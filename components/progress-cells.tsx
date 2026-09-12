"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { describeDue } from "@/lib/dates"
import type { MilestoneView } from "@/lib/selectors"
import { statusMeta } from "@/lib/status"
import { cn } from "@/lib/utils"

/** Twelve checkpoints as twelve bars.
 *
 * A whole project's year reads in one glance and one line, which is what makes
 * a register of twenty-two of them legible. The bar is a summary, never the
 * only place a status is stated — the row carries the word as well. */
export function ProgressCells({
  views,
  onSelect,
  className,
  height = "h-5",
}: {
  views: MilestoneView[]
  onSelect?: (view: MilestoneView) => void
  className?: string
  height?: string
}) {
  return (
    <div className={cn("flex items-stretch gap-[3px]", height, className)}>
      {views.map((view) => {
        const meta = statusMeta(view.status)
        const label = `${view.template.title}: ${meta.label}. ${describeDue(view.dueDate).label}.`

        const cell = (
          <span
            className={cn(
              "block h-full w-full rounded-[1px] transition-transform",
              onSelect && "cursor-pointer hover:scale-y-125"
            )}
            style={{ backgroundColor: fill(view.status) }}
          />
        )

        return (
          <Tooltip key={view.instance.id}>
            <TooltipTrigger
              render={
                onSelect ? (
                  <button
                    type="button"
                    aria-label={label}
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      onSelect(view)
                    }}
                    className="min-w-0 flex-1"
                  />
                ) : (
                  <span aria-label={label} className="min-w-0 flex-1" />
                )
              }
            >
              {cell}
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[250px]">
              <span className="block font-medium">
                Week {view.dueWeek} · {view.template.title}
              </span>
              <span className="block opacity-90">
                {meta.label} · {describeDue(view.dueDate).label}
              </span>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

/** Solid fills, read from the status tokens so the bar can never drift from
 * the pill it summarises. */
function fill(status: MilestoneView["status"]) {
  return `var(--status-${status}-solid)`
}
