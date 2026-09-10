"use client"

import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { projectHref } from "@/lib/navigation"
import type { Batch, Domain, Person, Project } from "@/lib/types"

type ProjectTableProps = {
  projects: Project[]
  people: Person[]
  batches: Batch[]
  domains: Domain[]
  backHref?: string
}

export function ProjectTable({ projects, people, batches, domains, backHref }: ProjectTableProps) {
  const router = useRouter()

  function names(ids: string[]) {
    const found = ids
      .map((id) => people.find((p) => p.id === id)?.name)
      .filter((n): n is string => Boolean(n))
    return found.length > 0 ? found.join(", ") : "Unassigned"
  }

  return (
    <div className="overflow-hidden rounded-3xl ring-1 ring-foreground/5 dark:ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Mentor</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const batch = batches.find((b) => b.id === project.batchId)
            const domain = domains.find((d) => d.id === project.domainId)

            return (
              <TableRow
                key={project.id}
                tabIndex={0}
                role="link"
                aria-label={project.title}
                className="cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                onClick={() => router.push(projectHref(project.id, backHref))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    router.push(projectHref(project.id, backHref))
                  }
                }}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1.5">
                    {project.title}
                    {project.archived && <Badge variant="destructive">Archived</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={project.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{batch?.label ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{domain?.label ?? "—"}</TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  {names(project.teamMemberIds)}
                </TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  {names(project.mentorIds)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
