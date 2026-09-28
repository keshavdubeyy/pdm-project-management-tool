"use client"

import * as React from "react"
import Link from "next/link"
import { notFound, useParams, useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, LockIcon, Search01Icon } from "@hugeicons/core-free-icons"

import { EmptyState, PageHeader, PersonAvatar } from "@/components/common"
import { PersonCombobox } from "@/components/person-combobox"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { canViewProject } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"
import type { ProjectStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

type StatusFilter = "all" | ProjectStatus

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
  const [query, setQuery] = React.useState("")
  const [domainId, setDomainId] = React.useState<string>("all")
  const [status, setStatus] = React.useState<StatusFilter>("all")
  const [mentorId, setMentorId] = React.useState<string | null>(null)

  const batch = db.batches.find((b) => b.id === params.batchId)

  if (!actor) return null
  if (!batch) return notFound()

  const mentors = db.people.filter((p) => p.roles.includes("mentor"))
  const batchProjects = db.projects.filter((p) => p.batchId === batch.id)
  const q = query.trim().toLowerCase()

  const rows = batchProjects
    .filter((project) => domainId === "all" || project.domainId === domainId)
    .filter((project) => status === "all" || project.status === status)
    .filter((project) => !mentorId || project.mentorIds.includes(mentorId))
    .map((project) => {
      const domain = db.domains.find((d) => d.id === project.domainId)
      const team = db.teams.find((t) => t.id === project.teamId)
      const students = (team?.memberIds ?? [])
        .map((id) => db.people.find((p) => p.id === id)?.name)
        .filter((name): name is string => Boolean(name))
      const mentorNames = project.mentorIds
        .map((id) => db.people.find((p) => p.id === id)?.name)
        .filter((name): name is string => Boolean(name))
      return { project, domain, team, students, mentorNames }
    })
    .filter(({ project, team }) => {
      if (!q) return true
      const hay = `${project.title} ${team?.name ?? ""} ${project.description}`.toLowerCase()
      return hay.includes(q)
    })
    .sort((a, b2) => a.project.title.localeCompare(b2.project.title))

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
      (row): row is { person: NonNullable<typeof row.person>; team: (typeof row.team) } =>
        Boolean(row.person)
    )
    .sort((a, b2) => a.person.name.localeCompare(b2.person.name))

  return (
    <>
      <Link
        href="/directory"
        className="inline-flex w-fit items-center gap-1.5 text-meta font-medium text-muted-foreground hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-3.5" />
        All batches
      </Link>

      <PageHeader
        title={batch.label}
        description={`${batch.admissionYear}–${batch.graduationYear}${batch.description ? ` · ${batch.description}` : ""}`}
        actions={
          <Badge variant={batch.archived ? "outline" : "default"}>
            {batch.archived ? "Past" : "Current"}
          </Badge>
        }
      />

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects ({rows.length})</TabsTrigger>
          <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                strokeWidth={2}
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title or team…"
                className="h-9 w-56 rounded-lg pl-8"
              />
            </div>

            <Select value={domainId} onValueChange={(value) => setDomainId(value ?? "all")}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Every domain</SelectItem>
                {db.domains.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(value) => setStatus((value as StatusFilter) ?? "all")}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Every status</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <PersonCombobox
              people={mentors}
              value={mentorId}
              onChange={setMentorId}
              allowEmpty
              emptyLabel="Every mentor"
              placeholder="Filter by mentor…"
              className="h-9 w-52"
            />
          </div>

          {rows.length === 0 ? (
            <EmptyState title="Nothing matches" body="Try a different chip, or clear the filter." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-3">Title</TableHead>
                    <TableHead className="py-3">Status</TableHead>
                    <TableHead className="py-3">Domain</TableHead>
                    <TableHead className="py-3">Team</TableHead>
                    <TableHead className="py-3">Mentor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ project, domain, team, students: teamStudents, mentorNames }) => {
                    const open = !batch.archived && canViewProject(actor, project, db)
                    return (
                      <TableRow
                        key={project.id}
                        tabIndex={open ? 0 : undefined}
                        role={open ? "link" : undefined}
                        aria-label={open ? project.title : undefined}
                        className={cn(
                          "align-top",
                          open &&
                            "cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                        )}
                        onClick={open ? () => router.push(`/projects/${project.id}`) : undefined}
                        onKeyDown={
                          open
                            ? (event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault()
                                  router.push(`/projects/${project.id}`)
                                }
                              }
                            : undefined
                        }
                      >
                        <TableCell className="h-auto min-w-56 py-3.5 align-top font-medium whitespace-normal text-foreground">
                          <div className="flex items-start gap-1.5">
                            <span>{project.title}</span>
                            {project.archived && (
                              <Badge variant="destructive" className="shrink-0 text-micro">
                                Archived
                              </Badge>
                            )}
                            {!open && (
                              <HugeiconsIcon
                                icon={LockIcon}
                                className="mt-0.5 size-3 shrink-0 text-muted-foreground"
                                strokeWidth={2}
                              />
                            )}
                          </div>
                          <p className="mt-1 text-caption text-muted-foreground">{team?.name}</p>
                        </TableCell>
                        <TableCell className="h-auto py-3.5 align-top">
                          <Badge variant={project.status === "completed" ? "secondary" : "outline"}>
                            {project.status === "completed" ? "Completed" : "Ongoing"}
                          </Badge>
                        </TableCell>
                        <TableCell className="h-auto py-3.5 align-top text-muted-foreground">
                          {domain?.label ?? "—"}
                        </TableCell>
                        <TableCell className="h-auto max-w-56 py-3.5 align-top whitespace-normal text-muted-foreground">
                          {teamStudents.length > 0 ? teamStudents.join(", ") : "Unassigned"}
                        </TableCell>
                        <TableCell className="h-auto max-w-48 py-3.5 align-top whitespace-normal text-muted-foreground">
                          {mentorNames.length > 0 ? mentorNames.join(", ") : "Unassigned"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="students" className="mt-5">
          {students.length === 0 ? (
            <EmptyState title="No students yet" body="Nobody is on a team in this batch." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {students.map(({ person, team }) => (
                <li
                  key={person.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5"
                >
                  <PersonAvatar person={person} size="default" />
                  <div className="min-w-0">
                    <p className="truncate text-subhead font-medium text-foreground">{person.name}</p>
                    <p className="mt-0.5 truncate text-caption text-muted-foreground">
                      {person.rollNumber ?? "—"} · {team.name}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
