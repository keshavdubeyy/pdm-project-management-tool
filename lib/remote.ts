"use client"

import type { Database } from "@/lib/types"
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

/** The roster is the only thing a browser seeds the server with, and only
 * while the server has none of it. Notes, action items and progress links are
 * the server's alone: an empty table there means they were deleted, and a
 * browser's old copy must never bring them back. */
const MIGRATED: SharedKey[] = ["people", "projects"]

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
