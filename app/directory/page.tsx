"use client"

import Link from "next/link"

import { EmptyState, PageHeader } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { useProjectsStore } from "@/lib/store"

/** Every batch the programme has run, each a door into its own roster and
 * register of projects.
 *
 * The prototype this replaced put the whole programme behind one flat list.
 * A batch is the real unit a cohort is admitted, taught and graduates in, so
 * it is the first thing this page asks: which one, then who and what.
 */
export default function DirectoryPage() {
  const { db, actor } = useProjectsStore()
  if (!actor) return null

  const batches = [...db.batches].sort((a, b) => b.admissionYear - a.admissionYear)

  return (
    <>
      <PageHeader
        title="Directory"
        description={`${db.batches.length} ${db.batches.length === 1 ? "batch" : "batches"} in the programme.`}
      />

      {batches.length === 0 ? (
        <EmptyState
          title="No batches yet"
          body="A batch groups a cohort's roster and projects together, once one exists."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => {
            const projects = db.projects.filter((p) => p.batchId === batch.id)
            const teamIds = new Set(projects.map((p) => p.teamId))
            const studentCount = db.teams
              .filter((team) => teamIds.has(team.id))
              .reduce((sum, team) => sum + team.memberIds.length, 0)

            return (
              <Link
                key={batch.id}
                href={`/directory/${batch.id}`}
                className="rounded-xl border border-border bg-card p-4 transition-colors duration-fast-02 ease-standard hover:bg-muted/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-subhead text-foreground">{batch.label}</p>
                  <Badge variant={batch.archived ? "outline" : "default"} className="shrink-0 text-micro">
                    {batch.archived ? "Past" : "Current"}
                  </Badge>
                </div>
                <p className="mt-1 text-caption text-muted-foreground">
                  {batch.admissionYear}–{batch.graduationYear}
                </p>
                <p className="mt-3 text-meta text-muted-foreground">
                  {projects.length} {projects.length === 1 ? "project" : "projects"} ·{" "}
                  {studentCount} {studentCount === 1 ? "student" : "students"}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
