"use client"

import * as React from "react"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { FolderLibraryIcon, Search01Icon, SearchRemoveIcon } from "@hugeicons/core-free-icons"

import { BatchCard } from "@/components/batch-card"
import { CreateBatchSheet } from "@/components/create-batch-sheet"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { canManageRecords } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"

type SortOrder = "newest" | "oldest"

const SORT_LABELS: Record<SortOrder, string> = {
  newest: "Newest batch first",
  oldest: "Oldest batch first",
}

function DirectoryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { projects, batches, currentUser } = useProjectsStore()

  const q = searchParams.get("q") ?? ""
  const sort: SortOrder = searchParams.get("sort") === "oldest" ? "oldest" : "newest"

  function updateParams(next: { q?: string; sort?: SortOrder }) {
    const params = new URLSearchParams(searchParams.toString())
    const nextQ = next.q ?? q
    const nextSort = next.sort ?? sort

    if (nextQ) params.set("q", nextQ)
    else params.delete("q")

    if (nextSort !== "newest") params.set("sort", nextSort)
    else params.delete("sort")

    const query = params.toString()
    router.replace(query ? `/?${query}` : "/", { scroll: false })
  }

  const visibleProjects = projects.filter(
    (project) => !project.archived || currentUser.role === "coordinator"
  )

  const countsByBatch = React.useMemo(() => {
    const map = new Map<string, { total: number; ongoing: number; completed: number }>()
    for (const batch of batches) map.set(batch.id, { total: 0, ongoing: 0, completed: 0 })
    for (const project of visibleProjects) {
      const entry = map.get(project.batchId)
      if (!entry) continue
      entry.total += 1
      if (project.status === "ongoing") entry.ongoing += 1
      else entry.completed += 1
    }
    return map
  }, [batches, visibleProjects])

  const matchingBatches = React.useMemo(() => {
    const query = q.trim().toLowerCase()
    const filtered = query
      ? batches.filter((batch) => batch.label.toLowerCase().includes(query))
      : batches
    return [...filtered].sort((a, b) =>
      sort === "newest"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt)
    )
  }, [batches, q, sort])

  const directoryQuery = searchParams.toString()
  const directoryHref = directoryQuery ? `/?${directoryQuery}` : "/"

  return (
    <div className="flex flex-col gap-6 px-8 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-medium">Project directory</h1>
          <p className="text-sm text-muted-foreground">
            {visibleProjects.length} {visibleProjects.length === 1 ? "project" : "projects"} across{" "}
            {batches.length} {batches.length === 1 ? "batch" : "batches"}.
          </p>
        </div>
        {canManageRecords(currentUser) && <CreateBatchSheet />}
      </div>

      {batches.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:max-w-sm sm:flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={q}
              onChange={(event) => updateParams({ q: event.target.value })}
              placeholder="Search batches"
              aria-label="Search batches"
              className="pl-9"
            />
          </div>
          <Select
            items={SORT_LABELS}
            value={sort}
            onValueChange={(value) => updateParams({ sort: value as SortOrder })}
          >
            <SelectTrigger className="w-full sm:w-52" aria-label="Sort batches">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest batch first</SelectItem>
              <SelectItem value="oldest">Oldest batch first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {batches.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={FolderLibraryIcon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>No batches yet</EmptyTitle>
            <EmptyDescription>
              {canManageRecords(currentUser)
                ? "Create a batch to start grouping projects by cohort."
                : "The coordinator hasn't created a batch yet."}
            </EmptyDescription>
          </EmptyHeader>
          {canManageRecords(currentUser) && (
            <EmptyContent>
              <CreateBatchSheet />
            </EmptyContent>
          )}
        </Empty>
      ) : matchingBatches.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={SearchRemoveIcon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>No batches found</EmptyTitle>
            <EmptyDescription>Try a different search term.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => updateParams({ q: "" })}>
              Clear search
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matchingBatches.map((batch) => {
            const counts = countsByBatch.get(batch.id) ?? { total: 0, ongoing: 0, completed: 0 }
            return (
              <BatchCard
                key={batch.id}
                batch={batch}
                projectCount={counts.total}
                ongoingCount={counts.ongoing}
                completedCount={counts.completed}
                backHref={directoryHref}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <DirectoryContent />
    </Suspense>
  )
}
