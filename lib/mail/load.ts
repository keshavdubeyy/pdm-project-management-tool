import { createClient } from "@supabase/supabase-js"

import { buildSeedDatabase, withDemoActivity } from "@/lib/seed"
import type { Database } from "@/lib/types"

/** The database as the server sees it, for building mails.
 *
 * The roster, teams and calendar are seeded in the app, so they are taken from
 * the seed. What people did (comments, notifications, weekly reports...) lives
 * in Supabase and is read with the service-role key. The roster, projects and
 * checkpoints fall back to the seed while the server holds none of them. */

const TABLES = {
  people: "people",
  projects: "projects",
  notes: "notes",
  actionItems: "action_items",
  artefacts: "artefacts",
  weeklyProgress: "weekly_progress",
  milestones: "milestones",
  submissions: "submissions",
  reviews: "reviews",
  comments: "comments",
  notifications: "notifications",
} as const

const FALL_BACK_TO_SEED = new Set(["people", "projects", "milestones"])

export function demoDatabase(): Database {
  return withDemoActivity(buildSeedDatabase())
}

export async function loadServerDatabase(): Promise<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key)
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed.")
  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const db: Database = buildSeedDatabase()
  const next = db as unknown as Record<string, unknown[]>
  for (const [field, table] of Object.entries(TABLES)) {
    const { data, error } = await admin.from(table).select("data")
    if (error) throw new Error(`Could not read ${table}: ${error.message}`)
    const rows = (data ?? []).map((r) => r.data)
    next[field] =
      FALL_BACK_TO_SEED.has(field) && rows.length === 0 ? next[field] : rows
  }
  return db
}
