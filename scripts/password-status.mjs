// Who has chosen their own password, and who is still on the one they were issued.
//
//   node --env-file=.env.local scripts/password-status.mjs          # list only
//   node --env-file=.env.local scripts/password-status.mjs --fix    # also mark people as done when their issued password no longer works
//
// "Done" is a flag on the account (user_metadata.password_set) that the app sets
// when someone saves a password. Anyone who changed theirs before that flag
// existed has the new password but no flag, and would be asked again; --fix
// finds them by trying their issued password (from scripts/credentials.csv) and
// marks them. Needs SUPABASE_SERVICE_ROLE_KEY, which is never put in the app.

import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) {
  console.error("Set SUPABASE_SERVICE_ROLE_KEY (and have NEXT_PUBLIC_SUPABASE_URL in .env.local).")
  process.exit(1)
}
const fix = process.argv.includes("--fix")
const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const issued = new Map(
  readFileSync(new URL("./credentials.csv", import.meta.url), "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .map((l) => l.slice(1, -1).split('","'))
    .map(([name, email, , password]) => [email.toLowerCase(), { name, password }])
)

const users = []
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
  if (error) throw error
  users.push(...data.users)
  if (data.users.length < 200) break
}

const done = []
const waiting = []
for (const user of users) {
  const email = user.email?.toLowerCase() ?? ""
  const who = issued.get(email)?.name ?? email
  if (user.user_metadata?.password_set === true) {
    done.push(who)
    continue
  }
  // No flag: did they change it anyway? Try the issued password.
  let changedAnyway = false
  const pw = issued.get(email)?.password
  if (fix && pw) {
    const probe = createClient(url, anon, { auth: { persistSession: false } })
    const { error } = await probe.auth.signInWithPassword({ email, password: pw })
    changedAnyway = Boolean(error && /invalid login/i.test(error.message))
    if (!error) await probe.auth.signOut()
  }
  if (changedAnyway) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { password_set: true },
    })
    done.push(`${who} (marked: had changed it before the flag existed)`)
  } else {
    waiting.push(who)
  }
}

console.log(`\nChosen their own password (${done.length}):`)
done.forEach((n) => console.log("  " + n))
console.log(`\nStill on the issued password (${waiting.length}):`)
waiting.forEach((n) => console.log("  " + n))
