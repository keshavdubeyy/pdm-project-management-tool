"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Flag02Icon } from "@hugeicons/core-free-icons"

import { DueBadge } from "@/components/common"
import { StatusPill } from "@/components/status/status-pill"
import type { MilestoneView } from "@/lib/selectors"
import { statusMeta } from "@/lib/status"
import { cn } from "@/lib/utils"

/** The twelve checkpoints as a rail.
 *
 * A Gantt needs width proportional to time and there is none here; a vertical
 * stepper reads the same information in a column. The node itself carries the
 * status glyph, so the shape of the rail tells you where the project is before
 * you read a word of it. */
export function MilestoneRail({
  views,
  currentWeek,
  onSelect,
  selectedId,
}: {
  views: MilestoneView[]
  currentWeek: number
  onSelect: (view: MilestoneView) => void
  selectedId?: string
}) {
  return (
    <ol className="relative">
      {views.map((view, index) => {
        const meta = statusMeta(view.status)
        const isCurrent =
          view.dueWeek >= currentWeek && views.slice(0, index).every((v) => v.dueWeek < currentWeek)
        const last = index === views.length - 1
        const selected = view.instance.id === selectedId
        const progress = view.template.deliverables.length
          ? view.instance.completedDeliverables.length / view.template.deliverables.length
          : 0

        return (
          <li key={view.instance.id} className="relative flex gap-3">
            {/* rail */}
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "z-10 flex shrink-0 items-center justify-center rounded-full border-2 bg-card transition-all",
                  isCurrent ? "size-8" : "size-7",
                  meta.border,
                  view.status === "accepted" && "bg-status-accepted-bg",
                  view.status === "overdue" && "bg-status-overdue-bg",
                  view.status === "returned" && "bg-status-returned-bg"
                )}
              >
                <HugeiconsIcon
                  icon={meta.icon}
                  className={cn(isCurrent ? "size-4" : "size-3.5", meta.solid)}
                  strokeWidth={2.4}
                  aria-hidden
                />
              </span>
              {!last && <span className="w-px flex-1 bg-border" aria-hidden />}
            </div>

            {/* body */}
            <button
              type="button"
              onClick={() => onSelect(view)}
              className={cn(
                "mb-2 min-w-0 flex-1 rounded-sm border px-3 py-2.5 text-left transition-colors",
                selected
                  ? "border-primary/40 bg-primary/[0.04]"
                  : "border-transparent hover:border-border hover:bg-muted/50"
              )}
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-th text-muted-foreground uppercase">
                  Week {view.dueWeek}
                </span>
                {view.template.isGate && (
                  <span className="inline-flex items-center gap-1 text-caption font-medium text-muted-foreground">
                    <HugeiconsIcon icon={Flag02Icon} className="size-3" strokeWidth={2} />
                    Gate
                  </span>
                )}
              </div>

              <p
                className={cn(
                  "mt-0.5 text-subhead text-foreground",
                  isCurrent && "text-foreground",
                  !isCurrent && view.status === "accepted" && "text-muted-foreground"
                )}
              >
                {view.template.title}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <StatusPill status={view.status} size="sm" />
                {view.status !== "accepted" && <DueBadge dueDate={view.dueDate} hideIcon />}
              </div>

              {view.status !== "accepted" && view.template.deliverables.length > 1 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary/60 transition-[width]"
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                  </span>
                  <span className="shrink-0 text-caption text-muted-foreground">
                    {view.instance.completedDeliverables.length}/
                    {view.template.deliverables.length}
                  </span>
                </div>
              )}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
