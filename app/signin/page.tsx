"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { PersonCombobox } from "@/components/person-combobox"
import { Button } from "@/components/ui/button"
import { ROLE_LABEL } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"
import type { Person } from "@/lib/types"

/** Signing in.
 *
 * One field you type three letters into, rather than forty-five names to
 * scroll. There are no passwords on purpose: the identities are the real
 * roster, and the point is to move between them quickly while testing.
 * Sessions belong to a tab, so signing in here logs nobody out anywhere else.
 */
export default function SignInPage() {
  const router = useRouter()
  const { db, signIn, ready } = useProjectsStore()
  const [personId, setPersonId] = React.useState<string | null>(null)

  const people = React.useMemo(() => {
    const rank = (p: Person) =>
      p.roles.includes("coordinator") ? 0 : p.roles.includes("mentor") ? 1 : 2
    return [...db.people].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
  }, [db.people])

  const describe = React.useCallback(
    (person: Person) => {
      if (person.roles.includes("mentor") || person.roles.includes("coordinator")) {
        const load = db.projects.filter((p) => p.mentorIds.includes(person.id)).length
        return `${person.roles.map((r) => ROLE_LABEL[r]).join(" · ")}${load ? ` · ${load} teams` : ""}`
      }
      const project = db.projects.find((p) => p.teamMemberIds.includes(person.id))
      const team = project ? db.teams.find((t) => t.id === project.teamId) : undefined
      return [person.rollNumber, team?.name].filter(Boolean).join(" · ")
    },
    [db.projects, db.teams]
  )

  const enter = () => {
    if (!personId) return
    signIn(personId)
    router.push("/")
  }

  if (!ready) return null

  const suggestions = [
    people.find((p) => p.roles.includes("coordinator")),
    people.find((p) => p.roles.includes("mentor") && !p.roles.includes("coordinator")),
    people.find((p) => p.roles.includes("student")),
  ].filter(Boolean) as Person[]

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto grid min-h-svh w-full max-w-5xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="text-th text-muted-foreground uppercase">IIIT Hyderabad</p>
          <h1 className="font-display mt-3 text-hero text-foreground">
            PDM
            <br />
            Project
            <br />
            Space
          </h1>
          <p className="mt-6 max-w-sm text-body text-muted-foreground">
            Twenty-two teams, four mentoring lines, twelve checkpoints across twenty-eight weeks.
          </p>
        </div>

        <div className="rounded-sm border border-border bg-card p-6">
          <h2 className="font-display text-title">Who are you?</h2>
          <p className="mt-1.5 text-meta text-muted-foreground">
            Type a few letters. This tab remembers your choice on its own, so you can open a second
            tab as someone else and watch work move between you.
          </p>

          <div className="mt-5 space-y-3">
            <PersonCombobox
              people={people}
              value={personId}
              onChange={setPersonId}
              placeholder="Name or roll number…"
              emptyLabel="Pick a person"
              describe={describe}
              className="h-11 text-body"
            />

            <Button className="h-11 w-full" disabled={!personId} onClick={enter}>
              Continue
            </Button>
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <p className="text-th text-muted-foreground uppercase">Or start as</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {suggestions.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => {
                    signIn(person.id)
                    router.push("/")
                  }}
                  className="rounded-sm border border-border px-2.5 py-1.5 text-meta transition-colors hover:bg-muted"
                >
                  <span className="font-medium">{person.name}</span>
                  <span className="ml-1.5 text-caption text-muted-foreground">
                    {person.roles.includes("coordinator")
                      ? "coordinator"
                      : person.roles.includes("mentor")
                        ? "mentor"
                        : "student"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 text-caption text-muted-foreground">
            A prototype for review. Data stays in this browser, and this list stands in for
            institute accounts.
          </p>
        </div>
      </div>
    </div>
  )
}
