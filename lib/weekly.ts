import { addDays, currentWeek } from "@/lib/dates"
import type { Database, WeeklyProgress } from "@/lib/types"

/** Weekly progress, read from the calendar and the team's reports.
 *
 * A week is never stored as "pending". It is pending when it has started, has
 * no report, and is not in the future, so the status can never drift from the
 * date. */

export type WeeklyStatus = "submitted" | "pending" | "upcoming"

export type WeekView = {
  week: number
  /** Monday and Sunday of the week, as YYYY-MM-DD. */
  startIso: string
  endIso: string
  status: WeeklyStatus
  isCurrent: boolean
  report?: WeeklyProgress
  /** Reported after the week had ended. */
  late: boolean
  /** The checkpoint due this week, if there is one. */
  checkpoint?: string
}

/** How many weeks the programme runs: as far as the last dated checkpoint.
 * Never fewer than the week we are in, so an overrun batch still lists today. */
export function programmeWeeks(db: Database, nowWeek: number): number {
  const last = Math.max(0, ...db.milestoneTemplate.map((t) => t.dueWeek))
  return Math.max(last, nowWeek)
}

export function weekViews(db: Database, projectId: string): WeekView[] {
  const start = db.batches[0]?.startDate
  if (!start) return []
  const now = currentWeek(start)
  const reports = new Map(
    db.weeklyProgress
      .filter((r) => r.projectId === projectId)
      .map((r) => [r.week, r])
  )
  const checkpoints = new Map<number, string>()
  db.milestoneTemplate.forEach((t) => {
    // Several can fall in one week; show the first.
    if (!checkpoints.has(t.dueWeek)) checkpoints.set(t.dueWeek, t.title)
  })

  const total = programmeWeeks(db, now)
  const out: WeekView[] = []
  for (let week = 1; week <= total; week++) {
    const startIso = addDays(start, (week - 1) * 7)
    const endIso = addDays(startIso, 6)
    const report = reports.get(week)
    out.push({
      week,
      startIso,
      endIso,
      status: report ? "submitted" : week <= now ? "pending" : "upcoming",
      isCurrent: week === now,
      report,
      late: report ? report.submittedAt.slice(0, 10) > endIso : false,
      checkpoint: checkpoints.get(week),
    })
  }
  return out
}

/** The weeks a team still owes, oldest first. */
export function pendingWeeks(views: WeekView[]): WeekView[] {
  return views.filter((v) => v.status === "pending")
}
