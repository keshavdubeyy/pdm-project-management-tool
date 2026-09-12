"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlarmClockIcon,
  ArrowRight01Icon,
  CheckListIcon,
  InboxIcon,
  LegalHammerIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { MilestoneSheet } from "@/components/milestones/milestone-sheet"
import {
  DueBadge,
  EmptyState,
  MetricTile,
  PageHeader,
  PersonAvatar,
  SectionHeading,
} from "@/components/common"
import { StatusLegend } from "@/components/status/status-legend"
import { StatusPill } from "@/components/status/status-pill"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { timeAgo } from "@/lib/dates"
import { projectsFor } from "@/lib/permissions"
import {
  actionItemsFor,
  measures,
  milestoneViews,
  needsAttention,
  personById,
  reviewQueue,
  statusCounts,
  upcomingFor,
  type MilestoneView,
} from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export default function HomePage() {
  const { actor } = useProjectsStore()
  if (!actor) return null
  if (actor.role === "student") return <StudentHome />
  if (actor.role === "mentor") return <MentorHome />
  return <CoordinatorHome />
}

/* ---------------------------------------------------------------- student */

function StudentHome() {
  const { db, actor, currentUser, week } = useProjectsStore()
  const [selected, setSelected] = React.useState<MilestoneView | null>(null)

  if (!actor || !currentUser) return null
  const myProjects = projectsFor(db, actor)
  const project = myProjects[0]

  if (!project) {
    return (
      <>
        <PageHeader title={`Hello, ${currentUser.name.split(" ")[0]}`} />
        <EmptyState
          icon={UserGroupIcon}
          title="You are not on a project yet"
          body="Your project will appear here once the coordinator adds you to a team."
        />
      </>
    )
  }

  const upcoming = upcomingFor(db, project.id, 4)
  const actions = actionItemsFor(db, currentUser.id)
  const recentFeedback = db.reviews
    .filter((r) => r.projectId === project.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 3)

  return (
    <>
      <PageHeader
        title={`Hello, ${currentUser.name.split(" ")[0]}`}
        description={`Week ${week} of 28 on ${project.title}`}
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href={`/projects/${project.id}`} />}>
            Open our project
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" strokeWidth={2} />
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* What you owe */}
        <section>
          <SectionHeading hint="what your team owes">Due next</SectionHeading>
          {upcoming.length === 0 ? (
            <EmptyState title="Everything is accepted" body="Nothing is waiting on your team." />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((view) => (
                <li key={view.instance.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(view)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-th text-muted-foreground uppercase">
                        Week {view.dueWeek} · {view.template.phase}
                      </p>
                      <p className="mt-0.5 truncate text-subhead text-foreground">
                        {view.template.title}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <StatusPill status={view.status} size="sm" />
                        <DueBadge dueDate={view.dueDate} hideIcon />
                      </p>
                    </div>
                    <span className="shrink-0 text-caption text-muted-foreground">
                      {view.instance.completedDeliverables.length}/
                      {view.template.deliverables.length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* What you are owed — deliberately a separate block */}
        <section className="space-y-6">
          <div>
            <SectionHeading count={actions.length}>Your actions</SectionHeading>
            {actions.length === 0 ? (
              <EmptyState title="Nothing open" body="Actions from meetings and reviews land here." className="py-6" />
            ) : (
              <ul className="space-y-1.5">
                {actions.slice(0, 6).map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <p className="text-meta">{item.text}</p>
                    <p className="mt-0.5">
                      <DueBadge dueDate={item.dueDate} hideIcon />
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <SectionHeading>Recent feedback</SectionHeading>
            {recentFeedback.length === 0 ? (
              <EmptyState title="No feedback yet" className="py-6" />
            ) : (
              <ul className="space-y-2">
                {recentFeedback.map((review) => {
                  const reviewer = personById(db, review.reviewerId)
                  return (
                    <li
                      key={review.id}
                      className={cn(
                        "rounded-lg border p-3",
                        review.verdict === "accept"
                          ? "border-status-accepted-br bg-status-accepted-bg"
                          : "border-status-returned-br bg-status-returned-bg"
                      )}
                    >
                      <p className="flex items-center gap-1.5 text-caption">
                        <PersonAvatar person={reviewer} size="xs" />
                        {reviewer?.name ?? "A mentor"} ·{" "}
                        {review.verdict === "accept" ? "accepted" : "asked for changes"} ·{" "}
                        {timeAgo(review.createdAt)}
                      </p>
                      <p className="mt-1 line-clamp-3 text-meta">{review.body}</p>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      <MilestoneSheet
        view={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  )
}

/* ----------------------------------------------------------------- mentor */

function MentorHome() {
  const { db, actor, currentUser } = useProjectsStore()
  const [selected, setSelected] = React.useState<MilestoneView | null>(null)
  if (!actor || !currentUser) return null

  const myProjects = projectsFor(db, actor)
  const queue = reviewQueue(db, actor)
  const attention = needsAttention(db, actor)
  const stats = measures(db, myProjects.map((p) => p.id))

  return (
    <>
      <PageHeader
        title="My teams"
        description={`${myProjects.length} ${myProjects.length === 1 ? "team" : "teams"} under your mentoring line.`}
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href="/review" />}>
            <HugeiconsIcon icon={InboxIcon} className="size-4" strokeWidth={2} />
            Review queue
            {queue.length > 0 && <Badge className="ml-1">{queue.length}</Badge>}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile
          label="Waiting on you"
          value={String(queue.length)}
          hint={queue.length ? "Oldest first in the queue" : "Nothing outstanding"}
          tone={queue.length > 3 ? "warn" : "default"}
        />
        <MetricTile
          label="Teams needing a look"
          value={String(attention.length)}
          hint="Overdue work, ageing actions or silence"
          tone={attention.length ? "warn" : "good"}
        />
        <MetricTile
          label="Actions closed"
          value={stats.actionClosureRate === null ? "—" : `${Math.round(stats.actionClosureRate * 100)}%`}
          hint="Across your teams"
        />
      </div>

      {/* Three sections, always visible. No filter to discover. */}
      <section>
        <SectionHeading count={queue.length} hint="oldest first">
          Needs your review
        </SectionHeading>
        {queue.length === 0 ? (
          <EmptyState icon={LegalHammerIcon} title="All reviewed. Nice work." />
        ) : (
          <ul className="space-y-2">
            {queue.slice(0, 5).map((view) => (
              <QueueRow key={view.instance.id} view={view} onOpen={() => setSelected(view)} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeading count={attention.length}>Worth a look</SectionHeading>
        {attention.length === 0 ? (
          <EmptyState title="Nothing is drifting" body="Every team has turned something in recently." />
        ) : (
          <ul className="space-y-2">
            {attention.map(({ project, reasons }) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <HugeiconsIcon
                    icon={AlarmClockIcon}
                    className="mt-0.5 size-4 shrink-0 text-status-returned-solid"
                    strokeWidth={2}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-subhead">{teamNameFor(db, project.teamId)}</p>
                    <p className="truncate text-caption text-muted-foreground">{project.title}</p>
                    <ul className="mt-1.5 space-y-0.5">
                      {reasons.map((reason) => (
                        <li key={reason} className="text-meta text-muted-foreground">
                          · {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeading count={myProjects.length}>All my teams</SectionHeading>
        <ProjectRows projectIds={myProjects.map((p) => p.id)} />
      </section>

      <MilestoneSheet
        view={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  )
}

function QueueRow({ view, onOpen }: { view: MilestoneView; onOpen: () => void }) {
  const { db } = useProjectsStore()
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-subhead">{view.template.title}</p>
          <p className="truncate text-caption text-muted-foreground">
            {teamNameFor(db, view.project.teamId)} · {view.project.title}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill status={view.status} size="sm" />
          <span className="text-caption text-muted-foreground">
            {view.instance.submittedAt ? timeAgo(view.instance.submittedAt) : ""}
          </span>
        </div>
      </button>
    </li>
  )
}

/* ------------------------------------------------------------ coordinator */

function CoordinatorHome() {
  const { db, actor, week } = useProjectsStore()
  if (!actor) return null

  const projects = projectsFor(db, actor)
  const views = milestoneViews(db, projects.map((p) => p.id))
  const counts = statusCounts(views)
  const stats = measures(db)
  const attention = needsAttention(db, actor)
  const mentors = db.people.filter((p) => p.roles.includes("mentor"))

  return (
    <>
      <PageHeader
        title="Programme overview"
        description={`${projects.length} projects, ${mentors.length} mentoring lines, week ${week} of 28.`}
        actions={
          <Button nativeButton={false} render={<Link href="/grid" />}>
            Open the grid
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" strokeWidth={2} />
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="On time so far"
          value={stats.onTimeRate === null ? "—" : `${Math.round(stats.onTimeRate * 100)}%`}
          hint={`${stats.dueSoFar} checkpoints due to date`}
          tone={stats.onTimeRate !== null && stats.onTimeRate < 0.6 ? "warn" : "good"}
        />
        <MetricTile
          label="Median time to feedback"
          value={
            stats.medianHoursToFeedback === null
              ? "—"
              : `${Math.round(stats.medianHoursToFeedback)}h`
          }
          hint="Submission to mentor response"
        />
        <MetricTile
          label="Actions closed"
          value={
            stats.actionClosureRate === null ? "—" : `${Math.round(stats.actionClosureRate * 100)}%`
          }
          hint="Before the next meeting"
        />
        <MetricTile
          label="Teams needing a look"
          value={String(attention.length)}
          hint={`of ${projects.length}`}
          tone={attention.length > projects.length / 3 ? "warn" : "default"}
        />
      </div>

      <section>
        <SectionHeading hint="every checkpoint across the batch">Where the batch is</SectionHeading>
        <StatusLegend counts={counts} />
      </section>

      <section>
        <SectionHeading count={attention.length}>Worth a look</SectionHeading>
        {attention.length === 0 ? (
          <EmptyState title="Nothing is drifting" />
        ) : (
          <ul className="space-y-2">
            {attention.slice(0, 8).map(({ project, reasons }) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-subhead">{teamNameFor(db, project.teamId)}</p>
                    <p className="truncate text-caption text-muted-foreground">
                      {mentorNames(db, project.mentorIds)} · {project.title}
                    </p>
                    <p className="mt-1 text-meta text-muted-foreground">{reasons.join(" · ")}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeading count={mentors.length}>Mentor load</SectionHeading>
        <ul className="grid gap-2 sm:grid-cols-2">
          {mentors.map((mentor) => {
            const load = db.projects.filter(
              (p) => !p.archived && p.mentorIds.includes(mentor.id)
            ).length
            const outOfBand = load > 8 || load === 0
            return (
              <li
                key={mentor.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
              >
                <PersonAvatar person={mentor} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-meta font-medium">{mentor.name}</p>
                  <p className="truncate text-caption text-muted-foreground">
                    {mentor.affiliation}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-2 py-0.5 text-meta font-semibold",
                    outOfBand
                      ? "bg-status-returned-bg text-status-returned-fg"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {load} {load === 1 ? "team" : "teams"}
                </span>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-caption text-muted-foreground">
          The programme describes the load as 6 to 8 teams each. Two lines sit outside that in the
          data we hold, which is on the list to confirm.
        </p>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ bits */

function ProjectRows({ projectIds }: { projectIds: string[] }) {
  const { db } = useProjectsStore()
  return (
    <ul className="space-y-1.5">
      {projectIds.map((projectId) => {
        const project = db.projects.find((p) => p.id === projectId)
        if (!project) return null
        const views = milestoneViews(db, [projectId])
        const next = views.find((v) => v.status !== "accepted")
        const accepted = views.filter((v) => v.status === "accepted").length
        return (
          <li key={projectId}>
            <Link
              href={`/projects/${projectId}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-meta font-medium">{teamNameFor(db, project.teamId)}</p>
                <p className="truncate text-caption text-muted-foreground">{project.title}</p>
              </div>
              {next && (
                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  <StatusPill status={next.status} size="sm" />
                  <span className="w-24 truncate text-caption text-muted-foreground">
                    {next.template.title}
                  </span>
                </div>
              )}
              <span className="shrink-0 text-caption text-muted-foreground">
                {accepted}/{views.length}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function teamNameFor(db: ReturnType<typeof useProjectsStore>["db"], teamId: string) {
  return db.teams.find((t) => t.id === teamId)?.name ?? "Team"
}

function mentorNames(db: ReturnType<typeof useProjectsStore>["db"], mentorIds: string[]) {
  return mentorIds
    .map((id) => personById(db, id)?.name ?? "")
    .filter(Boolean)
    .join(", ")
}
