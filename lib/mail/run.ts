import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import nodemailer from "nodemailer"

import { todayIso } from "@/lib/dates"
import {
  activityBatch,
  activityReadiness,
  coordinatorWeekly,
  hourInIndia,
  mentorWeekly,
  pendingActivity,
  studentReminder,
} from "@/lib/mail/compose"
import { loadServerDatabase } from "@/lib/mail/load"
import { renderHtml, renderText } from "@/lib/mail/render"
import type { Mail } from "@/lib/mail/types"
import type { Database, Person } from "@/lib/types"

/** One pass of the mail job. Called every few minutes by a scheduler; each
 * call works out what is due right now, sends it, and records that it did, so
 * running twice in a row sends nothing twice.
 *
 *   dry-run  builds everything and says what it would send; sends and records
 *            nothing
 *   live     sends and records
 *
 * Only what happened on or after `startDate` is mentioned: the day the tool
 * went live, so the first mail does not announce the past. */

export type MailMode = "dry-run" | "live"

export type RunSummary = {
  mode: MailMode
  at: string
  startDate: string
  planned: { kind: string; to: string; subject: string; why: string }[]
  skipped: string[]
  failed: string[]
}

const WEEKDAY = (at: Date) =>
  at.toLocaleDateString("en-US", { weekday: "short", timeZone: "Asia/Kolkata" })

const SEND_FROM_HOUR = 8

export async function runMail(options: {
  mode: MailMode
  startDate: string
  now?: Date
}): Promise<RunSummary> {
  const { mode, startDate } = options
  const now = options.now ?? new Date()
  const today = todayIso()
  const summary: RunSummary = {
    mode,
    at: now.toISOString(),
    startDate,
    planned: [],
    skipped: [],
    failed: [],
  }

  const db = await loadServerDatabase()
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // What was already sent for the scheduled mails, over the last few days.
  const since = new Date(now.getTime() - 3 * 86_400_000).toISOString()
  const { data: logged, error: logError } = await admin
    .from("mail_log")
    .select("id")
    .eq("status", "sent")
    .gte("sent_at", since)
  if (logError) {
    if (mode === "live")
      throw new Error(`mail_log is not readable: ${logError.message}`)
    summary.skipped.push(
      `mail_log not readable (${logError.message}); dry-run treats nothing as sent`
    )
  }
  const alreadySent = new Set((logged ?? []).map((r) => r.id as string))

  // Only people who have chosen their own password are mailed: until then they
  // are not really using the tool, and a mail would point at a door they
  // cannot open yet.
  const owned = new Set<string>()
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    })
    if (error) throw new Error(`Could not read accounts: ${error.message}`)
    data.users.forEach((u) => {
      if (u.user_metadata?.password_set === true && u.email)
        owned.add(u.email.toLowerCase())
    })
    if (data.users.length < 200) break
  }
  const candidates = db.people.filter((p) => p.email && !/test/i.test(p.name))
  const everyone = candidates.filter((p) => owned.has(p.email.toLowerCase()))
  summary.skipped.push(
    `${candidates.length - everyone.length} of ${candidates.length} people not mailed: own password not set yet`
  )
  const queue: { mail: Mail; logId: string; why: string; notificationIds?: string[] }[] = []
  // The team a mail is about, for the developer dashboard's per-team counts.
  const projectOf = (personId: string) =>
    db.projects.find((p) => p.teamMemberIds.includes(personId))?.id ?? null

  // Comments, mentions, actions, meetings: once a conversation has gone quiet.
  for (const person of everyone) {
    const items = pendingActivity(db, person.id).filter(
      (n) => n.createdAt.slice(0, 10) >= startDate
    )
    if (!items.length) continue
    const ready = activityReadiness(items, now)
    if (!ready.ready) {
      summary.skipped.push(`activity for ${person.name}: ${ready.reason}`)
      continue
    }
    const mail = activityBatch(db, person, items)
    if (mail)
      queue.push({
        mail,
        logId: `activity:${person.id}:${now.toISOString()}`,
        why: ready.reason,
        notificationIds: items.map((n) => n.id),
      })
  }

  const dueNow = hourInIndia(now) >= SEND_FROM_HOUR
  const day = WEEKDAY(now)
  const isCoordinator = (p: Person) => p.roles.includes("coordinator")

  // Students: Tuesday and Thursday, from 8 am.
  if (dueNow && (day === "Tue" || day === "Thu")) {
    for (const person of everyone.filter((p) => p.roles.includes("student"))) {
      const logId = `student-reminder:${person.id}:${today}`
      if (alreadySent.has(logId)) continue
      const mail = studentReminder(db, person, today, startDate)
      if (mail) queue.push({ mail, logId, why: `${day} reminder` })
    }
  }

  // Mentors and the coordinator: Monday, from 8 am. A person who is both gets
  // the coordinator's digest only, which already covers their teams.
  if (dueNow && day === "Mon") {
    for (const person of everyone) {
      const logId = `weekly:${person.id}:${today}`
      if (alreadySent.has(logId)) continue
      const mail = isCoordinator(person)
        ? coordinatorWeekly(db, person, today, startDate)
        : person.roles.includes("mentor")
          ? mentorWeekly(db, person, today, startDate)
          : null
      if (mail) queue.push({ mail, logId, why: "Monday weekly report" })
    }
  }

  for (const q of queue)
    summary.planned.push({
      kind: q.mail.kind,
      to: q.mail.to.email,
      subject: q.mail.subject,
      why: q.why,
    })
  if (mode === "dry-run" || !queue.length) return summary

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s/g, ""),
    },
  })
  for (const q of queue) {
    try {
      await transport.sendMail({
        from: `ProjectGarage <${process.env.GMAIL_USER}>`,
        to: q.mail.to.email,
        subject: q.mail.subject,
        text: renderText(q.mail),
        html: renderHtml(q.mail),
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : "failed"
      summary.failed.push(`${q.mail.to.email}: ${reason}`)
      // Its own id, so the failure is counted but does not count as sent.
      await admin.from("mail_log").insert({
        id: `failed:${q.logId}:${now.getTime()}`,
        kind: q.mail.kind,
        person_id: q.mail.to.id,
        project_id: projectOf(q.mail.to.id),
        status: "failed",
        error: reason.slice(0, 300),
        detail: { subject: q.mail.subject },
      })
      continue
    }
    // Recorded straight after each send, so a crash part-way does not resend.
    await admin.from("mail_log").insert({
      id: q.logId,
      kind: q.mail.kind,
      person_id: q.mail.to.id,
      project_id: projectOf(q.mail.to.id),
      detail: { subject: q.mail.subject },
    })
    if (q.notificationIds)
      await markEmailed(admin, db, q.notificationIds, now.toISOString())
    await new Promise((r) => setTimeout(r, 1000))
  }
  return summary
}

async function markEmailed(
  admin: SupabaseClient,
  db: Database,
  ids: string[],
  at: string
) {
  const byId = new Map(db.notifications.map((n) => [n.id, n]))
  for (const id of ids) {
    const n = byId.get(id)
    if (n)
      await admin
        .from("notifications")
        .update({ data: { ...n, emailedAt: at } })
        .eq("id", id)
  }
}
