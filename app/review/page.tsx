"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, InboxIcon } from "@hugeicons/core-free-icons"

import { ArtefactRow } from "@/components/artefacts/artefact-row"
import { DueBadge, EmptyState, PageHeader, SectionHeading } from "@/components/common"
import { MilestoneSheet } from "@/components/milestones/milestone-sheet"
import { StatusPill } from "@/components/status/status-pill"
import { Kbd } from "@/components/ui/kbd"
import { timeAgo } from "@/lib/dates"
import { projectsFor } from "@/lib/permissions"
import { milestoneViews, personById, reviewQueue, type MilestoneView } from "@/lib/selectors"
import { AWAITING_TEAM } from "@/lib/status"
import { useProjectsStore } from "@/lib/store"
import { cn } from "@/lib/utils"

/** The queue a mentor clears.
 *
 * Three sections, all visible at once, rather than a filter you have to find:
 * what is waiting on you, what is waiting on them, and what has just closed.
 * The first is sorted oldest first, because the team that has waited longest
 * is the one that should be looked at next. `j` and `k` step through it.
 */
export default function ReviewPage() {
  const { db, actor } = useProjectsStore()
  const [selected, setSelected] = React.useState<MilestoneView | null>(null)
  const [cursor, setCursor] = React.useState(0)

  const queue = actor ? reviewQueue(db, actor) : []

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return
      if (event.key === "j") setCursor((c) => Math.min(c + 1, Math.max(queue.length - 1, 0)))
      if (event.key === "k") setCursor((c) => Math.max(c - 1, 0))
      if (event.key === "Enter" && queue[cursor]) setSelected(queue[cursor])
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [cursor, queue])

  if (!actor) return null

  const mine = projectsFor(db, actor)
  const all = milestoneViews(db, mine.map((p) => p.id))
  const withTeams = all
    .filter((v) => AWAITING_TEAM.includes(v.status))
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
  const recentlyClosed = all
    .filter((v) => v.status === "accepted")
    .sort((a, b) => ((a.instance.acceptedAt ?? "") < (b.instance.acceptedAt ?? "") ? 1 : -1))
    .slice(0, 6)

  return (
    <>
      <PageHeader
        title="Review queue"
        description="Everything across your teams, split by who it is waiting on."
        actions={
          <span className="hidden items-center gap-1.5 text-caption text-muted-foreground sm:flex">
            <Kbd>j</Kbd>
            <Kbd>k</Kbd>
            to move, <Kbd>↵</Kbd> to open
          </span>
        }
      />

      <section>
        <SectionHeading count={queue.length} hint="oldest first">
          Needs your review
        </SectionHeading>
        {queue.length === 0 ? (
          <EmptyState icon={CheckmarkCircle02Icon} title="All reviewed. Nice work." />
        ) : (
          <ul className="space-y-2">
            {queue.map((view, index) => (
              <ReviewCard
                key={view.instance.id}
                view={view}
                active={index === cursor}
                onOpen={() => {
                  setCursor(index)
                  setSelected(view)
                }}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeading count={withTeams.length}>Waiting on the teams</SectionHeading>
        {withTeams.length === 0 ? (
          <EmptyState icon={InboxIcon} title="Nothing outstanding with your teams" />
        ) : (
          <ul className="space-y-1.5">
            {withTeams.slice(0, 12).map((view) => (
              <li key={view.instance.id}>
                <button
                  type="button"
                  onClick={() => setSelected(view)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-meta font-medium">{view.template.title}</p>
                    <p className="truncate text-caption text-muted-foreground">
                      {teamName(db, view.project.teamId)}
                    </p>
                  </div>
                  <StatusPill status={view.status} size="sm" />
                  <DueBadge dueDate={view.dueDate} hideIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recentlyClosed.length > 0 && (
        <section>
          <SectionHeading count={recentlyClosed.length}>Recently closed</SectionHeading>
          <ul className="space-y-1.5">
            {recentlyClosed.map((view) => (
              <li
                key={view.instance.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-meta">{view.template.title}</p>
                  <p className="truncate text-caption text-muted-foreground">
                    {teamName(db, view.project.teamId)}
                  </p>
                </div>
                <span className="shrink-0 text-caption text-muted-foreground">
                  {view.instance.acceptedAt ? timeAgo(view.instance.acceptedAt) : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <MilestoneSheet
        view={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  )
}

function ReviewCard({
  view,
  active,
  onOpen,
}: {
  view: MilestoneView
  active: boolean
  onOpen: () => void
}) {
  const { db } = useProjectsStore()
  const artefacts = db.artefacts.filter((a) => a.milestoneInstanceId === view.instance.id)
  const submittedBy = view.latestSubmission
    ? personById(db, view.latestSubmission.submittedBy)
    : undefined

  return (
    <li
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors",
        active ? "border-primary/50 ring-2 ring-ring/20" : "border-border hover:bg-muted/40"
      )}
    >
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-th text-muted-foreground uppercase">
              Week {view.dueWeek} · {teamName(db, view.project.teamId)}
            </p>
            <p className="mt-0.5 truncate text-subhead">{view.template.title}</p>
            <p className="truncate text-caption text-muted-foreground">{view.project.title}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusPill status={view.status} size="sm" />
            <span className="text-caption text-muted-foreground">
              {view.instance.submittedAt ? `turned in ${timeAgo(view.instance.submittedAt)}` : ""}
            </span>
          </div>
        </div>

        {view.latestSubmission?.note && (
          <p className="mt-2 rounded-md bg-muted/60 px-2.5 py-1.5 text-meta text-muted-foreground">
            “{view.latestSubmission.note}” — {submittedBy?.name.split(" ")[0] ?? "the team"}
          </p>
        )}
      </button>

      {artefacts.length > 0 && (
        <div className="mt-2.5 space-y-1">
          {artefacts.slice(0, 2).map((artefact) => (
            <ArtefactRow key={artefact.id} artefact={artefact} compact />
          ))}
          {artefacts.length > 2 && (
            <p className="text-caption text-muted-foreground">and {artefacts.length - 2} more</p>
          )}
        </div>
      )}
    </li>
  )
}

function teamName(db: ReturnType<typeof useProjectsStore>["db"], teamId: string) {
  return db.teams.find((t) => t.id === teamId)?.name ?? "Team"
}
