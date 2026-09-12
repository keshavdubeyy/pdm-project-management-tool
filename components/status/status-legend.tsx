"use client"

import { HugeiconsIcon } from "@hugeicons/react"

import { STATUS_ORDER, statusMeta } from "@/lib/status"
import type { MilestoneStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

/** The key to the grid, and a filter at the same time.
 *
 * Clicking a status narrows the grid to it. That is worth more than a static
 * key: the question a coordinator actually has is "show me the returned ones",
 * and the legend is already where their eye is. */
export function StatusLegend({
  counts,
  active,
  onToggle,
  className,
}: {
  counts?: Record<MilestoneStatus, number>
  active?: MilestoneStatus[]
  onToggle?: (status: MilestoneStatus) => void
  className?: string
}) {
  const interactive = Boolean(onToggle)

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} role="group" aria-label="Status key">
      {STATUS_ORDER.map((status) => {
        const meta = statusMeta(status)
        const isActive = !active?.length || active.includes(status)
        const count = counts?.[status]

        const content = (
          <>
            <HugeiconsIcon icon={meta.icon} className={cn("size-3.5", meta.solid)} strokeWidth={2.2} aria-hidden />
            <span>{meta.shortLabel}</span>
            {count !== undefined && (
              <span className="text-[11px] font-semibold opacity-70">{count}</span>
            )}
          </>
        )

        const classes = cn(
          "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-xs font-medium transition-opacity",
          meta.bg,
          meta.border,
          meta.fg,
          interactive && "cursor-pointer hover:opacity-100",
          interactive && !isActive && "opacity-35"
        )

        if (!interactive) {
          return (
            <span key={status} className={classes}>
              {content}
            </span>
          )
        }
        return (
          <button
            key={status}
            type="button"
            className={classes}
            aria-pressed={active?.includes(status) ?? false}
            onClick={() => onToggle?.(status)}
            title={meta.description}
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}
