import { developerAdmin } from "@/lib/developer-auth"

/** How much room the app is using, for the developer's /developer/storage page.
 * Sizes are not readable through the API, so they come from the
 * dev_storage_stats() function in supabase/schema.sql. */

export const dynamic = "force-dynamic"

const MB = 1024 * 1024

type Row = { data: Record<string, unknown> }

export type StorageTeam = {
  projectId: string
  title: string
  files: number
  bytes: number
  links: number
}

export type StorageReport = {
  storageLimitBytes: number
  dbLimitBytes: number
  dbBytes: number
  buckets: { bucket: string; bytes: number; files: number }[]
  largest: { bucket: string; name: string; bytes: number }[]
  tables: { table: string; bytes: number; rows: number }[]
  /** Document links added by teams. They are addresses, so they take no space. */
  links: number
  teams: StorageTeam[]
  /** Set when the sizes could not be read, e.g. the schema is not applied. */
  error: string | null
}

const num = (name: string, fallback: number) => {
  const n = Number(process.env[name])
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export async function GET(request: Request) {
  const auth = await developerAdmin(request)
  if ("error" in auth) return auth.error
  const { admin } = auth

  const read = async (table: string) => {
    const { data } = await admin.from(table).select("data")
    return ((data ?? []) as Row[]).map((r) => r.data)
  }
  const [projects, artefacts] = await Promise.all([
    read("projects"),
    read("artefacts"),
  ])

  const teams = new Map<string, StorageTeam>(
    projects.map((p) => [
      String(p.id),
      {
        projectId: String(p.id),
        title: String(p.title ?? p.id),
        files: 0,
        bytes: 0,
        links: 0,
      },
    ])
  )
  for (const a of artefacts) {
    const team = teams.get(String(a.projectId))
    if (team) team.links++
  }

  const { data, error } = await admin.rpc("dev_storage_stats")
  const s = (data ?? {}) as {
    dbBytes?: number
    buckets?: StorageReport["buckets"]
    byProject?: { projectId: string; bytes: number; files: number }[]
    largest?: StorageReport["largest"]
    tables?: StorageReport["tables"]
  }
  for (const p of s.byProject ?? []) {
    const team = teams.get(p.projectId)
    if (team) {
      team.bytes = p.bytes
      team.files = p.files
    }
  }

  const report: StorageReport = {
    storageLimitBytes: num("STORAGE_LIMIT_MB", 1024) * MB,
    dbLimitBytes: num("DB_LIMIT_MB", 500) * MB,
    dbBytes: s.dbBytes ?? 0,
    buckets: s.buckets ?? [],
    largest: s.largest ?? [],
    tables: (s.tables ?? []).sort((a, b) => b.bytes - a.bytes),
    links: artefacts.length,
    teams: [...teams.values()].sort((a, b) => b.bytes - a.bytes),
    error: error?.message ?? null,
  }
  return Response.json(report)
}
