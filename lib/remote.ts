"use client"

import type { ActivityEvent, Database } from "@/lib/types"
import { createClient } from "@/utils/supabase/client"

/** The part of the database that lives on the server.
 *
 * Notes, action items and progress links are what a student and a mentor both
 * see and change, so they are rows in Supabase: written through on every
 * change, and pushed back to every open browser as it happens. Everything else
 * (the roster, teams, calendar) is still local, seeded identically everywhere.
 *
 * Rows are stored one per item, so two people saving different items never
 * overwrite each other. If Supabase is unreachable the app carries on from the
 * local copy.
 */

export const SHARED_TABLES = {
  people: "people",
  projects: "projects",
  notes: "notes",
  actionItems: "action_items",
  artefacts: "artefacts",
  weeklyProgress: "weekly_progress",
  // What a team and its mentor both act on: where a checkpoint stands, what
  // was handed in, what was decided, and what was said about it.
  milestones: "milestones",
  submissions: "submissions",
  reviews: "reviews",
  comments: "comments",
  // Notices for people. One person's action has to reach another person's
  // screen, so these cannot live in one browser.
  notifications: "notifications",
} as const

export type SharedKey = keyof typeof SHARED_TABLES
export type SharedData = Pick<Database, SharedKey>
/** What the server returned; a table it could not read is simply absent. */
export type SharedPartial = Partial<SharedData>

type Item = { id: string; projectId?: string }

const KEYS = Object.keys(SHARED_TABLES) as SharedKey[]
const MIGRATED_KEY = "pdm.remote.migrated.v2"

let client: ReturnType<typeof createClient> | null = null

function supabase() {
  if (client) return client
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return null
  client = createClient()
  return client
}

const toRow = (item: Item) => ({
  id: item.id,
  project_id: item.projectId ?? null,
  data: item,
  updated_at: new Date().toISOString(),
})

/** Whether this browser holds a signed-in Supabase session. With no server
 * configured there is nothing to check, so that counts as fine. */
export async function hasServerSession(): Promise<boolean> {
  const sb = supabase()
  if (!sb) return true
  try {
    const { data } = await sb.auth.getSession()
    return Boolean(data.session)
  } catch {
    return false
  }
}

export const PROGRESS_BUCKET = "progress-files"
/** Matches the bucket's own limit in supabase/schema.sql. */
export const MAX_PROGRESS_FILE_BYTES = 25 * 1024 * 1024

/** Puts one file in the private bucket and returns where it landed, or the
 * reason it could not. The path is unique per upload, so two files with the
 * same name never replace each other. */
export async function uploadProgressFile(
  projectId: string,
  week: number,
  file: File
): Promise<{ ok: true; path: string } | { ok: false; reason: string }> {
  const sb = supabase()
  if (!sb || !(await hasServerSession()))
    return { ok: false, reason: "File storage is not available right now." }
  const safe = file.name.replace(/[^\w.\- ]+/g, "_")
  const path = `${projectId}/week-${week}/${Date.now()}-${safe}`
  const { error } = await sb.storage
    .from(PROGRESS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined })
  if (error) return { ok: false, reason: error.message }
  return { ok: true, path }
}

/** A short-lived link to a stored file. The bucket is private, so a file can
 * only be opened through one of these. */
export async function progressFileUrl(path: string): Promise<string | null> {
  const sb = supabase()
  if (!sb) return null
  const { data, error } = await sb.storage
    .from(PROGRESS_BUCKET)
    .createSignedUrl(path, 300)
  return error ? null : data.signedUrl
}

/** Everything on the server, or null when it cannot be reached or nobody is
 * signed in. The rules show a signed-out request an empty table, not an error,
 * and an empty table must not be mistaken for "the server has nothing". */
export async function fetchShared(): Promise<SharedPartial | null> {
  const sb = supabase()
  if (!sb) return null
  if (!(await hasServerSession())) return null
  const out: Record<string, unknown[]> = {}
  try {
    for (const key of KEYS) {
      const { data, error } = await sb.from(SHARED_TABLES[key]).select("data")
      if (error) {
        // One table failing (say, not created yet) must not hide the others.
        console.warn(`Could not load ${SHARED_TABLES[key]}`, error)
        continue
      }
      out[key] = (data ?? []).map((row) => row.data)
    }
  } catch (error) {
    console.warn("Could not load shared data", error)
    return null
  }
  return out as SharedPartial
}

/** Send what changed between two states, and nothing else. */
export function pushDiff(prev: Database, next: Database) {
  const sb = supabase()
  if (!sb) return
  for (const key of KEYS) {
    const before = new Map((prev[key] as Item[]).map((i) => [i.id, i]))
    const after = next[key] as Item[]
    const changed = after.filter((item) => {
      const old = before.get(item.id)
      return !old || JSON.stringify(old) !== JSON.stringify(item)
    })
    const kept = new Set(after.map((i) => i.id))
    const removed = [...before.keys()].filter((id) => !kept.has(id))
    const table = SHARED_TABLES[key]

    if (changed.length > 0) {
      sb.from(table)
        .upsert(changed.map(toRow))
        .then(({ error }) => {
          if (error) console.warn(`Could not save to ${table}`, error)
        })
    }
    if (removed.length > 0) {
      sb.from(table)
        .delete()
        .in("id", removed)
        .then(({ error }) => {
          if (error) console.warn(`Could not delete from ${table}`, error)
        })
    }
  }
}

/** What a browser may seed the server with, and only while the server has none
 * of it: the roster, and the calendar's checkpoints, which every browser builds
 * the same way from the programme sheet. Everything people make after that is
 * the server's alone: an empty table there means something was deleted, and a
 * browser's old copy must never bring it back. That includes what was handed in,
 * what was decided and what was said (submissions, reviews, comments), and
 * everyone's notifications. */
const MIGRATED: SharedKey[] = ["people", "projects", "milestones"]

export function migrateLocal(
  local: SharedData,
  remote: SharedPartial
): SharedPartial {
  const out = { ...remote }
  const sb = supabase()
  if (!sb) return out
  let done: string[] = []
  try {
    done = JSON.parse(window.localStorage.getItem(MIGRATED_KEY) ?? "[]")
  } catch {}
  for (const key of MIGRATED) {
    const held = remote[key]
    if (!held || done.includes(key) || held.length > 0) continue
    done.push(key)
    const items = local[key] as Item[]
    if (items.length === 0) continue
    ;(out[key] as Item[]) = items
    sb.from(SHARED_TABLES[key])
      .upsert(items.map(toRow))
      .then(({ error }) => {
        if (error) console.warn(`Could not move ${key} to the server`, error)
      })
  }
  try {
    window.localStorage.setItem(MIGRATED_KEY, JSON.stringify(done))
  } catch {}
  return out
}

export type RemoteChange =
  | { key: SharedKey; type: "upsert"; item: Item }
  | { key: SharedKey; type: "remove"; id: string }

/** Calls back as other people save. Returns an unsubscribe function. */
export function subscribeShared(onChange: (change: RemoteChange) => void) {
  const sb = supabase()
  if (!sb) return () => {}
  const channel = sb.channel("pdm-shared")
  for (const key of KEYS) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: SHARED_TABLES[key] },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string }).id
          if (id) onChange({ key, type: "remove", id })
        } else {
          const row = payload.new as { data?: Item }
          if (row.data) onChange({ key, type: "upsert", item: row.data })
        }
      }
    )
  }
  channel.subscribe()
  return () => {
    sb.removeChannel(channel)
  }
}

export function applyChange(db: Database, change: RemoteChange): Database {
  const list = db[change.key] as Item[]
  const next =
    change.type === "remove"
      ? list.filter((i) => i.id !== change.id)
      : list.some((i) => i.id === change.item.id)
        ? list.map((i) => (i.id === change.item.id ? change.item : i))
        : [change.item, ...list]
  return { ...db, [change.key]: next }
}

const AVATAR_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
}

/** Put a profile photo in storage and return the address it can be shown from. */
export async function uploadAvatar(personId: string, file: File) {
  const sb = supabase()
  if (!sb) throw new Error("Photos need the server, which is not connected.")
  const path = `${personId}/${Date.now()}.${AVATAR_EXT[file.type] ?? "png"}`
  const { error } = await sb.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" })
  if (error) throw new Error("The photo could not be uploaded. Try again.")
  return sb.storage.from("avatars").getPublicUrl(path).data.publicUrl
}

/* -------------------------------------------------------- activity log */

const LOG_TABLE = "activity_log"
const LOCAL_LOG_KEY = "pdm.activity.v1"
/** Only used when there is no server: a browser's own copy, so the page still
 * works in development. It is not tamper-proof and not shared. */
const LOCAL_LOG_LIMIT = 5000

function readLocalLog(): ActivityEvent[] {
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_LOG_KEY) ?? "[]")
  } catch {
    return []
  }
}

/** Writes entries to the log. Insert only: a row that already exists is left
 * as it is, so nothing here can change an entry, and nothing deletes one. */
export function appendActivity(events: ActivityEvent[]) {
  if (events.length === 0) return
  const sb = supabase()
  if (!sb) {
    try {
      const kept = [...events, ...readLocalLog()].slice(0, LOCAL_LOG_LIMIT)
      window.localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(kept))
    } catch {}
    return
  }
  sb.from(LOG_TABLE)
    .upsert(
      events.map((e) => ({
        id: e.id,
        project_id: e.projectId,
        data: e,
      })),
      { onConflict: "id", ignoreDuplicates: true }
    )
    .then(({ error }) => {
      if (error) console.warn("Could not write to the activity log", error)
    })
}

/** One team's log, newest first, a page at a time. */
export async function fetchActivity(
  projectId: string,
  opts: { before?: string; limit?: number } = {}
): Promise<{ events: ActivityEvent[]; failed: boolean }> {
  const limit = opts.limit ?? 50
  const sb = supabase()
  if (!sb) {
    const mine = readLocalLog()
      .filter((e) => e.projectId === projectId)
      .filter((e) => !opts.before || e.at < opts.before)
      .sort((a, b) => b.at.localeCompare(a.at))
    return { events: mine.slice(0, limit), failed: false }
  }
  if (!(await hasServerSession())) return { events: [], failed: true }
  let query = sb
    .from(LOG_TABLE)
    .select("data")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (opts.before) query = query.lt("data->>at", opts.before)
  const { data, error } = await query
  if (error) {
    console.warn("Could not read the activity log", error)
    return { events: [], failed: true }
  }
  return {
    events: (data ?? []).map((row) => row.data as ActivityEvent),
    failed: false,
  }
}
