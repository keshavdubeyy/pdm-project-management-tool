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
  height = "h-6",
}: {
  views: MilestoneView[]
  onSelect?: (view: MilestoneView) => void
  className?: string
  /** The height of the *target*, not of the bar. Segments are drawn 8px tall
   * and centred inside it, so a clickable segment still clears the 24px
   * minimum target size without the strip turning into a wall of colour. */
  height?: string
}) {
  return (
    <div className={cn("flex items-stretch gap-[3px]", height, className)}>
      {views.map((view) => {
        const meta = statusMeta(view.status)
        const label = `${view.template.title}: ${meta.label}. ${describeDue(view.dueDate).label}.`

        const cell = (
          <span className="flex h-full w-full items-center">
            <span
              className={cn(
                "block h-2 w-full rounded-[2px]",
                // Colour only. Nothing in a data view changes size on hover:
                // twenty-two strips of twelve segments would be a field of
                // movement under the pointer.
                onSelect && "cursor-pointer transition-colors duration-fast-01 ease-standard"
              )}
              style={{ backgroundColor: fill(view.status) }}
            />
          </span>
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

/** Read from the status tokens so the strip can never drift from the pill it
 * summarises. A checkpoint nobody has started is the track rather than a
 * colour, because twelve grey blocks read as twelve filled ones. */
function fill(status: MilestoneView["status"]) {
  if (status === "not_started") return "var(--progress-track)"
  return `var(--status-${status}-solid)`
}
