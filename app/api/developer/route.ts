import { createClient } from "@supabase/supabase-js"

/** Who is using the app, for the developer's /developer page.
 *
 * Sign-in times live in Supabase Auth, which the browser's publishable key
 * cannot read, so this runs on the server with the service-role key. That key
 * is only ever read here and is never sent to the browser. The caller must be
 * signed in, and their email must be on the DEVELOPER_EMAILS list.
 */

export const dynamic = "force-dynamic"

const DEVELOPER_EMAILS = (
  process.env.DEVELOPER_EMAILS ?? "keshav.dubey@students.iiit.ac.in"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

type Row = { data: Record<string, unknown> }

export type DeveloperPerson = {
  personId: string
  name: string
  email: string
  roles: string[]
  /** Whether an account exists for them. */
  hasAccount: boolean
  /** When the temporary password was handed over on /get-password. */
  assignedAt: string | null
  lastSignInAt: string | null
  passwordSet: boolean
  notes: number
  actions: number
  links: number
  /** Newest note, action or link they added. */
  lastActivityAt: string | null
  /** Dates (YYYY-MM-DD) they added something, for the weekly count. */
  activityDates: string[]
}

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return Response.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not set on the server." },
      { status: 500 }
    )
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) return Response.json({ error: "Sign in first." }, { status: 401 })

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: caller } = await admin.auth.getUser(token)
  const email = caller.user?.email?.toLowerCase()
  if (!email || !DEVELOPER_EMAILS.includes(email)) {
    return Response.json({ error: "Not allowed." }, { status: 403 })
  }

  const users = []
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    users.push(...data.users)
    if (data.users.length < 200) break
  }

  const read = async (table: string) => {
    const { data } = await admin.from(table).select("data")
    return ((data ?? []) as Row[]).map((r) => r.data)
  }
  const [people, notes, actions, artefacts] = await Promise.all([
    read("people"),
    read("notes"),
    read("action_items"),
    read("artefacts"),
  ])

  const userByPerson = new Map(
    users.map((u) => [
      (u.app_metadata?.personId as string | undefined) ?? u.email ?? u.id,
      u,
    ])
  )
  const userByEmail = new Map(users.map((u) => [u.email?.toLowerCase(), u]))

  const stats = new Map<string, DeveloperPerson>()
  for (const p of people) {
    const id = String(p.id)
    const pEmail = String(p.email ?? "")
    const user = userByPerson.get(id) ?? userByEmail.get(pEmail.toLowerCase())
    stats.set(id, {
      personId: id,
      name: String(p.name ?? pEmail),
      email: pEmail,
      roles: (p.roles as string[]) ?? [],
      hasAccount: Boolean(user),
      assignedAt:
        (user?.app_metadata?.tempPasswordShownAt as string | undefined) ??
        null,
      lastSignInAt: user?.last_sign_in_at ?? null,
      passwordSet: Boolean(user?.user_metadata?.password_set),
      notes: 0,
      actions: 0,
      links: 0,
      lastActivityAt: null,
      activityDates: [],
    })
  }

  const tally = (
    items: Record<string, unknown>[],
    by: string,
    at: string,
    kind: "notes" | "actions" | "links"
  ) => {
    for (const item of items) {
      const person = stats.get(String(item[by]))
      const when = item[at] as string | undefined
      if (!person) continue
      person[kind]++
      if (when) {
        person.activityDates.push(when.slice(0, 10))
        if (!person.lastActivityAt || when > person.lastActivityAt)
          person.lastActivityAt = when
      }
    }
  }
  tally(notes, "authorId", "createdAt", "notes")
  tally(actions, "createdBy", "createdAt", "actions")
  tally(artefacts, "addedBy", "addedAt", "links")

  return Response.json({ people: [...stats.values()] })
}
