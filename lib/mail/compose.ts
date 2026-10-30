import { addDays, daysBetween, formatDate, todayIso } from "@/lib/dates"
import { milestoneViews } from "@/lib/selectors"
import { weekViews } from "@/lib/weekly"
import type {
  AppNotification,
  Database,
  NotificationKind,
  Person,
  Project,
} from "@/lib/types"
import { teamReports, type TeamReport } from "@/lib/mail/team-status"
import type { Mail, MailItem, MailSection } from "@/lib/mail/types"

/** Building each email from the database.
 *
 * Every function here is pure: it reads the data and returns the mail (or null
 * when there is nothing to say), and sends nothing. When a mail goes out, and
 * whether it goes at all, is decided elsewhere.
 */

/* ------------------------------------------------------------- timing */

export const QUIET_MINUTES = 30
export const MAX_WAIT_HOURS = 3
/** Nothing is sent from 9 pm to 8 am, India time. */
export const QUIET_FROM = 21
export const QUIET_UNTIL = 8
/** Weeks and escalations: how long a team can be silent before the coordinator
 * is told. */
export const SILENT_DAYS = 14
/** Escalations are paused: the coordinator does not need them yet. Switch this
 * on to bring them back; nothing else has to change. */
export const ESCALATIONS_ENABLED = false

export const hourInIndia = (at: Date) =>
  Number(
    at.toLocaleString("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    })
  ) % 24

export function inQuietHours(at: Date): boolean {
  const hour = hourInIndia(at)
  return hour >= QUIET_FROM || hour < QUIET_UNTIL
}

/* ------------------------------------------------------ activity batch */

/** The kinds of in-app notice that are worth an email. Reviews and
 * announcements are left out: feedback is given in comments. */
const ACTIVITY_KINDS: NotificationKind[] = [
  "comment",
  "mention",
  "action_item",
  "meeting",
]
const MAX_THREADS = 10
const SNIPPETS_PER_THREAD = 2

export type Readiness = { ready: boolean; reason: string }

/** Whether a person's waiting items should go out now: once the conversation
 * has been quiet for 30 minutes, or the oldest has waited 3 hours, and never in
 * quiet hours. */
export function activityReadiness(
  items: AppNotification[],
  now: Date
): Readiness {
  if (!items.length) return { ready: false, reason: "nothing unread" }
  if (inQuietHours(now))
    return { ready: false, reason: "quiet hours: held until 8 am" }
  const times = items.map((n) => new Date(n.createdAt).getTime())
  const quiet = (now.getTime() - Math.max(...times)) / 60_000
  const waited = (now.getTime() - Math.min(...times)) / 3_600_000
  if (waited >= MAX_WAIT_HOURS)
    return { ready: true, reason: `oldest has waited ${MAX_WAIT_HOURS}h` }
  if (quiet >= QUIET_MINUTES)
    return { ready: true, reason: `quiet for ${QUIET_MINUTES} min` }
  return {
    ready: false,
    reason: `still active: waiting for ${QUIET_MINUTES} min of quiet`,
  }
}

/** Unread, not yet emailed, and of a kind that goes by email. */
export function pendingActivity(db: Database, personId: string) {
  return db.notifications
    .filter(
      (n) =>
        n.personId === personId &&
        !n.readAt &&
        !(n as { emailedAt?: string }).emailedAt &&
        ACTIVITY_KINDS.includes(n.kind)
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
}

function projectOfHref(db: Database, href: string): Project | undefined {
  const direct = href.match(/^\/projects\/([^/?#]+)/)
  if (direct) return db.projects.find((p) => p.id === direct[1])
  const note = href.match(/^\/notes\/([^/?#]+)/)
  if (note) {
    const found = db.notes.find((n) => n.id === note[1])
    return db.projects.find((p) => p.id === found?.projectId)
  }
  return undefined
}

function teamLabel(db: Database, project?: Project): string {
  if (!project) return "Other"
  const team = db.teams.find((t) => t.id === project.teamId)?.name ?? "A team"
  return project.title.trim() ? `${team} · ${project.title}` : team
}

const who = (db: Database, id?: string) =>
  db.people.find((p) => p.id === id)?.name

export function activityBatch(
  db: Database,
  person: Person,
  items = pendingActivity(db, person.id)
): Mail | null {
  if (!items.length) return null

  // One thread is everything with the same link.
  const threads = new Map<string, AppNotification[]>()
  items.forEach((n) => threads.set(n.href, [...(threads.get(n.href) ?? []), n]))

  const toItem = ([href, list]: [string, AppNotification[]]): MailItem => {
    const latest = list[list.length - 1]
    const shown = list.slice(0, SNIPPETS_PER_THREAD)
    const more = list.length - shown.length
    return {
      title: latest.title,
      body:
        shown.map((n) => `“${n.body}”`).join("  ") +
        (more > 0 ? `  +${more} more` : ""),
      meta: [who(db, latest.actorId), formatDate(latest.createdAt.slice(0, 10))]
        .filter(Boolean)
        .join(" · "),
      href,
    }
  }

  const sections: MailSection[] = []
  const mentions = [...threads].filter(([, l]) =>
    l.some((n) => n.kind === "mention")
  )
  if (mentions.length)
    sections.push({
      heading: "You were mentioned",
      items: mentions.slice(0, MAX_THREADS).map(toItem),
    })

  const rest = [...threads].filter(([, l]) => !l.some((n) => n.kind === "mention"))
  const byProject = new Map<string, [string, AppNotification[]][]>()
  rest.forEach((entry) => {
    const label = teamLabel(db, projectOfHref(db, entry[0]))
    byProject.set(label, [...(byProject.get(label) ?? []), entry])
  })
  let budget = MAX_THREADS - Math.min(mentions.length, MAX_THREADS)
  for (const [label, entries] of byProject) {
    if (budget <= 0) break
    const taken = entries.slice(0, budget)
    budget -= taken.length
    sections.push({ heading: label, items: taken.map(toItem) })
  }
  const hidden = threads.size - sections.reduce((n, s) => n + s.items.length, 0)
  if (hidden > 0)
    sections.push({
      heading: "And more",
      note: `${hidden} more thread${hidden === 1 ? "" : "s"} waiting in the app.`,
      items: [],
    })

  const projects = new Set(
    [...threads.keys()].map((h) => projectOfHref(db, h)?.id ?? h)
  )
  const subject =
    threads.size === 1
      ? items[items.length - 1].title
      : `${items.length} updates across ${projects.size} project${projects.size === 1 ? "" : "s"}`

  return {
    kind: "activity",
    to: person,
    subject,
    intro: `Here is what happened while you were away.`,
    sections,
    reason:
      "You get this once a conversation goes quiet, never one mail per message. Anything you read in the app first is left out.",
  }
}

/* ---------------------------------------------------- student reminder */

const OPEN = ["not_started", "in_progress", "returned"]

export function studentReminder(
  db: Database,
  person: Person,
  today = todayIso(),
  since = ""
): Mail | null {
  const horizon = addDays(today, 7)
  const start = db.batches[0]?.startDate
  const sections: MailSection[] = []
  const projects = db.projects.filter(
    (p) => !p.archived && p.teamMemberIds.includes(person.id)
  )

  for (const project of projects) {
    const views = milestoneViews(db, [project.id])
    const items: MailItem[] = []

    views
      .filter((v) => v.status === "overdue" && v.dueDate >= since)
      .forEach((v) =>
        items.push({
          title: `${v.template.title} is overdue`,
          meta: `Was due ${formatDate(v.dueDate)}, ${daysBetween(v.dueDate, today)} days ago`,
          href: `/projects/${project.id}?milestone=${v.instance.id}`,
          tone: "alert",
        })
      )

    views
      .filter(
        (v) => OPEN.includes(v.status) && v.dueDate >= today && v.dueDate <= horizon
      )
      .forEach((v) => {
        const days = daysBetween(today, v.dueDate)
        items.push({
          title: `${v.template.title} is due ${days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}`,
          meta: `Due ${formatDate(v.dueDate)}`,
          href: `/projects/${project.id}?milestone=${v.instance.id}`,
          tone: "warn",
        })
      })

    if (start) {
      const nowWeek = Math.max(
        1,
        Math.floor(daysBetween(start, today) / 7) + 1
      )
      weekViews(db, project.id)
        .filter(
          (w) => w.status === "pending" && w.week < nowWeek && w.endIso >= since
        )
        .forEach((w) =>
          items.push({
            title: `Week ${w.week} progress is not filed`,
            meta: `${formatDate(w.startIso)} to ${formatDate(w.endIso)}`,
            href: `/projects/${project.id}?tab=progress`,
            tone: "warn",
          })
        )
    }

    if (items.length)
      sections.push({ heading: teamLabel(db, project), items })
  }

  if (!sections.length) return null
  const count = sections.reduce((n, s) => n + s.items.length, 0)
  return {
    kind: "student-reminder",
    to: person,
    subject: `${count} thing${count === 1 ? "" : "s"} to do on ProjectGarage`,
    intro:
      "Overdue work, checkpoints due in the next 7 days, and weekly progress still to file.",
    sections,
    reason:
      "You get this on Tuesdays and Thursdays, only when there is something to do.",
  }
}

/* -------------------------------------------------------- weekly mails */

const CLASS_HEADING = {
  at_risk: "At risk",
  lagging: "Lagging",
  going_well: "Going well",
} as const

function teamItem(r: TeamReport, withMentor: boolean): MailItem {
  const mentors = r.health.mentors.map((m) => m.name).join(", ")
  const quiet =
    r.quietDays === null
      ? "No activity yet"
      : r.quietDays >= 3
        ? `Quiet for ${r.quietDays} days`
        : "Active in the last 3 days"
  return {
    title: r.label,
    body: r.reasons.length ? r.reasons.join(" · ") : "Nothing overdue",
    meta: [withMentor && mentors ? `Mentor: ${mentors}` : null, quiet]
      .filter(Boolean)
      .join(" · "),
    href: `/projects/${r.health.project.id}`,
    tone:
      r.class === "at_risk" ? "alert" : r.class === "lagging" ? "warn" : "good",
  }
}

function weeklySections(reports: TeamReport[], withMentor: boolean) {
  const sections: MailSection[] = []
  ;(["at_risk", "lagging", "going_well"] as const).forEach((cls) => {
    const list = reports.filter((r) => r.class === cls)
    if (list.length)
      sections.push({
        heading: `${CLASS_HEADING[cls]} (${list.length})`,
        items: list.map((r) => teamItem(r, withMentor)),
      })
  })
  const coming = reports
    .filter((r) => r.comingUp.length)
    .flatMap((r) =>
      r.comingUp.map((c) => ({
        title: `${c.title}: ${r.label}`,
        meta: `Due ${formatDate(c.dueDate)} (${c.days === 0 ? "today" : `in ${c.days} days`})`,
        href: `/projects/${r.health.project.id}`,
        days: c.days,
      }))
    )
    .sort((a, b) => a.days - b.days)
  if (coming.length)
    sections.push({
      heading: `Coming up in the next 14 days (${coming.length})`,
      items: coming.map((c) => ({
        title: c.title,
        meta: c.meta,
        href: c.href,
      })),
    })
  return sections
}

export function mentorWeekly(
  db: Database,
  mentor: Person,
  today = todayIso(),
  since = ""
): Mail | null {
  const mine = teamReports(db, today, since).filter((r) =>
    r.health.project.mentorIds.includes(mentor.id)
  )
  if (!mine.length) return null
  const behind = mine.filter((r) => r.class !== "going_well").length
  return {
    kind: "mentor-weekly",
    to: mentor,
    subject: behind
      ? `Weekly report: ${behind} of ${mine.length} teams need attention`
      : `Weekly report: all ${mine.length} teams on track`,
    intro: `Where your ${mine.length} teams stand this week.`,
    sections: weeklySections(mine, false),
    reason: "You get this once a week, covering only your own teams.",
  }
}

export function coordinatorWeekly(
  db: Database,
  coordinator: Person,
  today = todayIso(),
  since = ""
): Mail | null {
  const all = teamReports(db, today, since)
  if (!all.length) return null
  const behind = all.filter((r) => r.class !== "going_well").length
  return {
    kind: "coordinator-weekly",
    to: coordinator,
    subject: behind
      ? `Weekly digest: ${behind} of ${all.length} teams need attention`
      : `Weekly digest: all ${all.length} teams on track`,
    intro: `Where all ${all.length} teams stand this week.`,
    sections: weeklySections(all, true),
    reason: "You get this once a week, covering every team.",
  }
}

/* ---------------------------------------------------------- escalation */

export function escalations(
  db: Database,
  coordinator: Person,
  today = todayIso()
): Mail | null {
  if (!ESCALATIONS_ENABLED) return null
  const reports = teamReports(db, today)
  const start = db.batches[0]?.startDate
  const missed = reports.filter((r) => r.health.overdue >= 2)
  const silent = reports.filter((r) => {
    const days =
      r.quietDays ?? (start ? Math.max(0, daysBetween(start, today)) : 0)
    return days >= SILENT_DAYS
  })
  if (!missed.length && !silent.length) return null

  const sections: MailSection[] = []
  if (missed.length)
    sections.push({
      heading: "Missed two or more checkpoints",
      items: missed.map((r) => ({
        title: r.label,
        body: `${r.health.overdue} checkpoints overdue`,
        meta: `Mentor: ${r.health.mentors.map((m) => m.name).join(", ") || "none"}`,
        href: `/projects/${r.health.project.id}`,
        tone: "alert",
      })),
    })
  if (silent.length)
    sections.push({
      heading: `No activity for ${SILENT_DAYS} days or more`,
      items: silent.map((r) => ({
        title: r.label,
        body:
          r.quietDays === null
            ? "Nothing recorded yet"
            : `Last activity ${r.quietDays} days ago`,
        meta: `Mentor: ${r.health.mentors.map((m) => m.name).join(", ") || "none"}`,
        href: `/projects/${r.health.project.id}`,
        tone: "alert",
      })),
    })

  const n = missed.length + silent.length
  return {
    kind: "escalation",
    to: coordinator,
    subject: `Escalation: ${n} team${n === 1 ? "" : "s"} need${n === 1 ? "s" : ""} you`,
    intro: "These teams have crossed a line set for the programme.",
    sections,
    reason:
      "Sent straight away, only when a team misses two checkpoints or goes quiet for 14 days.",
  }
}
