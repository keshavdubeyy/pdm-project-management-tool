"use client"

import { useConfirm } from "@/components/confirm-dialog"
import * as React from "react"
import {
  AvatarStack,
  EmptyState,
  PageHeader,
  PersonAvatar,
} from "@/components/common"
import { Badge } from "@/components/untitled/base/badges/badges"
import { Button } from "@/components/untitled/base/buttons/button"
import { Checkbox } from "@/components/untitled/base/checkbox/checkbox"
import { ModalDialog } from "@/components/untitled/application/modals/modal-dialog"
import { Input } from "@/components/untitled/base/input/input"
import { Label } from "@/components/untitled/base/input/label"
import {
  RadioButton,
  RadioGroup,
} from "@/components/untitled/base/radio-buttons/radio-buttons"
import { TextArea } from "@/components/untitled/base/textarea/textarea"
import {
  Tooltip,
  TooltipTrigger,
} from "@/components/untitled/base/tooltip/tooltip"
import { timeAgo } from "@/lib/dates"
import { canAnnounceTo, isCoordinator, projectsFor } from "@/lib/permissions"
import {
  announcementsFor,
  audienceMembers,
  describeAudience,
  personById,
  readersOf,
} from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { AnnouncementAudience } from "@/lib/types"
import { cn } from "@/lib/utils"

import { Announcement01, Eye, Plus } from "@untitledui/icons"

/** Write it once, choose who sees it.
 *
 * The audience is a single ordered choice from narrow to broad rather than a
 * set of filters, because that is what it actually is — and the live count
 * under each option means the blast radius is visible before anyone sends. */
export default function AnnouncementsPage() {
  const { db, actor, markAnnouncementRead } = useProjectsStore()
  if (!actor) return null

  const items = announcementsFor(db, actor)
  const canPost = actor.role !== "student"

  return (
    <>
      <PageHeader
        title="Messages"
        description="Announcements that need to be found again later. Informal conversation stays where it already happens."
        actions={canPost ? <Composer /> : undefined}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Announcement01}
          title="No announcements yet"
          body="Deadlines, schedule changes and notices to the batch appear here."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((announcement) => {
            const author = personById(db, announcement.authorId)
            const reach = audienceMembers(db, announcement)
            const readers = readersOf(db, announcement.id)
            const mine = announcement.authorId === actor.person.id
            const canSeeReceipts = mine || isCoordinator(actor)
            const iHaveRead = readers.includes(actor.person.id)

            return (
              <li
                key={announcement.id}
                className={cn(
                  "rounded-xl border bg-card p-4",
                  announcement.pinned ? "border-brand/30" : "border-border"
                )}
                onMouseEnter={() => {
                  if (!iHaveRead) markAnnouncementRead(announcement.id)
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <PersonAvatar person={author} size="xs" />
                  <span className="text-meta font-medium">
                    {author?.name ?? "Someone"}
                  </span>
                  <Badge size="sm" type="modern" color="gray">
                    {describeAudience(db, announcement)}
                  </Badge>
                  {announcement.pinned && (
                    <Badge size="sm" color="gray">
                      Pinned
                    </Badge>
                  )}
                  <span className="ml-auto text-caption text-muted-foreground">
                    {timeAgo(announcement.createdAt)}
                  </span>
                </div>

                <h2 className="mt-2 text-subhead text-foreground">
                  {announcement.title}
                </h2>
                <p className="mt-1 text-meta whitespace-pre-line text-muted-foreground">
                  {announcement.body}
                </p>

                {canSeeReceipts && (
                  <div className="mt-3 flex items-center gap-2 border-t border-border pt-2.5">
                    <Eye className="size-3.5 text-muted-foreground" />
                    <Tooltip
                      title={
                        <>
                          Only you and the coordinator can see this. No times,
                          and no per-person record.
                        </>
                      }
                    >
                      <TooltipTrigger className="text-caption text-muted-foreground">
                        Seen by {readers.length} of {reach.length}
                      </TooltipTrigger>
                    </Tooltip>
                    <AvatarStack
                      people={readers.map((personId) =>
                        personById(db, personId)
                      )}
                      max={5}
                      className="ml-1"
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

/* ------------------------------------------------------------- composer */

function Composer() {
  const { db, actor, postAnnouncement, batch } = useProjectsStore()
  const { confirm, dialog: confirmDialog } = useConfirm()
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState("")
  const [kind, setKind] =
    React.useState<AnnouncementAudience["kind"]>("my_teams")
  const [teamId, setTeamId] = React.useState<string>("")
  const [pinned, setPinned] = React.useState(false)

  if (!actor) return null

  const myProjects = projectsFor(db, actor)
  const myTeams = db.teams.filter((t) =>
    myProjects.some((p) => p.teamId === t.id)
  )

  const options = (
    [
      myTeams.length > 0 && { kind: "team" as const, label: "One team" },
      actor.role === "mentor" && {
        kind: "my_teams" as const,
        label: "All my teams",
      },
      canAnnounceTo(actor, "batch") && {
        kind: "batch" as const,
        label: "Whole batch",
      },
      { kind: "faculty" as const, label: "Mentors only" },
    ].filter(Boolean) as { kind: AnnouncementAudience["kind"]; label: string }[]
  ).filter((option) => canAnnounceTo(actor, option.kind))

  const audience = buildAudience(kind, teamId || myTeams[0]?.id, batch.id)
  const reach = audience
    ? audienceMembers(db, {
        id: "preview",
        authorId: actor.person.id,
        audience,
        title: "",
        body: "",
        pinned: false,
        createdAt: "",
      }).length
    : 0

  const broad = kind === "batch"

  return (
    <>
      <Button onPress={() => setOpen(true)} iconLeading={Plus}>
        New announcement
      </Button>
      <ModalDialog
        isOpen={open}
        onOpenChange={setOpen}
        size="xl"
        title={<>New announcement</>}
        description={
          <>
            Written once. It lands in the app, and stays attached to the batch
            so it can be found again.
          </>
        }
        footer={
          <>
            <Button color="tertiary" slot="close">
              Cancel
            </Button>
            <Button
              isDisabled={!title.trim() || !body.trim() || !audience}
              onPress={() => {
                if (!audience) return
                const send = () => {
                  const result = postAnnouncement({
                    title,
                    body,
                    audience,
                    pinned,
                  })
                  if (report(result, "Announcement posted")) {
                    setTitle("")
                    setBody("")
                    setPinned(false)
                    setOpen(false)
                  }
                }
                if (!broad) return send()
                confirm({
                  title: "Send to the entire batch?",
                  description: `This reaches ${reach} people.`,
                  confirmLabel: "Send",
                  onConfirm: send,
                })
              }}
            >
              Post
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Input
              label="Subject"
              value={title}
              onChange={setTitle}
              placeholder="Office hours move to Thursday this week"
            />
          </div>

          <div className="space-y-1.5">
            <TextArea
              label="Message"
              rows={5}
              value={body}
              onChange={setBody}
            />
          </div>

          <div className="space-y-2">
            <RadioGroup
              value={kind}
              onChange={(value) =>
                setKind(value as AnnouncementAudience["kind"])
              }
              className="gap-3"
            >
              <Label>Who should see this?</Label>
              {options.map((option) => {
                const preview = buildAudience(
                  option.kind,
                  teamId || myTeams[0]?.id,
                  batch.id
                )
                const count = preview
                  ? audienceMembers(db, {
                      id: "preview",
                      authorId: actor.person.id,
                      audience: preview,
                      title: "",
                      body: "",
                      pinned: false,
                      createdAt: "",
                    }).length
                  : 0
                return (
                  <RadioButton
                    key={option.kind}
                    value={option.kind}
                    label={option.label}
                    hint={`${count} ${count === 1 ? "person" : "people"}`}
                  />
                )
              })}
            </RadioGroup>

            {kind === "team" && myTeams.length > 1 && (
              <select
                value={teamId || myTeams[0]?.id}
                onChange={(event) => setTeamId(event.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-background px-2 text-meta"
              >
                {myTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <Checkbox
            isSelected={pinned}
            onChange={() => setPinned((value) => !value)}
            label="Keep this at the top"
          />

          {broad && (
            <p className="rounded-lg border border-status-under_review-br bg-status-under_review-bg px-3 py-2 text-caption text-status-under_review-fg">
              This reaches all {reach} people in the batch.
            </p>
          )}
        </div>
      </ModalDialog>
      {confirmDialog}
    </>
  )
}

function buildAudience(
  kind: AnnouncementAudience["kind"],
  teamId: string | undefined,
  batchId: string
): AnnouncementAudience | null {
  switch (kind) {
    case "team":
      return teamId ? { kind: "team", teamId } : null
    case "my_teams":
      return { kind: "my_teams" }
    case "batch":
      return { kind: "batch", batchId }
    case "faculty":
      return { kind: "faculty" }
  }
}
