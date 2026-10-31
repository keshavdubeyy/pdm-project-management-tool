"use client"

import * as React from "react"

import { Input } from "@/components/untitled/base/input/input"
import { BATCHES, type PublicRepoProject } from "@/lib/repository"

import { SearchLg } from "@untitledui/icons"

import { ProjectGrid, matches } from "./browser"
import { GlassFolder, Tile } from "./tile"

/** The top of the repository: one folder per batch, newest first. The search
 * narrows the folders by batch name or year, and also lists any project that
 * matches across every batch, so a visitor need not know which batch to open. */
export function BatchFolders({ projects }: { projects: PublicRepoProject[] }) {
  const [query, setQuery] = React.useState("")
  const q = query.trim().toLowerCase()

  const folders = [...BATCHES].reverse().map((b) => ({
    ...b,
    count: projects.filter((p) => p.graduation_year === b.graduationYear).length,
  }))
  const shownFolders = q
    ? folders.filter(
        (b) =>
          b.label.toLowerCase().includes(q) ||
          String(b.graduationYear).includes(q) ||
          `batch ${b.label}`.toLowerCase().includes(q)
      )
    : folders
  const shownProjects = q ? projects.filter((p) => matches(p, q)) : []

  return (
    <>
      <Input
        className="w-full sm:max-w-md"
        aria-label="Search batches and projects"
        icon={SearchLg}
        placeholder="Search batches and projects"
        value={query}
        onChange={setQuery}
      />

      {shownFolders.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {shownFolders.map((b) => (
            <Tile
              key={b.graduationYear}
              href={`/repository/batch/${b.graduationYear}`}
              icon={<GlassFolder empty={b.count === 0} />}
              title={`Batch ${b.label}`}
              meta={`${b.count} ${b.count === 1 ? "project" : "projects"}`}
            />
          ))}
        </div>
      )}

      {q && (
        <>
          <p className="text-meta text-muted-foreground">
            {shownProjects.length}{" "}
            {shownProjects.length === 1 ? "project" : "projects"} across all
            batches
          </p>
          {shownProjects.length === 0 && shownFolders.length === 0 ? (
            <p className="py-8 text-center text-meta text-muted-foreground">
              Nothing matches. Try a different search.
            </p>
          ) : (
            <ProjectGrid projects={shownProjects} />
          )}
        </>
      )}
    </>
  )
}
