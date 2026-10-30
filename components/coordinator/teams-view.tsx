"use client"

import * as React from "react"
import type { SortDescriptor } from "react-aria-components"
import { EmptyState, PersonChips } from "@/components/common"
import { Table, TableCard } from "@/components/untitled/application/table/table"
import { Button } from "@/components/untitled/base/buttons/button"
import { Input } from "@/components/untitled/base/input/input"
import { Select } from "@/components/untitled/base/select/select"
import { formatDate } from "@/lib/dates"
import {
  batchOverview,
  programmeDay,
  type TeamHealth,
  type TeamStatus,
} from "@/lib/overview"
import { useProjectsStore } from "@/lib/store"
import { cn } from "@/lib/utils"

import { SearchLg, Users01 } from "@untitledui/icons"

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

const STATUS_RANK: Record<TeamStatus, string> = {
  behind: "0",
  waiting: "1",
  on_track: "2",
}

/** How a team stands, in words and colour, with the number that explains it. */
export function TeamStatusText({ team }: { team: TeamHealth }) {
  if (team.status === "behind")
    return (
      <span className="font-medium text-status-overdue-fg">
        Behind · {team.overdue} overdue
      </span>
    )
  if (team.status === "waiting")
    return (
      <span className="font-medium text-status-returned-fg">
        Waiting on mentor
        {team.oldestWaitingDays !== null && ` · ${team.oldestWaitingDays}d`}
      </span>
    )
  return <span className="font-medium text-status-accepted-fg">On track</span>
}

/** Accepted checkpoints out of the twelve, as a short bar and the numbers. */
function Progress({ team }: { team: TeamHealth }) {
  const share = team.total ? team.accepted / team.total : 0
  return (
    <span className="flex items-center gap-2">
      <span
        className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"
        aria-hidden
      >
        <span
          className="block h-full rounded-full bg-brand-solid"
          style={{ width: `${Math.round(share * 100)}%` }}
        />
      </span>
      <span className="text-caption text-muted-foreground tabular-nums">
        {team.accepted}/{team.total}
      </span>
    </span>
  )
}

/** Every team in the batch as one list: who is on each project, who mentors it,
 * and how it is doing. Opening a row lands on the same three tabs the students
 * and mentors see. */
export function CoordinatorTeams() {
  const { db } = useProjectsStore()
  const [query, setQuery] = React.useState("")
  const [mentorId, setMentorId] = React.useState<string | null>(null)
  const [sort, setSort] = React.useState<SortState>({
    column: "student1",
    direction: "ascending",
  })

  const mentors = db.people.filter((p) => p.roles.includes("mentor"))
  const q = query.trim().toLowerCase()
  const filtered = batchOverview(db)
    .teams.filter(
      ({ project }) => !mentorId || project.mentorIds.includes(mentorId)
    )
    .filter(
      ({ project, students, mentors: m }) =>
        !q ||
        `${students.map((s) => s.name).join(" ")} ${m.map((x) => x.name).join(" ")} ${project.title}`
          .toLowerCase()
          .includes(q)
    )

  const rows = sortRows(filtered, sort, {
    student1: (r) => r.students[0]?.name ?? "",
    student2: (r) => r.students[1]?.name ?? "",
    mentor: (r) => r.mentors.map((p) => p.name).join(", "),
    progress: (r) => String(r.accepted).padStart(3, "0"),
    status: (r) =>
      `${STATUS_RANK[r.status]}${String(99 - r.overdue).padStart(2, "0")}`,
    activity: (r) => r.lastActivity ?? "",
  })

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <header className="space-y-1.5">
          <h1 className="text-page text-foreground">Teams</h1>
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
            aria-label="Teams"
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
              <Table.Head id="progress" allowsSorting label="Progress" />
              <Table.Head id="status" allowsSorting label="Status" />
              <Table.Head id="activity" allowsSorting label="Last activity" />
              <Table.Head id="actions" aria-label="Actions" className="w-0" />
            </Table.Header>
            <Table.Body
              items={rows.map((r, i) => ({
                ...r,
                id: r.project.id,
                no: i + 1,
              }))}
            >
              {(team) => (
                <Table.Row id={team.id} href={`/projects/${team.project.id}`}>
                  <Table.Cell className="w-0 text-tertiary tabular-nums">
                    {team.no}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap">
                    <PersonChips people={[team.students[0]]} />
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap">
                    <PersonChips people={[team.students[1]]} empty="—" />
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap">
                    <PersonChips people={team.mentors} />
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap">
                    <Progress team={team} />
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap">
                    <TeamStatusText team={team} />
                  </Table.Cell>
                  <Table.Cell
                    className={cn(
                      "whitespace-nowrap",
                      !team.lastActivity && "text-tertiary"
                    )}
                  >
                    {team.lastActivity
                      ? formatDate(programmeDay(team.lastActivity))
                      : "—"}
                  </Table.Cell>
                  <Table.Cell className="w-0 pr-4 text-right">
                    <Button
                      size="sm"
                      color="secondary"
                      href={`/projects/${team.project.id}`}
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
