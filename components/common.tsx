"use client"

import Image from "next/image"
import * as React from "react"
import { Avatar } from "@/components/untitled/base/avatar/avatar"
import {
  Tooltip,
  TooltipTrigger,
} from "@/components/untitled/base/tooltip/tooltip"
import { describeDue, formatDate, PROJECT_TIMEZONE } from "@/lib/dates"
import {
  hasProjectTitle,
  initialsOf,
  PROJECT_TITLE_PLACEHOLDER,
} from "@/lib/selectors"
import { statusMeta } from "@/lib/status"
import type { MilestoneStatus, Person } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Any icon from `@untitledui/icons`, or anything else that takes a class. */
export type IconComponent = React.ComponentType<{
  className?: string
  "aria-hidden"?: boolean | "true" | "false"
}>

/* --------------------------------------------------------------- headings */

export function PageHeader({
  title,
  description,
  actions,
  meta,
  divider = true,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  meta?: React.ReactNode
  /** The rule under the header. On by default; pass false to drop it. */
  divider?: boolean
}) {
  return (
    <div
      className={
        divider
          ? "flex flex-col gap-3 border-b border-border pb-5"
          : "flex flex-col gap-3"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        <div className="min-w-0 space-y-1">
          <h1 className="truncate text-page text-foreground" title={title}>
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-meta text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
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
        <h2 className="text-section text-foreground">{children}</h2>
        {count !== undefined && (
          <span className="text-meta font-medium text-muted-foreground">
            {count}
          </span>
        )}
        {hint && (
          <span className="text-caption text-muted-foreground">{hint}</span>
        )}
      </div>
      {action}
    </div>
  )
}

/* ------------------------------------------------------------ empty state */

export function EmptyState({
  icon: Icon,
  image,
  title,
  body,
  action,
  className,
}: {
  icon?: IconComponent
  /** An illustration from /public, shown above the title in place of the icon. */
  image?: string
  title: string
  body?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-10 text-center",
        className
      )}
    >
      {image && (
        <Image
          src={image}
          alt=""
          width={160}
          height={160}
          className="mb-3 size-40 object-contain"
        />
      )}
      {!image && Icon && (
        <Icon className="mb-3 size-8 text-fg-quaternary" aria-hidden />
      )}
      <p className="text-subhead text-foreground">{title}</p>
      {body && (
        <p className="mt-1 max-w-sm text-meta text-muted-foreground">{body}</p>
      )}
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
      size={size === "default" ? "sm" : "xs"}
      src={person?.avatarUrl}
      initials={initialsOf(name)}
      alt={name}
      className={className}
    />
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
  if (!person)
    return <span className="text-meta text-muted-foreground">Unassigned</span>
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <PersonAvatar person={person} size="xs" />
      <span className="truncate text-meta text-foreground">{person.name}</span>
      {suffix && (
        <span className="shrink-0 text-caption text-muted-foreground">
          {suffix}
        </span>
      )}
    </span>
  )
}

/** Avatar and name for each person, side by side. Used in table cells. */
export function PersonChips({
  people,
  empty = "Unassigned",
}: {
  people: (Person | null | undefined)[]
  empty?: string
}) {
  const list = people.filter((p): p is Person => Boolean(p))
  if (list.length === 0)
    return <span className="text-meta text-muted-foreground">{empty}</span>
  return (
    <span className="flex items-center gap-3">
      {list.map((person) => (
        <PersonChip key={person.id} person={person} />
      ))}
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
        <span
          key={person.id}
          className="-ml-1.5 first:ml-0"
          title={person.name}
        >
          <PersonAvatar
            person={person}
            size="xs"
            className="ring-2 ring-background"
          />
        </span>
      ))}
      {rest > 0 && (
        <span className="-ml-1.5 flex size-5 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-tertiary ring-2 ring-background">
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
  small,
  plain,
}: {
  dueDate: string
  className?: string
  hideIcon?: boolean
  /** One size down from the page's text (14px, where it would be 16px), for a
   * dense list. */
  small?: boolean
  /** No tooltip, and no button of its own: for use inside something that is
   * already a button, where a nested one is invalid HTML. */
  plain?: boolean
}) {
  const info = describeDue(dueDate)
  const tone = {
    overdue: "text-status-overdue-fg",
    urgent: "text-status-overdue-fg",
    soon: "text-status-returned-fg",
    calm: "text-muted-foreground",
  }[info.tone]

  if (plain) {
    return (
      <span
        title={info.full}
        className={cn(
          "inline-flex items-center gap-1 text-meta font-medium whitespace-nowrap",
          tone,
          className
        )}
      >
        {!hideIcon && <span aria-hidden>·</span>}
        {small ? <span className="text-meta">{info.label}</span> : info.label}
      </span>
    )
  }

  return (
    <Tooltip title={<>{info.full}</>}>
      <TooltipTrigger
        className={cn(
          "inline-flex items-center gap-1 text-meta font-medium whitespace-nowrap",
          tone,
          className
        )}
      >
        {!hideIcon && <span aria-hidden>·</span>}
        {/* The size goes on an inner element on purpose. The trigger merges its
          classes with a rule set that does not know the app's size classes and
          would drop one beside the colour. */}
        {small ? <span className="text-meta">{info.label}</span> : info.label}
      </TooltipTrigger>
    </Tooltip>
  )
}

/** Where a checkpoint stands, as plain coloured text in the same style as
 * DueBadge, so "Overdue by 60 days" and "Submitted" read as one family: green
 * once the work is in or accepted, amber when it comes back. */
export function StatusText({
  status,
  submittedAt,
  small,
  className,
}: {
  status: MilestoneStatus
  /** When it was handed in. Shown with "Submitted", so the word comes with the
   * day, as "Overdue by 60 days" comes with its count. */
  submittedAt?: string
  /** The size DueBadge uses with `small`. */
  small?: boolean
  className?: string
}) {
  const tone: Record<MilestoneStatus, string> = {
    submitted: "text-status-accepted-fg",
    accepted: "text-status-accepted-fg",
    under_review: "text-status-under_review-fg",
    returned: "text-status-returned-fg",
    overdue: "text-status-overdue-fg",
    in_progress: "text-muted-foreground",
    not_started: "text-muted-foreground",
  }
  // There is no separate "in review": from the team's side, and the faculty's,
  // work that is in and not yet decided is simply Submitted.
  const shown: MilestoneStatus =
    status === "under_review" ? "submitted" : status
  const base = statusMeta(shown).shortLabel
  // The day in the programme's own calendar, so a late-night upload is not
  // dated by the server's clock.
  const label =
    shown === "submitted" && submittedAt
      ? `${base} ${formatDate(
          new Date(submittedAt).toLocaleDateString("en-CA", {
            timeZone: PROJECT_TIMEZONE,
          })
        )}`
      : base
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium whitespace-nowrap",
        tone[shown],
        className
      )}
    >
      {/* Size on an inner element, as in DueBadge. */}
      {small ? <span className="text-meta">{label}</span> : label}
    </span>
  )
}

/* ------------------------------------------------------------- measures */

export function MetricTile({
  label,
  value,
  hint,
  tone = "default",
  dashboard,
  ref: reference,
}: {
  label: string
  value: string
  hint?: string
  tone?: "default" | "good" | "warn"
  /** The dashboard style: the label as a normal sentence, and the same outline
   * as the input fields and the lists beside it. The Measures page keeps its
   * capitals and its own border. */
  dashboard?: boolean
  /** The measure's number in the plan, e.g. "K1". It sits in the header row
   * rather than floating over it, so a long label cannot run underneath it. */
  ref?: string
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col p-4",
        dashboard
          ? "rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset"
          : "rounded-xl border border-border bg-card"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-muted-foreground",
            dashboard ? "text-meta font-medium" : "text-th uppercase"
          )}
        >
          {label}
        </p>
        {reference && (
          <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-caption font-medium text-muted-foreground">
            {reference}
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-1.5 text-stat text-foreground",
          tone === "good" && "text-status-accepted-fg",
          tone === "warn" && "text-status-returned-fg"
        )}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-auto pt-1 text-caption text-muted-foreground">
          {hint}
        </p>
      )}
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
    <p className="rounded-lg border border-status-under_review-br bg-status-under_review-bg px-3 py-2 text-caption text-status-under_review-fg">
      <span className="font-semibold">Still to confirm with mentors. </span>
      {children}
    </p>
  )
}

/** A project's title, or a grey placeholder until its team has written one. */
export function ProjectTitle({
  project,
  className,
}: {
  project: { title: string }
  className?: string
}) {
  const named = hasProjectTitle(project)
  return (
    <span className={cn(className, !named && "text-muted-foreground")}>
      {named ? project.title : PROJECT_TITLE_PLACEHOLDER}
    </span>
  )
}
