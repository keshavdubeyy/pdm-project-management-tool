"use client"

import { useConfirm } from "@/components/confirm-dialog"
import * as React from "react"
import {
  EmptyState,
  PageHeader,
  PersonAvatar,
  SectionHeading,
} from "@/components/common"
import { PersonCombobox } from "@/components/person-combobox"
import { Badge } from "@/components/untitled/base/badges/badges"
import { Button } from "@/components/untitled/base/buttons/button"
import { ModalDialog } from "@/components/untitled/application/modals/modal-dialog"
import { Input } from "@/components/untitled/base/input/input"
import { Label } from "@/components/untitled/base/input/label"
import { Select } from "@/components/untitled/base/select/select"
import {
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "@/components/untitled/application/tabs/tabs"
import { TextArea } from "@/components/untitled/base/textarea/textarea"
import { dueDateForWeek, formatDate, formatTimestamp } from "@/lib/dates"
import { isCoordinator } from "@/lib/permissions"
import { personById } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { MilestoneTemplateItem, Team } from "@/lib/types"

import { Plus, Trash01 } from "@untitledui/icons"

/** The coordinator's back room: allocation, the calendar, and the record of
 * who changed what. */
export default function AdminPage() {
  const { actor } = useProjectsStore()
  if (!actor) return null

  if (!isCoordinator(actor)) {
    return (
      <EmptyState
        title="This area belongs to the programme coordinator"
        body="Mentor allocation, the milestone calendar and the roster are managed here."
      />
    )
  }

  return (
    <>
      <PageHeader
        title="Programme settings"
        description="The calendar, who mentors whom, and a record of every decision the system has stored."
      />

      <Tabs defaultSelectedKey="allocation">
        <TabList type="underline">
          <Tab id="allocation">Mentor allocation</Tab>
          <Tab id="calendar">Milestone calendar</Tab>
          <Tab id="roster">Roster</Tab>
          <Tab id="audit">Audit trail</Tab>
        </TabList>

        <TabPanel id="allocation" className="mt-5">
          <AllocationTab />
        </TabPanel>
        <TabPanel id="calendar" className="mt-5">
          <CalendarTab />
        </TabPanel>
        <TabPanel id="roster" className="mt-5">
          <RosterTab />
        </TabPanel>
        <TabPanel id="audit" className="mt-5">
          <AuditTab />
        </TabPanel>
      </Tabs>
    </>
  )
}

/* ------------------------------------------------------------ allocation */

function AllocationTab() {
  const { db, updateAllocation } = useProjectsStore()
  const mentors = db.people.filter((p) => p.roles.includes("mentor"))
  const projects = db.projects.filter((p) => !p.archived)

  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {mentors.map((mentor) => {
          const load = projects.filter((p) =>
            p.mentorIds.includes(mentor.id)
          ).length
          const heaviest = load >= 9
          return (
            <div
              key={mentor.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
            >
              <PersonAvatar person={mentor} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-meta font-medium">{mentor.name}</p>
                <p className="truncate text-caption text-muted-foreground">
                  {mentor.affiliation}
                </p>
              </div>
              <Badge size="sm" color="gray">
                {load}
              </Badge>
            </div>
          )
        })}
      </div>

      <SectionHeading count={projects.length}>Who mentors whom</SectionHeading>
      <ul className="space-y-1.5">
        {projects.map((project) => {
          const team = db.teams.find((t) => t.id === project.teamId)
          return (
            <li
              key={project.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-meta font-medium">{team?.name}</p>
                <p className="truncate text-caption text-muted-foreground">
                  {project.title}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="shrink-0 text-caption text-muted-foreground">
                  Assigned
                </span>
                <PersonCombobox
                  people={mentors}
                  value={project.mentorIds[0] ?? null}
                  onChange={(value) => {
                    if (!value) return
                    report(
                      updateAllocation(
                        project.id,
                        [value],
                        project.preferredMentorId
                      ),
                      "Allocation updated"
                    )
                  }}
                  emptyLabel="Unassigned"
                  placeholder="Find a mentor…"
                  className="w-48"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="shrink-0 text-caption text-muted-foreground">
                  Asked for
                </span>
                <PersonCombobox
                  people={mentors}
                  value={project.preferredMentorId}
                  onChange={(value) =>
                    report(
                      updateAllocation(project.id, project.mentorIds, value),
                      "Preference recorded"
                    )
                  }
                  allowEmpty
                  emptyLabel="Not recorded"
                  placeholder="Find a mentor…"
                  className="w-48"
                />
              </div>

              {project.preferredMentorId &&
                !project.mentorIds.includes(project.preferredMentorId) && (
                  <Badge size="sm" type="modern" color="gray">
                    reassigned
                  </Badge>
                )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* -------------------------------------------------------------- calendar */

function CalendarTab() {
  const { db, batch, deleteMilestoneTemplateItem } = useProjectsStore()
  const { confirm, dialog: confirmDialog } = useConfirm()
  const [editing, setEditing] = React.useState<MilestoneTemplateItem | null>(
    null
  )
  const [creating, setCreating] = React.useState(false)

  const template = db.milestoneTemplate
    .filter((t) => t.batchId === batch.id)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-meta text-muted-foreground">
        The checkpoints are data, not something built into the app. The 2025–27
        curriculum runs the final project as one 24-credit unit and the 2026–28
        curriculum splits it in two, so the calendar has to be editable without
        a new release.
      </p>

      <SectionHeading
        count={template.length}
        action={
          <Button
            size="xs"
            color="secondary"
            onPress={() => setCreating(true)}
            iconLeading={Plus}
          >
            Add a checkpoint
          </Button>
        }
      >
        Checkpoints
      </SectionHeading>

      <ul className="space-y-1.5">
        {template.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
          >
            <span className="w-16 shrink-0 text-meta font-semibold">
              W{item.dueWeek}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-meta font-medium">{item.title}</p>
              <p className="truncate text-caption text-muted-foreground">
                Semester {item.semester} · {item.phase} ·{" "}
                {item.deliverables.length} deliverables · closes{" "}
                {formatDate(dueDateForWeek(item.dueWeek, batch.startDate))}
              </p>
            </div>
            {item.isGate && (
              <Badge size="sm" color="gray">
                Gate
              </Badge>
            )}
            <Button size="xs" color="tertiary" onPress={() => setEditing(item)}>
              Edit
            </Button>
            <Button
              size="xs"
              color="tertiary-destructive"
              aria-label={`Remove ${item.title}`}
              onPress={() =>
                confirm({
                  title: `Remove "${item.title}"?`,
                  description:
                    "It leaves the checkpoint calendar for the whole batch.",
                  confirmLabel: "Remove",
                  destructive: true,
                  onConfirm: () => report(deleteMilestoneTemplateItem(item.id)),
                })
              }
              iconLeading={Trash01}
            />
          </li>
        ))}
      </ul>

      {confirmDialog}
      <TemplateDialog
        item={editing}
        open={Boolean(editing) || creating}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null)
            setCreating(false)
          }
        }}
      />
    </div>
  )
}

function TemplateDialog({
  item,
  open,
  onOpenChange,
}: {
  item: MilestoneTemplateItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { saveMilestoneTemplateItem } = useProjectsStore()
  const [title, setTitle] = React.useState("")
  const [phase, setPhase] = React.useState("")
  const [dueWeek, setDueWeek] = React.useState(4)
  const [semester, setSemester] = React.useState<3 | 4>(3)
  const [deliverables, setDeliverables] = React.useState("")
  const [description, setDescription] = React.useState("")

  React.useEffect(() => {
    setTitle(item?.title ?? "")
    setPhase(item?.phase ?? "")
    setDueWeek(item?.dueWeek ?? 4)
    setSemester(item?.semester ?? 3)
    setDeliverables((item?.deliverables ?? []).join("\n"))
    setDescription(item?.description ?? "")
  }, [item, open])

  return (
    <ModalDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      title={<>{item ? "Edit checkpoint" : "Add a checkpoint"}</>}
      description={
        <>
          Every project in the batch gets this checkpoint, and the grid gets a
          column for it.
        </>
      }
      footer={
        <>
          <Button color="tertiary" slot="close">
            Cancel
          </Button>
          <Button
            onPress={() => {
              const result = saveMilestoneTemplateItem(item?.id ?? null, {
                title,
                phase,
                dueWeek,
                semester,
                order: item?.order ?? 99,
                description,
                deliverables: deliverables
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
                isGate: item?.isGate,
              })
              if (report(result, "Calendar updated")) onOpenChange(false)
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Input label="Title" value={title} onChange={setTitle} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Input
              label="Due week"
              type="number"
              value={String(dueWeek)}
              onChange={(value) => setDueWeek(Number(value))}
            />
          </div>
          <div className="space-y-1.5">
            <Select
              selectedKey={String(semester)}
              onSelectionChange={(value) => setSemester(Number(value) as 3 | 4)}
              size="md"
              label="Semester"
            >
              <Select.Item id="3" label="3" />
              <Select.Item id="4" label="4" />
            </Select>
          </div>
          <div className="space-y-1.5">
            <Input label="Phase" value={phase} onChange={setPhase} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Input
            label="What it is for"
            value={description}
            onChange={setDescription}
          />
        </div>
        <div className="space-y-1.5">
          <TextArea
            label="Deliverables, one per line"
            rows={6}
            value={deliverables}
            onChange={setDeliverables}
          />
        </div>
      </div>
    </ModalDialog>
  )
}

/* ---------------------------------------------------------------- roster */

function RosterTab() {
  const { db } = useProjectsStore()
  const [editing, setEditing] = React.useState<Team | null>(null)
  const teams = db.teams
  const unassigned = db.people.filter(
    (p) =>
      p.roles.includes("student") &&
      !db.projects.some((project) => project.teamMemberIds.includes(p.id))
  )

  return (
    <div className="space-y-5">
      <SectionHeading count={teams.length}>Teams</SectionHeading>
      <ul className="grid gap-2 md:grid-cols-2">
        {teams.map((team) => {
          const project = db.projects.find((p) => p.teamId === team.id)
          return (
            <li
              key={team.id}
              className="rounded-xl border border-border bg-card px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-meta font-medium">{team.name}</p>
                <span className="flex shrink-0 items-center gap-1">
                  <Badge size="sm" type="modern" color="gray">
                    {team.memberIds.length === 1
                      ? "Individual"
                      : `${team.memberIds.length} members`}
                  </Badge>
                  <Button
                    size="xs"
                    color="tertiary"
                    onPress={() => setEditing(team)}
                  >
                    Edit
                  </Button>
                </span>
              </div>
              <ul className="mt-1.5 space-y-0.5">
                {team.memberIds.map((memberId) => {
                  const person = personById(db, memberId)
                  return (
                    <li key={memberId} className="flex items-center gap-1.5">
                      <PersonAvatar person={person} size="xs" />
                      <span className="truncate text-caption text-muted-foreground">
                        {person?.name}
                        {team.leadId === memberId && " · lead"}
                      </span>
                    </li>
                  )
                })}
              </ul>
              {project && (
                <p className="mt-1.5 truncate text-caption text-muted-foreground">
                  {project.title}
                </p>
              )}
            </li>
          )
        })}
      </ul>

      {unassigned.length > 0 && (
        <>
          <SectionHeading count={unassigned.length}>
            Not on a team
          </SectionHeading>
          <ul className="flex flex-wrap gap-2">
            {unassigned.map((person) => (
              <li
                key={person.id}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1"
              >
                <PersonAvatar person={person} size="xs" />
                <span className="text-caption">{person.name}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <TeamDialog
        team={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  )
}

/** Renaming a team and naming its lead.
 *
 * A team of two with nobody named is how an action ends up belonging to
 * neither of them, so the lead is a real field rather than a convention. */
function TeamDialog({
  team,
  open,
  onOpenChange,
}: {
  team: Team | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { db, saveTeam } = useProjectsStore()
  const [name, setName] = React.useState("")
  const [leadId, setLeadId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setName(team?.name ?? "")
    setLeadId(team?.leadId ?? null)
  }, [team, open])

  if (!team) return null

  return (
    <ModalDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      size="md"
      title={<>Edit team</>}
      description={
        <>The name shows everywhere this team appears, including the grid.</>
      }
      footer={
        <>
          <Button color="tertiary" slot="close">
            Cancel
          </Button>
          <Button
            onPress={() => {
              const result = saveTeam(team.id, {
                name,
                memberIds: team.memberIds,
                leadId,
              })
              if (report(result, "Team updated")) onOpenChange(false)
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Input label="Team name" value={name} onChange={setName} />
        </div>
        <div className="space-y-1.5">
          <Label>Who speaks for the team</Label>
          <PersonCombobox
            people={team.memberIds
              .map((id) => personById(db, id))
              .filter((p): p is NonNullable<typeof p> => Boolean(p))}
            value={leadId}
            onChange={setLeadId}
            allowEmpty
            emptyLabel="Nobody named"
            placeholder="Find a member…"
          />
        </div>
      </div>
    </ModalDialog>
  )
}

/* ----------------------------------------------------------------- audit */

function AuditTab() {
  const { db } = useProjectsStore()

  return (
    <div className="space-y-3">
      <p className="max-w-2xl text-meta text-muted-foreground">
        Every status change, override and allocation edit, with who did it. A
        coordinator acting outside their own mentoring line is recorded as an
        override rather than passing silently.
      </p>

      {db.audit.length === 0 ? (
        <EmptyState
          title="No activity yet"
          body="Changes made from now on will appear here."
        />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {db.audit.slice(0, 80).map((event) => (
            <li
              key={event.id}
              className="flex flex-wrap items-baseline gap-2 px-3 py-2"
            >
              <span className="text-caption text-muted-foreground">
                {formatTimestamp(event.createdAt)}
              </span>
              <span className="text-meta font-medium">
                {personById(db, event.actorId)?.name ?? "Someone"}
              </span>
              <span className="text-meta text-muted-foreground">
                {event.action}
              </span>
              {event.detail && (
                <span className="text-caption text-muted-foreground">
                  · {event.detail}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
