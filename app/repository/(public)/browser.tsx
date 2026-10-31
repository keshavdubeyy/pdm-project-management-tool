"use client"

import * as React from "react"

import { EmptyState } from "@/components/common"
import { Badge } from "@/components/untitled/base/badges/badges"
import { Input } from "@/components/untitled/base/input/input"
import { NativeSelect } from "@/components/untitled/base/select/select-native"
import { type PublicRepoProject } from "@/lib/repository"

import { SearchLg } from "@untitledui/icons"

import { GlassSheet, Tile } from "./tile"

/** Whether a project matches a lower-cased search. */
export function matches(p: PublicRepoProject, q: string) {
  return [
    p.title,
    p.summary,
    p.mentor ?? "",
    p.tags.join(" "),
    p.team.map((m) => m.name).join(" "),
  ]
    .join(" ")
    .toLowerCase()
    .includes(q)
}

/** What the coordinator's view adds to each project card: its own badge (say,
 * "Hidden") and buttons. The public pages pass nothing. */
export type ProjectExtras = {
  badge?: (p: PublicRepoProject) => React.ReactNode
  actions?: (p: PublicRepoProject) => React.ReactNode
}

export function ProjectGrid({
  projects,
  extras,
}: {
  projects: PublicRepoProject[]
  extras?: ProjectExtras
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {projects.map((p) => (
        <Tile
          key={p.id}
          href={`/repository/${p.id}`}
          icon={<GlassSheet />}
          badge={
            (extras?.badge?.(p) || p.domain) && (
              <span className="flex gap-1">
                {extras?.badge?.(p)}
                {p.domain && (
                  <Badge size="sm" color="gray">
                    {p.domain}
                  </Badge>
                )}
              </span>
            )
          }
          actions={extras?.actions?.(p)}
          title={p.title}
          meta={p.team.map((m) => m.name).join(", ")}
          align="left"
        />
      ))}
    </div>
  )
}

/** Inside one batch folder: search, a domain filter, and every project.
 * Filtering happens here, in the browser, because a batch is small enough to
 * send once. */
export function RepositoryBrowser({
  projects,
  extras,
}: {
  projects: PublicRepoProject[]
  extras?: ProjectExtras
}) {
  const [query, setQuery] = React.useState("")
  const [domain, setDomain] = React.useState("")

  const domains = Array.from(
    new Set(projects.map((p) => p.domain).filter((d): d is string => !!d))
  ).sort()

  const q = query.trim().toLowerCase()
  const shown = projects.filter(
    (p) => (!domain || p.domain === domain) && (!q || matches(p, q))
  )

  if (projects.length === 0) {
    return (
      <EmptyState
        image="/empty-states/repository.png"
        title="No projects yet"
        body="Published projects from this batch will appear here."
        className="min-h-[50vh]"
      />
    )
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <Input
          aria-label="Search projects"
          icon={SearchLg}
          placeholder="Search by title, team, mentor or tag"
          value={query}
          onChange={setQuery}
        />
        <NativeSelect
          aria-label="Domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          options={[
            { label: "All domains", value: "" },
            ...domains.map((d) => ({ label: d, value: d })),
          ]}
        />
      </div>

      <p className="text-meta text-muted-foreground">
        {shown.length} {shown.length === 1 ? "project" : "projects"}
      </p>

      {shown.length === 0 ? (
        <p className="py-8 text-center text-meta text-muted-foreground">
          Nothing matches. Try a different search.
        </p>
      ) : (
        <ProjectGrid projects={shown} extras={extras} />
      )}
    </>
  )
}
