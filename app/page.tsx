"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlarmClockIcon,
  CheckmarkCircle02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { ActionItemList } from "@/components/meetings/action-items"
import { EmptyState, PersonAvatar, SectionHeading } from "@/components/common"
import { MilestoneSheet } from "@/components/milestones/milestone-sheet"
import { ProgressCells } from "@/components/progress-cells"
import { StatusPill } from "@/components/status/status-pill"
import { describeDue, timeAgo } from "@/lib/dates"
import { projectsFor } from "@/lib/permissions"
import {
  actionItemsFor,
  measures,
  milestoneViews,
  needsAttention,
  personById,
  reviewQueue,
  upcomingFor,
  type MilestoneView,
} from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export default function TodayPage() {
  const { actor } = useProjectsStore()
  if (!actor) return null
  if (actor.role === "student") return <StudentToday />
  if (actor.role === "mentor") return <MentorToday />
  return <CoordinatorToday />
}

/* -------------------------------------------------------------- shared */

/** The one number, at the size that says it is the one number. */
function Headline({
  value,
  unit,
  caption,
  aside,
}: {
  value: string
  unit?: string
  caption: string
  aside?: { value: string; caption: string }[]
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-7 gap-y-4 border-b border-border pb-6">
      <div>
        <p className="font-display text-hero py-1 text-foreground">
          {value}
          {unit && <span className="ml-1 text-[0.34em] font-bold tracking-normal">{unit}</span>}
        </p>
        <p className="mt-2 text-subhead">{caption}</p>
      </div>
      {aside && aside.length > 0 && (
        <>
          <span aria-hidden className="hidden h-14 w-px bg-border sm:block" />
          <div className="flex flex-wrap gap-7 pb-1">
            {aside.map((item) => (
              <div key={item.caption}>
                <p className="font-display text-stat">{item.value}</p>
                <p className="mt-1 text-caption text-muted-foreground">{item.caption}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** The row you are meant to act on. Dark, so it cannot be mistaken for the
 * list underneath it. */
function LoudRow({
  eyebrow,
  title,
  meta,
  action,
  onClick,
  tone = "loud",
}: {
  eyebrow: React.ReactNode
  title: string
  meta: string
  action: string
  onClick: () => void
  tone?: "loud" | "quiet"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-sm px-4 py-3.5 text-left transition-colors",
        tone === "loud"
          ? "bg-foreground text-background hover:bg-foreground/90"
          : "border border-border hover:bg-muted"
      )}
    >
      <span className="shrink-0">{eyebrow}</span>
      <span className="min-w-0 flex-1">
        <span className="font-display block truncate text-[17px] font-bold tracking-[-0.02em]">
          {title}
        </span>
        <span
          className={cn(
            "mt-0.5 block truncate text-caption",
            tone === "loud" ? "text-background/65" : "text-muted-foreground"
          )}
        >
          {meta}
        </span>
      </span>
      <span
        className={cn(
          "shrink-0 rounded-sm px-3.5 py-2 text-meta font-bold whitespace-nowrap",
          tone === "loud" ? "bg-lime text-lime-ink" : "border border-foreground"
        )}
      >
        {action}
      </span>
    </button>
  )
}

/* ------------------------------------------------------------- student */

function StudentToday() {
  const { db, actor, currentUser, week } = useProjectsStore()
  const [selected, setSelected] = React.useState<MilestoneView | null>(null)
  if (!actor || !currentUser) return null

  const project = projectsFor(db, actor)[0]
  if (!project) {
    return (
      <EmptyState
        icon={UserGroupIcon}
        title="You are not on a project yet"
        body="Your project appears here once the coordinator adds you to a team."
      />
    )
  }

  const views = milestoneViews(db, [project.id])
  const upcoming = upcomingFor(db, project.id, 3)
  const next = upcoming[0]
  const actions = actionItemsFor(db, currentUser.id)
  const accepted = views.filter((v) => v.status === "accepted").length
  const due = next ? describeDue(next.dueDate) : null
  const feedback = db.reviews
    .filter((r) => r.projectId === project.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 2)

  return (
    <>
      <Headline
        value={due ? String(Math.abs(due.days)) : "—"}
        unit={due ? (Math.abs(due.days) === 1 ? "day" : "days") : undefined}
        caption={
          due
            ? due.overdue
              ? `overdue — ${next?.template.title}`
              : `until ${next?.template.title}`
            : "everything accepted"
        }
        aside={[
          { value: `${accepted}/12`, caption: "accepted" },
          { value: String(actions.length), caption: "actions open" },
          { value: String(week), caption: "week of 28" },
        ]}
      />

      <section>
        <SectionHeading
          hint="what your team owes"
          action={
            <Link
              href={`/projects/${project.id}`}
              className="text-meta font-medium underline underline-offset-2"
            >
              Open our project
            </Link>
          }
        >
          Due next
        </SectionHeading>
        <div className="space-y-2">
          {upcoming.map((view, index) => (
            <LoudRow
              key={view.instance.id}
              tone={index === 0 ? "loud" : "quiet"}
              eyebrow={<StatusPill status={view.status} size="sm" />}
              title={view.template.title}
              meta={`Week ${view.dueWeek} · ${describeDue(view.dueDate).label} · ${view.instance.completedDeliverables.length} of ${view.template.deliverables.length} done`}
              action="Open"
              onClick={() => setSelected(view)}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionHeading count={actions.length}>Your actions</SectionHeading>
          {actions.length === 0 ? (
            <EmptyState title="Nothing open" body="Actions from meetings and reviews land here." />
          ) : (
            <ActionItemList project={project} items={actions} allowAdd={false} />
          )}
        </section>

        <section>
          <SectionHeading>Recent feedback</SectionHeading>
          {feedback.length === 0 ? (
            <EmptyState title="No feedback yet" />
          ) : (
            <ul className="space-y-2">
              {feedback.map((review) => {
                const reviewer = personById(db, review.reviewerId)
                return (
                  <li
                    key={review.id}
                    className={cn(
                      "rounded-sm border-l-2 py-2 pl-3",
                      review.verdict === "accept"
                        ? "border-status-accepted-solid bg-status-accepted-bg"
                        : "border-status-returned-solid bg-status-returned-bg"
                    )}
                  >
                    <p className="flex items-center gap-1.5 text-caption">
                      <PersonAvatar person={reviewer} size="xs" />
                      <span className="font-medium">{reviewer?.name}</span>
                      {review.verdict === "accept" ? "accepted" : "asked for changes"} ·{" "}
                      {timeAgo(review.createdAt)}
                    </p>
                    <p className="mt-1 line-clamp-3 text-meta">{review.body}</p>
                  </li>
                )
              })}
            </ul>
          )}
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

/* -------------------------------------------------------------- mentor */

function MentorToday() {
  const { db, actor } = useProjectsStore()
  const [selected, setSelected] = React.useState<MilestoneView | null>(null)
  if (!actor) return null

  const projects = projectsFor(db, actor)
  const queue = reviewQueue(db, actor)
  const attention = needsAttention(db, actor)
  const stats = measures(
    db,
    projects.map((p) => p.id)
  )

  return (
    <>
      <Headline
        value={String(queue.length)}
        caption={
          queue.length === 1 ? "piece of work waiting on you" : "pieces of work waiting on you"
        }
        aside={[
          { value: String(projects.length), caption: "teams" },
          { value: String(attention.length), caption: "drifting" },
          {
            value:
              stats.actionClosureRate === null
                ? "—"
                : `${Math.round(stats.actionClosureRate * 100)}%`,
            caption: "actions closed",
          },
        ]}
      />

      <section>
        <SectionHeading count={queue.length} hint="oldest first">
          Waiting on you
        </SectionHeading>
        {queue.length === 0 ? (
          <EmptyState icon={CheckmarkCircle02Icon} title="All reviewed. Nice work." />
        ) : (
          <div className="space-y-2">
            {queue.slice(0, 5).map((view, index) => (
              <LoudRow
                key={view.instance.id}
                tone={index === 0 ? "loud" : "quiet"}
                eyebrow={<StatusPill status={view.status} size="sm" />}
                title={view.template.title}
                meta={`${teamName(db, view.project.teamId)} · turned in ${
                  view.instance.submittedAt ? timeAgo(view.instance.submittedAt) : "recently"
                }`}
                action="Review it"
                onClick={() => setSelected(view)}
              />
            ))}
          </div>
        )}
      </section>

      {attention.length > 0 && (
        <section>
          <SectionHeading count={attention.length} hint="why, not a score">
            Drifting
          </SectionHeading>
          <ul className="space-y-1.5">
            {attention.map(({ project, reasons }) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-start gap-3 rounded-sm border border-border px-4 py-3 transition-colors hover:bg-muted"
                >
                  <HugeiconsIcon
                    icon={AlarmClockIcon}
                    className="mt-0.5 size-4 shrink-0 text-status-returned-solid"
                    strokeWidth={2}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="font-display block truncate text-[15px] font-bold tracking-[-0.02em]">
                      {teamName(db, project.teamId)}
                    </span>
                    <span className="block text-caption text-muted-foreground">
                      {reasons.join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-caption text-muted-foreground">
        All {projects.length} teams live under{" "}
        <Link href="/projects" className="underline">
          Projects
        </Link>
        . They are not repeated here.
      </p>

      <MilestoneSheet
        view={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  )
}

/* --------------------------------------------------------- coordinator */

function CoordinatorToday() {
  const { db, actor, week } = useProjectsStore()
  const [selected, setSelected] = React.useState<MilestoneView | null>(null)
  if (!actor) return null

  const projects = projectsFor(db, actor)
  const stats = measures(db)
  const attention = needsAttention(db, actor)
  const queue = reviewQueue(db, actor)
  const mentors = db.people.filter((p) => p.roles.includes("mentor"))

  return (
    <>
      <Headline
        value={stats.onTimeRate === null ? "—" : String(Math.round(stats.onTimeRate * 100))}
        unit={stats.onTimeRate === null ? undefined : "%"}
        caption={`of ${stats.dueSoFar} checkpoints due so far were on time`}
        aside={[
          { value: String(projects.length), caption: "projects" },
          { value: String(attention.length), caption: "drifting" },
          { value: String(queue.length), caption: "awaiting a mentor" },
          { value: String(week), caption: "week of 28" },
        ]}
      />

      <section>
        <SectionHeading count={attention.length} hint="why, not a score">
          Drifting
        </SectionHeading>
        {attention.length === 0 ? (
          <EmptyState title="Nothing is drifting" />
        ) : (
          <ul className="space-y-1.5">
            {attention.slice(0, 6).map(({ project, reasons }) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-4 rounded-sm border border-border px-4 py-3 transition-colors hover:bg-muted"
                >
                  <span className="min-w-0 flex-1">
                    <span className="font-display block truncate text-[15px] font-bold tracking-[-0.02em]">
                      {teamName(db, project.teamId)}
                    </span>
                    <span className="block truncate text-caption text-muted-foreground">
                      {project.mentorIds
                        .map((id) => personById(db, id)?.name)
                        .filter(Boolean)
                        .join(", ")}{" "}
                      · {reasons.join(" · ")}
                    </span>
                  </span>
                  <span className="hidden w-56 shrink-0 md:block">
                    <ProgressCells views={milestoneViews(db, [project.id])} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeading count={mentors.length}>Mentoring lines</SectionHeading>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {mentors.map((mentor) => {
            const load = db.projects.filter(
              (p) => !p.archived && p.mentorIds.includes(mentor.id)
            ).length
            return (
              <li
                key={mentor.id}
                className="flex items-center gap-3 rounded-sm border border-border px-3 py-2.5"
              >
                <PersonAvatar person={mentor} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-meta font-semibold">{mentor.name}</span>
                  <span className="block truncate text-caption text-muted-foreground">
                    {mentor.affiliation}
                  </span>
                </span>
                <span className="font-display shrink-0 text-[17px] font-bold tabular-nums">
                  {load}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <p className="text-caption text-muted-foreground">
        <Link href="/checkpoints" className="underline">
          Checkpoints
        </Link>{" "}
        holds every project against every week.{" "}
        <Link href="/measures" className="underline">
          Measures
        </Link>{" "}
        holds the numbers this is judged on.
      </p>

      <MilestoneSheet
        view={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  )
}

function teamName(db: ReturnType<typeof useProjectsStore>["db"], teamId: string) {
  return db.teams.find((t) => t.id === teamId)?.name ?? "Team"
}
