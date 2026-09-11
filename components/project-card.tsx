import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { projectHref } from "@/lib/navigation"
import type { Batch, Domain, Person, Project } from "@/lib/types"

type ProjectCardProps = {
  project: Project
  people: Person[]
  batches: Batch[]
  domains: Domain[]
  backHref?: string
}

export function ProjectCard({ project, people, batches, domains, backHref }: ProjectCardProps) {
  const batch = batches.find((b) => b.id === project.batchId)
  const domain = domains.find((d) => d.id === project.domainId)
  const team = project.teamMemberIds
    .map((id) => people.find((p) => p.id === id)?.name)
    .filter((n): n is string => Boolean(n))
  const mentors = project.mentorIds
    .map((id) => people.find((p) => p.id === id)?.name)
    .filter((n): n is string => Boolean(n))

  return (
    <Link
      href={projectHref(project.id, backHref)}
      className="block rounded-4xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={project.status} />
            {project.archived && <Badge variant="destructive">Archived</Badge>}
            {domain && <Badge variant="outline">{domain.label}</Badge>}
          </div>
          <CardTitle className="mt-1.5 line-clamp-2">{project.title}</CardTitle>
          <CardDescription className="line-clamp-2">{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <div>{batch?.label ?? "No batch"}</div>
          <div className="truncate">Team: {team.length > 0 ? team.join(", ") : "Unassigned"}</div>
          <div className="truncate">Mentor: {mentors.length > 0 ? mentors.join(", ") : "Unassigned"}</div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
        </CardFooter>
      </Card>
    </Link>
  )
}
