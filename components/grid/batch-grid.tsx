"use client"

import * as React from "react"

import { StatusGlyph } from "@/components/status/status-pill"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { describeDue, timeAgo } from "@/lib/dates"
import type { MilestoneView } from "@/lib/selectors"
import { statusMeta } from "@/lib/status"
import type { MilestoneTemplateItem, Project } from "@/lib/types"
import { cn } from "@/lib/utils"

type Row = {
  project: Project
  label: string
  sublabel: string
  cells: Map<string, MilestoneView>
}

/** Twenty-two projects against twelve checkpoints, on one screen.
 *
 * Built as an ARIA grid rather than a table because every cell is reachable:
 * as a table that would be 264 tab stops. As a grid it is one, and the arrow
 * keys do the rest.
 *
 * There is no zebra striping. The problem striping solves — losing your place
 * while tracking a row across twelve columns — is solved more precisely by
 * lighting up the row and the column you are pointing at.
 */
export function BatchGrid({
  rows,
  columns,
  currentWeek,
  onSelect,
}: {
  rows: Row[]
  columns: MilestoneTemplateItem[]
  currentWeek: number
  onSelect: (view: MilestoneView) => void
}) {
  const [focus, setFocus] = React.useState({ row: 0, col: 0 })
  const [hover, setHover] = React.useState<{ row: number; col: number } | null>(null)
  const cellRefs = React.useRef<(HTMLDivElement | null)[][]>([])

  const move = (rowDelta: number, colDelta: number) => {
    setFocus((prev) => {
      const row = clamp(prev.row + rowDelta, 0, rows.length - 1)
      const col = clamp(prev.col + colDelta, 0, columns.length - 1)
      cellRefs.current[row]?.[col]?.focus()
      return { row, col }
    })
  }

  const onKeyDown = (event: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault()
        move(0, 1)
        break
      case "ArrowLeft":
        event.preventDefault()
        move(0, -1)
        break
      case "ArrowDown":
        event.preventDefault()
        move(1, 0)
        break
      case "ArrowUp":
        event.preventDefault()
        move(-1, 0)
        break
      case "Home":
        event.preventDefault()
        if (event.ctrlKey || event.metaKey) setFocusTo(0, 0)
        else setFocusTo(rowIndex, 0)
        break
      case "End":
        event.preventDefault()
        if (event.ctrlKey || event.metaKey) setFocusTo(rows.length - 1, columns.length - 1)
        else setFocusTo(rowIndex, columns.length - 1)
        break
      case "PageDown":
        event.preventDefault()
        move(5, 0)
        break
      case "PageUp":
        event.preventDefault()
        move(-5, 0)
        break
      case "Enter":
      case " ": {
        event.preventDefault()
        const view = rows[rowIndex]?.cells.get(columns[colIndex].id)
        if (view) onSelect(view)
        break
      }
      default:
        break
    }
  }

  const setFocusTo = (row: number, col: number) => {
    setFocus({ row, col })
    cellRefs.current[row]?.[col]?.focus()
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <div
        role="grid"
        aria-label={`Every project against every checkpoint. ${rows.length} projects, ${columns.length} checkpoints.`}
        aria-rowcount={rows.length + 1}
        aria-colcount={columns.length + 1}
        className="min-w-max"
        onMouseLeave={() => setHover(null)}
      >
        {/* header */}
        <div role="row" aria-rowindex={1} className="sticky top-0 z-20 flex bg-card">
          <div
            role="columnheader"
            aria-colindex={1}
            className="sticky left-0 z-30 w-[248px] shrink-0 border-r border-b border-border bg-card px-3 py-2 text-th text-muted-foreground uppercase"
          >
            Project
          </div>
          {columns.map((column, colIndex) => {
            const isCurrent =
              column.dueWeek >= currentWeek &&
              columns.slice(0, colIndex).every((c) => c.dueWeek < currentWeek)
            return (
              <div
                key={column.id}
                role="columnheader"
                aria-colindex={colIndex + 2}
                className={cn(
                  "w-[76px] shrink-0 border-b border-border px-1 py-2 text-center",
                  hover?.col === colIndex && "bg-muted/60",
                  isCurrent && "bg-primary/[0.06]"
                )}
              >
                <Tooltip>
                  <TooltipTrigger render={<span className="block cursor-default" />}>
                    <span className="block text-th font-semibold text-foreground">
                      W{column.dueWeek}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted-foreground">
                      {shortTitle(column.title)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[240px]">
                    <span className="block font-medium">{column.title}</span>
                    <span className="block opacity-80">
                      Week {column.dueWeek} · {column.phase}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </div>
            )
          })}
        </div>

        {/* body */}
        {rows.map((row, rowIndex) => (
          <div
            key={row.project.id}
            role="row"
            aria-rowindex={rowIndex + 2}
            className={cn("flex", hover?.row === rowIndex && "bg-muted/40")}
          >
            <div
              role="rowheader"
              aria-colindex={1}
              className={cn(
                "sticky left-0 z-10 w-[248px] shrink-0 border-r border-b border-border bg-card px-3 py-1.5",
                hover?.row === rowIndex && "bg-muted/40"
              )}
            >
              <p className="truncate text-meta font-medium text-foreground">{row.label}</p>
              <p className="truncate text-caption text-muted-foreground">{row.sublabel}</p>
            </div>

            {columns.map((column, colIndex) => {
              const view = row.cells.get(column.id)
              const focused = focus.row === rowIndex && focus.col === colIndex
              const meta = view ? statusMeta(view.status) : null

              return (
                <div
                  key={column.id}
                  role="gridcell"
                  aria-colindex={colIndex + 2}
                  ref={(element) => {
                    cellRefs.current[rowIndex] = cellRefs.current[rowIndex] ?? []
                    cellRefs.current[rowIndex][colIndex] = element
                  }}
                  tabIndex={focused ? 0 : -1}
                  aria-label={cellLabel(row, column, view)}
                  onKeyDown={(event) => onKeyDown(event, rowIndex, colIndex)}
                  onFocus={() => setFocus({ row: rowIndex, col: colIndex })}
                  onMouseEnter={() => setHover({ row: rowIndex, col: colIndex })}
                  onClick={() => view && onSelect(view)}
                  className={cn(
                    "flex w-[76px] shrink-0 cursor-pointer items-center justify-center border-b border-border py-1.5 outline-none",
                    hover?.col === colIndex && "bg-muted/40",
                    meta?.bg,
                    focused && "ring-2 ring-ring ring-inset"
                  )}
                >
                  {view ? (
                    <Tooltip>
                      <TooltipTrigger render={<span className="flex items-center justify-center" />}>
                        <StatusGlyph status={view.status} />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[260px]">
                        <span className="block font-medium">{column.title}</span>
                        <span className="block opacity-90">{cellStory(view)}</span>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-caption text-muted-foreground">—</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function shortTitle(title: string) {
  return title
    .replace("Detailed ", "")
    .replace(" Report", "")
    .replace(" Strategy", "")
    .replace("Prototype", "Proto")
    .replace("Ideas and Screening Matrix", "Screening")
    .replace("Research Pack and Market Opportunity", "Research pack")
    .replace("Actionable Problem Statement", "Problem stmt")
    .replace("Updated Plan and Requirements", "Re-plan")
}

function cellLabel(row: Row, column: MilestoneTemplateItem, view?: MilestoneView) {
  if (!view) return `${row.label}, ${column.title}: not applicable`
  return `${row.label}, ${column.title}: ${statusMeta(view.status).label}. ${describeDue(view.dueDate).label}.`
}

function cellStory(view: MilestoneView) {
  const meta = statusMeta(view.status)
  const due = describeDue(view.dueDate)
  switch (view.status) {
    case "submitted":
      return `Turned in ${view.instance.submittedAt ? timeAgo(view.instance.submittedAt) : ""}, waiting on the mentor`
    case "under_review":
      return `Turned in ${view.instance.submittedAt ? timeAgo(view.instance.submittedAt) : ""}, mentor is reading it`
    case "accepted":
      return `Accepted ${view.instance.acceptedAt ? timeAgo(view.instance.acceptedAt) : ""}`
    case "returned":
      return `Returned ${view.instance.returnedAt ? timeAgo(view.instance.returnedAt) : ""}, back with the team`
    case "overdue":
      return `${due.label}, nothing turned in`
    default:
      return `${meta.label} · ${due.label}`
  }
}

export type { Row as BatchGridRow }
