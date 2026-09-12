"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FilterIcon, Grid02Icon } from "@hugeicons/core-free-icons"

import { BatchGrid, type BatchGridRow } from "@/components/grid/batch-grid"
import { EmptyState, PageHeader } from "@/components/common"
import { MilestoneSheet } from "@/components/milestones/milestone-sheet"
import { StatusLegend } from "@/components/status/status-legend"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { projectsFor } from "@/lib/permissions"
import { milestoneViews, personById, statusCounts, type MilestoneView } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import type { MilestoneStatus } from "@/lib/types"

/** Every project against every checkpoint.
 *
 * The coordinator's home screen, and the one thing no existing tool gives a
 * programme: one grid where a mentoring line, a slipping team and a whole
 * cohort's shape are all visible without asking anybody. */
export default function GridPage() {
  const { db, actor, week } = useProjectsStore()
  const [selected, setSelected] = React.useState<MilestoneView | null>(null)
  const [query, setQuery] = React.useState("")
  const [mentorId, setMentorId] = React.useState("all")
  const [statuses, setStatuses] = React.useState<MilestoneStatus[]>([])

  if (!actor) return null

  const scope = projectsFor(db, actor)
  const mentors = db.people.filter((p) => p.roles.includes("mentor"))
  const columns = db.milestoneTemplate
    .filter((t) => t.batchId === db.batches[0]?.id)
    .sort((a, b) => a.order - b.order)

  const allViews = milestoneViews(db, scope.map((p) => p.id))
  const counts = statusCounts(allViews)

  const rows: BatchGridRow[] = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return scope
      .filter((project) => {
        if (mentorId !== "all" && !project.mentorIds.includes(mentorId)) return false
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
          sublabel: mentorLabel(db, project.mentorIds),
          cells,
        }
      })
      .filter((row) => !statuses.length || row.cells.size > 0)
  }, [allViews, db, mentorId, query, scope, statuses])

  return (
    <>
      <PageHeader
        title="Milestone grid"
        description={`${rows.length} of ${scope.length} projects against ${columns.length} checkpoints. Arrow keys move between cells, Enter opens one.`}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by team or project…"
              className="h-8 w-56"
            />
            <Select value={mentorId} onValueChange={(value) => setMentorId(value ?? "all")}>
              <SelectTrigger size="sm" className="w-52">
                <HugeiconsIcon icon={FilterIcon} className="size-3.5" strokeWidth={2} />
                <SelectValue placeholder="Every mentor">
                  {(value) =>
                    value === "all"
                      ? "Every mentor"
                      : (mentors.find((m) => m.id === value)?.name ?? "Every mentor")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Every mentor</SelectItem>
                {mentors.map((mentor) => (
                  <SelectItem key={mentor.id} value={mentor.id}>
                    {mentor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(statuses.length > 0 || mentorId !== "all" || query) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatuses([])
                  setMentorId("all")
                  setQuery("")
                }}
              >
                Clear filters
              </Button>
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

function mentorLabel(db: ReturnType<typeof useProjectsStore>["db"], mentorIds: string[]) {
  return (
    mentorIds
      .map((id) => personById(db, id)?.name.replace(/^Dr\.\s*/, "") ?? "")
      .filter(Boolean)
      .join(", ") || "No mentor"
  )
}
