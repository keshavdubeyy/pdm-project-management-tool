// Builds every kind of ProjectGarage email from real data and sends them to
// ONE address so they can be looked at. Nobody else is ever mailed: the person
// a mail is "for" is only named in the banner.
//
//   npx tsx --env-file=.env.local scripts/preview-mails.ts                 # dry run, live data
//   npx tsx --env-file=.env.local scripts/preview-mails.ts --data demo     # dry run, demo activity
//   npx tsx --env-file=.env.local scripts/preview-mails.ts --data demo --send
//
// Flags:
//   --data live|demo   live reads Supabase; demo uses the app's demo activity
//   --kind <kind>      only one of: activity, student-reminder, mentor-weekly,
//                      coordinator-weekly, escalation
//   --as <email>       render as this person instead of the one with most to say
//   --to <email>       where previews go (default keshav.dubey@students.iiit.ac.in)
//   --html             write the mails to mail-preview/ (open index.html) to look at
//                      them in a browser; sends nothing
//   --send             actually send; without it, only prints what would go
//
// Needs GMAIL_USER and GMAIL_APP_PASSWORD (see scripts/send-reminders.mjs).

import { mkdirSync, writeFileSync } from "node:fs"

import nodemailer from "nodemailer"

import {
  activityBatch,
  activityReadiness,
  coordinatorWeekly,
  escalations,
  mentorWeekly,
  pendingActivity,
  studentReminder,
} from "@/lib/mail/compose"
import { demoDatabase, loadServerDatabase } from "@/lib/mail/load"
import { renderHtml, renderText } from "@/lib/mail/render"
import type { Mail, MailKind } from "@/lib/mail/types"
import type { Database, Person, Role } from "@/lib/types"

const args = process.argv.slice(2)
const flag = (name: string) => {
  const at = args.indexOf(name)
  return at >= 0 ? args[at + 1]?.trim() : undefined
}
const dataMode = flag("--data") ?? "live"
const only = flag("--kind") as MailKind | undefined
const as = flag("--as")?.toLowerCase()
const to = flag("--to") ?? "keshav.dubey@students.iiit.ac.in"
const send = args.includes("--send")

const db: Database =
  dataMode === "demo" ? demoDatabase() : await loadServerDatabase()
console.log(`Data: ${dataMode}. Previews go to ${to} only.\n`)

/** Demo data has no unread conversation, so a few sample notices are added for
 * the first team's student and mentor, as if comments were arriving. */
if (dataMode === "demo") {
  const project = db.projects.find((p) => p.teamMemberIds.length && p.mentorIds.length)
  const milestone = project && db.milestones.find((m) => m.projectId === project.id)
  if (project && milestone) {
    const student = project.teamMemberIds[0]
    const mate = project.teamMemberIds[1] ?? student
    const mentor = project.mentorIds[0]
    const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()
    const href = `/projects/${project.id}?milestone=${milestone.id}`
    const make = (
      personId: string,
      kind: "comment" | "mention" | "action_item" | "meeting",
      title: string,
      body: string,
      actorId: string,
      mins: number,
      to = href
    ) => ({
      id: `sample-${personId}-${mins}`,
      personId,
      kind,
      title,
      body,
      href: to,
      actorId,
      createdAt: minsAgo(mins),
    })
    const name = (id: string) => db.people.find((p) => p.id === id)?.name ?? "Someone"
    db.notifications.push(
      make(student, "comment", `${name(mentor)} commented on the checkpoint`, "Can you add the user interview notes here?", mentor, 95),
      make(student, "comment", `${name(mentor)} replied on the checkpoint`, "Also link the raw recordings if you have them.", mentor, 70),
      make(student, "mention", `${name(mate)} mentioned you on the checkpoint`, `@${name(student)} can you confirm the dates?`, mate, 60),
      make(student, "action_item", "You were given an action", "Share the interview synthesis with the mentor", mentor, 80, `/projects/${project.id}?tab=notes`),
      make(mentor, "comment", `${name(student)} replied on the checkpoint`, "Added the notes and the recordings link.", student, 55),
      make(mentor, "mention", `${name(mate)} mentioned you on the checkpoint`, `@${name(mentor)} could you review our synthesis?`, mate, 45)
    )
  }
}

const withRole = (role: Role) => db.people.filter((p) => p.roles.includes(role))
// The test coordinator is a dummy account; never preview as it.
const realCoordinators = withRole("coordinator").filter(
  (p) => !/test/i.test(p.name)
)

type Candidate = { kind: MailKind; people: Person[]; build: (p: Person) => Mail | null }
const now = new Date()
const candidates: Candidate[] = [
  {
    kind: "activity",
    people: db.people,
    build: (p) => activityBatch(db, p),
  },
  {
    kind: "student-reminder",
    people: withRole("student"),
    build: (p) => studentReminder(db, p),
  },
  { kind: "mentor-weekly", people: withRole("mentor"), build: (p) => mentorWeekly(db, p) },
  {
    kind: "coordinator-weekly",
    people: realCoordinators,
    build: (p) => coordinatorWeekly(db, p),
  },
  { kind: "escalation", people: realCoordinators, build: (p) => escalations(db, p) },
]

const size = (m: Mail) => m.sections.reduce((n, s) => n + s.items.length, 0)

const chosen: Mail[] = []
for (const c of candidates) {
  if (only && only !== c.kind) continue
  const pool = as ? c.people.filter((p) => p.email.toLowerCase() === as) : c.people
  const built = pool
    .map((p) => c.build(p))
    .filter((m): m is Mail => m !== null)
    .sort((a, b) => size(b) - size(a))
  const pick = built[0]
  if (!pick) {
    console.log(`${c.kind}: nothing to send for anyone right now.`)
    continue
  }
  const extra =
    c.kind === "activity"
      ? ` (would send: ${activityReadiness(pendingActivity(db, pick.to.id), now).reason})`
      : ""
  console.log(
    `${c.kind}: "${pick.subject}" for ${pick.to.name}, ${size(pick)} item(s)${extra}`
  )
  chosen.push(pick)
}

if (args.includes("--html")) {
  const dir = new URL("../mail-preview/", import.meta.url)
  mkdirSync(dir, { recursive: true })
  const banner = `Preview of the "KIND" mail as NAME would get it.`
  chosen.forEach((m) =>
    writeFileSync(
      new URL(`${m.kind}.html`, dir),
      renderHtml(m, banner.replace("KIND", m.kind).replace("NAME", m.to.name))
    )
  )
  const cards = chosen
    .map(
      (m) => `<section><h2>${m.kind} <small>for ${m.to.name}</small></h2>
<iframe src="${m.kind}.html" loading="lazy"></iframe></section>`
    )
    .join("")
  writeFileSync(
    new URL("index.html", dir),
    `<!doctype html><meta charset="utf-8"><title>Mail previews</title>
<style>body{margin:0;padding:24px;background:#eef0f3;font:14px -apple-system,Segoe UI,sans-serif;color:#101828}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(620px,1fr));gap:24px}
h2{margin:0 0 8px;font-size:15px}small{color:#667085;font-weight:400}
iframe{width:100%;height:880px;border:1px solid #d0d5dd;border-radius:12px;background:#fff}</style>
<h1 style="margin:0 0 16px;font-size:20px">Mail previews (${dataMode} data)</h1><div class="grid">${cards}</div>`
  )
  console.log(`\nWrote ${chosen.length} mail(s). Open mail-preview/index.html`)
  process.exit(0)
}

if (!send) {
  console.log("\nDry run: nothing sent. Add --send to send these previews.")
  process.exit(0)
}
if (!chosen.length) process.exit(0)
if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.error("Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local to send.")
  process.exit(1)
}

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, ""),
  },
})
for (const mail of chosen) {
  const role = mail.to.roles.join(" + ")
  const banner = `PREVIEW. This is the "${mail.kind}" mail as ${mail.to.name} (${role}) would get it. It was sent to you only.${dataMode === "demo" ? " Built from demo data." : ""}`
  await transport.sendMail({
    from: `ProjectGarage <${process.env.GMAIL_USER}>`,
    to,
    subject: `[PREVIEW] ${mail.subject}`,
    text: renderText(mail, banner),
    html: renderHtml(mail, banner),
  })
  console.log(`sent    ${mail.kind}`)
  await new Promise((r) => setTimeout(r, 1500))
}
console.log(`\n${chosen.length} preview(s) sent to ${to}.`)
