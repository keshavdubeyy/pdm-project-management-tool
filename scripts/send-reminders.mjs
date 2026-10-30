// Emails students about their ProjectGarage account, through Gmail.
//
//   node --env-file=.env.local scripts/send-reminders.mjs --audience not-assigned
//   node --env-file=.env.local scripts/send-reminders.mjs --audience waiting --send
//
// Audiences (the same lists the developer dashboard filters on):
//   not-assigned   has not collected a temporary password on /get-password
//   waiting        collected one but has never signed in
//   temporary      signed in but is still on the temporary password
//
// --only <email> mails just that one student whatever list they are on, with
// "[TEST]" in the subject, to try a mail out before the real batch.
// Without --send it only prints who would get a mail. Add --cc to copy someone
// on every message (for example --cc raman.saxena@iiit.ac.in).
//
// Needs, in .env.local (never committed):
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   already there
//   GMAIL_USER           the Gmail address to send from
//   GMAIL_APP_PASSWORD   a Google "app password" (Google Account → Security →
//                        2-Step Verification → App passwords), not the real one
// No password is ever put in these mails: the temporary password is only ever
// shown on the portal.

import { createClient } from "@supabase/supabase-js"
import nodemailer from "nodemailer"

const SITE = "https://pdm-project-manager.vercel.app"
const DELAY_MS = 1500

const args = process.argv.slice(2)
const flag = (name) => {
  const at = args.indexOf(name)
  return at >= 0 ? args[at + 1]?.trim() : undefined
}
const audience = flag("--audience")
const cc = flag("--cc")
const only = flag("--only")?.toLowerCase()
const send = args.includes("--send")

const mails = {
  "not-assigned": {
    subject: "Get your ProjectGarage password and start uploading your PDM progress",
    body: (name) => `Dear ${name},

Please use ProjectGarage to upload all your PDM progress. You have not collected your temporary password yet.

1. Open ${SITE}/get-password
2. Enter your university email and click "Generate my temporary password".
3. Copy the password right away. It is shown only once.
4. Sign in at ${SITE}/signin and choose your own password when prompted.
5. Start uploading your PDM progress.

If you have any trouble, just let me know.

Thanks,
Keshav`,
  },
  waiting: {
    subject: "Please sign in to ProjectGarage and start uploading your PDM progress",
    body: (name) => `Dear ${name},

You have collected your temporary password for ProjectGarage, but have not signed in yet.

1. Sign in at ${SITE}/signin with your university email and the temporary password.
2. Choose your own password when prompted.
3. Start uploading your PDM progress.

If you did not save your temporary password, or have any other trouble, just let me know.

Thanks,
Keshav`,
  },
  temporary: {
    subject: "Please set your own ProjectGarage password",
    body: (name) => `Dear ${name},

You have signed in to ProjectGarage, but you are still using the temporary password.

Please choose your own: sign in at ${SITE}/signin and set a new password when asked, or from your profile.

If you have any trouble, just let me know.

Thanks,
Keshav`,
  },
}

if (!mails[audience]) {
  console.error(
    "Pick who to mail: --audience not-assigned | waiting | temporary"
  )
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed.")
  process.exit(1)
}
if (send && !(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)) {
  console.error("Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local to send.")
  process.exit(1)
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const users = []
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
  if (error) throw error
  users.push(...data.users)
  if (data.users.length < 200) break
}
const byEmail = new Map(users.map((u) => [u.email?.toLowerCase(), u]))

const { data: rows, error } = await admin.from("people").select("data")
if (error) throw error

const matches = {
  "not-assigned": (u) => !u.app_metadata?.tempPasswordShownAt,
  waiting: (u) => u.app_metadata?.tempPasswordShownAt && !u.last_sign_in_at,
  temporary: (u) => u.last_sign_in_at && u.user_metadata?.password_set !== true,
}[audience]

const targets = rows
  .map((r) => r.data)
  // Students only; mentors and coordinators are not part of this rollout.
  .filter((p) => p.roles?.length === 1 && p.roles[0] === "student" && p.email)
  .map((p) => ({ person: p, user: byEmail.get(p.email.toLowerCase()) }))
  .filter(({ person, user }) =>
    only
      ? person.email.toLowerCase() === only
      : // Anyone who already chose their own password has nothing left to be told.
        user && user.user_metadata?.password_set !== true && matches(user)
  )

console.log(`${targets.length} student(s) for "${audience}":`)
for (const { person } of targets) console.log(`  ${person.name} <${person.email}>`)

if (!send) {
  console.log("\nDry run: nothing sent. Add --send to send these.")
  process.exit(0)
}
if (targets.length === 0) process.exit(0)

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    // Google shows the app password in groups of four; the spaces are not part of it.
    pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, ""),
  },
})

const { subject, body } = mails[audience]
let sent = 0
for (const { person } of targets) {
  try {
    await transport.sendMail({
      from: `Keshav Dubey <${process.env.GMAIL_USER}>`,
      to: person.email,
      cc,
      subject: only ? `[TEST] ${subject}` : subject,
      text: body(person.name.split(" ")[0]),
    })
    sent++
    console.log(`sent    ${person.email}`)
  } catch (err) {
    console.error(`FAILED  ${person.email}: ${err.message}`)
  }
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
}
console.log(`\n${sent} of ${targets.length} sent.`)
