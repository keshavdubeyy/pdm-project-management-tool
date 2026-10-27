"use client"

import * as React from "react"
import type { SortDescriptor } from "react-aria-components"
import { EmptyState, PersonChips, ProjectTitle } from "@/components/common"
import { StudentDashboard } from "@/components/student/student-dashboard"
import { Table, TableCard } from "@/components/untitled/application/table/table"
import { Button } from "@/components/untitled/base/buttons/button"
import { Select } from "@/components/untitled/base/select/select"
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
  return <CoordinatorToday />
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

type SortState = SortDescriptor

/** Sorts rows by the text a column shows. Empty cells go last either way. */
function sortRows<T>(
  rows: T[],
  sort: SortState,
  keys: Record<string, (row: T) => string>
) {
  const key = keys[String(sort.column)]
  if (!key) return rows
  const dir = sort.direction === "ascending" ? 1 : -1
  return [...rows].sort((a, b) => {
    const x = key(a)
    const y = key(b)
    if (!x && !y) return 0
    if (!x) return 1
    if (!y) return -1
    return x.localeCompare(y) * dir
  })
}

/* --------------------------------------------------------- coordinator */

/** The coordinator's overview is the whole batch as one list: who is on each
 * project and who mentors it. Opening a row lands on the same two tabs the
 * students and mentors see. */
function CoordinatorToday() {
  const { db, actor } = useProjectsStore()
  const [query, setQuery] = React.useState("")
  const [mentorId, setMentorId] = React.useState<string | null>(null)
  const [sort, setSort] = React.useState<SortState>({
    column: "student1",
    direction: "ascending",
  })
  if (!actor) return null

  const mentors = db.people.filter((p) => p.roles.includes("mentor"))
  const q = query.trim().toLowerCase()
  const filtered = projectsFor(db, actor)
    .map((project) => {
      const students = project.teamMemberIds
        .map((id) => personById(db, id))
        .filter((p): p is Person => Boolean(p))
      const mentorPeople = project.mentorIds
        .map((id) => personById(db, id))
        .filter((p): p is Person => Boolean(p))
      return {
        project,
        students,
        mentorPeople,
        mentorNames: mentorPeople.map((p) => p.name),
      }
    })
    .filter(({ project }) => !mentorId || project.mentorIds.includes(mentorId))
    .filter(
      ({ project, students, mentorNames }) =>
        !q ||
        `${students.map((s) => s.name).join(" ")} ${mentorNames.join(" ")} ${project.title}`
          .toLowerCase()
          .includes(q)
    )

  const rows = sortRows(filtered, sort, {
    student1: (r) => r.students[0]?.name ?? "",
    student2: (r) => r.students[1]?.name ?? "",
    mentor: (r) => r.mentorNames.join(", "),
  })

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <header className="space-y-1.5">
          <h1 className="text-page text-foreground">Overview</h1>
          <p className="text-meta text-muted-foreground">
            {rows.length} {rows.length === 1 ? "project" : "projects"} · pick
            one to open it
          </p>
        </header>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            icon={SearchLg}
            value={query}
            onChange={setQuery}
            placeholder="Search students, mentor or project…"
            className="w-96"
          />
          <Select
            selectedKey={mentorId ?? "all"}
            onSelectionChange={(value) =>
              setMentorId(value === "all" ? null : String(value))
            }
            size="md"
            className="w-52"
            placeholder="Mentor"
          >
            <Select.Item id="all" label="Every mentor" />
            {mentors.map((mentor) => (
              <Select.Item key={mentor.id} id={mentor.id} label={mentor.name} />
            ))}
          </Select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users01}
          title={query || mentorId ? "No matches" : "No projects yet"}
          body={
            query || mentorId
              ? "Try a different filter, or clear it."
              : "Projects appear here once a team is formed."
          }
        />
      ) : (
        <TableCard.Root size="sm">
          <Table
            aria-label="Projects"
            sortDescriptor={sort}
            onSortChange={setSort}
          >
            <Table.Header>
              <Table.Head id="sno" label="S.No" className="w-0" />
              <Table.Head
                id="student1"
                isRowHeader
                allowsSorting
                label="Student 1"
              />
              <Table.Head id="student2" allowsSorting label="Student 2" />
              <Table.Head id="mentor" allowsSorting label="Mentor" />
              <Table.Head id="actions" aria-label="Actions" className="w-0" />
            </Table.Header>
            <Table.Body items={rows.map((r, i) => ({ ...r, no: i + 1 }))}>
              {({ project, students, mentorPeople, no }) => (
                <Table.Row id={project.id} href={`/projects/${project.id}`}>
                  <Table.Cell className="w-0 text-tertiary tabular-nums">
                    {no}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap">
                    <PersonChips people={[students[0]]} />
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap">
                    <PersonChips people={[students[1]]} empty="—" />
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap">
                    <PersonChips people={mentorPeople} />
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
