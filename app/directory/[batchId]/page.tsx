"use client"

import * as React from "react"
import type { SortDescriptor } from "react-aria-components"
import Link from "next/link"
import { notFound, useParams, useRouter } from "next/navigation"
import { EmptyState, PageHeader, PersonChips } from "@/components/common"
import { Button } from "@/components/untitled/base/buttons/button"
import { Badge } from "@/components/untitled/base/badges/badges"
import { Input } from "@/components/untitled/base/input/input"
import { Select } from "@/components/untitled/base/select/select"
import { Table } from "@/components/untitled/application/table/table"
import {
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "@/components/untitled/application/tabs/tabs"
import { canViewProject } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"
import type { Person } from "@/lib/types"

import { ChevronLeft, Lock01, SearchLg } from "@untitledui/icons"

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

/** One batch: its roster, and its register of projects.
 *
 * A past batch's projects are shown, not opened — there is no lifecycle left
 * to page through once a batch has graduated, so a locked, read-only row is
 * the honest state rather than a link into a milestone rail built for work
 * still in progress.
 */
export default function BatchDirectoryPage() {
  const router = useRouter()
  const params = useParams<{ batchId: string }>()
  const { db, actor } = useProjectsStore()
  const [projectSort, setProjectSort] = React.useState<SortState>({
    column: "student1",
    direction: "ascending",
  })
  const [studentSort, setStudentSort] = React.useState<SortState>({
    column: "name",
    direction: "ascending",
  })
  const [tab, setTab] = React.useState("projects")
  const [query, setQuery] = React.useState("")
  const [mentorId, setMentorId] = React.useState<string | null>(null)

  const batch = db.batches.find((b) => b.id === params.batchId)
  const isStudent = actor?.role === "student"

  // The directory is hidden from students for now, including by address.
  React.useEffect(() => {
    if (isStudent) router.replace("/")
  }, [isStudent, router])

  if (!actor || isStudent) return null
  if (!batch) return notFound()

  const mentors = db.people.filter((p) => p.roles.includes("mentor"))
  const batchProjects = db.projects.filter((p) => p.batchId === batch.id)
  const q = query.trim().toLowerCase()

  const filtered = batchProjects
    .filter((project) => !mentorId || project.mentorIds.includes(mentorId))
    .map((project) => {
      const domain = db.domains.find((d) => d.id === project.domainId)
      const team = db.teams.find((t) => t.id === project.teamId)
      const studentPeople = (team?.memberIds ?? [])
        .map((id) => db.people.find((p) => p.id === id))
        .filter((p): p is Person => Boolean(p))
      const mentorPeople = project.mentorIds
        .map((id) => db.people.find((p) => p.id === id))
        .filter((p): p is Person => Boolean(p))
      return {
        project,
        domain,
        team,
        studentPeople,
        students: studentPeople.map((p) => p.name),
        mentorPeople,
        mentorNames: mentorPeople.map((p) => p.name),
      }
    })
    .filter(({ project, students: teamStudents, mentorNames }) => {
      if (!q) return true
      const hay =
        `${teamStudents.join(" ")} ${mentorNames.join(" ")} ${project.title}`.toLowerCase()
      return hay.includes(q)
    })

  const rows = sortRows(filtered, projectSort, {
    student1: (r) => r.students[0] ?? "",
    student2: (r) => r.students[1] ?? "",
    mentor: (r) => r.mentorNames.join(", "),
  })

  const teamIdsInBatch = new Set(batchProjects.map((p) => p.teamId))
  const students = db.teams
    .filter((team) => teamIdsInBatch.has(team.id))
    .flatMap((team) =>
      team.memberIds.map((personId) => ({
        person: db.people.find((p) => p.id === personId),
        team,
      }))
    )
    .filter(
      (
        row
      ): row is {
        person: NonNullable<typeof row.person>
        team: typeof row.team
      } => Boolean(row.person)
    )
    .sort((a, b2) => a.person.name.localeCompare(b2.person.name))

  const filteredStudents = students.filter(
    ({ person }) =>
      !q ||
      `${person.name} ${person.rollNumber ?? ""}`.toLowerCase().includes(q)
  )

  const studentRows = sortRows(filteredStudents, studentSort, {
    name: (r) => r.person.name,
    roll: (r) => r.person.rollNumber ?? "",
  })

  return (
    <>
      <Link
        href="/directory"
        className="inline-flex w-fit items-center gap-1.5 text-meta font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" />
        All batches
      </Link>

      <PageHeader
        divider={false}
        title={batch.label}
        description="The projects and students in this batch."
        actions={
          <Badge size="sm" color={batch.archived ? "gray" : "brand"}>
            {batch.archived ? "Past" : "Current"}
          </Badge>
        }
      />

      <Tabs
        selectedKey={tab}
        onSelectionChange={(key) => setTab(String(key))}
        className="w-full gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabList type="button-border" className="w-fit">
            <Tab id="projects" badge={rows.length}>
              Projects
            </Tab>
            <Tab id="students" badge={students.length}>
              Students
            </Tab>
          </TabList>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              icon={SearchLg}
              value={query}
              onChange={setQuery}
              placeholder={
                tab === "projects"
                  ? "Search students, mentor or project…"
                  : "Search by name or roll number…"
              }
              className="w-96"
            />

            {tab === "projects" && (
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
                  <Select.Item
                    key={mentor.id}
                    id={mentor.id}
                    label={mentor.name}
                  />
                ))}
              </Select>
            )}
          </div>
        </div>

        <TabPanel id="projects" className="space-y-4">
          {rows.length === 0 ? (
            <EmptyState
              title="No matches"
              body="Try a different filter, or clear it."
            />
          ) : (
            <div className="overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary">
              <Table
                aria-label="Projects"
                size="sm"
                sortDescriptor={projectSort}
                onSortChange={setProjectSort}
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
                  <Table.Head id="open" label="" />
                </Table.Header>
                <Table.Body>
                  {rows.map(
                    (
                      { project, studentPeople, mentorPeople },
                      index
                    ) => {
                      const open =
                        !batch.archived && canViewProject(actor, project, db)
                      return (
                        <Table.Row
                          key={project.id}
                          id={project.id}
                          onAction={
                            open
                              ? () => router.push(`/projects/${project.id}`)
                              : undefined
                          }
                        >
                          <Table.Cell className="w-0 text-tertiary tabular-nums">
                            {index + 1}
                          </Table.Cell>
                          <Table.Cell>
                            <PersonChips people={[studentPeople[0]]} />
                          </Table.Cell>
                          <Table.Cell>
                            <PersonChips people={[studentPeople[1]]} empty="—" />
                          </Table.Cell>
                          <Table.Cell>
                            <PersonChips people={mentorPeople} />
                          </Table.Cell>
                          <Table.Cell className="text-right">
                            {open ? (
                              <Button
                                size="sm"
                                color="secondary"
                                href={`/projects/${project.id}`}
                              >
                                Open
                              </Button>
                            ) : (
                              <Lock01 className="ml-auto size-3 text-muted-foreground" />
                            )}
                          </Table.Cell>
                        </Table.Row>
                      )
                    }
                  )}
                </Table.Body>
              </Table>
            </div>
          )}
        </TabPanel>

        <TabPanel id="students">
          {studentRows.length === 0 ? (
            <EmptyState
              title={q ? "No matches" : "No students yet"}
              body={
                q
                  ? "Try a different name, or clear the search."
                  : "Students appear here once they are added to a team."
              }
            />
          ) : (
            <div className="overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary">
              <Table
                aria-label="Students"
                size="sm"
                sortDescriptor={studentSort}
                onSortChange={setStudentSort}
              >
                <Table.Header>
                  <Table.Head id="sno" label="S.No" className="w-0" />
                  <Table.Head
                    id="name"
                    isRowHeader
                    allowsSorting
                    label="Student"
                  />
                  <Table.Head id="roll" allowsSorting label="Roll number" />
                </Table.Header>
                <Table.Body>
                  {studentRows.map(({ person }, index) => (
                    <Table.Row key={person.id} id={person.id}>
                      <Table.Cell className="w-0 text-tertiary tabular-nums">
                        {index + 1}
                      </Table.Cell>
                      <Table.Cell>
                        <PersonChips people={[person]} />
                      </Table.Cell>
                      <Table.Cell className="text-tertiary">
                        {person.rollNumber ?? "—"}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          )}
        </TabPanel>
      </Tabs>
    </>
  )
}
