import {
  AlarmClockIcon,
  CheckmarkCircle02Icon,
  CircleDashedIcon,
  DeliverySent02Icon,
  RecordIcon,
  TimeQuarterPassIcon,
  Undo02Icon,
} from "@hugeicons/core-free-icons"

import type { MilestoneStatus } from "@/lib/types"

/** Everything the interface knows about a milestone status, in one place.
 *
 * Each status carries three independent signals: a distinct glyph silhouette,
 * a word, and a colour — in that order of importance. Under deuteranopia the
 * pale accepted and overdue fills are near-identical, so colour is the least
 * reliable of the three and never appears on its own.
 *
 * The vocabulary is deliberately the one students already know from Google
 * Classroom. "Returned for revisions", never "Rejected"; and returned is amber
 * rather than red, because it is a normal stop in the pipeline, not a failure.
 */
export type StatusMeta = {
  value: MilestoneStatus
  /** Shown to students and mentors. */
  label: string
  /** Shorter form for the grid legend and dense cells. */
  shortLabel: string
  icon: typeof CircleDashedIcon
  /** One line explaining what this state means, used in the legend and the
   * design-system page. */
  description: string
  /** Which of the four buckets this collapses into when 264 cells have to be
   * read at once. */
  bucket: "idle" | "moving" | "waiting" | "done"
  /** Tailwind classes for the pill and the grid cell. */
  bg: string
  border: string
  fg: string
  solid: string
}

export const STATUS_META: Record<MilestoneStatus, StatusMeta> = {
  not_started: {
    value: "not_started",
    label: "Not started",
    shortLabel: "Not started",
    icon: CircleDashedIcon,
    description: "No work recorded against this checkpoint yet.",
    bucket: "idle",
    bg: "bg-status-not_started-bg",
    border: "border-status-not_started-br",
    fg: "text-status-not_started-fg",
    solid: "text-status-not_started-solid",
  },
  in_progress: {
    value: "in_progress",
    label: "In progress",
    shortLabel: "In progress",
    icon: RecordIcon,
    description: "The team is working on it. Nothing is waiting on the mentor.",
    bucket: "moving",
    bg: "bg-status-in_progress-bg",
    border: "border-status-in_progress-br",
    fg: "text-status-in_progress-fg",
    solid: "text-status-in_progress-solid",
  },
  submitted: {
    value: "submitted",
    label: "Turned in",
    shortLabel: "Turned in",
    icon: DeliverySent02Icon,
    description: "The team has handed it in. The mentor has not opened it yet.",
    bucket: "waiting",
    bg: "bg-status-submitted-bg",
    border: "border-status-submitted-br",
    fg: "text-status-submitted-fg",
    solid: "text-status-submitted-solid",
  },
  under_review: {
    value: "under_review",
    label: "Under review",
    shortLabel: "In review",
    icon: TimeQuarterPassIcon,
    description: "The mentor has opened it and is reading.",
    bucket: "waiting",
    bg: "bg-status-under_review-bg",
    border: "border-status-under_review-br",
    fg: "text-status-under_review-fg",
    solid: "text-status-under_review-solid",
  },
  returned: {
    value: "returned",
    label: "Returned for revisions",
    shortLabel: "Returned",
    icon: Undo02Icon,
    description: "The mentor has asked for changes and said what they are.",
    bucket: "moving",
    bg: "bg-status-returned-bg",
    border: "border-status-returned-br",
    fg: "text-status-returned-fg",
    solid: "text-status-returned-solid",
  },
  accepted: {
    value: "accepted",
    label: "Accepted",
    shortLabel: "Accepted",
    icon: CheckmarkCircle02Icon,
    description: "The mentor is satisfied. Only a mentor can set this.",
    bucket: "done",
    bg: "bg-status-accepted-bg",
    border: "border-status-accepted-br",
    fg: "text-status-accepted-fg",
    solid: "text-status-accepted-solid",
  },
  overdue: {
    value: "overdue",
    label: "Overdue",
    shortLabel: "Overdue",
    icon: AlarmClockIcon,
    description: "Past its due week with nothing handed in.",
    bucket: "idle",
    bg: "bg-status-overdue-bg",
    border: "border-status-overdue-br",
    fg: "text-status-overdue-fg",
    solid: "text-status-overdue-solid",
  },
}

export const STATUS_ORDER: MilestoneStatus[] = [
  "not_started",
  "in_progress",
  "submitted",
  "under_review",
  "returned",
  "accepted",
  "overdue",
]

/** Statuses that mean somebody is waiting on the mentor. */
export const AWAITING_MENTOR: MilestoneStatus[] = ["submitted", "under_review"]

/** Statuses that mean the ball is with the team. */
export const AWAITING_TEAM: MilestoneStatus[] = ["not_started", "in_progress", "returned", "overdue"]

export function statusMeta(status: MilestoneStatus): StatusMeta {
  return STATUS_META[status]
}

/** The transitions the state machine allows, before permissions are applied.
 * Permissions decide *who* may make a move; this decides which moves exist. */
export const ALLOWED_TRANSITIONS: Record<MilestoneStatus, MilestoneStatus[]> = {
  not_started: ["in_progress", "submitted"],
  in_progress: ["submitted", "not_started"],
  submitted: ["under_review", "accepted", "returned"],
  under_review: ["accepted", "returned"],
  returned: ["in_progress", "submitted"],
  accepted: ["under_review"],
  overdue: ["in_progress", "submitted"],
}

export function canTransition(from: MilestoneStatus, to: MilestoneStatus) {
  return ALLOWED_TRANSITIONS[from].includes(to)
}

export const RETURN_CATEGORY_LABEL: Record<string, string> = {
  scope: "Scope is off",
  evidence: "Needs more evidence",
  depth: "Needs more depth",
  incomplete: "Incomplete",
  other: "Something else",
}
