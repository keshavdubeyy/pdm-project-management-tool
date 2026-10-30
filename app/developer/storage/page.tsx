"use client"

import * as React from "react"

import { EmptyState, MetricTile, PageHeader } from "@/components/common"
import type { StorageReport } from "@/app/api/developer/storage/route"
import { useProjectsStore } from "@/lib/store"
import { createClient } from "@/utils/supabase/client"

type Load =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; report: StorageReport }

const MB = 1024 * 1024

function size(bytes: number) {
  if (bytes >= 1024 * MB) return `${(bytes / (1024 * MB)).toFixed(2)} GB`
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

/** Red past 80%, which is when it is time to act. */
function Bar({ used, limit }: { used: number; limit: number }) {
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0
  return (
    <div className="mt-1 h-2 rounded-full bg-muted">
      <div
        className={`h-2 rounded-full ${pct > 80 ? "bg-error-primary" : "bg-foreground"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/** How much of the Supabase plan the app is using, and who is using it. */
export default function StoragePage() {
  const { actor } = useProjectsStore()
  const [load, setLoad] = React.useState<Load>({ state: "loading" })

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await createClient().auth.getSession()
        const res = await fetch("/api/developer/storage", {
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
    return <EmptyState title="Storage" body={load.message} />

  const r = load.report
  const used = r.buckets.reduce((n, b) => n + b.bytes, 0)
  const files = r.buckets.reduce((n, b) => n + b.files, 0)
  const left = Math.max(0, r.storageLimitBytes - used)
  const dbLeft = Math.max(0, r.dbLimitBytes - r.dbBytes)
  const usedPct = r.storageLimitBytes ? (used / r.storageLimitBytes) * 100 : 0
  const dbPct = r.dbLimitBytes ? (r.dbBytes / r.dbLimitBytes) * 100 : 0
  const teamTotal = r.teams.reduce((n, t) => n + t.bytes, 0)

  return (
    <>
      <PageHeader
        title="Storage"
        description="How much of the Supabase plan is used for files and data, and which teams use it."
      />

      {r.error && (
        <p className="rounded-lg border border-border p-3 text-sm text-error-primary">
          Could not read sizes: {r.error}. Run the new part of supabase/schema.sql.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile
          label="File storage left"
          value={size(left)}
          hint={`${size(used)} of ${size(r.storageLimitBytes)} used`}
          tone={usedPct > 80 ? "warn" : "good"}
        />
        <MetricTile
          label="Database left"
          value={size(dbLeft)}
          hint={`${size(r.dbBytes)} of ${size(r.dbLimitBytes)} used`}
          tone={dbPct > 80 ? "warn" : "good"}
        />
        <MetricTile
          label="Uploaded files"
          value={String(files)}
          hint="Across all buckets"
        />
        <MetricTile
          label="Document links"
          value={String(r.links)}
          hint="Addresses only, they take no space"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">File storage</span>
            <span className="tabular-nums">
              {size(used)} of {size(r.storageLimitBytes)}
            </span>
          </div>
          <Bar used={used} limit={r.storageLimitBytes} />
          <ul className="mt-3 space-y-1 text-sm">
            {r.buckets.map((b) => (
              <li key={b.bucket} className="flex justify-between">
                <span className="text-muted-foreground">{b.bucket}</span>
                <span className="tabular-nums">
                  {size(b.bytes)} · {b.files} files
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border p-4">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Database</span>
            <span className="tabular-nums">
              {size(r.dbBytes)} of {size(r.dbLimitBytes)}
            </span>
          </div>
          <Bar used={r.dbBytes} limit={r.dbLimitBytes} />
          <ul className="mt-3 space-y-1 text-sm">
            {r.tables.slice(0, 8).map((t) => (
              <li key={t.table} className="flex justify-between">
                <span className="text-muted-foreground">{t.table}</span>
                <span className="tabular-nums">
                  {size(t.bytes)} · ≈{t.rows} rows
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-caption text-muted-foreground">
            Limits come from STORAGE_LIMIT_MB and DB_LIMIT_MB. Set them to your
            plan. Row counts are estimates.
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Per team</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-muted text-caption text-muted-foreground uppercase">
              <tr>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2 text-right">Files</th>
                <th className="px-3 py-2 text-right">Size</th>
                <th className="px-3 py-2 text-right">Share</th>
                <th className="px-3 py-2 text-right">Links</th>
              </tr>
            </thead>
            <tbody>
              {r.teams.map((t) => (
                <tr key={t.projectId} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{t.title}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.files}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {size(t.bytes)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {teamTotal ? `${Math.round((t.bytes / teamTotal) * 100)}%` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.links}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-caption text-muted-foreground">
          Team files are weekly progress uploads. Profile photos are not counted
          against a team.
        </p>
      </section>

      {r.largest.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Largest files</h2>
          <div className="rounded-xl border border-border p-4">
            <ul className="space-y-1 text-sm">
              {r.largest.map((f) => (
                <li
                  key={`${f.bucket}/${f.name}`}
                  className="flex justify-between gap-3"
                >
                  <span className="truncate text-muted-foreground">
                    {f.bucket}/{f.name}
                  </span>
                  <span className="tabular-nums">{size(f.bytes)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
