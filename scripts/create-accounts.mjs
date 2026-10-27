// Creates a Supabase sign-in for everyone in scripts/roster.json and writes
// each person's email and password to scripts/credentials.csv.
//
//   node --env-file=.env.local scripts/create-accounts.mjs                        # new accounts only
//   node --env-file=.env.local scripts/create-accounts.mjs --only a@b.ac.in       # one person forgot their password: issue a new one
//   node --env-file=.env.local scripts/create-accounts.mjs --reset                # every existing account gets a fresh password (rarely wanted)
//
// A reset account is sent to "choose your password" again on next sign-in.
//
// Needs SUPABASE_SERVICE_ROLE_KEY in the environment (Supabase dashboard →
// Project Settings → API). That key can do anything to the project: it is read
// here and never goes into the app, the repo or a chat.

import { randomInt } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL (it is in .env.local) and SUPABASE_SERVICE_ROLE_KEY, then run again."
  )
  process.exit(1)
}

const args = process.argv.slice(2)
const onlyAt = args.indexOf("--only")
const only = onlyAt >= 0 ? args[onlyAt + 1]?.trim().toLowerCase() : null
if (onlyAt >= 0 && !only) {
  console.error("--only needs an email, for example: --only a.b@students.iiit.ac.in")
  process.exit(1)
}
// Naming one person means "give them a new password", so it implies a reset.
const reset = args.includes("--reset") || Boolean(only)
const everyone = JSON.parse(
  readFileSync(new URL("./roster.json", import.meta.url), "utf8")
)
const roster = only ? everyone.filter((p) => p.email === only) : everyone
if (only && roster.length === 0) {
  console.error(`${only} is not on the roster (scripts/roster.json).`)
  process.exit(1)
}
const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// No 0/O, 1/l/I: these get read out and typed in by hand.
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const password = () =>
  Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("")

async function existingUsers() {
  const byEmail = new Map()
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    })
    if (error) throw error
    for (const user of data.users) byEmail.set(user.email?.toLowerCase(), user)
    if (data.users.length < 200) return byEmail
  }
}

const existing = await existingUsers()
const rows = [["name", "email", "role", "password"]]
let created = 0
let reseted = 0
let skipped = 0

for (const person of roster) {
  const found = existing.get(person.email)
  const role = person.roles.join(" + ")

  if (found && !reset) {
    skipped++
    continue
  }

  const pw = password()
  if (found) {
    const { error } = await admin.auth.admin.updateUserById(found.id, {
      password: pw,
      app_metadata: { personId: person.personId },
      // Back to "still on an issued password", so they choose their own again.
      user_metadata: { password_set: false },
    })
    if (error) {
      console.error(`FAILED  ${person.email}: ${error.message}`)
      continue
    }
    reseted++
  } else {
    const { error } = await admin.auth.admin.createUser({
      email: person.email,
      password: pw,
      email_confirm: true,
      app_metadata: { personId: person.personId },
      user_metadata: { name: person.name },
    })
    if (error) {
      console.error(`FAILED  ${person.email}: ${error.message}`)
      continue
    }
    created++
  }
  rows.push([person.name, person.email, role, pw])
}

if (rows.length > 1) {
  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n")
  writeFileSync(new URL("./credentials.csv", import.meta.url), csv + "\n", {
    mode: 0o600,
  })
}

console.log(
  `${created} created, ${reseted} given a new password, ${skipped} already had an account.`
)
if (rows.length > 1)
  console.log("Passwords are in scripts/credentials.csv. Send them, then delete the file.")
