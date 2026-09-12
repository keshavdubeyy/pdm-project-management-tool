"use client"

import type { Role, Session } from "@/lib/types"

/** Who this tab is signed in as.
 *
 * Deliberately stored in sessionStorage rather than localStorage, so each tab
 * carries its own identity. Open a second tab, sign in as the mentor, and you
 * can watch a submission move through review without logging anybody out.
 *
 * A brand-new tab starts from the last identity used in this browser, which is
 * remembered separately in localStorage. That keeps the common case to zero
 * clicks without tying the two tabs together.
 */

const SESSION_KEY = "pdm.session"
const LAST_SESSION_KEY = "pdm.lastSession"

export function readSession(): Session | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw) as Session
    const remembered = window.localStorage.getItem(LAST_SESSION_KEY)
    if (remembered) {
      const session = JSON.parse(remembered) as Session
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
      return session
    }
    return null
  } catch {
    return null
  }
}

export function writeSession(session: Session) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    window.localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(session))
  } catch {
    /* private window; the tab keeps working from memory */
  }
}

export function clearSession() {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(SESSION_KEY)
    window.localStorage.removeItem(LAST_SESSION_KEY)
  } catch {
    /* nothing to do */
  }
}

export function signIn(personId: string, activeRole: Role): Session {
  const session: Session = { personId, activeRole, signedInAt: new Date().toISOString() }
  writeSession(session)
  return session
}
