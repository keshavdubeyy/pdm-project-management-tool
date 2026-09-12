"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { LockIcon, Search01Icon } from "@hugeicons/core-free-icons"

import { EmptyState, PageHeader, PersonAvatar } from "@/components/common"
import { MilestoneSheet } from "@/components/milestones/milestone-sheet"
import { PersonCombobox } from "@/components/person-combobox"
import { ProgressCells } from "@/components/progress-cells"
import { StatusPill } from "@/components/status/status-pill"
import { Input } from "@/components/ui/input"
import { canViewProject, isCoordinator, projectsFor } from "@/lib/permissions"
import { milestoneViews, personById, type MilestoneView } from "@/lib/selectors"
import { AWAITING_MENTOR } from "@/lib/status"
import { useProjectsStore } from "@/lib/store"
import type { Project } from "@/lib/types"
import { cn } from "@/lib/utils"

type Filter = "all" | "waiting" | "drifting" | "done"

/** One register, not three lists.
 *
 * This page used to be three: a directory, a review queue, and a mentor home
 * that listed the same six teams a third time. Same teams, one place, with the
 * question you are asking as a chip above them.
 */
export default function ProjectsPage() {
  const { db, actor } = useProjectsStore()
  const [filter, setFilter] = React.useState<Filter>("all")
  const [query, setQuery] = React.useState("")
  const [mentorId, setMentorId] = React.useState<string | null>(null)
  const [selected, setSelected] = React.useState<MilestoneView | null>(null)

  if (!actor) return null

  const mine = projectsFor(db, actor)
  const isStudent = actor.role === "student"
  // A student sees the whole batch, at the depth their permissions allow.
  const scope = isStudent ? db.projects.filter((p) => !p.archived) : mine
  const mentors = db.people.filter((p) => p.roles.includes("mentor"))

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return scope
      .map((project) => {
        const views = milestoneViews(db, [project.id])
        const waiting = views.filter((v) => AWAITING_MENTOR.includes(v.status)).length
        const overdue = views.filter((v) => v.status === "overdue").length
        const returned = views.filter((v) => v.status === "returned").length
        const accepted = views.filter((v) => v.status === "accepted").length
        const next = views.find((v) => v.status !== "accepted")
        const team = db.teams.find((t) => t.id === project.teamId)
        return { project, views, waiting, overdue, returned, accepted, next, team }
      })
      .filter((row) => {
        if (mentorId && !row.project.mentorIds.includes(mentorId)) return false
        if (q) {
          const hay = `${row.project.title} ${row.team?.name ?? ""} ${row.project.description}`
          if (!hay.toLowerCase().includes(q)) return false
        }
        if (filter === "waiting") return row.waiting > 0
        if (filter === "drifting") return row.overdue > 0 || row.returned > 0
        if (filter === "done") return row.accepted > 0
        return true
      })
      .sort((a, b) => b.waiting - a.waiting || b.overdue - a.overdue)
  }, [db, filter, mentorId, query, scope])

  const counts = React.useMemo(() => {
    const all = scope.map((project) => milestoneViews(db, [project.id]))
    return {
      all: scope.length,
      waiting: all.filter((v) => v.some((x) => AWAITING_MENTOR.includes(x.status))).length,
      drifting: all.filter((v) => v.some((x) => x.status === "overdue" || x.status === "returned"))
        .length,
      done: all.filter((v) => v.some((x) => x.status === "accepted")).length,
    }
  }, [db, scope])

  const chips: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: isStudent ? "Every project" : "All", count: counts.all },
    { key: "waiting", label: isStudent ? "With a mentor" : "Waiting on me", count: counts.waiting },
    { key: "drifting", label: "Drifting", count: counts.drifting },
    { key: "done", label: "Has accepted work", count: counts.done },
  ]

  return (
    <>
      <PageHeader
        title="Projects"
        description={
          isStudent
            ? "Every project in the batch. You can open your own; the rest show their shape only."
            : `${scope.length} ${scope.length === 1 ? "project" : "projects"} you are responsible for.`
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setFilter(chip.key)}
                  className={cn(
                    "rounded-sm border px-2.5 py-1 text-meta font-medium transition-colors",
                    filter === chip.key
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {chip.label}
                  <span className="ml-1.5 tabular-nums opacity-65">{chip.count}</span>
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={2}
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter…"
                  className="h-8 w-48 rounded-sm pl-8"
                />
              </div>
              {isCoordinator(actor) && (
                <PersonCombobox
                  people={mentors}
                  value={mentorId}
                  onChange={setMentorId}
                  allowEmpty
                  emptyLabel="Every mentor"
                  placeholder="Filter by mentor…"
                  className="w-52"
                />
              )}
            </div>
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing matches"
          body="Try a different chip, or clear the filter."
        />
      ) : (
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          {rows.map((row, index) => {
            const open = canViewProject(actor, row.project, db)
            const inner = (
              <div
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)] items-center gap-x-5 gap-y-2.5 px-4 py-3.5 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_9rem_3.5rem]",
                  index > 0 && "border-t border-border",
                  open && "transition-colors hover:bg-muted/60"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-display truncate text-[15px] font-bold tracking-[-0.02em]">
                      {row.team?.name ?? "Team"}
                    </p>
                    {!open && (
                      <HugeiconsIcon
                        icon={LockIcon}
                        className="size-3 shrink-0 text-muted-foreground"
                        strokeWidth={2}
                      />
                    )}
                  </div>
                  <p className="truncate text-caption text-muted-foreground">{row.project.title}</p>
                </div>

                <ProgressCells
                  views={row.views}
                  onSelect={open ? setSelected : undefined}
                  height="h-5"
                />

                <div className="min-w-0">
                  {row.next ? (
                    <>
                      <StatusPill status={row.next.status} size="sm" />
                      <p className="mt-1 truncate text-caption text-muted-foreground">
                        {row.next.template.title}
                      </p>
                    </>
                  ) : (
                    <StatusPill status="accepted" size="sm" />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <span className="font-display text-[15px] font-bold tabular-nums">
                    {row.accepted}
                    <span className="text-caption font-medium text-muted-foreground">/12</span>
                  </span>
                </div>
              </div>
            )

            return open ? (
              <Link key={row.project.id} href={`/projects/${row.project.id}`} className="block">
                {inner}
              </Link>
            ) : (
              <div key={row.project.id}>{inner}</div>
            )
          })}
        </div>
      )}

      {!isStudent && (
        <p className="text-caption text-muted-foreground">
          Each team appears once. The chips ask a different question of the same list.
        </p>
      )}

      <MilestoneSheet
        view={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  )
}
