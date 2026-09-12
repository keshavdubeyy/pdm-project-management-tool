import { currentWeek, dueDateForWeek, todayIso } from "@/lib/dates"
import { type Actor, effectiveStatus, isCoordinator, projectsFor } from "@/lib/permissions"
import { AWAITING_MENTOR } from "@/lib/status"
import type {
  ActionItem,
  Announcement,
  AppNotification,
  Database,
  MilestoneInstance,
  MilestoneStatus,
  MilestoneTemplateItem,
  Person,
  Project,
  Review,
  Submission,
} from "@/lib/types"

/** Derived reads. Nothing here writes, and nothing here is stored — every
 * value is computed from the database so there is only one source of truth. */

export type MilestoneView = {
  instance: MilestoneInstance
  template: MilestoneTemplateItem
  project: Project
  /** Overdue is decided by the calendar rather than by anyone pressing a
   * button, so the status shown can differ from the status stored. */
  status: MilestoneStatus
  dueWeek: number
  dueDate: string
  latestSubmission?: Submission
  latestReview?: Review
}

export function milestoneViews(db: Database, projectIds?: string[]): MilestoneView[] {
  const batchStart = db.batches[0]?.startDate ?? todayIso()
  const week = currentWeek(batchStart)
  const templates = new Map(db.milestoneTemplate.map((t) => [t.id, t]))
  const projects = new Map(db.projects.map((p) => [p.id, p]))
  const wanted = projectIds ? new Set(projectIds) : null

  return db.milestones
    .filter((m) => (wanted ? wanted.has(m.projectId) : true))
    .flatMap((instance) => {
      const template = templates.get(instance.templateItemId)
      const project = projects.get(instance.projectId)
      if (!template || !project) return []
      const dueWeek = instance.dueWeekOverride ?? template.dueWeek
      return [
        {
          instance,
          template,
          project,
          status: effectiveStatus(instance, dueWeek, week),
          dueWeek,
          dueDate: dueDateForWeek(dueWeek, batchStart),
          latestSubmission: latestSubmission(db, instance.id),
          latestReview: latestReview(db, instance.id),
        },
      ]
    })
    .sort((a, b) => a.template.order - b.template.order)
}

export function latestSubmission(db: Database, milestoneInstanceId: string) {
  return db.submissions
    .filter((s) => s.milestoneInstanceId === milestoneInstanceId)
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))[0]
}

export function latestReview(db: Database, milestoneInstanceId: string) {
  return db.reviews
    .filter((r) => r.milestoneInstanceId === milestoneInstanceId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0]
}

export function personById(db: Database, personId: string): Person | undefined {
  return db.people.find((p) => p.id === personId)
}

export function personName(db: Database, personId: string): string {
  return personById(db, personId)?.name ?? "Someone"
}

export function initialsOf(name: string): string {
  const parts = name.replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/)
  if (!parts.length) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** The checkpoints a team should be looking at right now. */
export function upcomingFor(db: Database, projectId: string, limit = 3): MilestoneView[] {
  const views = milestoneViews(db, [projectId])
  const open = views.filter((v) => v.status !== "accepted")
  return open.slice(0, limit)
}

export function nextDue(db: Database, projectId: string): MilestoneView | undefined {
  return upcomingFor(db, projectId, 1)[0]
}

/** Everything waiting on this mentor, oldest first — the queue they clear. */
export function reviewQueue(db: Database, actor: Actor): MilestoneView[] {
  const mine = projectsFor(db, actor).map((p) => p.id)
  return milestoneViews(db, mine)
    .filter((v) => AWAITING_MENTOR.includes(v.status))
    .sort((a, b) => {
      const at = a.instance.submittedAt ?? ""
      const bt = b.instance.submittedAt ?? ""
      return at < bt ? -1 : at > bt ? 1 : 0
    })
}

/** Projects that are behind, with the reason spelled out.
 *
 * Deliberately a plain list of facts rather than a score. An automatic "at
 * risk" label that a mentor cannot see the workings of is the thing faculty
 * push back on, so this shows what happened and lets a person judge. */
export type AttentionReason = {
  project: Project
  reasons: string[]
  overdueCount: number
  openActionsOverdue: number
  daysSinceMeeting: number | null
}

export function needsAttention(db: Database, actor: Actor): AttentionReason[] {
  const projects = projectsFor(db, actor)
  const today = todayIso()

  return projects
    .map((project) => {
      const views = milestoneViews(db, [project.id])
      const overdue = views.filter((v) => v.status === "overdue")
      const returned = views.filter((v) => v.status === "returned")
      const actions = db.actionItems.filter(
        (a) => a.projectId === project.id && a.status === "open" && a.dueDate < today
      )
      const meetings = db.meetings
        .filter((m) => m.projectId === project.id)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
      const last = meetings[0]
      const daysSinceMeeting = last
        ? Math.round(
            (new Date(`${today}T00:00:00Z`).getTime() - new Date(`${last.date}T00:00:00Z`).getTime()) /
              86_400_000
          )
        : null

      const reasons: string[] = []
      if (overdue.length) {
        reasons.push(
          `${overdue.length} checkpoint${overdue.length === 1 ? "" : "s"} past due with nothing turned in`
        )
      }
      if (returned.length) {
        reasons.push(`${returned.length} returned and not yet resubmitted`)
      }
      if (actions.length) {
        reasons.push(`${actions.length} action${actions.length === 1 ? "" : "s"} past their date`)
      }
      // "No meeting recorded" only counts as a reason to look when the project
      // is also quiet. On its own it usually means the meeting happened and
      // nobody wrote it down, which would put most of the cohort on this list
      // and make it worth ignoring.
      const recentlyActive = views.some(
        (v) => v.instance.updatedAt >= new Date(Date.now() - 14 * 86_400_000).toISOString()
      )
      if (daysSinceMeeting === null && !recentlyActive) {
        reasons.push("No meeting recorded, and nothing has moved in a fortnight")
      } else if (daysSinceMeeting !== null && daysSinceMeeting > 21) {
        reasons.push(`No meeting recorded for ${daysSinceMeeting} days`)
      }

      return {
        project,
        reasons,
        overdueCount: overdue.length,
        openActionsOverdue: actions.length,
        daysSinceMeeting,
      }
    })
    .filter((r) => r.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length)
}

/** Open action items since the last meeting — the answer to the question a
 * mentor otherwise has to ask out loud every week. */
export function openSinceLastMeeting(db: Database, projectId: string) {
  const meetings = db.meetings
    .filter((m) => m.projectId === projectId)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  const last = meetings[0]
  const items = db.actionItems.filter((a) => a.projectId === projectId)
  const open = items.filter((a) => a.status === "open")
  const closedSince = last
    ? items.filter((a) => a.status === "done" && (a.completedAt ?? "") >= `${last.date}T00:00:00Z`)
    : items.filter((a) => a.status === "done")
  return { lastMeeting: last, open, closedSince }
}

export function actionItemsFor(db: Database, personId: string): ActionItem[] {
  return db.actionItems
    .filter((a) => a.ownerId === personId && a.status === "open")
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
}

/* ----------------------------------------------------------- announcements */

/** Everyone an announcement reaches. */
export function audienceMembers(db: Database, announcement: Announcement): string[] {
  const { audience, authorId } = announcement
  switch (audience.kind) {
    case "team": {
      const team = db.teams.find((t) => t.id === audience.teamId)
      const mentorIds = db.projects
        .filter((p) => p.teamId === audience.teamId)
        .flatMap((p) => p.mentorIds)
      return Array.from(new Set([...(team?.memberIds ?? []), ...mentorIds]))
    }
    case "my_teams": {
      const projects = db.projects.filter((p) => p.mentorIds.includes(authorId))
      return Array.from(new Set(projects.flatMap((p) => p.teamMemberIds)))
    }
    case "batch": {
      const projects = db.projects.filter((p) => p.batchId === audience.batchId && !p.archived)
      const students = projects.flatMap((p) => p.teamMemberIds)
      const mentors = projects.flatMap((p) => p.mentorIds)
      return Array.from(new Set([...students, ...mentors]))
    }
    case "faculty":
      return db.people
        .filter((p) => p.roles.includes("mentor") || p.roles.includes("coordinator"))
        .map((p) => p.id)
  }
}

export function describeAudience(db: Database, announcement: Announcement): string {
  const { audience } = announcement
  switch (audience.kind) {
    case "team": {
      const team = db.teams.find((t) => t.id === audience.teamId)
      return team ? team.name : "One team"
    }
    case "my_teams":
      return "All my teams"
    case "batch":
      return "Whole batch"
    case "faculty":
      return "Faculty only"
  }
}

/** Announcements this person is addressed by, newest first, pinned on top. */
export function announcementsFor(db: Database, actor: Actor): Announcement[] {
  return db.announcements
    .filter((a) => {
      if (a.audience.kind === "faculty") {
        return actor.role === "mentor" || isCoordinator(actor)
      }
      if (a.authorId === actor.person.id) return true
      return audienceMembers(db, a).includes(actor.person.id)
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return a.createdAt < b.createdAt ? 1 : -1
    })
}

export function readCount(db: Database, announcementId: string): number {
  return db.announcementReads.filter((r) => r.announcementId === announcementId).length
}

export function readersOf(db: Database, announcementId: string): string[] {
  return db.announcementReads
    .filter((r) => r.announcementId === announcementId)
    .map((r) => r.personId)
}

/* ---------------------------------------------------------- notifications */

export function notificationsFor(db: Database, personId: string): AppNotification[] {
  return db.notifications
    .filter((n) => n.personId === personId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 60)
}

export function unreadCount(db: Database, personId: string): number {
  return db.notifications.filter((n) => n.personId === personId && !n.readAt).length
}

/* -------------------------------------------------------------- measures */

/** The four numbers the project said it should be judged on, plus the ones
 * that fall out of the same data for free. */
export type Measures = {
  onTimeRate: number | null
  medianHoursToFeedback: number | null
  actionClosureRate: number | null
  meetingsWithMinutes: number | null
  teamsActiveThisWeek: number
  totalTeams: number
  acceptedCount: number
  dueSoFar: number
}

export function measures(db: Database, projectIds?: string[]): Measures {
  const ids = projectIds ?? db.projects.filter((p) => !p.archived).map((p) => p.id)
  const views = milestoneViews(db, ids)
  const batchStart = db.batches[0]?.startDate ?? todayIso()
  const week = currentWeek(batchStart)

  const dueSoFar = views.filter((v) => v.dueWeek <= week)
  const onTime = dueSoFar.filter(
    (v) => v.instance.submittedAt && v.instance.submittedAt.slice(0, 10) <= v.dueDate
  )

  const feedbackGaps = db.reviews
    .filter((r) => ids.includes(r.projectId))
    .map((r) => {
      const submission = db.submissions.find((s) => s.id === r.submissionId)
      if (!submission) return null
      return (
        (new Date(r.createdAt).getTime() - new Date(submission.submittedAt).getTime()) / 3_600_000
      )
    })
    .filter((n): n is number => n !== null && n >= 0)
    .sort((a, b) => a - b)

  const actions = db.actionItems.filter((a) => ids.includes(a.projectId))
  const closed = actions.filter((a) => a.status === "done")

  const meetings = db.meetings.filter((m) => ids.includes(m.projectId))
  const withMinutes = meetings.filter((m) => db.minutes.some((mi) => mi.meetingId === m.id))

  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const active = new Set(
    [
      ...db.milestones.filter((m) => ids.includes(m.projectId) && m.updatedAt >= weekAgo),
      ...db.submissions.filter((s) => ids.includes(s.projectId) && s.submittedAt >= weekAgo),
    ].map((x) => x.projectId)
  )

  return {
    onTimeRate: dueSoFar.length ? onTime.length / dueSoFar.length : null,
    medianHoursToFeedback: feedbackGaps.length
      ? feedbackGaps[Math.floor(feedbackGaps.length / 2)]
      : null,
    actionClosureRate: actions.length ? closed.length / actions.length : null,
    meetingsWithMinutes: meetings.length ? withMinutes.length / meetings.length : null,
    teamsActiveThisWeek: active.size,
    totalTeams: ids.length,
    acceptedCount: views.filter((v) => v.status === "accepted").length,
    dueSoFar: dueSoFar.length,
  }
}

export function statusCounts(views: MilestoneView[]): Record<MilestoneStatus, number> {
  const counts = {
    not_started: 0,
    in_progress: 0,
    submitted: 0,
    under_review: 0,
    returned: 0,
    accepted: 0,
    overdue: 0,
  } as Record<MilestoneStatus, number>
  views.forEach((v) => {
    counts[v.status] += 1
  })
  return counts
}
