"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { EmptyState, PageHeader } from "@/components/common"
import { Badge } from "@/components/untitled/base/badges/badges"
import { useProjectsStore } from "@/lib/store"

/** Every batch the programme has run, each a door into its own roster and
 * register of projects.
 *
 * The prototype this replaced put the whole programme behind one flat list.
 * A batch is the real unit a cohort is admitted, taught and graduates in, so
 * it is the first thing this page asks: which one, then who and what.
 */
export default function DirectoryPage() {
  const router = useRouter()
  const { db, actor } = useProjectsStore()
  const isStudent = actor?.role === "student"

  // The directory is hidden from students for now, including by address.
  React.useEffect(() => {
    if (isStudent) router.replace("/")
  }, [isStudent, router])

  if (!actor || isStudent) return null

  const batches = [...db.batches].sort(
    (a, b) => b.admissionYear - a.admissionYear
  )

  return (
    <>
      <PageHeader
        divider={false}
        title="Directory"
        description="Every batch the programme has run."
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
                  <p className="truncate text-subhead text-foreground">
                    {batch.label}
                  </p>
                  <Badge
                    size="sm"
                    color={batch.archived ? "gray" : "brand"}
                    className="shrink-0"
                  >
                    {batch.archived ? "Past" : "Current"}
                  </Badge>
                </div>
                <p className="mt-1 text-caption text-muted-foreground">
                  {batch.admissionYear}–{batch.graduationYear}
                </p>
                <p className="mt-3 text-meta text-muted-foreground">
                  {projects.length}{" "}
                  {projects.length === 1 ? "project" : "projects"} ·{" "}
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
