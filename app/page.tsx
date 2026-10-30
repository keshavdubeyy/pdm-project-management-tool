"use client"

import * as React from "react"
import { EmptyState, PersonChips, ProjectTitle } from "@/components/common"
import { CoordinatorOverview } from "@/components/coordinator/overview"
import { StudentDashboard } from "@/components/student/student-dashboard"
import { Table, TableCard } from "@/components/untitled/application/table/table"
import { Button } from "@/components/untitled/base/buttons/button"
import { Input } from "@/components/untitled/base/input/input"
import { projectsFor } from "@/lib/permissions"
import { personById } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import type { Person } from "@/lib/types"

import { SearchLg, Users01 } from "@untitledui/icons"

export default function TodayPage() {
  const { actor } = useProjectsStore()
  if (!actor) return null
  if (actor.role === "student") return <StudentDashboard />
  if (actor.role === "mentor") return <MentorToday />
  return <CoordinatorOverview />
}

/* -------------------------------------------------------------- mentor */

/** A mentor's home is their teams and nothing else. Opening one lands on the
 * same two tabs the students see, so there is one thing to learn. */
function MentorToday() {
  const { db, actor } = useProjectsStore()
  const [query, setQuery] = React.useState("")
  if (!actor) return null

  const q = query.trim().toLowerCase()
  const rows = projectsFor(db, actor)
    .map((project) => {
      const firstNames = project.teamMemberIds
        .map((id) => personById(db, id)?.name.split(" ")[0])
        .filter((n): n is string => Boolean(n))
      const members = project.teamMemberIds
        .map((id) => personById(db, id))
        .filter((p): p is Person => Boolean(p))
      return { project, members, team: firstNames.join(" & ") || "Team" }
    })
    .filter(
      ({ project, team }) =>
        !q || `${team} ${project.title}`.toLowerCase().includes(q)
    )
    .sort((a, b) => a.team.localeCompare(b.team))

  return (
    <>
      <header className="space-y-1.5">
        <h1 className="text-page text-foreground">Your teams</h1>
        <p className="text-meta text-muted-foreground">The teams you mentor.</p>
      </header>

      <Input
        icon={SearchLg}
        value={query}
        onChange={setQuery}
        placeholder="Search teams…"
        className="w-64"
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Users01}
          title={query ? "No matches" : "No teams yet"}
          body={
            query
              ? "Try a different name, or clear the search."
              : "Teams you mentor appear here once the coordinator assigns them."
          }
        />
      ) : (
        <TableCard.Root size="sm">
          <Table aria-label="Your teams">
            <Table.Header>
              <Table.Head id="sno" label="S.No" className="w-0" />
              <Table.Head id="team" isRowHeader label="Team" />
              <Table.Head id="project" label="Project" />
              <Table.Head id="actions" aria-label="Actions" className="w-0" />
            </Table.Header>
            <Table.Body items={rows.map((r, i) => ({ ...r, no: i + 1 }))}>
              {({ project, members, team, no }) => (
                <Table.Row id={project.id} href={`/projects/${project.id}`}>
                  <Table.Cell className="w-0 text-tertiary tabular-nums">
                    {no}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap">
                    <PersonChips people={members} empty={team} />
                  </Table.Cell>
                  <Table.Cell className="max-w-96">
                    <span className="block truncate text-tertiary">
                      <ProjectTitle project={project} />
                    </span>
                  </Table.Cell>
                  <Table.Cell className="w-0 pr-4 text-right">
                    <Button
                      size="sm"
                      color="secondary"
                      href={`/projects/${project.id}`}
                    >
                      Open
                    </Button>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </TableCard.Root>
      )}
    </>
  )
}
