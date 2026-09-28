"use client"

import * as React from "react"

import { EmptyState, PageHeader, PersonAvatar } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROLE_LABEL } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"
import type { Person, Role } from "@/lib/types"

type RoleFilter = "all" | Role

/** Every person in the batch, in one register.
 *
 * The prototype this replaced had a directory as its whole personality — this
 * one is a single page inside a lifecycle, but the question "who is this and
 * how do I reach them" is still asked often enough to deserve its own place
 * rather than a hover card three clicks deep in the grid.
 */
export default function DirectoryPage() {
  const { db, actor } = useProjectsStore()
  const [query, setQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<RoleFilter>("all")

  if (!actor) return null

  const projectFor = (person: Person) => {
    const team = db.teams.find((t) => t.memberIds.includes(person.id))
    return team ? db.projects.find((p) => p.teamId === team.id) : undefined
  }

  const q = query.trim().toLowerCase()
  const people = db.people
    .filter((p) => roleFilter === "all" || p.roles.includes(roleFilter))
    .filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.rollNumber ?? "").toLowerCase().includes(q)
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <PageHeader
        title="Directory"
        description="Every student and mentor in this batch, and how to reach them."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, roll number or email…"
          className="max-w-xs"
        />
        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter((value as RoleFilter) ?? "all")}
        >
          <SelectTrigger size="sm" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="mentor">Mentors</SelectItem>
            <SelectItem value="coordinator">Coordinators</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-meta text-muted-foreground">
          {people.length} {people.length === 1 ? "person" : "people"}
        </span>
      </div>

      {people.length === 0 ? (
        <EmptyState title="Nobody matches" body="Try a different name, roll number or role." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Roll number</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team / project</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person) => {
                const project = projectFor(person)
                return (
                  <TableRow key={person.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PersonAvatar person={person} size="xs" />
                        <span className="font-medium text-foreground">{person.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {person.rollNumber ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {person.roles.map((role) => (
                          <Badge key={role} variant="outline" className="text-micro">
                            {ROLE_LABEL[role]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{project?.title ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{person.email}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
