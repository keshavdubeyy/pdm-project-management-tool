"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Megaphone01Icon, PlusSignIcon, ViewIcon } from "@hugeicons/core-free-icons"

import { AvatarStack, EmptyState, PageHeader, PersonAvatar } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
        title="Announcements"
        description="Things that need to be found again later. Informal conversation stays where it already happens."
        actions={canPost ? <Composer /> : undefined}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Megaphone01Icon}
          title="Nothing announced yet"
          body="Deadlines, schedule changes and notices to the batch will appear here."
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
                  "rounded-sm border bg-card p-4",
                  announcement.pinned ? "border-primary/30" : "border-border"
                )}
                onMouseEnter={() => {
                  if (!iHaveRead) markAnnouncementRead(announcement.id)
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <PersonAvatar person={author} size="xs" />
                  <span className="text-meta font-medium">{author?.name ?? "Someone"}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {describeAudience(db, announcement)}
                  </Badge>
                  {announcement.pinned && (
                    <Badge variant="secondary" className="text-[10px]">
                      Pinned
                    </Badge>
                  )}
                  <span className="ml-auto text-caption text-muted-foreground">
                    {timeAgo(announcement.createdAt)}
                  </span>
                </div>

                <h2 className="mt-2 text-subhead text-foreground">{announcement.title}</h2>
                <p className="mt-1 text-meta whitespace-pre-line text-muted-foreground">
                  {announcement.body}
                </p>

                {canSeeReceipts && (
                  <div className="mt-3 flex items-center gap-2 border-t border-border pt-2.5">
                    <HugeiconsIcon
                      icon={ViewIcon}
                      className="size-3.5 text-muted-foreground"
                      strokeWidth={2}
                    />
                    <Tooltip>
                      <TooltipTrigger
                        render={<span className="text-caption text-muted-foreground" />}
                      >
                        Seen by {readers.length} of {reach.length}
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[260px]">
                        Only you and the coordinator can see this. No times, and no per-person
                        record.
                      </TooltipContent>
                    </Tooltip>
                    <AvatarStack
                      people={readers.map((personId) => personById(db, personId))}
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
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState("")
  const [kind, setKind] = React.useState<AnnouncementAudience["kind"]>("my_teams")
  const [teamId, setTeamId] = React.useState<string>("")
  const [pinned, setPinned] = React.useState(false)

  if (!actor) return null

  const myProjects = projectsFor(db, actor)
  const myTeams = db.teams.filter((t) => myProjects.some((p) => p.teamId === t.id))

  const options = (
    [
      myTeams.length > 0 && { kind: "team" as const, label: "One team" },
      actor.role === "mentor" && { kind: "my_teams" as const, label: "All my teams" },
      canAnnounceTo(actor, "batch") && { kind: "batch" as const, label: "Whole batch" },
      { kind: "faculty" as const, label: "Faculty only" },
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
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <HugeiconsIcon icon={PlusSignIcon} className="size-4" strokeWidth={2} />
        New announcement
      </Button>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
          <DialogDescription>
            Written once. It lands in the app, and stays attached to the batch so it can be found
            again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ann-title">Subject</Label>
            <Input
              id="ann-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Office hours move to Thursday this week"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ann-body">Message</Label>
            <Textarea
              id="ann-body"
              rows={5}
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Who should see this?</Label>
            <RadioGroup
              value={kind}
              onValueChange={(value) => setKind(value as AnnouncementAudience["kind"])}
              className="gap-1"
            >
              {options.map((option) => {
                const preview = buildAudience(option.kind, teamId || myTeams[0]?.id, batch.id)
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
                  <Label
                    key={option.kind}
                    className="flex cursor-pointer items-center gap-2.5 rounded-sm border border-transparent px-2 py-1.5 text-meta font-normal hover:bg-muted/60"
                  >
                    <RadioGroupItem value={option.kind} />
                    <span className="flex-1">{option.label}</span>
                    <span className="text-caption text-muted-foreground">
                      {count} {count === 1 ? "person" : "people"}
                    </span>
                  </Label>
                )
              })}
            </RadioGroup>

            {kind === "team" && myTeams.length > 1 && (
              <select
                value={teamId || myTeams[0]?.id}
                onChange={(event) => setTeamId(event.target.value)}
                className="h-8 w-full rounded-sm border border-input bg-background px-2 text-meta"
              >
                {myTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-meta">
            <Checkbox checked={pinned} onCheckedChange={() => setPinned((value) => !value)} />
            Keep this at the top
          </label>

          {broad && (
            <p className="rounded-sm border border-status-under_review-br bg-status-under_review-bg px-3 py-2 text-caption text-status-under_review-fg">
              This reaches all {reach} people in the batch.
            </p>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            disabled={!title.trim() || !body.trim() || !audience}
            onClick={() => {
              if (!audience) return
              if (
                broad &&
                !window.confirm(`Send to the entire batch — ${reach} people?`)
              ) {
                return
              }
              const result = postAnnouncement({ title, body, audience, pinned })
              if (report(result, "Announcement posted")) {
                setTitle("")
                setBody("")
                setPinned(false)
                setOpen(false)
              }
            }}
          >
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
