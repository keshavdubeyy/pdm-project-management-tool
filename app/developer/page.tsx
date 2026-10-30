"use client"

import * as React from "react"

import { EmptyState, MetricTile, PageHeader } from "@/components/common"
import { HealthPanel } from "@/app/developer/health-panel"
import { Badge } from "@/components/untitled/base/badges/badges"
import type { Health } from "@/app/api/developer/health/route"
import type {
  DeveloperPerson,
  Funnel,
  FunnelRole,
} from "@/app/api/developer/route"
import { STALE_AFTER_DAYS } from "@/lib/funnel"
import { addDays, todayIso, timeAgo } from "@/lib/dates"
import { useProjectsStore } from "@/lib/store"
import { createClient } from "@/utils/supabase/client"

type Load =
  | { state: "loading" }
  | { state: "error"; message: string }
  | {
      state: "ready"
      people: DeveloperPerson[]
      funnel: Record<FunnelRole, Funnel>
    }

type Filter =
  | "all"
  | "assigned"
  | "not-assigned"
  | "signed-in"
  | "waiting"
  | "temporary"

/** The developer's view of who is actually using the app. The server decides
 * who may see it; this page only shows what it is given. */
export default function DeveloperPage() {
  const { actor } = useProjectsStore()
  const [load, setLoad] = React.useState<Load>({ state: "loading" })
  const [filter, setFilter] = React.useState<Filter>("all")
  const [health, setHealth] = React.useState<Health | string | null>(null)
  const [role, setRole] = React.useState<FunnelRole | "all">("all")

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await createClient().auth.getSession()
        const headers = {
          authorization: `Bearer ${data.session?.access_token ?? ""}`,
        }
        // The health numbers are slower and can fail on their own; the funnel
        // does not wait for them.
        fetch("/api/developer/health", { headers, cache: "no-store" })
          .then(async (r) => {
            const body = await r.json()
            if (!cancelled) setHealth(r.ok ? body : (body.error ?? "Failed."))
          })
          .catch(() => {
            if (!cancelled) setHealth("Could not reach the server.")
          })
        const res = await fetch("/api/developer", {
          headers,
          cache: "no-store",
        })
        const body = await res.json()
        if (cancelled) return
        if (!res.ok) setLoad({ state: "error", message: body.error ?? "Failed." })
        else setLoad({
            state: "ready",
            people: body.people,
            funnel: body.funnel,
          })
      } catch {
        if (!cancelled)
          setLoad({ state: "error", message: "Could not reach the server." })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!actor) return null

  if (load.state === "loading")
    return <p className="text-sm text-muted-foreground">Loading…</p>
  if (load.state === "error")
    return <EmptyState title="Developer dashboard" body={load.message} />

  const today = todayIso()
  const weekAgo = addDays(today, -6)
  const monthAgo = addDays(today, -29)
  const inRange = (p: DeveloperPerson, from: string) =>
    p.activityDates.filter((d) => d >= from).length

  const rows = load.people
    .map((p) => ({
      ...p,
      week: inRange(p, weekAgo),
      month: inRange(p, monthAgo),
      total: p.notes + p.actions + p.links,
    }))
    .filter((p) => role === "all" || p.roles.includes(role))
    .filter((p) =>
      filter === "all"
        ? true
        : filter === "assigned"
          ? p.assignedAt
          : filter === "not-assigned"
            ? !p.assignedAt
            : filter === "signed-in"
              ? p.lastSignInAt
              : filter === "waiting"
                ? p.assignedAt && !p.lastSignInAt
                : p.lastSignInAt && !p.passwordSet
    )
    .sort(
      (a, b) =>
        b.month - a.month ||
        b.total - a.total ||
        a.name.localeCompare(b.name)
    )

  const all = load.people
  const students = all.filter((p) => p.roles.includes("student"))
  const assigned = students.filter((p) => p.assignedAt).length
  const signedIn = students.filter((p) => p.lastSignInAt).length
  const ownPassword = students.filter((p) => p.passwordSet).length
  const activeThisWeek = all.filter((p) => inRange(p, weekAgo) > 0).length

  return (
    <>
      <PageHeader
        title="Developer dashboard"
        description="Who has signed in, who has not, and who is adding meeting notes and progress."
      />

      <FunnelPanel funnel={load.funnel} />

      {health === null ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : typeof health === "string" ? (
        <p className="text-sm text-error-primary">{health}</p>
      ) : (
        <HealthPanel health={health} />
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <MetricTile
          label="Assigned"
          value={`${assigned} / ${students.length}`}
          hint="Students who collected a temporary password"
          tone={assigned < students.length ? "warn" : "good"}
        />
        <MetricTile
          label="Signed in"
          value={`${signedIn} / ${students.length}`}
          hint="Students who have logged in at least once"
        />
        <MetricTile
          label="Own password"
          value={`${ownPassword} / ${students.length}`}
          hint="Students who changed the temporary password"
        />
        <MetricTile
          label="Active this week"
          value={String(activeThisWeek)}
          hint="Added a note, action or link"
        />
        <MetricTile
          label="Meeting notes"
          value={String(all.reduce((n, p) => n + p.notes, 0))}
          hint={`${students.length} students on the roster`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All roles"],
            ["student", "Students"],
            ["mentor", "Mentors"],
            ["coordinator", "Coordinator"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setRole(key)}
            className={`rounded-md border px-3 py-1 text-sm ${
              role === key
                ? "border-foreground font-semibold"
                : "border-border text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Everyone"],
            ["assigned", "Assigned"],
            ["not-assigned", "Not assigned"],
            ["signed-in", "Signed in"],
            ["waiting", "Assigned, not signed in"],
            ["temporary", "Signed in, still temporary"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-md border px-3 py-1 text-sm ${
              filter === key
                ? "border-foreground font-semibold"
                : "border-border text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-muted text-caption text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2">Person</th>
              <th className="px-3 py-2">Assigned</th>
              <th className="px-3 py-2">Signed in</th>
              <th className="px-3 py-2">Password</th>
              <th className="px-3 py-2 text-right">Notes</th>
              <th className="px-3 py-2 text-right">Actions</th>
              <th className="px-3 py-2 text-right">Links</th>
              <th className="px-3 py-2 text-right">7 days</th>
              <th className="px-3 py-2 text-right">30 days</th>
              <th className="px-3 py-2">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.personId} className="border-t border-border">
                <td className="px-3 py-2">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-caption text-muted-foreground">
                    {p.roles.join(", ")} · {p.email}
                  </p>
                </td>
                <td className="px-3 py-2">
                  {p.assignedAt ? (
                    <Badge color="success" size="sm">
                      {timeAgo(p.assignedAt)}
                    </Badge>
                  ) : (
                    <Badge color={p.hasAccount ? "warning" : "gray"} size="sm">
                      {p.hasAccount ? "Not assigned" : "No account"}
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2">
                  {p.lastSignInAt ? (
                    <Badge color="success" size="sm">
                      {timeAgo(p.lastSignInAt)}
                    </Badge>
                  ) : (
                    <Badge color={p.hasAccount ? "warning" : "gray"} size="sm">
                      {p.hasAccount ? "Not yet" : "No account"}
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2">
                  {!p.hasAccount ? (
                    <Badge color="gray" size="sm">
                      —
                    </Badge>
                  ) : p.passwordSet ? (
                    <Badge color="success" size="sm">
                      Own password
                    </Badge>
                  ) : (
                    <Badge color="warning" size="sm">
                      Temporary
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{p.notes}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.actions}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.links}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.week}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.month}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {p.lastActivityAt ? timeAgo(p.lastActivityAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

const ROLE_LABEL: Record<FunnelRole, string> = {
  student: "Students",
  mentor: "Mentors",
  coordinator: "Coordinator",
}

/** The password funnel for each role, then the people who need chasing. */
function FunnelPanel({ funnel }: { funnel: Record<FunnelRole, Funnel> }) {
  const roles = Object.keys(ROLE_LABEL) as FunnelRole[]
  return (
    <section className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-3">
        {roles.map((r) => {
          const f = funnel[r]
          const steps: [string, number][] = [
            ["Password issued", f.assigned],
            ["Signed in", f.signedIn],
            ["Own password", f.ownPassword],
          ]
          return (
            <div key={r} className="rounded-xl border border-border p-4">
              <p className="text-sm font-semibold">
                {ROLE_LABEL[r]}{" "}
                <span className="font-normal text-muted-foreground">
                  · {f.total}
                </span>
              </p>
              <div className="mt-3 space-y-2">
                {steps.map(([label, n]) => (
                  <div key={label}>
                    <div className="flex justify-between text-caption">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="tabular-nums">
                        {n} / {f.total}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-foreground"
                        style={{
                          width: `${f.total ? (n / f.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-caption">
                <div>
                  <dt className="text-muted-foreground">Still temporary</dt>
                  <dd className="tabular-nums">
                    {f.stillTemporary}
                    {f.staleTemporary > 0 && (
                      <span className="text-warning-primary">
                        {" "}
                        ({f.staleTemporary} over {STALE_AFTER_DAYS} days)
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Stuck, never signed in</dt>
                  <dd className="tabular-nums">{f.stuck}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Not started</dt>
                  <dd className="tabular-nums">{f.notStarted}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Have an account</dt>
                  <dd className="tabular-nums">{f.hasAccount}</dd>
                </div>
              </dl>
            </div>
          )
        })}
      </div>
    </section>
  )
}
