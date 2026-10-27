import * as React from "react"

import type { Person } from "@/lib/types"
import { createClient } from "@/utils/supabase/client"

/** Signing in, checked by Supabase.
 *
 * The password never touches this app's data: Supabase verifies it, and the app
 * then looks the person up on the roster by email. The caller picks the role
 * from the roles the account holds; Dr. Saxena holds two and is asked which.
 */

export type LoginResult =
  { ok: true; person: Person } | { ok: false; error: string }

export async function signInWithPassword(
  people: Person[],
  email: string,
  password: string
): Promise<LoginResult> {
  const wrong = "That email and password do not match."
  const address = email.trim().toLowerCase()

  let error: { message: string } | null
  let personId: string | undefined
  try {
    const result = await createClient().auth.signInWithPassword({
      email: address,
      password,
    })
    error = result.error
    // The account carries the roster id it was made for, so a person is found
    // even if the roster still holds an older email for them.
    personId = result.data.user?.app_metadata?.personId
  } catch {
    return { ok: false, error: "Could not reach the server. Try again." }
  }
  if (error) {
    // A network failure is not a wrong password; say which it was.
    return {
      ok: false,
      error: /fetch|network/i.test(error.message)
        ? "Could not reach the server. Try again."
        : wrong,
    }
  }

  const person =
    people.find((p) => p.id === personId) ??
    people.find((p) => p.email.toLowerCase() === address)
  if (!person) {
    return { ok: false, error: "This account is not on the programme roster." }
  }
  return { ok: true, person }
}

const LATER_KEY = "pdm.passwordLater"

/** Who, in this tab, chose "I will do it later" for the password step. It
 * lasts until the tab is closed or they sign out, then they are asked again. */
export function passwordLaterFor(): string | null {
  try {
    return window.sessionStorage.getItem(LATER_KEY)
  } catch {
    return null
  }
}

export function rememberPasswordLater(personId: string) {
  try {
    window.sessionStorage.setItem(LATER_KEY, personId)
  } catch {
    /* the box simply comes back on the next page load */
  }
}

export async function signOutOfServer() {
  try {
    window.sessionStorage.removeItem(LATER_KEY)
  } catch {
    /* nothing to clear */
  }
  try {
    await createClient().auth.signOut()
  } catch {
    // The tab's own session is cleared regardless.
  }
}

/** Sets a new password for whoever is signed in, and marks the account as
 * having chosen its own. Until then the password is the one the coordinator
 * issued, and the person is taken to set theirs before anything else. */
export async function changePassword(password: string) {
  const { error } = await createClient().auth.updateUser({
    password,
    data: { password_set: true },
  })
  return error ? error.message : null
}

/** Whether the signed-in person still has the password they were issued.
 * `loading` is true until the session has been read. */
export function usePasswordSetup() {
  const [state, setState] = React.useState({ loading: true, needed: false })

  React.useEffect(() => {
    const sb = createClient()
    const read = (
      user: { user_metadata?: Record<string, unknown> } | null | undefined
    ) =>
      setState({
        loading: false,
        needed: Boolean(user) && user?.user_metadata?.password_set !== true,
      })
    sb.auth.getSession().then(({ data }) => read(data.session?.user))
    const { data } = sb.auth.onAuthStateChange((_event, session) =>
      read(session?.user)
    )
    return () => data.subscription.unsubscribe()
  }, [])

  return state
}
