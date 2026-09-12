"use client"

import * as React from "react"
import Link from "next/link"
import { notFound, useParams, useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Attachment01Icon, ExternalLinkIcon, UserGroupIcon } from "@hugeicons/core-free-icons"

import { AddArtefact } from "@/components/artefacts/add-artefact"
import { ArtefactRow } from "@/components/artefacts/artefact-row"
import { EmptyState, PageHeader, PersonAvatar, SectionHeading } from "@/components/common"
import { MeetingsPanel } from "@/components/meetings/meetings-panel"
import { MilestoneRail } from "@/components/milestones/milestone-rail"
import { MilestoneSheet } from "@/components/milestones/milestone-sheet"
import { StatusPill } from "@/components/status/status-pill"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatTimestamp, timeAgo } from "@/lib/dates"
import { canViewProject, isCoordinator, isMemberOf } from "@/lib/permissions"
import { milestoneViews, personById, type MilestoneView } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { Project } from "@/lib/types"
import { cn } from "@/lib/utils"

/** A project's whole life on one page.
 *
 * The rail down the left is the spine — twelve checkpoints, where the team is
 * on each. Everything else on the page hangs off it. */
export default function ProjectPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { db, actor, week } = useProjectsStore()
  const [selected, setSelected] = React.useState<MilestoneView | null>(null)

  const project = db.projects.find((p) => p.id === params.id)
  const views = React.useMemo(
    () => (project ? milestoneViews(db, [project.id]) : []),
    [db, project]
  )

  // A notification can deep-link straight to a checkpoint.
  const requested = searchParams.get("milestone")
  React.useEffect(() => {
    if (!requested) return
    const match = views.find((v) => v.instance.id === requested)
    if (match) setSelected(match)
  }, [requested, views])

  if (!actor) return null
  if (!project) return notFound()

  if (!canViewProject(actor, project, db)) {
    return (
      <EmptyState
        title="This project is not visible to you"
        body="Only its team, its mentors and the programme coordinator can open it. Ask the team to widen who can see it if you need access."
      />
    )
  }

  const team = db.teams.find((t) => t.id === project.teamId)
  const members = project.teamMemberIds.map((id) => personById(db, id))
  const mentors = project.mentorIds.map((id) => personById(db, id))
  const preferred = project.preferredMentorId ? personById(db, project.preferredMentorId) : null
  const artefacts = db.artefacts.filter((a) => a.projectId === project.id)
  const reviews = db.reviews
    .filter((r) => r.projectId === project.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const accepted = views.filter((v) => v.status === "accepted").length
  const isTeam = isMemberOf(actor, project)

  return (
    <>
      <PageHeader
        title={project.title}
        description={
          project.description.trim() === project.title.trim() ? undefined : project.description
        }
        actions={<VisibilityControl project={project} />}
        meta={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon
                icon={UserGroupIcon}
                className="size-3.5 text-muted-foreground"
                strokeWidth={2}
              />
              <span className="text-meta font-medium">{team?.name}</span>
            </span>
            <span className="flex items-center gap-1.5">
              {members.map((person) => (
                <span key={person?.id} className="inline-flex items-center gap-1">
                  <PersonAvatar person={person} size="xs" />
                  <span className="text-caption text-muted-foreground">{person?.name}</span>
                </span>
              ))}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-caption text-muted-foreground">Mentor</span>
              {mentors.map((person) => (
                <span key={person?.id} className="inline-flex items-center gap-1">
                  <PersonAvatar person={person} size="xs" />
                  <span className="text-caption text-foreground">{person?.name}</span>
                </span>
              ))}
              {preferred && !project.mentorIds.includes(preferred.id) && (
                <Badge variant="outline" className="text-[10px]">
                  asked for {preferred.name}
                </Badge>
              )}
            </span>
            <span className="text-caption text-muted-foreground">
              {accepted} of {views.length} checkpoints accepted
            </span>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SectionHeading hint={`week ${week} of 28`}>Checkpoints</SectionHeading>
          <MilestoneRail
            views={views}
            currentWeek={week}
            onSelect={setSelected}
            selectedId={selected?.instance.id}
          />
        </aside>

        <div className="min-w-0">
          <Tabs defaultValue={searchParams.get("tab") ?? "meetings"}>
            <TabsList>
              <TabsTrigger value="meetings">Meetings and actions</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="artefacts">Work ({artefacts.length})</TabsTrigger>
              <TabsTrigger value="brief">Brief</TabsTrigger>
            </TabsList>

            <TabsContent value="meetings" className="mt-4">
              <MeetingsPanel project={project} />
            </TabsContent>

            <TabsContent value="feedback" className="mt-4">
              <SectionHeading count={reviews.length}>Everything a mentor has said</SectionHeading>
              {reviews.length === 0 ? (
                <EmptyState
                  title="No feedback yet"
                  body="Feedback on a checkpoint is kept here permanently, so nobody has to remember it."
                />
              ) : (
                <ol className="space-y-3">
                  {reviews.map((review) => {
                    const reviewer = personById(db, review.reviewerId)
                    const view = views.find((v) => v.instance.id === review.milestoneInstanceId)
                    return (
                      <li
                        key={review.id}
                        className={cn(
                          "rounded-sm border p-4",
                          review.verdict === "accept"
                            ? "border-status-accepted-br bg-status-accepted-bg"
                            : "border-status-returned-br bg-status-returned-bg"
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <PersonAvatar person={reviewer} size="xs" />
                          <span className="text-meta font-medium">{reviewer?.name}</span>
                          <span className="text-caption opacity-75">
                            {review.verdict === "accept" ? "accepted" : "asked for changes"} on{" "}
                            {view?.template.title}
                          </span>
                          <span className="ml-auto text-caption opacity-75">
                            {formatTimestamp(review.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-meta whitespace-pre-line">{review.body}</p>
                        {review.addressedNote && (
                          <div className="mt-2 rounded-sm bg-background/60 p-2">
                            <p className="text-caption font-medium">The team said:</p>
                            <p className="text-meta">{review.addressedNote}</p>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ol>
              )}
            </TabsContent>

            <TabsContent value="artefacts" className="mt-4">
              <SectionHeading count={artefacts.length} hint="everything this project has produced">
                Work
              </SectionHeading>
              {artefacts.length === 0 ? (
                <EmptyState
                  icon={Attachment01Icon}
                  title="Nothing attached yet"
                  body="Links to documents, boards and repositories collect here so nothing has to be hunted for later."
                />
              ) : (
                <div className="space-y-1.5">
                  {artefacts.map((artefact) => {
                    const view = views.find((v) => v.instance.id === artefact.milestoneInstanceId)
                    return (
                      <div key={artefact.id}>
                        {view && (
                          <p className="mt-3 mb-1 text-th text-muted-foreground uppercase">
                            Week {view.dueWeek} · {view.template.title}
                          </p>
                        )}
                        <ArtefactRow artefact={artefact} onRemove={isTeam} />
                      </div>
                    )
                  })}
                </div>
              )}
              {isTeam && (
                <div className="mt-4 rounded-sm border border-dashed border-border p-4">
                  <p className="mb-3 text-subhead">Add a link</p>
                  <AddArtefact projectId={project.id} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="brief" className="mt-4 space-y-5">
              <div>
                <SectionHeading>The problem</SectionHeading>
                <p className="text-meta whitespace-pre-line text-muted-foreground">
                  {project.problem || "Not written up yet."}
                </p>
              </div>
              {project.workOrOutcome && (
                <div>
                  <SectionHeading>Where it has got to</SectionHeading>
                  <p className="text-meta whitespace-pre-line text-muted-foreground">
                    {project.workOrOutcome}
                  </p>
                </div>
              )}
              {project.materials.length > 0 && (
                <div>
                  <SectionHeading>Links</SectionHeading>
                  <ul className="space-y-1">
                    {project.materials.map((material) => (
                      <li key={material.id}>
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-meta text-primary hover:underline"
                        >
                          {material.label}
                          <HugeiconsIcon
                            icon={ExternalLinkIcon}
                            className="size-3"
                            strokeWidth={2}
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <MilestoneSheet
        view={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  )
}

const VISIBILITY_LABEL: Record<string, string> = {
  team_and_mentor: "Our team and our mentor",
  mentor_group: "All faculty mentors",
  batch: "Everyone in the batch",
}

/** Who can see this beyond the team and its mentors.
 *
 * Closed by default. Whether mentors want to see each other's projects is an
 * open question with the faculty, and shipping an open default would answer it
 * on their behalf. */
function VisibilityControl({ project }: { project: Project }) {
  const { actor, setProjectVisibility } = useProjectsStore()
  if (!actor) return null
  if (!isMemberOf(actor, project) && !isCoordinator(actor)) return null

  return (
    <Select
      value={project.visibility}
      onValueChange={(value) =>
        report(
          setProjectVisibility(project.id, value as Project["visibility"]),
          "Visibility updated"
        )
      }
    >
      <SelectTrigger size="sm" className="w-56">
        <SelectValue>{(value) => VISIBILITY_LABEL[String(value)] ?? "Who can see this"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="team_and_mentor">{VISIBILITY_LABEL.team_and_mentor}</SelectItem>
        <SelectItem value="mentor_group">{VISIBILITY_LABEL.mentor_group}</SelectItem>
        <SelectItem value="batch">{VISIBILITY_LABEL.batch}</SelectItem>
      </SelectContent>
    </Select>
  )
}
