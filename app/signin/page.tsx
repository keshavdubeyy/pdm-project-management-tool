"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, UserGroupIcon } from "@hugeicons/core-free-icons"

import { PersonAvatar } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ROLE_LABEL } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"
import type { Person } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Signing in.
 *
 * There are no passwords here on purpose. The identities are the real roster,
 * and the point of the screen is to let one person move between them quickly
 * while testing — a student in this tab, their mentor in the next. Sessions
 * are per-tab, so signing in here does not sign anyone out anywhere else.
 */
export default function SignInPage() {
  const router = useRouter()
  const { db, signIn, ready } = useProjectsStore()
  const [query, setQuery] = React.useState("")

  const groups = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (p: Person) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.rollNumber ?? "").includes(q)

    const faculty = db.people.filter(
      (p) => (p.roles.includes("mentor") || p.roles.includes("coordinator")) && match(p)
    )
    const students = db.people.filter((p) => p.roles.includes("student") && match(p))
    return { faculty, students }
  }, [db.people, query])

  const enter = (person: Person) => {
    signIn(person.id)
    router.push("/")
  }

  if (!ready) return null

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-4xl flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-color.svg" alt="" className="h-9 w-auto dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-white.svg" alt="" className="hidden h-9 w-auto dark:block" />
      </div>

      <h1 className="text-display text-foreground">Sign in to PDM Project Space</h1>
      <p className="mt-2 max-w-xl text-body text-muted-foreground">
        Pick who you are. This tab remembers your choice on its own, so you can open a second tab,
        sign in as someone else, and watch work move between them.
      </p>

      <div className="relative mt-6">
        <HugeiconsIcon
          icon={Search01Icon}
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={2}
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or roll number…"
          className="pl-9"
          autoFocus
        />
      </div>

      <ScrollArea className="mt-4 max-h-[52vh] rounded-xl border border-border">
        {groups.faculty.length > 0 && (
          <PeopleGroup label="Faculty" people={groups.faculty} db={db} onPick={enter} />
        )}
        {groups.students.length > 0 && (
          <PeopleGroup label="Students" people={groups.students} db={db} onPick={enter} />
        )}
        {groups.faculty.length === 0 && groups.students.length === 0 && (
          <p className="px-4 py-8 text-center text-meta text-muted-foreground">
            Nobody matches “{query}”.
          </p>
        )}
      </ScrollArea>

      <p className="mt-4 text-caption text-muted-foreground">
        A prototype for review. Data lives in this browser only, and the sign-in list stands in for
        institute accounts.
      </p>
    </div>
  )
}

function PeopleGroup({
  label,
  people,
  db,
  onPick,
}: {
  label: string
  people: Person[]
  db: ReturnType<typeof useProjectsStore>["db"]
  onPick: (person: Person) => void
}) {
  return (
    <div>
      <p className="sticky top-0 z-10 border-b border-border bg-muted/60 px-3 py-1.5 text-th text-muted-foreground uppercase backdrop-blur">
        {label}
        <span className="ml-1.5 normal-case">({people.length})</span>
      </p>
      <ul className="divide-y divide-border">
        {people.map((person) => {
          const project = db.projects.find((p) => p.teamMemberIds.includes(person.id))
          const team = project ? db.teams.find((t) => t.id === project.teamId) : undefined
          const mentoring = db.projects.filter((p) => p.mentorIds.includes(person.id)).length

          return (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => onPick(person)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                  "hover:bg-muted/70 focus-visible:bg-muted/70"
                )}
              >
                <PersonAvatar person={person} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-meta font-medium text-foreground">
                    {person.name}
                  </span>
                  <span className="block truncate text-caption text-muted-foreground">
                    {person.affiliation ?? person.rollNumber ?? person.email}
                    {team && ` · ${team.name}`}
                    {mentoring > 0 && ` · ${mentoring} team${mentoring === 1 ? "" : "s"}`}
                  </span>
                </span>
                <span className="flex shrink-0 gap-1">
                  {person.roles.map((role) => (
                    <Badge key={role} variant="outline" className="text-[10px]">
                      {role === "coordinator" ? "Coordinator" : ROLE_LABEL[role].replace("Faculty ", "")}
                    </Badge>
                  ))}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
