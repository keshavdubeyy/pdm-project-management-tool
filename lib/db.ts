"use client"

import { buildSeedDatabase, DB_VERSION } from "@/lib/seed"
import type { Database } from "@/lib/types"

/** Persistence.
 *
 * The store lives in localStorage, which is per-browser rather than per-user.
 * That has one consequence worth stating plainly: two people on two machines
 * do not share data. What it does support, and what the workflows actually
 * need to be testable, is two tabs in the same browser signed in as two
 * different people — a student in one, their mentor in the other — watching
 * each other's changes land live.
 *
 * That works because the two halves are stored differently: the data is in
 * localStorage and shared by every tab, while the session identity is in
 * sessionStorage and belongs to one tab only. A write in either tab is
 * broadcast to the other through a BroadcastChannel, with the storage event as
 * a fallback for browsers that block it.
 */

export const DB_KEY = "pdm.db.v1"
export const CHANNEL = "pdm.db"

let channel: BroadcastChannel | null = null

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null
  if (!channel) channel = new BroadcastChannel(CHANNEL)
  return channel
}

export function loadDatabase(): Database {
  if (typeof window === "undefined") return buildSeedDatabase()
  try {
    const raw = window.localStorage.getItem(DB_KEY)
    if (!raw) {
      const fresh = buildSeedDatabase()
      saveDatabase(fresh, { broadcast: false })
      return fresh
    }
    const parsed = JSON.parse(raw) as Database
    if (parsed.version !== DB_VERSION) {
      // The shape changed under an existing browser. Reseeding is the honest
      // response for a prototype — a half-migrated store would be worse than
      // a reset, and nothing here is anyone's only copy.
      const fresh = buildSeedDatabase()
      saveDatabase(fresh, { broadcast: false })
      return fresh
    }
    return parsed
  } catch {
    return buildSeedDatabase()
  }
}

export function saveDatabase(db: Database, opts?: { broadcast?: boolean }) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // Quota exceeded, or storage blocked in a private window. The app keeps
    // working from memory for this tab; it just will not survive a reload.
    return
  }
  if (opts?.broadcast !== false) {
    getChannel()?.postMessage({ type: "db:changed", at: Date.now() })
  }
}

export function resetDatabase(): Database {
  const fresh = buildSeedDatabase()
  saveDatabase(fresh)
  return fresh
}

/** Calls back whenever another tab writes. Returns an unsubscribe function. */
export function subscribeToChanges(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {}

  const bc = getChannel()
  const onMessage = (event: MessageEvent) => {
    if (event.data?.type === "db:changed") onChange()
  }
  bc?.addEventListener("message", onMessage)

  const onStorage = (event: StorageEvent) => {
    if (event.key === DB_KEY) onChange()
  }
  window.addEventListener("storage", onStorage)

  return () => {
    bc?.removeEventListener("message", onMessage)
    window.removeEventListener("storage", onStorage)
  }
}

export function exportDatabase(db: Database): string {
  return JSON.stringify(db, null, 2)
}
