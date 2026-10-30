"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ROLE_LABEL } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"
import type { Role } from "@/lib/types"
import { cn } from "@/lib/utils"

/** TESTING ONLY. Look at the app as a student, mentor or coordinator without
 * signing in.
 *
 * It exists in development builds only. The preview session never talks to the
 * server: nothing is loaded from it and nothing is saved to it.
 *
 * To remove before production: delete this folder (components/dev), its two
 * uses (app/signin/page.tsx and components/shell/app-frame.tsx), and the
 * lines marked "preview" in lib/store.tsx, lib/types.ts and
 * components/shell/app-frame.tsx. */
export const PREVIEW_ENABLED = process.env.NODE_ENV !== "production"

const ROLES: Role[] = ["student", "mentor", "coordinator"]

export function PreviewSwitcher({ floating }: { floating?: boolean }) {
  const { db, session, signIn } = useProjectsStore()
  const router = useRouter()
  const [role, setRole] = React.useState<Role>(
    session?.preview ? session.activeRole : "student"
  )
  const people = React.useMemo(
    () => db.people.filter((p) => p.roles.includes(role)),
    [db.people, role]
  )
  const [personId, setPersonId] = React.useState<string>("")
  const chosen = people.some((p) => p.id === personId)
    ? personId
    : (people[0]?.id ?? "")

  if (!PREVIEW_ENABLED) return null

  const go = (id: string, r: Role) => {
    signIn(id, r, true)
    router.push("/")
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-secondary bg-primary p-3 shadow-lg",
        floating ? "fixed right-4 bottom-4 z-50 w-72" : "mt-8"
      )}
    >
      <p className="text-caption font-semibold text-tertiary">
        Testing only: preview as
      </p>
      <div className="mt-2 flex gap-1">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              setRole(r)
              const first = db.people.find((p) => p.roles.includes(r))
              if (first && floating) go(first.id, r)
            }}
            className={cn(
              "flex-1 rounded-md border px-2 py-1 text-caption font-medium outline-brand focus-visible:outline-2",
              role === r
                ? "border-brand bg-brand-solid/10 text-brand-secondary"
                : "border-secondary text-muted-foreground hover:bg-muted"
            )}
          >
            {ROLE_LABEL[r].split(" ")[0]}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <select
          aria-label="Person"
          value={chosen}
          onChange={(e) => {
            setPersonId(e.target.value)
            if (floating) go(e.target.value, role)
          }}
          className="min-w-0 flex-1 rounded-md border border-secondary bg-primary px-2 py-1 text-caption text-foreground"
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {!floating && (
          <button
            type="button"
            disabled={!chosen}
            onClick={() => go(chosen, role)}
            className="rounded-md bg-brand-solid px-3 py-1 text-caption font-semibold text-white disabled:opacity-50"
          >
            Open
          </button>
        )}
      </div>
    </div>
  )
}
