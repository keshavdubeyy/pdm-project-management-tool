import { currentWeek, PROJECT_TIMEZONE, todayIso } from "@/lib/dates"
import { milestoneViews, type MilestoneView } from "@/lib/selectors"
import { programmeWeeks } from "@/lib/weekly"
import type { Database, Person, Project } from "@/lib/types"

/** What the coordinator reads across the whole batch.
 *
 * Nothing here is stored. Every figure is worked out from the same data the rest
 * of the app shows, with the same rules (a checkpoint is overdue when the
 * calendar says so, not when somebody says so), so a team's row and the tiles
 * above it cannot disagree. Where there is nothing to measure yet a figure is
 * null, and the screen says "No data yet" rather than showing a zero that looks
 * like a result. */

export type TeamStatus = "behind" | "waiting" | "on_track"

export type TeamHealth = {
  project: Project
  students: Person[]
  mentors: Person[]
  accepted: number
  /** Of those, how many were handed in by their due date. */
  acceptedOnTime: number
  total: number
  overdue: number
  /** Handed in and not yet accepted. */
  waiting: number
  /** How many days the oldest of those has been waiting. */
  oldestWaitingDays: number | null
  /** Behind beats waiting: what the team has to act on comes first. */
  status: TeamStatus
  /** The latest thing the team did, ISO. */
  lastActivity: string | null
}

export type BatchOverview = {
  week: number
  totalWeeks: number
  teams: TeamHealth[]
  /** Teams with nothing overdue. */
  onTrack: number
  overdueTotal: number
  teamsBehind: number
  waitingTotal: number
  oldestWaitingDays: number | null
  /** Accepted checkpoints among those already due. */
  acceptedOfDue: number
  due: number
  /** Share of due checkpoints handed in by their due date. */
  onTimeRate: number | null
}

const DAY_MS = 86_400_000

const latest = (times: (string | undefined)[]) =>
  times
    .filter((t): t is string => Boolean(t))
    .sort()
    .at(-1) ?? null

export function batchOverview(db: Database): BatchOverview {
  const projects = db.projects.filter((p) => !p.archived)
  const ids = new Set(projects.map((p) => p.id))
  const batchStart = db.batches[0]?.startDate ?? todayIso()
  const week = currentWeek(batchStart)
  const now = Date.now()

  const people = new Map(db.people.map((p) => [p.id, p]))
  const byProject = new Map<string, MilestoneView[]>()
  milestoneViews(db, [...ids]).forEach((v) =>
    byProject.set(v.project.id, [...(byProject.get(v.project.id) ?? []), v])
  )

  const teams: TeamHealth[] = projects.map((project) => {
    const views = byProject.get(project.id) ?? []
    const overdue = views.filter((v) => v.status === "overdue").length
    const waitingViews = views.filter(
      (v) => v.status === "submitted" || v.status === "under_review"
    )
    const ages = waitingViews
      .map((v) => v.instance.submittedAt)
      .filter((t): t is string => Boolean(t))
      .map((t) => Math.floor((now - new Date(t).getTime()) / DAY_MS))
    return {
      project,
      students: project.teamMemberIds
        .map((id) => people.get(id))
        .filter((p): p is Person => Boolean(p)),
      mentors: project.mentorIds
        .map((id) => people.get(id))
        .filter((p): p is Person => Boolean(p)),
      accepted: views.filter((v) => v.status === "accepted").length,
      acceptedOnTime: views.filter(
        (v) =>
          v.status === "accepted" &&
          v.instance.submittedAt &&
          v.instance.submittedAt.slice(0, 10) <= v.dueDate
      ).length,
      total: views.length,
      overdue,
      waiting: waitingViews.length,
      oldestWaitingDays: ages.length ? Math.max(...ages) : null,
      status:
        overdue > 0 ? "behind" : waitingViews.length ? "waiting" : "on_track",
      // The calendar's own checkpoints are not activity: they carry the day they
      // were created, which would make every team look busy.
      lastActivity: latest([
        ...db.submissions
          .filter((s) => s.projectId === project.id)
          .map((s) => s.submittedAt),
        ...db.comments
          .filter((c) => c.projectId === project.id)
          .map((c) => c.createdAt),
        ...db.notes
          .filter((n) => n.projectId === project.id)
          .map((n) => n.updatedAt),
        ...db.meetings
          .filter((m) => m.projectId === project.id)
          .map((m) => m.createdAt),
        ...db.artefacts
          .filter((a) => a.projectId === project.id)
          .map((a) => a.addedAt),
        ...db.weeklyProgress
          .filter((w) => w.projectId === project.id)
          .map((w) => w.submittedAt),
      ]),
    }
  })

  const dueViews = [...byProject.values()]
    .flat()
    .filter((v) => v.dueWeek <= week)
  const onTime = dueViews.filter(
    (v) =>
      v.instance.submittedAt && v.instance.submittedAt.slice(0, 10) <= v.dueDate
  )
  const ages = teams
    .map((t) => t.oldestWaitingDays)
    .filter((d): d is number => d !== null)

  return {
    week,
    totalWeeks: programmeWeeks(db, week),
    teams,
    onTrack: teams.filter((t) => t.overdue === 0).length,
    overdueTotal: teams.reduce((n, t) => n + t.overdue, 0),
    teamsBehind: teams.filter((t) => t.overdue > 0).length,
    waitingTotal: teams.reduce((n, t) => n + t.waiting, 0),
    oldestWaitingDays: ages.length ? Math.max(...ages) : null,
    acceptedOfDue: dueViews.filter((v) => v.status === "accepted").length,
    due: dueViews.length,
    onTimeRate: dueViews.length ? onTime.length / dueViews.length : null,
  }
}

/** The day of an ISO time in the programme's calendar, as YYYY-MM-DD. */
export function programmeDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: PROJECT_TIMEZONE,
  })
}
