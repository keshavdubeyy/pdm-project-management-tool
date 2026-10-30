import { randomInt } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

/** The "get your temporary password" portal, for students only.
 *
 * A student gives their university email and is handed a freshly generated
 * password. Supabase keeps only hashes, so an issued password can never be read
 * back: this makes a new one. It runs on the server with the service-role key,
 * which is never sent to the browser.
 *
 * Rules, because an ID alone is not a secret:
 *   - students only (mentors and coordinators are refused);
 *   - once per student: the account is stamped when a password is shown, and a
 *     second request is refused, so a stranger cannot overwrite it afterwards;
 *   - never once the student has chosen their own password;
 *   - a few tries per address a minute.
 * A student who lost theirs asks the coordinator: create-accounts.mjs --only.
 */

export const dynamic = "force-dynamic"

// No 0/O, 1/l/I: these get read out and typed in by hand.
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const generate = () =>
  Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("")

const WINDOW_MS = 60_000
const MAX_TRIES = 5
const tries = new Map<string, number[]>()

/** Best effort: each server instance counts for itself. */
function limited(key: string) {
  const now = Date.now()
  const recent = (tries.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  tries.set(key, recent)
  return recent.length > MAX_TRIES
}

const fail = (error: string, status: number) =>
  Response.json({ error }, { status })

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return fail("This portal is not set up yet. Contact the coordinator.", 500)
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (limited(ip)) {
    return fail("Too many tries. Wait a minute and try again.", 429)
  }

  let email = ""
  try {
    const body = (await request.json()) as { email?: unknown }
    email = String(body.email ?? "").trim().toLowerCase()
  } catch {
    return fail("Enter your university email.", 400)
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("Enter your university email, like name.surname@students.iiit.ac.in.", 400)
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const notFound =
    "We could not find a student with that email. Check it, or contact the coordinator."

  const { data: row } = await admin
    .from("people")
    .select("id, data")
    .eq("data->>email", email)
    .maybeSingle()
  const personId = row?.id as string
  const person = row?.data as
    | { name?: string; email?: string; roles?: string[] }
    | undefined
  if (!person || !person.roles?.includes("student") || !person.email) {
    return fail(notFound, 404)
  }
  if (person.roles.some((r) => r !== "student")) {
    return fail(notFound, 404)
  }

  let user: Awaited<ReturnType<typeof admin.auth.admin.listUsers>>["data"]["users"][number] | undefined
  for (let page = 1; !user; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    })
    if (error) return fail("Something went wrong. Try again.", 500)
    user = data.users.find(
      (u) =>
        u.app_metadata?.personId === personId || u.email?.toLowerCase() === email
    )
    if (data.users.length < 200) break
  }
  if (!user) return fail(notFound, 404)

  if (user.user_metadata?.password_set === true) {
    return Response.json(
      {
        state: "already-set",
        error: "You have already set your password, so you can just sign in.",
      },
      { status: 409 }
    )
  }
  if (user.app_metadata?.tempPasswordShownAt) {
    return fail(
      "A temporary password was already shown for this email. If you did not save it, contact the coordinator.",
      409
    )
  }

  const password = generate()
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password,
    app_metadata: { tempPasswordShownAt: new Date().toISOString() },
    user_metadata: { password_set: false },
  })
  if (error) return fail("Something went wrong. Try again.", 500)

  return Response.json({
    name: person.name ?? "",
    email,
    password,
  })
}
