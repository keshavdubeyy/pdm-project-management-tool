"use client"

import * as React from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { describeDue } from "@/lib/dates"
import { initialsOf } from "@/lib/selectors"
import type { Person } from "@/lib/types"
import { cn } from "@/lib/utils"

/* --------------------------------------------------------------- headings */

export function PageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  meta?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-title text-foreground">{title}</h1>
          {description && <p className="max-w-2xl text-meta text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {meta}
    </div>
  )
}

export function SectionHeading({
  children,
  count,
  hint,
  action,
}: {
  children: React.ReactNode
  count?: number
  hint?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 pb-2">
      <div className="flex items-baseline gap-2">
        <h2 className="font-display text-section text-foreground">{children}</h2>
        {count !== undefined && (
          <span className="text-meta font-medium text-muted-foreground">{count}</span>
        )}
        {hint && <span className="text-caption text-muted-foreground">{hint}</span>}
      </div>
      {action}
    </div>
  )
}

/* ------------------------------------------------------------ empty state */

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: IconSvgElement
  title: string
  body?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-sm border border-dashed border-border px-6 py-10 text-center",
        className
      )}
    >
      {icon && (
        <HugeiconsIcon
          icon={icon}
          className="mb-3 size-8 text-muted-foreground/60"
          strokeWidth={1.6}
          aria-hidden
        />
      )}
      <p className="text-subhead text-foreground">{title}</p>
      {body && <p className="mt-1 max-w-sm text-meta text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ---------------------------------------------------------------- people */

export function PersonAvatar({
  person,
  size = "sm",
  className,
}: {
  person?: Person | null
  size?: "xs" | "sm" | "default"
  className?: string
}) {
  const name = person?.name ?? "Unknown"
  return (
    <Avatar
      size={size === "default" ? "default" : "sm"}
      className={cn(size === "xs" && "size-5", className)}
    >
      <AvatarFallback className={cn(size === "xs" ? "text-[9px]" : "text-[10px]")}>
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  )
}

export function PersonChip({
  person,
  suffix,
  className,
}: {
  person?: Person | null
  suffix?: string
  className?: string
}) {
  if (!person) return <span className="text-meta text-muted-foreground">Unassigned</span>
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <PersonAvatar person={person} size="xs" />
      <span className="truncate text-meta text-foreground">{person.name}</span>
      {suffix && <span className="shrink-0 text-caption text-muted-foreground">{suffix}</span>}
    </span>
  )
}

/** First few faces plus a count. Used for attendees and read receipts, where
 * the useful signal is "how many" rather than "exactly who, at what time". */
export function AvatarStack({
  people,
  max = 4,
  className,
}: {
  people: (Person | undefined)[]
  max?: number
  className?: string
}) {
  const known = people.filter(Boolean) as Person[]
  const shown = known.slice(0, max)
  const rest = known.length - shown.length
  return (
    <span className={cn("flex items-center", className)}>
      {shown.map((person) => (
        <span key={person.id} className="-ml-1.5 first:ml-0" title={person.name}>
          <PersonAvatar person={person} size="xs" className="ring-2 ring-background" />
        </span>
      ))}
      {rest > 0 && (
        <span className="-ml-1.5 flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground ring-2 ring-background">
          +{rest}
        </span>
      )}
    </span>
  )
}

/* ----------------------------------------------------------------- dates */

/** Absolute date leads because these are deadlines somebody will refer back
 * to; the relative part only appears inside a week, where it is what actually
 * changes behaviour. */
export function DueBadge({
  dueDate,
  className,
  hideIcon,
}: {
  dueDate: string
  className?: string
  hideIcon?: boolean
}) {
  const info = describeDue(dueDate)
  const tone = {
    overdue: "text-status-overdue-fg",
    urgent: "text-status-overdue-fg",
    soon: "text-status-returned-fg",
    calm: "text-muted-foreground",
  }[info.tone]

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              "inline-flex items-center gap-1 text-meta font-medium whitespace-nowrap",
              tone,
              className
            )}
          />
        }
      >
        {!hideIcon && <span aria-hidden>·</span>}
        {info.label}
      </TooltipTrigger>
      <TooltipContent>{info.full}</TooltipContent>
    </Tooltip>
  )
}

/* ------------------------------------------------------------- measures */

export function MetricTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string
  value: string
  hint?: string
  tone?: "default" | "good" | "warn"
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <p className="text-th text-muted-foreground uppercase">{label}</p>
      <p
        className={cn(
          "font-display mt-1.5 text-stat",
          tone === "good" && "text-status-accepted-fg",
          tone === "warn" && "text-status-returned-fg"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-caption text-muted-foreground">{hint}</p>}
    </div>
  )
}

/* ----------------------------------------------------------------- misc */

export function InlineHint({ children }: { children: React.ReactNode }) {
  return <p className="text-caption text-muted-foreground">{children}</p>
}

/** A note the reviewer should read as an open question rather than a claim. */
export function ToValidate({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-sm border border-status-under_review-br bg-status-under_review-bg px-3 py-2 text-caption text-status-under_review-fg">
      <span className="font-semibold">Still to confirm with faculty. </span>
      {children}
    </p>
  )
}
