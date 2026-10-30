import { developerAdmin } from "@/lib/developer-auth"

/** Is the mail going out, for the developer's /developer/mail page. Reads the
 * mail_log the mail job writes (lib/mail/run.ts). */

export const dynamic = "force-dynamic"

const DAYS = 14

type Row = { data: Record<string, unknown> }
type MailRow = {
  id: string
  kind: string
  person_id: string | null
  project_id: string | null
  status: string | null
  error: string | null
  detail: { subject?: string } | null
  sent_at: string
}

export type MailTeam = {
  projectId: string
  title: string
  today: number
  last7: number
  last14: number
  failed14: number
}

export type MailReport = {
  mode: string
  startDate: string | null
  /** Gmail's ceiling on mails a day for this sender. */
  dailyLimit: number
  sentToday: number
  failedToday: number
  lastSentAt: string | null
  lastFailedAt: string | null
  /** Notices with no mail sent yet, since MAIL_START_DATE. */
  unmailed: number
  /** Oldest first; the last 14 days, today included. */
  perDay: { date: string; sent: number; failed: number }[]
  byKind: { kind: string; sent: number; failed: number }[]
  teams: MailTeam[]
  /** Newest first. */
  recent: {
    at: string
    kind: string
    to: string
    team: string | null
    subject: string
    failed: boolean
    error: string | null
  }[]
  /** Set when mail_log could not be read, e.g. the schema is not applied. */
  error: string | null
}

/** Calendar day in India, which is when the programme counts a day. */
const dayOf = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })

const limit = () => {
  const n = Number(process.env.GMAIL_DAILY_LIMIT)
  return Number.isFinite(n) && n > 0 ? n : 500
}

export async function GET(request: Request) {
  const auth = await developerAdmin(request)
  if ("error" in auth) return auth.error
  const { admin } = auth

  const read = async (table: string) => {
    const { data } = await admin.from(table).select("data")
    return ((data ?? []) as Row[]).map((r) => r.data)
  }
  const [people, projects, notifications] = await Promise.all([
    read("people"),
    read("projects"),
    read("notifications"),
  ])

  const dayAgo = (n: number) =>
    dayOf(new Date(Date.now() - n * 86_400_000).toISOString())
  const today = dayAgo(0)
  const days = Array.from({ length: DAYS }, (_, i) => dayAgo(DAYS - 1 - i))
  const week = new Set(days.slice(-7))

  const teams = new Map<string, MailTeam>()
  const teamOfPerson = new Map<string, string>()
  for (const p of projects) {
    const id = String(p.id)
    teams.set(id, {
      projectId: id,
      title: String(p.title ?? id),
      today: 0,
      last7: 0,
      last14: 0,
      failed14: 0,
    })
    for (const m of (p.teamMemberIds as string[]) ?? [])
      teamOfPerson.set(m, id)
  }
  const nameOf = new Map(
    people.map((p) => [String(p.id), String(p.name ?? p.email ?? p.id)])
  )

  const { data, error } = await admin
    .from("mail_log")
    .select("id, kind, person_id, project_id, status, error, detail, sent_at")
    .gte("sent_at", new Date(Date.now() - (DAYS + 1) * 86_400_000).toISOString())
    .order("sent_at", { ascending: true })
    .limit(10_000)
  const mails = (data ?? []) as MailRow[]

  const perDay = new Map(days.map((d) => [d, { date: d, sent: 0, failed: 0 }]))
  const byKind = new Map<string, { kind: string; sent: number; failed: number }>()
  let lastSentAt: string | null = null
  let lastFailedAt: string | null = null
  const recent: MailReport["recent"] = []

  for (const m of mails) {
    const failed = m.status === "failed"
    const d = dayOf(m.sent_at)
    const bucket = perDay.get(d)
    if (!bucket) continue
    if (failed) {
      bucket.failed++
      lastFailedAt = m.sent_at
    } else {
      bucket.sent++
      lastSentAt = m.sent_at
    }
    const k = byKind.get(m.kind) ?? { kind: m.kind, sent: 0, failed: 0 }
    if (failed) k.failed++
    else k.sent++
    byKind.set(m.kind, k)

    const team = teams.get(
      m.project_id ?? teamOfPerson.get(m.person_id ?? "") ?? ""
    )
    if (team) {
      if (failed) team.failed14++
      else {
        team.last14++
        if (week.has(d)) team.last7++
        if (d === today) team.today++
      }
    }
    recent.push({
      at: m.sent_at,
      kind: m.kind,
      to: nameOf.get(m.person_id ?? "") ?? m.person_id ?? "unknown",
      team: team?.title ?? null,
      subject: m.detail?.subject ?? "",
      failed,
      error: m.error,
    })
  }

  const startDate = process.env.MAIL_START_DATE ?? null
  const unmailed = notifications.filter(
    (n) =>
      !n.emailedAt &&
      (!startDate || String(n.createdAt ?? "").slice(0, 10) >= startDate)
  ).length

  const report: MailReport = {
    mode: (process.env.MAIL_MODE ?? "off").toLowerCase(),
    startDate,
    dailyLimit: limit(),
    sentToday: perDay.get(today)?.sent ?? 0,
    failedToday: perDay.get(today)?.failed ?? 0,
    lastSentAt,
    lastFailedAt,
    unmailed,
    perDay: [...perDay.values()],
    byKind: [...byKind.values()].sort((a, b) => b.sent - a.sent),
    teams: [...teams.values()].sort((a, b) => b.last14 - a.last14),
    recent: recent.reverse().slice(0, 25),
    error: error?.message ?? null,
  }
  return Response.json(report)
}
