import { developerAdmin } from "@/lib/developer-auth"

/** Comment use per team, for the developer's /developer page.
 * Same rule as /api/developer: the caller must be on DEVELOPER_EMAILS. */

export const dynamic = "force-dynamic"

type Row = { data: Record<string, unknown> }
export type TeamHealth = {
  projectId: string
  title: string
  links: number
  comments: number
  comments7: number
  comments30: number
  replies: number
  mentions: number
  deleted: number
  /** Comments from mentors, and from everyone else. */
  fromMentors: number
  fromTeam: number
  /** A mentor's comment nobody on the team has answered. */
  unanswered: number
  lastCommentAt: string | null
}

export type Health = {
  teams: TeamHealth[]
}

/** Calendar day in India, which is when the programme counts a day. */
const dayOf = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })

export async function GET(request: Request) {
  const auth = await developerAdmin(request)
  if ("error" in auth) return auth.error
  const { admin } = auth

  const read = async (table: string) => {
    const { data } = await admin.from(table).select("data")
    return ((data ?? []) as Row[]).map((r) => r.data)
  }
  const [people, projects, comments, artefacts] = await Promise.all([
    read("people"),
    read("projects"),
    read("comments"),
    read("artefacts"),
  ])

  const dayAgo = (n: number) =>
    dayOf(new Date(Date.now() - n * 86_400_000).toISOString())

  const teams = new Map<string, TeamHealth>()
  for (const p of projects) {
    const id = String(p.id)
    teams.set(id, {
      projectId: id,
      title: String(p.title ?? id),
      links: 0,
      comments: 0,
      comments7: 0,
      comments30: 0,
      replies: 0,
      mentions: 0,
      deleted: 0,
      fromMentors: 0,
      fromTeam: 0,
      unanswered: 0,
      lastCommentAt: null,
    })
  }
  const rolesOf = new Map(
    people.map((p) => [String(p.id), (p.roles as string[]) ?? []])
  )

  // ---- comments
  const weekStart = dayAgo(6)
  const monthStart = dayAgo(29)
  for (const c of comments) {
    const team = teams.get(String(c.projectId))
    if (!team) continue
    if (c.deletedAt) {
      team.deleted++
      continue
    }
    const created = String(c.createdAt ?? "")
    const d = created ? dayOf(created) : ""
    team.comments++
    if (d >= weekStart) team.comments7++
    if (d >= monthStart) team.comments30++
    if (c.parentId) team.replies++
    team.mentions += ((c.mentions as string[]) ?? []).length
    if (rolesOf.get(String(c.authorId))?.includes("mentor")) team.fromMentors++
    else team.fromTeam++
    if (created && (!team.lastCommentAt || created > team.lastCommentAt))
      team.lastCommentAt = created
  }
  // A mentor's comment is unanswered when nobody who is not a mentor replied.
  const live = comments.filter((c) => !c.deletedAt)
  for (const c of live) {
    if (c.parentId) continue
    if (!rolesOf.get(String(c.authorId))?.includes("mentor")) continue
    const answered = live.some(
      (r) =>
        r.parentId === c.id &&
        !rolesOf.get(String(r.authorId))?.includes("mentor")
    )
    if (!answered) {
      const team = teams.get(String(c.projectId))
      if (team) team.unanswered++
    }
  }

  for (const a of artefacts) {
    const team = teams.get(String(a.projectId))
    if (team) team.links++
  }

  const health: Health = {
    teams: [...teams.values()].sort((a, b) => a.title.localeCompare(b.title)),
  }
  return Response.json(health)
}
