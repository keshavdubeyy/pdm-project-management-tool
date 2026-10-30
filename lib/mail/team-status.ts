import { addDays, currentWeek, daysBetween, todayIso } from "@/lib/dates"
import { batchOverview, type TeamHealth } from "@/lib/overview"
import { milestoneViews } from "@/lib/selectors"
import { pendingWeeks, weekViews } from "@/lib/weekly"
import type { Database } from "@/lib/types"

/** How a team is doing, in the words the weekly mails use.
 *
 * Worked out from the same data as the coordinator's overview, so a mail never
 * disagrees with the screen. */

export type TeamClass = "at_risk" | "lagging" | "going_well"

export type TeamReport = {
  health: TeamHealth
  teamName: string
  label: string
  class: TeamClass
  /** Plain reasons a team is not "going well". */
  reasons: string[]
  /** Checkpoints falling due in the next 14 days that are not yet handed in. */
  comingUp: { title: string; dueDate: string; days: number }[]
  /** Whole days since the team last did anything, or null if never. */
  quietDays: number | null
}

const HANDED_IN = ["accepted", "submitted", "under_review"]

/** Weeks that have ended with no report. The week in progress is not owed yet,
 * so a Monday-morning mail does not call every team late. */
function unreportedWeeks(
  db: Database,
  projectId: string,
  since: string
): number[] {
  const start = db.batches[0]?.startDate
  if (!start) return []
  const now = currentWeek(start)
  return pendingWeeks(weekViews(db, projectId))
    .filter((w) => w.week < now && w.endIso >= since)
    .map((w) => w.week)
}

/** `since` is the day the mails went live: anything that was already late
 * before it is not counted, so the first mail does not announce the past. */
export function teamReports(
  db: Database,
  today = todayIso(),
  since = ""
): TeamReport[] {
  const overview = batchOverview(db)
  const teams = new Map(db.teams.map((t) => [t.id, t.name]))
  const horizon = addDays(today, 14)

  return overview.teams.map((health) => {
    const { project } = health
    const views = milestoneViews(db, [project.id])
    const late = unreportedWeeks(db, project.id, since)
    const overdue = views.filter(
      (v) => v.status === "overdue" && v.dueDate >= since
    ).length

    const reasons: string[] = []
    if (overdue > 0)
      reasons.push(`${overdue} checkpoint${overdue === 1 ? "" : "s"} overdue`)
    if (late.length)
      reasons.push(
        late.length === 1
          ? `Week ${late[0]} progress not reported`
          : `${late.length} weekly reports missing (weeks ${late.join(", ")})`
      )

    const comingUp = views
      .filter(
        (v) =>
          !HANDED_IN.includes(v.status) &&
          v.status !== "overdue" &&
          v.dueDate >= today &&
          v.dueDate <= horizon
      )
      .map((v) => ({
        title: v.template.title,
        dueDate: v.dueDate,
        days: daysBetween(today, v.dueDate),
      }))

    const teamName = teams.get(project.teamId) ?? "A team"
    return {
      health,
      teamName,
      label: project.title.trim() ? `${teamName} · ${project.title}` : teamName,
      class:
        overdue >= 2
          ? "at_risk"
          : reasons.length
            ? "lagging"
            : "going_well",
      reasons,
      comingUp,
      quietDays: health.lastActivity
        ? daysBetween(health.lastActivity.slice(0, 10), today)
        : null,
    }
  })
}
