/** Week arithmetic and date wording.
 *
 * Everything is done on plain YYYY-MM-DD calendar dates so nothing drifts
 * across timezones or daylight saving. The project runs on an Asia/Kolkata
 * calendar; that only matters for deciding which day "today" is, which is
 * resolved once in `todayIso`.
 */

export const PROJECT_TIMEZONE = "Asia/Kolkata"

export function todayIso(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: PROJECT_TIMEZONE })
}

export function isoToDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((isoToDate(toIso).getTime() - isoToDate(fromIso).getTime()) / 86_400_000)
}

export function addDays(iso: string, days: number): string {
  const d = isoToDate(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Week 1 is the week containing the start date. */
export function weekNumber(dateIso: string, startIso: string): number {
  return Math.max(1, Math.floor(daysBetween(startIso, dateIso) / 7) + 1)
}

/** The last day of a given project week — the day a checkpoint is due. */
export function dueDateForWeek(week: number, startIso: string): string {
  return addDays(startIso, week * 7 - 1)
}

export function currentWeek(startIso: string): number {
  return weekNumber(todayIso(), startIso)
}

export function formatDate(iso: string, opts?: { withYear?: boolean }): string {
  return isoToDate(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: opts?.withYear ? "numeric" : undefined,
    timeZone: "UTC",
  })
}

export function formatDateLong(iso: string): string {
  return isoToDate(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

export type DueTone = "overdue" | "urgent" | "soon" | "calm"

export type DueInfo = {
  /** What the interface shows, e.g. "Due 14 Oct · in 3 days". */
  label: string
  /** The same thing spelled out, for a tooltip or a screen reader. */
  full: string
  tone: DueTone
  days: number
  overdue: boolean
}

/** Absolute date leads, because these are long-lived deadlines somebody will
 * need to refer back to. The relative part only appears inside a week, where
 * it is the part that actually drives behaviour. */
export function describeDue(dueIso: string, fromIso: string = todayIso()): DueInfo {
  const days = daysBetween(fromIso, dueIso)
  const absolute = formatDate(dueIso)
  const full = formatDateLong(dueIso)

  if (days < 0) {
    const n = Math.abs(days)
    return {
      label: `Overdue by ${n} ${n === 1 ? "day" : "days"}`,
      full: `Was due ${full}`,
      tone: "overdue",
      days,
      overdue: true,
    }
  }
  if (days === 0) {
    return { label: "Due today", full: `Due ${full}`, tone: "urgent", days, overdue: false }
  }
  if (days === 1) {
    return { label: "Due tomorrow", full: `Due ${full}`, tone: "urgent", days, overdue: false }
  }
  if (days <= 7) {
    return {
      label: `Due ${absolute} · in ${days} days`,
      full: `Due ${full}`,
      tone: "soon",
      days,
      overdue: false,
    }
  }
  return { label: `Due ${absolute}`, full: `Due ${full}`, tone: "calm", days, overdue: false }
}

/** Rough proximity, for things that already happened. */
export function timeAgo(isoTimestamp: string): string {
  const then = new Date(isoTimestamp).getTime()
  const mins = Math.round((Date.now() - then) / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`
  const weeks = Math.round(days / 7)
  if (weeks < 5) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`
  return formatDate(isoTimestamp.slice(0, 10), { withYear: true })
}

export function formatTimestamp(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PROJECT_TIMEZONE,
  })
}
