"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Grid02Icon } from "@hugeicons/core-free-icons"

import { BatchGrid, type BatchGridRow } from "@/components/grid/batch-grid"
import { EmptyState, PageHeader } from "@/components/common"
import { MilestoneRail } from "@/components/milestones/milestone-rail"
import { MilestoneSheet } from "@/components/milestones/milestone-sheet"
import { PersonCombobox } from "@/components/person-combobox"
import { StatusLegend } from "@/components/status/status-legend"
import { Input } from "@/components/ui/input"
import { isCoordinator, projectsFor } from "@/lib/permissions"
import { milestoneViews, personById, statusCounts, type MilestoneView } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import type { MilestoneStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

/** The calendar, at the scope your role has.
 *
 * A student's twelve checkpoints, or everybody's — the same word in the rail
 * either way. */
export default function CheckpointsPage() {
  const { actor } = useProjectsStore()
  if (!actor) return null
  return actor.role === "student" ? <OwnCheckpoints /> : <EveryoneGrid />
}

/* ------------------------------------------------------------- student */

function OwnCheckpoints() {
  const { db, actor, week } = useProjectsStore()
  const [selected, setSelected] = React.useState<MilestoneView | null>(null)
  if (!actor) return null

  const project = projectsFor(db, actor)[0]
  if (!project) {
    return (
      <EmptyState
        title="You are not on a project yet"
        body="Your twelve checkpoints appear here once the coordinator adds you to a team."
      />
    )
  }

  const views = milestoneViews(db, [project.id])
  const accepted = views.filter((v) => v.status === "accepted").length

  return (
    <>
      <PageHeader
        title="Checkpoints"
        description={`${project.title} · twelve checkpoints across twenty-eight weeks.`}
        meta={
          <div className="flex items-baseline gap-3">
            <span className="font-display text-stat">
              {accepted}
              <span className="text-[0.5em] font-medium text-muted-foreground">/12</span>
            </span>
            <span className="text-meta text-muted-foreground">accepted · week {week} of 28</span>
          </div>
        }
      />
      <div className="max-w-2xl">
        <MilestoneRail
          views={views}
          currentWeek={week}
          onSelect={setSelected}
          selectedId={selected?.instance.id}
        />
      </div>
      <MilestoneSheet
        view={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  )
}

/* ------------------------------------------------- mentor / coordinator */

function EveryoneGrid() {
  const { db, actor, week } = useProjectsStore()
  const [selected, setSelected] = React.useState<MilestoneView | null>(null)
  const [query, setQuery] = React.useState("")
  const [mentorId, setMentorId] = React.useState<string | null>(null)
  const [statuses, setStatuses] = React.useState<MilestoneStatus[]>([])

  if (!actor) return null

  const scope = projectsFor(db, actor)
  const mentors = db.people.filter((p) => p.roles.includes("mentor"))
  const columns = db.milestoneTemplate
    .filter((t) => t.batchId === db.batches[0]?.id)
    .sort((a, b) => a.order - b.order)

  const allViews = milestoneViews(
    db,
    scope.map((p) => p.id)
  )
  const counts = statusCounts(allViews)

  const rows: BatchGridRow[] = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return scope
      .filter((project) => {
        if (mentorId && !project.mentorIds.includes(mentorId)) return false
        if (!q) return true
        const team = db.teams.find((t) => t.id === project.teamId)
        return (
          project.title.toLowerCase().includes(q) ||
          (team?.name.toLowerCase().includes(q) ?? false)
        )
      })
      .map((project) => {
        const team = db.teams.find((t) => t.id === project.teamId)
        const cells = new Map<string, MilestoneView>()
        allViews
          .filter((v) => v.project.id === project.id)
          .filter((v) => !statuses.length || statuses.includes(v.status))
          .forEach((v) => cells.set(v.template.id, v))
        return {
          project,
          label: team?.name ?? project.title,
          sublabel:
            project.mentorIds
              .map((id) => personById(db, id)?.name.replace(/^Dr\.\s*/, "") ?? "")
              .filter(Boolean)
              .join(", ") || "No mentor",
          cells,
        }
      })
      .filter((row) => !statuses.length || row.cells.size > 0)
  }, [allViews, db, mentorId, query, scope, statuses])

  return (
    <>
      <PageHeader
        title="Checkpoints"
        description={`${rows.length} of ${scope.length} projects against ${columns.length} checkpoints. Arrow keys move between cells, Enter opens one.`}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by team…"
              className="h-8 w-48 rounded-sm"
            />
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
            {(statuses.length > 0 || mentorId || query) && (
              <button
                type="button"
                onClick={() => {
                  setStatuses([])
                  setMentorId(null)
                  setQuery("")
                }}
                className="rounded-sm px-2 py-1 text-meta text-muted-foreground hover:bg-muted"
              >
                Clear
              </button>
            )}
          </div>
        }
      />

      <StatusLegend
        counts={counts}
        active={statuses}
        onToggle={(status) =>
          setStatuses((prev) =>
            prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
          )
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Grid02Icon}
          title="Nothing matches those filters"
          body="Try clearing the status filter or choosing a different mentor."
        />
      ) : (
        <BatchGrid rows={rows} columns={columns} currentWeek={week} onSelect={setSelected} />
      )}

      <MilestoneSheet
        view={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  )
}
