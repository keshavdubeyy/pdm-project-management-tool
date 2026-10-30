"use client"

import {
  hasLegacyDeliverables,
  migrateTicks,
  milestoneTemplateFor,
} from "@/lib/milestone-template"
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
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined")
    return null
  if (!channel) channel = new BroadcastChannel(CHANNEL)
  return channel
}

/** Emails are roster data, not something anyone types in. The seed's address
 * for a person wins over a copy saved earlier, in this browser or on the
 * server, so a corrected email reaches everyone without losing the notes and
 * progress already entered. Returns the same object when nothing differs. */
export function withSeedEmails(db: Database): Database {
  const seed = new Map(buildSeedDatabase().people.map((p) => [p.id, p.email]))
  let changed = false
  const people = db.people.map((person) => {
    const email = seed.get(person.id)
    if (!email || email === person.email) return person
    changed = true
    return { ...person, email }
  })
  return changed ? { ...db, people } : db
}

/** The programme calendar is data a coordinator can edit, but the sheet is the
 * source of truth for the weeks, the phases and the activities beneath them.
 * A checkpoint saved by an earlier version is brought in line with it, matched
 * by id, so the statuses, submissions and reviews that point at it are
 * untouched.
 *
 * A checkpoint that still lists the earlier deliverable names is moved onto
 * the sheet's sub-activities, and every team's ticks under the old names are
 * rewritten to match, so nobody loses progress. Once moved, deliverables are
 * left alone so a coordinator's later edits stick. Returns the same object
 * when nothing differs, so it is safe to run on every load. */
export function withSeedTemplate(db: Database): Database {
  const wanted = new Map(
    db.batches
      .flatMap((b) => milestoneTemplateFor(b.id))
      .map((item) => [item.id, item])
  )
  let changed = false
  const milestoneTemplate = db.milestoneTemplate.map((item) => {
    const seed = wanted.get(item.id)
    if (!seed) return item
    const legacy = hasLegacyDeliverables(item.deliverables)
    const same =
      !legacy &&
      item.dueWeek === seed.dueWeek &&
      item.phase === seed.phase &&
      item.semester === seed.semester &&
      Boolean(item.isGate) === Boolean(seed.isGate) &&
      JSON.stringify(item.activities) === JSON.stringify(seed.activities)
    if (same) return item
    changed = true
    return {
      ...item,
      dueWeek: seed.dueWeek,
      phase: seed.phase,
      semester: seed.semester,
      isGate: seed.isGate,
      activities: seed.activities,
      deliverables: legacy ? seed.deliverables : item.deliverables,
    }
  })

  const seeded = new Set(wanted.keys())
  let ticksChanged = false
  const milestones = db.milestones.map((m) => {
    if (!seeded.has(m.templateItemId)) return m
    const next = migrateTicks(m.completedDeliverables)
    if (
      next.length === m.completedDeliverables.length &&
      next.every((t, i) => t === m.completedDeliverables[i])
    )
      return m
    ticksChanged = true
    return { ...m, completedDeliverables: next }
  })

  if (!changed && !ticksChanged) return db
  return {
    ...db,
    milestoneTemplate: changed
      ? [...milestoneTemplate].sort((a, b) => a.dueWeek - b.dueWeek)
      : db.milestoneTemplate,
    milestones: ticksChanged ? milestones : db.milestones,
  }
}

function syncSeedData(db: Database): Database {
  const next = withSeedTemplate(withSeedEmails(db))
  if (next !== db) saveDatabase(next, { broadcast: false })
  return next
}

/** A one-time clean-up of the comments and notifications that testing left in a
 * browser. The first time this version loads in a browser it empties both lists,
 * and the leftover test entries of the activity log kept before the server had
 * one, then notes that it has done so and never does it again. Both lists are
 * the server's now, so this only removes what that browser was holding.
 *
 * Remove this, and PURGED_KEY, once every browser in use has loaded it. */
const PURGED_KEY = "pdm.purged.comments-notifications.v1"

function purgeTestData(db: Database): Database {
  try {
    if (window.localStorage.getItem(PURGED_KEY)) return db
    window.localStorage.setItem(PURGED_KEY, new Date().toISOString())
    window.localStorage.removeItem("pdm.activity.v1")
  } catch {
    return db
  }
  if (db.comments.length === 0 && db.notifications.length === 0) return db
  const cleared = { ...db, comments: [], notifications: [] }
  // Saved now: nothing else will write it back out before the next change.
  saveDatabase(cleared, { broadcast: false })
  return cleared
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
    // Added after the first release; a store saved earlier has no such list.
    return syncSeedData(
      purgeTestData({
        ...parsed,
        weeklyProgress: parsed.weeklyProgress ?? [],
        comments: parsed.comments ?? [],
      })
    )
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
