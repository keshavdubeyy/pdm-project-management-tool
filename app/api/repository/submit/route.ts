import { adminClient, parseSubmission } from "@/lib/repository"

/** The public submission form posts here. No sign-in: anyone with the link can
 * add a project, and it goes straight into the repository. The coordinator can
 * hide or delete an entry afterwards. A hidden field and a per-address limit
 * keep casual spam out. */

export const dynamic = "force-dynamic"

const WINDOW_MS = 10 * 60_000
const MAX_PER_WINDOW = 5
const recent = new Map<string, number[]>()

/** Best effort: each server instance counts for itself. */
function limited(key: string) {
  const now = Date.now()
  const times = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  times.push(now)
  recent.set(key, times)
  return times.length > MAX_PER_WINDOW
}

const fail = (error: string, status: number) =>
  Response.json({ error }, { status })

export async function POST(request: Request) {
  const admin = adminClient()
  if (!admin) return fail("The repository is not set up yet.", 500)

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (limited(ip))
    return fail("Too many submissions. Wait a few minutes and try again.", 429)

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return fail("That did not look like a submission.", 400)
  }

  // Real people never fill this in. Answer as if it worked.
  if (typeof body.website === "string" && body.website.trim())
    return Response.json({ ok: true })

  const parsed = parseSubmission(body)
  if (!parsed.ok) return fail(parsed.error, 400)
  const v = parsed.value

  const { error } = await admin.from("repository_projects").insert({
    status: "published",
    project_type: "graduation",
    title: v.title,
    summary: v.summary,
    problem: v.problem || null,
    outcome: v.outcome || null,
    graduation_year: v.graduationYear,
    batch_label: v.batchLabel || null,
    domain: v.domain || null,
    mentor: v.mentor || null,
    team: v.team,
    links: v.links,
    tags: v.tags,
    submitter_name: v.submitterName,
    submitter_email: v.submitterEmail,
  })
  if (error) return fail("Something went wrong. Try again.", 500)

  return Response.json({ ok: true })
}
