"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/untitled/base/badges/badges"
import { toast } from "@/components/untitled/application/notifications/toast"
import { isCoordinator } from "@/lib/permissions"
import type { RepoProject, RepoStatus } from "@/lib/repository"
import { useProjectsStore } from "@/lib/store"
import { createClient } from "@/utils/supabase/client"

import { Eye, EyeOff, Trash01 } from "@untitledui/icons"

import type { ProjectExtras } from "../(public)/browser"

/** Everything the coordinator's repository pages share: the rows (hidden ones
 * included), hiding, deleting and the CSV download, plus the badge and buttons
 * each project card carries. Anyone but a coordinator is sent home. */
export function useManagedRepository() {
  const router = useRouter()
  const { actor } = useProjectsStore()
  const allowed = actor ? isCoordinator(actor) : false
  const [rows, setRows] = React.useState<RepoProject[] | null>(null)
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
              setError(body.error ?? "Could not load the repository.")
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
    if (!window.confirm("Delete this project for good?")) return
    const response = await call(
      `/api/repository/manage?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    )
    if (!response.ok) toast({ title: "That did not go through" })
    else await load()
  }

  /** One batch's CSV, by graduation year, or every batch when none is given. */
  const download = async (graduationYear?: number) => {
    const query = graduationYear ? `&batch=${graduationYear}` : ""
    const response = await call(`/api/repository/manage?format=csv${query}`)
    if (!response.ok) {
      toast({ title: "Could not export" })
      return
    }
    const url = URL.createObjectURL(await response.blob())
    const a = document.createElement("a")
    a.href = url
    a.download = `project-repository-${graduationYear ? `batch-${graduationYear}` : "all"}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusOf = (id: string) => rows?.find((r) => r.id === id)?.status

  const iconButton =
    "flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors duration-fast-02 ease-standard hover:text-foreground"

  const extras: ProjectExtras = {
    badge: (p) =>
      statusOf(p.id) !== "published" && (
        <Badge size="sm" color="warning">
          Hidden
        </Badge>
      ),
    actions: (p) => {
      const live = statusOf(p.id) === "published"
      return (
        <>
          <button
            type="button"
            className={iconButton}
            aria-label={live ? "Hide from the public page" : "Show on the public page"}
            title={live ? "Hide from the public page" : "Show on the public page"}
            onClick={() => setStatus(p.id, live ? "rejected" : "published")}
          >
            {live ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
          <button
            type="button"
            className={`${iconButton} hover:text-destructive`}
            aria-label="Delete"
            title="Delete"
            onClick={() => remove(p.id)}
          >
            <Trash01 className="size-4" />
          </button>
        </>
      )
    },
  }

  return { allowed, rows, error, download, extras }
}
