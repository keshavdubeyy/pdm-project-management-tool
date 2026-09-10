"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FolderLibraryIcon } from "@hugeicons/core-free-icons"

import { BatchCard } from "@/components/batch-card"
import { CreateBatchDialog } from "@/components/create-batch-dialog"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { canManageRecords } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"

export default function Page() {
  const { projects, batches, currentUser } = useProjectsStore()

  const visibleProjects = projects.filter(
    (project) => !project.archived || currentUser.role === "coordinator"
  )

  const sortedBatches = React.useMemo(
    () => [...batches].sort((a, b) => b.label.localeCompare(a.label)),
    [batches]
  )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-medium">Project directory</h1>
          <p className="text-sm text-muted-foreground">
            {visibleProjects.length} {visibleProjects.length === 1 ? "project" : "projects"} across{" "}
            {batches.length} {batches.length === 1 ? "batch" : "batches"}.
          </p>
        </div>
        {canManageRecords(currentUser) && <CreateBatchDialog />}
      </div>

      {sortedBatches.length === 0 ? (
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
              <CreateBatchDialog />
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedBatches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              projectCount={visibleProjects.filter((p) => p.batchId === batch.id).length}
            />
          ))}
        </div>
      )}
    </div>
  )
}
