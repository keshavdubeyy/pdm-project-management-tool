"use client"

import * as React from "react"

import { EmptyState, MetricTile, PageHeader } from "@/components/common"
import { Badge } from "@/components/untitled/base/badges/badges"
import type { MailReport } from "@/app/api/developer/mail/route"
import { timeAgo } from "@/lib/dates"
import { useProjectsStore } from "@/lib/store"
import { createClient } from "@/utils/supabase/client"

type Load =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; report: MailReport }

/** Whether the mail job is running and what it has sent. */
export default function MailPage() {
  const { actor } = useProjectsStore()
  const [load, setLoad] = React.useState<Load>({ state: "loading" })

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await createClient().auth.getSession()
        const res = await fetch("/api/developer/mail", {
          headers: { authorization: `Bearer ${data.session?.access_token ?? ""}` },
          cache: "no-store",
        })
        const body = await res.json()
        if (cancelled) return
        if (!res.ok) setLoad({ state: "error", message: body.error ?? "Failed." })
        else setLoad({ state: "ready", report: body })
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
    return <EmptyState title="Mail" body={load.message} />

  const r = load.report
  const peak = Math.max(1, ...r.perDay.map((d) => d.sent + d.failed))

  return (
    <>
      <PageHeader
        title="Mail"
        description="Whether mails are going out, how many each day and for each team, and what failed."
      />

      {r.error && (
        <p className="rounded-lg border border-border p-3 text-sm text-error-primary">
          Could not read mail_log: {r.error}. Run the new part of
          supabase/schema.sql.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <MetricTile
          label="Mail mode"
          value={r.mode}
          hint={r.startDate ? `Live since ${r.startDate}` : "No start date"}
          tone={r.mode === "live" ? "good" : "warn"}
        />
        <MetricTile
          label="Sent today"
          value={`${r.sentToday} / ${r.dailyLimit}`}
          hint="Against the daily Gmail limit"
          tone={r.sentToday > r.dailyLimit * 0.8 ? "warn" : "default"}
        />
        <MetricTile
          label="Failed today"
          value={String(r.failedToday)}
          hint={
            r.lastFailedAt
              ? `Last failure ${timeAgo(r.lastFailedAt)}`
              : "No failures in 14 days"
          }
          tone={r.failedToday > 0 ? "warn" : "good"}
        />
        <MetricTile
          label="Last mail sent"
          value={r.lastSentAt ? timeAgo(r.lastSentAt) : "—"}
          hint="Newest successful send"
        />
        <MetricTile
          label="Not mailed yet"
          value={String(r.unmailed)}
          hint="Notices with no email since the start date"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-border p-4 lg:col-span-2">
          <p className="text-sm font-semibold">Sent per day, last 14 days</p>
          <div className="mt-3 flex h-28 items-end gap-1">
            {r.perDay.map((d) => (
              <div
                key={d.date}
                className="flex flex-1 flex-col items-center justify-end gap-1"
                title={`${d.date}: ${d.sent} sent, ${d.failed} failed`}
              >
                <span className="text-caption tabular-nums text-muted-foreground">
                  {d.sent + d.failed || ""}
                </span>
                <div className="flex w-full flex-col justify-end">
                  {d.failed > 0 && (
                    <div
                      className="w-full rounded-t-sm bg-error-primary"
                      style={{ height: `${(d.failed / peak) * 80}px` }}
                    />
                  )}
                  <div
                    className="w-full rounded-t-sm bg-foreground"
                    style={{
                      height: `${Math.max(d.sent ? 2 : 0, (d.sent / peak) * 80)}px`,
                    }}
                  />
                </div>
                <span className="text-caption text-muted-foreground">
                  {d.date.slice(8)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm font-semibold">By kind</p>
          <ul className="mt-3 space-y-1 text-sm">
            {r.byKind.length === 0 && (
              <li className="text-muted-foreground">Nothing sent yet.</li>
            )}
            {r.byKind.map((k) => (
              <li key={k.kind} className="flex justify-between">
                <span className="text-muted-foreground">{k.kind}</span>
                <span className="tabular-nums">
                  {k.sent}
                  {k.failed > 0 && (
                    <span className="text-error-primary"> · {k.failed} failed</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Per team</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-muted text-caption text-muted-foreground uppercase">
              <tr>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2 text-right">Today</th>
                <th className="px-3 py-2 text-right">7 days</th>
                <th className="px-3 py-2 text-right">14 days</th>
                <th className="px-3 py-2 text-right">Failed</th>
              </tr>
            </thead>
            <tbody>
              {r.teams.map((t) => (
                <tr key={t.projectId} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{t.title}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.today}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.last7}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.last14}</td>
                  <td
                    className={`px-3 py-2 text-right tabular-nums ${t.failed14 ? "text-error-primary" : ""}`}
                  >
                    {t.failed14}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Recent mails</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted text-caption text-muted-foreground uppercase">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">To</th>
                <th className="px-3 py-2">Kind</th>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {r.recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-muted-foreground">
                    No mail in the last 14 days.
                  </td>
                </tr>
              )}
              {r.recent.map((m, i) => (
                <tr key={`${m.at}-${i}`} className="border-t border-border">
                  <td className="px-3 py-2 text-muted-foreground">
                    {timeAgo(m.at)}
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium">{m.to}</p>
                    {m.team && (
                      <p className="text-caption text-muted-foreground">
                        {m.team}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{m.kind}</td>
                  <td className="max-w-[260px] truncate px-3 py-2">{m.subject}</td>
                  <td className="px-3 py-2">
                    {m.failed ? (
                      <Badge color="error" size="sm">
                        {m.error ? `Failed: ${m.error.slice(0, 40)}` : "Failed"}
                      </Badge>
                    ) : (
                      <Badge color="success" size="sm">
                        Sent
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
