"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/untitled/base/buttons/button"
import { Input } from "@/components/untitled/base/input/input"

/** Where a student collects the temporary password for their first sign-in.
 *
 * They give their university ID; the server makes a password and shows it here
 * once. It is not emailed and cannot be shown again, so the page says so. */

type Issued = { name: string; email: string; password: string }

export default function GetPasswordPage() {
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [issued, setIssued] = React.useState<Issued | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [alreadySet, setAlreadySet] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const response = await fetch("/api/temp-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const body = await response.json()
      if (body.state === "already-set") {
        setAlreadySet(true)
      } else if (!response.ok) {
        setError(body.error ?? "Something went wrong. Try again.")
      } else {
        setIssued(body as Issued)
      }
    } catch {
      setError("Could not reach the server. Try again.")
    }
    setBusy(false)
  }

  const copy = async () => {
    if (!issued) return
    try {
      await navigator.clipboard.writeText(issued.password)
      setCopied(true)
    } catch {
      /* the password is on screen to copy by hand */
    }
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
            ProjectGarage
          </h1>
          <p className="mt-2 text-body text-muted-foreground">
            {alreadySet
              ? "You have already set your password."
              : issued
              ? "Your temporary password is ready."
              : "Enter your university email to get a temporary password for your first sign-in."}
          </p>
        </div>

        {alreadySet ? (
          <div className="mt-8 space-y-5">
            <p className="text-center text-body text-muted-foreground">
              There is nothing to collect. Sign in directly with the email and
              password you chose.
            </p>
            <Link href="/signin" className="block">
              <Button size="lg" className="w-full">
                Go to sign in
              </Button>
            </Link>
          </div>
        ) : issued ? (
          <div className="mt-8 space-y-5">
            <div className="rounded-lg border border-secondary p-4">
              <p className="text-meta text-muted-foreground">Email</p>
              <p className="break-all text-body text-foreground">
                {issued.email}
              </p>
              <p className="mt-4 text-meta text-muted-foreground">
                Temporary password
              </p>
              <p className="font-mono text-page break-all text-foreground select-all">
                {issued.password}
              </p>
            </div>

            <p className="text-meta text-muted-foreground">
              This is the only password you need to sign in. It is shown just
              once and is not emailed to you, so copy it now. After you sign in
              you can choose your own.
            </p>

            <Button size="lg" color="secondary" className="w-full" onPress={copy}>
              {copied ? "Copied" : "Copy password"}
            </Button>
            <Link href="/signin" className="block">
              <Button size="lg" className="w-full">
                Go to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <Input
              label="University email"
              type="email"
              size="md"
              autoComplete="email"
              placeholder="name.surname@students.iiit.ac.in"
              value={email}
              onChange={setEmail}
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
              isDisabled={!email.trim()}
              isLoading={busy}
            >
              Generate my temporary password
            </Button>

            <p className="text-center text-caption text-muted-foreground">
              Already have a password?{" "}
              <Link
                href="/signin"
                className="font-medium text-brand-secondary underline-offset-2 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
