"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/untitled/base/buttons/button"
import { Input } from "@/components/untitled/base/input/input"
import { signInWithPassword } from "@/lib/auth"
import { useProjectsStore } from "@/lib/store"

/** Signing in.
 *
 * An email and password; the role follows from the account. Dr. Saxena holds
 * two roles and switches between them from the account menu. Sessions belong
 * to a tab, so signing in here logs nobody out anywhere else: open a second tab
 * as someone else and watch work move between you. Passwords are checked by Supabase;
 * the coordinator issues them.
 */

/** Opens the person's mail app with the request already written. */
const RESET_MAILTO = `mailto:keshav.dubey@students.iiit.ac.in?subject=${encodeURIComponent(
  "Reset my password"
)}&body=${encodeURIComponent("Keshav, reset my password")}`

export default function SignInPage() {
  const router = useRouter()
  const { db, signIn, ready } = useProjectsStore()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const [busy, setBusy] = React.useState(false)

  if (!ready) return null

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    const result = await signInWithPassword(db.people, email, password)
    if (!result.ok) {
      setError(result.error)
      setBusy(false)
      return
    }
    signIn(result.person.id)
    router.push("/")
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <p className="text-th text-muted-foreground uppercase">
            IIIT Hyderabad
          </p>
          <h1 className="mt-2 flex items-center justify-center gap-3 text-page text-foreground">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-color.svg" alt="PDM" className="h-8 w-auto" />
            Project Space
          </h1>
          <p className="mt-2 text-body text-muted-foreground">
            Sign in to continue with your final project.
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <Input
            label="Email"
            type="email"
            size="md"
            autoComplete="username"
            placeholder="Enter your email"
            value={email}
            onChange={setEmail}
          />
          <Input
            label="Password"
            type="password"
            size="md"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={setPassword}
          />

          {error ? (
            <p role="alert" className="text-meta text-destructive">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            isDisabled={!email || !password}
            isLoading={busy}
          >
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-caption text-muted-foreground">
          Forgot your password?{" "}
          <a
            href={RESET_MAILTO}
            className="font-medium text-brand-secondary underline-offset-2 hover:underline"
          >
            Email Keshav to reset it
          </a>
        </p>
      </div>
    </div>
  )
}
