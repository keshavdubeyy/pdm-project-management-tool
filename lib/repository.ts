import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/** The public project repository: what a submission holds, how it is checked,
 * and how the server reads it.
 *
 * Everything goes through the server with the service-role key. The browser
 * key reaches nothing in this table, so a visitor can only do what these
 * routes allow: add a pending submission, and read published ones. */

export type RepoStatus = "pending" | "published" | "rejected"

export type RepoPerson = { name: string; email?: string; rollNumber?: string }
export type RepoLink = { label: string; url: string }

/** A row as the coordinator sees it, contact details included. */
export type RepoProject = {
  id: string
  status: RepoStatus
  /** Graduation projects only for now; other kinds come later. */
  project_type: string
  title: string
  summary: string
  problem: string | null
  outcome: string | null
  graduation_year: number
  batch_label: string | null
  domain: string | null
  mentor: string | null
  team: RepoPerson[]
  links: RepoLink[]
  tags: string[]
  submitter_name: string
  submitter_email: string
  created_at: string
  reviewed_at: string | null
}

/** What a stranger may see: no emails, no submitter. */
export const PUBLIC_COLUMNS =
  "id, title, summary, problem, outcome, graduation_year, batch_label, domain, mentor, team, links, tags, created_at"

export type PublicRepoProject = Pick<
  RepoProject,
  | "id"
  | "title"
  | "summary"
  | "problem"
  | "outcome"
  | "graduation_year"
  | "batch_label"
  | "domain"
  | "mentor"
  | "links"
  | "tags"
  | "created_at"
> & { team: { name: string }[] }

/** Every batch the programme has run, earliest first. Each lasts two years and
 * graduates in the year it ends. This is the one list the form's dropdown, the
 * public filter and the checks all read, so a new batch is added here and
 * nowhere else. */
export const BATCHES = [
  { label: "2021–23", graduationYear: 2023 },
  { label: "2022–24", graduationYear: 2024 },
  { label: "2023–25", graduationYear: 2025 },
  { label: "2024–26", graduationYear: 2026 },
  { label: "2025–27", graduationYear: 2027 },
] as const

/** How a batch is named on screen. Entries saved before batches were a
 * dropdown may have no label, so fall back to the year. */
export function batchName(p: {
  batch_label: string | null
  graduation_year: number
}) {
  return p.batch_label ? `Batch ${p.batch_label}` : `Class of ${p.graduation_year}`
}

export const MAX_TEAM = 8
export const MAX_LINKS = 8

export const DOMAINS = [
  "Healthcare",
  "Education",
  "Fintech",
  "Mobility",
  "Sustainability",
  "Consumer products",
  "Enterprise software",
  "Agriculture",
  "Other",
]

export function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Published projects, newest graduates first. Empty if the table is not set
 * up yet, so the page says "nothing here" rather than crashing. */
export async function listPublished(): Promise<PublicRepoProject[]> {
  const admin = adminClient()
  if (!admin) return []
  const { data, error } = await admin
    .from("repository_projects")
    .select(PUBLIC_COLUMNS)
    .eq("status", "published")
    .order("graduation_year", { ascending: false })
    .order("created_at", { ascending: false })
  if (error || !data) return []
  return (data as unknown as PublicRepoProject[]).map(stripTeam)
}

export async function getPublished(
  id: string
): Promise<PublicRepoProject | null> {
  const admin = adminClient()
  if (!admin || !/^[0-9a-f-]{36}$/i.test(id)) return null
  const { data } = await admin
    .from("repository_projects")
    .select(PUBLIC_COLUMNS)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle()
  return data ? stripTeam(data as unknown as PublicRepoProject) : null
}

/** Team emails and roll numbers are for the coordinator only. */
function stripTeam(p: PublicRepoProject): PublicRepoProject {
  return { ...p, team: (p.team ?? []).map((m) => ({ name: m.name })) }
}

/* ---------------------------------------------------------- validation */

export type SubmissionInput = {
  title: string
  summary: string
  problem: string
  outcome: string
  graduationYear: number
  batchLabel: string
  domain: string
  mentor: string
  team: RepoPerson[]
  links: RepoLink[]
  tags: string[]
  submitterName: string
  submitterEmail: string
}

const text = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : ""

export function isHttpUrl(value: string) {
  try {
    const u = new URL(value)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

/** Checks and cleans a submission. Returns the first thing wrong, in words a
 * submitter can act on. Used on the server; the form runs it too so people
 * hear about mistakes before they send. */
export function parseSubmission(
  raw: unknown
): { ok: true; value: SubmissionInput } | { ok: false; error: string } {
  const b = (raw ?? {}) as Record<string, unknown>

  const title = text(b.title, 140)
  const summary = text(b.summary, 600)
  if (!title) return { ok: false, error: "Give the project a title." }
  if (summary.length < 30)
    return {
      ok: false,
      error: "Describe the project in at least a couple of sentences.",
    }

  const batch = BATCHES.find((x) => x.label === b.batch)
  if (!batch) return { ok: false, error: "Choose your batch." }

  const team = (Array.isArray(b.team) ? b.team : [])
    .slice(0, MAX_TEAM)
    .map((m) => {
      const r = (m ?? {}) as Record<string, unknown>
      const email = text(r.email, 200).toLowerCase()
      return {
        name: text(r.name, 100),
        ...(email ? { email } : {}),
        ...(text(r.rollNumber, 30) ? { rollNumber: text(r.rollNumber, 30) } : {}),
      }
    })
    .filter((m) => m.name)
  if (team.length === 0)
    return { ok: false, error: "Add at least one team member." }
  if (team.some((m) => m.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)))
    return { ok: false, error: "A team member's email is not valid." }

  const links = (Array.isArray(b.links) ? b.links : [])
    .slice(0, MAX_LINKS)
    .map((l) => {
      const r = (l ?? {}) as Record<string, unknown>
      return { label: text(r.label, 60), url: text(r.url, 500) }
    })
    .filter((l) => l.label || l.url)
  if (links.length === 0)
    return { ok: false, error: "Add at least one link to your project." }
  const badLink = links.find((l) => !l.url || !isHttpUrl(l.url))
  if (badLink)
    return {
      ok: false,
      error: "Every link needs an address starting with http:// or https://.",
    }

  const tags = Array.from(
    new Set(
      (Array.isArray(b.tags) ? b.tags : [])
        .map((t) => text(t, 30).toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, 10)

  const submitterName = text(b.submitterName, 100)
  const submitterEmail = text(b.submitterEmail, 200).toLowerCase()
  if (!submitterName) return { ok: false, error: "Tell us your name." }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail))
    return { ok: false, error: "Enter a valid email so we can reach you." }

  return {
    ok: true,
    value: {
      title,
      summary,
      problem: text(b.problem, 3000),
      outcome: text(b.outcome, 3000),
      graduationYear: batch.graduationYear,
      batchLabel: batch.label,
      domain: text(b.domain, 60),
      mentor: text(b.mentor, 100),
      team,
      links: links.map((l) => ({ label: l.label || l.url, url: l.url })),
      tags,
      submitterName,
      submitterEmail,
    },
  }
}

/* ---------------------------------------------------------------- csv */

const CSV_COLUMNS: [string, (p: RepoProject) => string][] = [
  ["id", (p) => p.id],
  ["status", (p) => p.status],
  ["project_type", (p) => p.project_type],
  ["title", (p) => p.title],
  ["summary", (p) => p.summary],
  ["problem", (p) => p.problem ?? ""],
  ["outcome", (p) => p.outcome ?? ""],
  ["graduation_year", (p) => String(p.graduation_year)],
  ["batch", (p) => p.batch_label ?? ""],
  ["domain", (p) => p.domain ?? ""],
  ["mentor", (p) => p.mentor ?? ""],
  ["team", (p) => p.team.map((m) => m.name).join("; ")],
  ["team_emails", (p) => p.team.map((m) => m.email ?? "").join("; ")],
  ["team_roll_numbers", (p) => p.team.map((m) => m.rollNumber ?? "").join("; ")],
  ["links", (p) => p.links.map((l) => `${l.label}: ${l.url}`).join("; ")],
  ["tags", (p) => p.tags.join("; ")],
  ["submitted_by", (p) => p.submitter_name],
  ["submitter_email", (p) => p.submitter_email],
  ["submitted_at", (p) => p.created_at],
]

/** One CSV cell. A leading = + - @ would run as a formula when the file is
 * opened in a spreadsheet, and the text here came from strangers. */
function cell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

export function toCsv(rows: RepoProject[]) {
  const head = CSV_COLUMNS.map(([name]) => name).join(",")
  const body = rows.map((p) =>
    CSV_COLUMNS.map(([, get]) => cell(get(p))).join(",")
  )
  return [head, ...body].join("\r\n")
}
