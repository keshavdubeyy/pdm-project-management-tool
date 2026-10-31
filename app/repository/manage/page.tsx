"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/untitled/base/badges/badges"
import { Button } from "@/components/untitled/base/buttons/button"
import { toast } from "@/components/untitled/application/notifications/toast"
import { isCoordinator } from "@/lib/permissions"
import { batchName, type RepoProject, type RepoStatus } from "@/lib/repository"
import { useProjectsStore } from "@/lib/store"
import { createClient } from "@/utils/supabase/client"

const FILTERS: { value: RepoStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "On the repository" },
  { value: "rejected", label: "Hidden" },
]

const COLOR = { pending: "warning", published: "success", rejected: "gray" } as const
const STATE = { pending: "Not live", published: "Live", rejected: "Hidden" } as const

/** The coordinator's review desk: publish or reject what people submit, and
 * download everything as one CSV. */
export default function ManageRepositoryPage() {
  const router = useRouter()
  const { actor } = useProjectsStore()
  const allowed = actor ? isCoordinator(actor) : false
  const [rows, setRows] = React.useState<RepoProject[] | null>(null)
  const [filter, setFilter] = React.useState<RepoStatus | "all">("all")
  const [error, setError] = React.useState<string | null>(null)

  const call = React.useCallback(async (path: string, init?: RequestInit) => {
    const { data } = await createClient().auth.getSession()
    return fetch(path, {
      ...init,
      headers: {
        ...init?.headers,
        authorization: `Bearer ${data.session?.access_token ?? ""}`,
      },
    })
  }, [])

  const load = React.useCallback(
    () =>
      call("/api/repository/manage")
        .then((response) =>
          response.json().then((body) => {
            if (!response.ok)
              setError(body.error ?? "Could not load submissions.")
            else {
              setRows(body.projects)
              setError(null)
            }
          })
        )
        .catch(() => setError("Could not reach the server.")),
    [call]
  )

  React.useEffect(() => {
    if (actor && !allowed) router.replace("/")
    else if (allowed) void load()
  }, [actor, allowed, load, router])

  if (!allowed) return null

  const setStatus = async (id: string, status: RepoStatus) => {
    const response = await call("/api/repository/manage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    if (!response.ok) toast({ title: "That did not go through" })
    else await load()
  }

  const remove = async (id: string) => {
    if (!window.confirm("Delete this submission for good?")) return
    const response = await call(
      `/api/repository/manage?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    )
    if (!response.ok) toast({ title: "That did not go through" })
    else await load()
  }

  const download = async () => {
    const response = await call("/api/repository/manage?format=csv")
    if (!response.ok) {
      toast({ title: "Could not export" })
      return
    }
    const url = URL.createObjectURL(await response.blob())
    const a = document.createElement("a")
    a.href = url
    a.download = `project-repository-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const shown = (rows ?? []).filter((r) => filter === "all" || r.status === filter)
  const count = (s: RepoStatus) => (rows ?? []).filter((r) => r.status === s).length

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-page text-foreground">Repository submissions</h1>
          <p className="text-meta text-muted-foreground">
            Send graduates the link{" "}
            <Link
              href="/submit-project"
              className="font-medium text-brand-secondary underline-offset-2 hover:underline"
            >
              /submit-project
            </Link>
            . Projects go live as soon as they are sent; hide or delete anything that should not be public.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/repository">
            <Button color="secondary">View public page</Button>
          </Link>
          <Button onPress={download}>Download CSV</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-md border px-3 py-1 text-sm ${
              filter === f.value
                ? "border-foreground font-semibold"
                : "border-border text-muted-foreground"
            }`}
          >
            {f.label}
            {f.value !== "all" && rows ? ` (${count(f.value)})` : ""}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-meta text-destructive">
          {error}
        </p>
      )}

      {rows && shown.length === 0 && (
        <p className="py-8 text-center text-meta text-muted-foreground">
          Nothing here.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {shown.map((p) => (
          <li
            key={p.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge size="sm" color={COLOR[p.status]}>
                {STATE[p.status]}
              </Badge>
              <Badge size="sm" color="gray">
                {batchName(p)}
              </Badge>
              {p.domain && (
                <Badge size="sm" color="gray">
                  {p.domain}
                </Badge>
              )}
            </div>
            <div>
              <p className="text-subhead text-foreground">{p.title}</p>
              <p className="mt-1 text-meta text-muted-foreground">{p.summary}</p>
            </div>
            <p className="text-caption text-muted-foreground">
              Team: {p.team.map((m) => m.name).join(", ")} · Submitted by{" "}
              {p.submitter_name} ({p.submitter_email})
            </p>
            <div className="flex flex-wrap gap-2">
              {p.status !== "published" && (
                <Button size="sm" onPress={() => setStatus(p.id, "published")}>
                  Show on repository
                </Button>
              )}
              {p.status === "published" && (
                <>
                  <Link href={`/repository/${p.id}`}>
                    <Button size="sm" color="secondary">
                      View
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    color="secondary"
                    onPress={() => setStatus(p.id, "rejected")}
                  >
                    Hide
                  </Button>
                </>
              )}
              <Button size="sm" color="tertiary" onPress={() => remove(p.id)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
