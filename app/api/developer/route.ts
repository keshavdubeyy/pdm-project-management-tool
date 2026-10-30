import { developerAdmin } from "@/lib/developer-auth"
import { STALE_AFTER_DAYS } from "@/lib/funnel"

/** Who is using the app, for the developer's /developer page.
 *
 * Sign-in times live in Supabase Auth, which the browser's publishable key
 * cannot read, so this runs on the server with the service-role key. The
 * caller must be on the DEVELOPER_EMAILS list; see lib/developer-auth.ts.
 */

export const dynamic = "force-dynamic"

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
  /** When the account was made. Mentors and the coordinator are given their
   * password by the coordinator, not on /get-password, so this stands in for
   * when theirs was issued. */
  accountCreatedAt: string | null
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

export type FunnelRole = "student" | "mentor" | "coordinator"

/** Each stage is a subset of the one before it, except the three problem
 * buckets, which split the people who are not yet on their own password. */
export type Funnel = {
  total: number
  hasAccount: number
  assigned: number
  signedIn: number
  ownPassword: number
  /** Signed in, never changed the temporary password. */
  stillTemporary: number
  /** Still temporary and issued more than STALE_AFTER_DAYS ago. */
  staleTemporary: number
  /** Password collected, never signed in. */
  stuck: number
  /** No account, or no password collected yet. */
  notStarted: number
}

const emptyFunnel = (): Funnel => ({
  total: 0,
  hasAccount: 0,
  assigned: 0,
  signedIn: 0,
  ownPassword: 0,
  stillTemporary: 0,
  staleTemporary: 0,
  stuck: 0,
  notStarted: 0,
})

export async function GET(request: Request) {
  const auth = await developerAdmin(request)
  if ("error" in auth) return auth.error
  const { admin } = auth

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
      accountCreatedAt: user?.created_at ?? null,
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

  const funnel: Record<FunnelRole, Funnel> = {
    student: emptyFunnel(),
    mentor: emptyFunnel(),
    coordinator: emptyFunnel(),
  }
  const staleBefore = Date.now() - STALE_AFTER_DAYS * 86_400_000
  for (const p of stats.values()) {
    // Someone who is both a mentor and the coordinator counts in each row.
    for (const role of Object.keys(funnel) as FunnelRole[]) {
      if (!p.roles.includes(role)) continue
      const f = funnel[role]
      const issuedAt =
        role === "student" ? p.assignedAt : p.accountCreatedAt
      f.total++
      if (p.hasAccount) f.hasAccount++
      if (issuedAt) f.assigned++
      if (p.lastSignInAt) f.signedIn++
      if (p.passwordSet) f.ownPassword++
      if (p.lastSignInAt && !p.passwordSet) {
        f.stillTemporary++
        if (issuedAt && Date.parse(issuedAt) < staleBefore)
          f.staleTemporary++
      }
      if (issuedAt && !p.lastSignInAt) f.stuck++
      if (!issuedAt) f.notStarted++
    }
  }

  return Response.json({ people: [...stats.values()], funnel })
}
