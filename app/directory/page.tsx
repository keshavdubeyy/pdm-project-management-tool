"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { LockIcon, Search01Icon } from "@hugeicons/core-free-icons"

import { EmptyState, PageHeader } from "@/components/common"
import { PersonCombobox } from "@/components/person-combobox"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import { canViewProject, isCoordinator } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"
import type { ProjectStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

type StatusFilter = "all" | ProjectStatus

/** Every project in the batch, in one register.
 *
 * The prototype this replaced was a directory as its whole personality — a
 * table of every team, mentor and domain, nothing scoped to "your reach". That
 * plain registry is still asked for often enough — "which domain is this
 * batch light on", "who is Team Vertex's mentor" — to deserve its own page,
 * separate from /projects, which answers a different question: not "what
 * exists" but "what needs me today".
 */
export default function DirectoryPage() {
  const router = useRouter()
  const { db, actor } = useProjectsStore()
  const [query, setQuery] = React.useState("")
  const [domainId, setDomainId] = React.useState<string>("all")
  const [status, setStatus] = React.useState<StatusFilter>("all")
  const [mentorId, setMentorId] = React.useState<string | null>(null)
  const [showArchived, setShowArchived] = React.useState(false)

  if (!actor) return null

  const mentors = db.people.filter((p) => p.roles.includes("mentor"))
  const q = query.trim().toLowerCase()

  const rows = db.projects
    .filter((project) => showArchived || !project.archived)
    .filter((project) => domainId === "all" || project.domainId === domainId)
    .filter((project) => status === "all" || project.status === status)
    .filter((project) => !mentorId || project.mentorIds.includes(mentorId))
    .map((project) => {
      const batch = db.batches.find((b) => b.id === project.batchId)
      const domain = db.domains.find((d) => d.id === project.domainId)
      const team = db.teams.find((t) => t.id === project.teamId)
      const students = (team?.memberIds ?? [])
        .map((id) => db.people.find((p) => p.id === id)?.name)
        .filter((name): name is string => Boolean(name))
      const mentorNames = project.mentorIds
        .map((id) => db.people.find((p) => p.id === id)?.name)
        .filter((name): name is string => Boolean(name))
      return { project, batch, domain, team, students, mentorNames }
    })
    .filter(({ project, team }) => {
      if (!q) return true
      const hay = `${project.title} ${team?.name ?? ""} ${project.description}`.toLowerCase()
      return hay.includes(q)
    })
    .sort((a, b) => a.project.title.localeCompare(b.project.title))

  return (
    <>
      <PageHeader
        title="Directory"
        description={`${rows.length} ${rows.length === 1 ? "project" : "projects"} across ${db.batches.length} ${db.batches.length === 1 ? "batch" : "batches"}.`}
      />

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
            className="h-8 w-52 rounded-lg pl-8"
          />
        </div>

        <Select value={domainId} onValueChange={(value) => setDomainId(value ?? "all")}>
          <SelectTrigger size="sm" className="w-40">
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
          <SelectTrigger size="sm" className="w-36">
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
          className="w-48"
        />

        {isCoordinator(actor) && (
          <label className="flex items-center gap-1.5 text-meta text-muted-foreground">
            <Checkbox checked={showArchived} onCheckedChange={() => setShowArchived((v) => !v)} />
            Include archived
          </label>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Nothing matches" body="Try a different chip, or clear the filter." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Mentor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ project, batch, domain, team, students, mentorNames }) => {
                const open = canViewProject(actor, project, db)
                const cells = (
                  <>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate">{project.title}</span>
                        {project.archived && (
                          <Badge variant="destructive" className="text-micro">
                            Archived
                          </Badge>
                        )}
                        {!open && (
                          <HugeiconsIcon
                            icon={LockIcon}
                            className="size-3 shrink-0 text-muted-foreground"
                            strokeWidth={2}
                          />
                        )}
                      </div>
                      <p className="truncate text-caption text-muted-foreground">{team?.name}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={project.status === "completed" ? "secondary" : "outline"}>
                        {project.status === "completed" ? "Completed" : "Ongoing"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{batch?.label ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{domain?.label ?? "—"}</TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground">
                      {students.length > 0 ? students.join(", ") : "Unassigned"}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground">
                      {mentorNames.length > 0 ? mentorNames.join(", ") : "Unassigned"}
                    </TableCell>
                  </>
                )
                return (
                  <TableRow
                    key={project.id}
                    tabIndex={open ? 0 : undefined}
                    role={open ? "link" : undefined}
                    aria-label={open ? project.title : undefined}
                    className={cn(
                      open && "cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
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
                    {cells}
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
