import { HugeiconsIcon } from "@hugeicons/react"

import { statusMeta } from "@/lib/status"
import type { MilestoneStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

/** A milestone's state, said three ways.
 *
 * Glyph, word, colour — in that order of reliability. The word is the only one
 * that always survives, so it is never dropped without `sr-only` taking over.
 */
export function StatusPill({
  status,
  size = "default",
  showLabel = true,
  className,
}: {
  status: MilestoneStatus
  size?: "default" | "sm"
  showLabel?: boolean
  className?: string
}) {
  const meta = statusMeta(status)
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md border font-medium whitespace-nowrap",
        size === "sm" ? "px-1.5 py-px text-[11px]" : "px-2 py-0.5 text-xs",
        meta.bg,
        meta.border,
        meta.fg,
        className
      )}
    >
      <HugeiconsIcon
        icon={meta.icon}
        className={cn("shrink-0", size === "sm" ? "size-3" : "size-3.5")}
        strokeWidth={2.2}
        aria-hidden
      />
      {showLabel ? (
        <span>{size === "sm" ? meta.shortLabel : meta.label}</span>
      ) : (
        <span className="sr-only">{meta.label}</span>
      )}
    </span>
  )
}

/** The same three signals, sized for a 22 × 12 grid where only the glyph
 * fits. The accessible name on the cell carries the rest. */
export function StatusGlyph({
  status,
  className,
}: {
  status: MilestoneStatus
  className?: string
}) {
  const meta = statusMeta(status)
  return (
    <HugeiconsIcon
      icon={meta.icon}
      className={cn("size-4", meta.solid, className)}
      strokeWidth={2.2}
      aria-hidden
    />
  )
}
