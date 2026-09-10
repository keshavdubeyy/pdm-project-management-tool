"use client"

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, ArrowLeft02Icon, SearchRemoveIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ProjectCard } from "@/components/project-card"
import { ALL, ProjectFilters, defaultFilters, type DirectoryFilters } from "@/components/project-filters"
import { ProjectTable } from "@/components/project-table"
import { batchHref } from "@/lib/navigation"
import { canAddProject } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"

function filtersFromParams(params: URLSearchParams): DirectoryFilters {
  return {
    q: params.get("q") ?? defaultFilters.q,
    batchId: ALL,
    domainId: params.get("domain") ?? defaultFilters.domainId,
    status: params.get("status") ?? defaultFilters.status,
    onlyMine: params.get("mine") === "1",
    showArchived: params.get("archived") === "1",
    view: params.get("view") === "table" ? "table" : defaultFilters.view,
  }
}

function paramsFromFilters(filters: DirectoryFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set("q", filters.q)
  if (filters.domainId !== ALL) params.set("domain", filters.domainId)
  if (filters.status !== ALL) params.set("status", filters.status)
  if (filters.onlyMine) params.set("mine", "1")
  if (filters.showArchived) params.set("archived", "1")
  if (filters.view !== defaultFilters.view) params.set("view", filters.view)
  return params.toString()
}

function BatchContent() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { projects, people, batches, domains, currentUser } = useProjectsStore()

  const batch = batches.find((b) => b.id === params.id)
  const filters = React.useMemo(() => filtersFromParams(searchParams), [searchParams])

  function setFilters(next: DirectoryFilters) {
    const query = paramsFromFilters(next)
    router.replace(query ? `${batchHref(params.id)}?${query}` : batchHref(params.id), {
      scroll: false,
    })
  }

  if (!batch) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Batch not found</EmptyTitle>
            <EmptyDescription>This batch doesn&apos;t exist.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" render={<Link href="/" />} nativeButton={false}>
              Back to project directory
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  const batchProjects = projects.filter((project) => project.batchId === batch.id)

  const filtered = batchProjects.filter((project) => {
    if (project.archived && !(currentUser.role === "coordinator" && filters.showArchived)) {
      return false
    }
    if (filters.status !== ALL && project.status !== filters.status) return false
    if (filters.domainId !== ALL && project.domainId !== filters.domainId) return false

    if (filters.onlyMine) {
      if (currentUser.role === "mentor" && !project.mentorIds.includes(currentUser.id)) return false
      if (currentUser.role === "student" && !project.teamMemberIds.includes(currentUser.id)) return false
    }

    const q = filters.q.trim().toLowerCase()
    if (q.length > 0) {
      const domain = domains.find((d) => d.id === project.domainId)
      const teamNames = project.teamMemberIds
        .map((id) => people.find((p) => p.id === id)?.name ?? "")
        .join(" ")
      const haystack = `${project.title} ${project.description} ${domain?.label ?? ""} ${teamNames}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }

    return true
  })

  const hasAnyFilter =
    filters.q.length > 0 ||
    filters.domainId !== ALL ||
    filters.status !== ALL ||
    filters.onlyMine ||
    filters.showArchived

  const query = searchParams.toString()
  const backHref = query ? `${batchHref(batch.id)}?${query}` : batchHref(batch.id)
  const visibleCount = batchProjects.filter(
    (p) => !p.archived || currentUser.role === "coordinator"
  ).length

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <Link
          href="/"
          className="mb-2 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-4" />
          All batches
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl font-medium">{batch.label}</h1>
            <p className="text-sm text-muted-foreground">
              {visibleCount} {visibleCount === 1 ? "project" : "projects"} in this batch.
            </p>
          </div>
          {canAddProject(currentUser) && (
            <Button size="sm" render={<Link href={`/projects/new?batch=${batch.id}`} />} nativeButton={false}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              Add project
            </Button>
          )}
        </div>
      </div>

      <ProjectFilters
        filters={filters}
        onChange={setFilters}
        batches={batches}
        domains={domains}
        role={currentUser.role}
        showBatchFilter={false}
      />

      {filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={SearchRemoveIcon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>No projects found</EmptyTitle>
            <EmptyDescription>
              {hasAnyFilter
                ? "Nothing matches these filters yet. Try clearing them or searching a different term."
                : "No projects have been added to this batch yet."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {hasAnyFilter && (
              <Button
                variant="outline"
                onClick={() => setFilters({ ...defaultFilters, view: filters.view })}
              >
                Clear filters
              </Button>
            )}
          </EmptyContent>
        </Empty>
      ) : filters.view === "table" ? (
        <ProjectTable projects={filtered} people={people} batches={batches} domains={domains} backHref={backHref} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              people={people}
              batches={batches}
              domains={domains}
              backHref={backHref}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function BatchPage() {
  return (
    <Suspense>
      <BatchContent />
    </Suspense>
  )
}
