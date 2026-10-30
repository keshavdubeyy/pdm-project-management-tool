"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EmptyState, PersonChips, ProjectTitle } from "@/components/common"
import { useConfirm } from "@/components/confirm-dialog"
import { MilestoneSheet } from "@/components/milestones/milestone-sheet"
import { PlanView } from "@/components/student/plan-view"
import { SubmissionsTab } from "@/components/submissions/submissions-tab"
import { Tab, TabList, Tabs } from "@/components/untitled/application/tabs/tabs"
import { Table, TableCard } from "@/components/untitled/application/table/table"
import { Button } from "@/components/untitled/base/buttons/button"
import { Dropdown } from "@/components/untitled/base/dropdown/dropdown"
import { formatTimestamp } from "@/lib/dates"
import { projectsFor } from "@/lib/permissions"
import { milestoneViews, personById } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { Project } from "@/lib/types"

import { ChevronLeft, Edit05, Plus, Trash01, Users01 } from "@untitledui/icons"

/** The student's home: three tabs and nothing else.
 *
 *   1. Plan          — the programme as Semester → Phase → Checkpoint, students
 *                      only. A checkpoint opens as a sheet.
 *   2. Progress      — a running log of what the team has handed in.
 *   3. Meeting notes — a table of the team's notes, stamped with date and time.
 *
 * (To-dos are switched off for now; the store keeps the action-item functions.)
 */
export function StudentDashboard() {
  const { db, actor, currentUser } = useProjectsStore()
  if (!actor || !currentUser) return null

  const project = projectsFor(db, actor)[0]
  if (!project) {
    return (
      <EmptyState
        icon={Users01}
        title="You are not on a project yet"
        body="Your project appears here once the coordinator adds you to a team."
      />
    )
  }

  return <ProjectHome project={project} />
}

/** One team's home: its header and the two tabs. A student sees their own
 * team's; a mentor opens the same page from the list of their teams, so both
 * sides read the same thing. */
export function ProjectHome({
  project,
  backHref,
  backLabel = "Your teams",
  initialTab,
  initialMilestone,
  initialComment,
}: {
  project: Project
  backHref?: string
  backLabel?: string
  initialTab?: string
  /** A checkpoint instance to open straight away, from a notification. */
  initialMilestone?: string
  /** The comment on it to scroll to and mark. */
  initialComment?: string
}) {
  const { db } = useProjectsStore()
  const mentors = project.mentorIds
    .map((id) => personById(db, id)?.name)
    .filter(Boolean)
  const firstNames = project.teamMemberIds
    .map((id) => personById(db, id)?.name.split(" ")[0])
    .filter(Boolean)

  return (
    <>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 text-meta font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          {backLabel}
        </Link>
      )}

      <header className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
        <div className="min-w-0 space-y-1.5">
          <h1
            className="truncate text-page text-foreground"
            title={project.title || undefined}
          >
            <ProjectTitle project={project} />
          </h1>
          <p className="text-meta text-muted-foreground">
            {backHref && firstNames.length > 0
              ? `${firstNames.join(" & ")} · `
              : ""}
            Mentor: {mentors.join(", ") || "not assigned yet"} ·{" "}
            {project.teamMemberIds.length} team{" "}
            {project.teamMemberIds.length === 1 ? "member" : "members"}
          </p>
        </div>
      </header>

      <HomeTabs
        projectId={project.id}
        initialTab={initialTab}
        initialMilestone={initialMilestone}
        initialComment={initialComment}
      />
    </>
  )
}

/* ---------------------------------------------------------------- tabs */

function HomeTabs({
  projectId,
  initialTab,
  initialMilestone,
  initialComment,
}: {
  projectId: string
  initialTab?: string
  initialMilestone?: string
  initialComment?: string
}) {
  const router = useRouter()
  const { actor, createNote } = useProjectsStore()
  // The coordinator reads a team's notes; they do not add to them.
  const canWrite = actor?.role !== "coordinator"
  const newNote = () => {
    const noteId = createNote(projectId)
    if (noteId) router.push(`/notes/${noteId}`)
  }
  // Everyone lands on the Project plan: the team to work from it, a mentor or
  // the coordinator to read it and review from it. An old "weekly" or "progress"
  // link lands there too.
  const [tab, setTab] = React.useState(
    initialTab === "notes" || initialTab === "submissions" ? initialTab : "plan"
  )
  const { db } = useProjectsStore()
  // A notification can name the checkpoint to open.
  const [planId, setPlanId] = React.useState<string | null>(() =>
    initialMilestone
      ? (db.milestones.find((m) => m.id === initialMilestone)?.templateItemId ??
        null)
      : null
  )
  // The comment a notification pointed at, until the sheet is closed.
  const [focusComment, setFocusComment] = React.useState<string | null>(
    initialComment ?? null
  )
  // Read from the database each render, so ticking a deliverable in the sheet
  // shows at once rather than holding a stale copy.
  const planView = planId
    ? (milestoneViews(db, [projectId]).find((v) => v.template.id === planId) ??
      null)
    : null

  return (
    <>
      <Tabs
        className="w-full gap-4"
        selectedKey={tab}
        onSelectionChange={(key) => setTab(String(key))}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabList type="button-border" className="w-fit">
            <Tab id="plan">Project plan</Tab>
            <Tab id="submissions">Submissions</Tab>
            <Tab id="notes">Meeting notes</Tab>
          </TabList>

          {canWrite && (
            <Button onPress={newNote} iconLeading={Plus}>
              Create meeting note
            </Button>
          )}
        </div>

        <Tabs.Panel id="plan">
          <PlanView projectId={projectId} onOpen={setPlanId} />
        </Tabs.Panel>
        <Tabs.Panel id="submissions">
          <SubmissionsTab
            projectId={projectId}
            onOpenCheckpoint={(instanceId) =>
              setPlanId(
                db.milestones.find((m) => m.id === instanceId)
                  ?.templateItemId ?? null
              )
            }
          />
        </Tabs.Panel>
        <Tabs.Panel id="notes">
          <Notes projectId={projectId} />
        </Tabs.Panel>
      </Tabs>

      {/* Outside <Tabs>: it renders its children twice, once off-screen to build
        its collection, and the hidden copy of an open dialog treats every click
        in the real one as an outside click and closes it. */}
      <MilestoneSheet
        view={planView}
        open={planView !== null}
        focusCommentId={focusComment}
        onOpenChange={(open) => {
          if (!open) {
            setPlanId(null)
            setFocusComment(null)
          }
        }}
        // Once it is uploaded the sheet closes, and the checkpoint's row in the
        // plan says Submitted.
        onSubmitted={() => setPlanId(null)}
      />
    </>
  )
}

/* ------------------------------------------------------- meeting notes */

/** The team's notes as a table, newest first. A row opens the note; the three
 * dots at its end edit or delete it. */
function Notes({ projectId }: { projectId: string }) {
  const router = useRouter()
  const { db, actor, deleteNote } = useProjectsStore()
  const canWrite = actor?.role !== "coordinator"
  const { confirm, dialog: confirmDialog } = useConfirm()
  const notes = db.notes
    .filter((n) => n.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (notes.length === 0) {
    return (
      <EmptyState
        image="/empty-states/notes.png"
        title="No notes yet"
        className="min-h-[55vh]"
        body={
          actor?.role === "student"
            ? "Create a note to record what was discussed in a meeting."
            : actor?.role === "mentor"
              ? "No meeting notes yet. Notes you or the team write will show up here."
              : "This team has not written any meeting notes yet."
        }
      />
    )
  }

  return (
    <>
      <TableCard.Root size="sm">
        <Table aria-label="Meeting notes">
          <Table.Header>
            <Table.Head id="sno" label="S.No" className="w-0" />
            <Table.Head id="title" isRowHeader label="Title" />
            <Table.Head id="author" label="Written by" />
            <Table.Head id="when" label="Date and time" />
            {canWrite && (
              <Table.Head id="actions" aria-label="Actions" className="w-0" />
            )}
          </Table.Header>
          <Table.Body items={notes.map((n, i) => ({ ...n, no: i + 1 }))}>
            {(note) => (
              <Table.Row id={note.id} href={`/notes/${note.id}`}>
                <Table.Cell className="w-0 text-tertiary tabular-nums">
                  {note.no}
                </Table.Cell>
                <Table.Cell className="font-medium whitespace-nowrap text-primary">
                  {note.title || "Untitled"}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  <PersonChips
                    people={[personById(db, note.authorId)]}
                    empty="Unknown"
                  />
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  {formatTimestamp(note.createdAt)}
                </Table.Cell>
                {canWrite && (
                  <Table.Cell className="w-0 pr-4 text-right">
                    <Dropdown.Root>
                      <Dropdown.DotsButton />
                      <Dropdown.Popover className="w-40">
                        <Dropdown.Menu>
                          <Dropdown.Item
                            icon={Edit05}
                            onAction={() => router.push(`/notes/${note.id}`)}
                          >
                            Edit
                          </Dropdown.Item>
                          <Dropdown.Item
                            icon={Trash01}
                            className="[&_span]:text-error-primary [&_svg]:text-fg-error-secondary"
                            onAction={() =>
                              confirm({
                                title: "Delete this note?",
                                description: note.title || "Untitled",
                                confirmLabel: "Delete",
                                destructive: true,
                                onConfirm: () =>
                                  report(deleteNote(note.id), "Note deleted"),
                              })
                            }
                          >
                            Delete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown.Root>
                  </Table.Cell>
                )}
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </TableCard.Root>
      {confirmDialog}
    </>
  )
}
