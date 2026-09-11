"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Archive01Icon,
  ArchiveRestoreIcon,
  MoreVerticalIcon,
  PencilEdit02Icon,
  Share08Icon,
} from "@hugeicons/core-free-icons"

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"
import { StatusBadge } from "@/components/status-badge"
import { canEditProject, canManageRecords } from "@/lib/permissions"
import { projectHref } from "@/lib/navigation"
import { useProjectsStore } from "@/lib/store"
import { getInitials } from "@/lib/utils"
import type { Domain, Person, Project } from "@/lib/types"

type ProjectCardProps = {
  project: Project
  people: Person[]
  domains: Domain[]
  backHref?: string
}

function PersonAvatars({ people }: { people: Person[] }) {
  if (people.length === 0)
    return <span className="text-sm text-muted-foreground">Unassigned</span>

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <AvatarGroup>
        {people.map((person) => (
          <Avatar key={person.id} size="sm">
            {person.avatarUrl && (
              <AvatarImage src={person.avatarUrl} alt={person.name} />
            )}
            <AvatarFallback className="text-[10px]">
              {getInitials(person.name)}
            </AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>
      <span className="truncate text-sm text-muted-foreground">
        {people.map((p) => p.name).join(", ")}
      </span>
    </div>
  )
}

export function ProjectCard({
  project,
  people,
  domains,
  backHref,
}: ProjectCardProps) {
  const { currentUser, archiveProject, restoreProject } = useProjectsStore()
  const domain = domains.find((d) => d.id === project.domainId)
  const team = project.teamMemberIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => Boolean(p))
  const mentors = project.mentorIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => Boolean(p))

  function handleShare() {
    const url = `${window.location.origin}${projectHref(project.id)}`
    navigator.clipboard.writeText(url)
    toast.add({
      title: "Link copied",
      description: project.title,
      type: "success",
    })
  }

  function handleArchiveToggle() {
    if (project.archived) {
      restoreProject(project.id)
      toast.add({
        title: "Project restored",
        description: project.title,
        type: "success",
      })
    } else {
      archiveProject(project.id)
      toast.add({
        title: "Project archived",
        description: project.title,
        type: "success",
      })
    }
  }

  return (
    <div className="relative">
      <Link
        href={projectHref(project.id, backHref)}
        className="block rounded-4xl focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
      >
        <Card className="h-full transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardAction>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                      }}
                    />
                  }
                >
                  <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} />
                  <span className="sr-only">Project actions</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEditProject(project, currentUser) && (
                    <DropdownMenuItem
                      render={<Link href={`/projects/${project.id}/edit`} />}
                    >
                      <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleShare}>
                    <HugeiconsIcon icon={Share08Icon} strokeWidth={2} />
                    Share
                  </DropdownMenuItem>
                  {canManageRecords(currentUser) && (
                    <DropdownMenuItem
                      variant={project.archived ? "default" : "destructive"}
                      onClick={handleArchiveToggle}
                    >
                      <HugeiconsIcon
                        icon={
                          project.archived ? ArchiveRestoreIcon : Archive01Icon
                        }
                        strokeWidth={2}
                      />
                      {project.archived ? "Restore" : "Archive"}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardAction>
            <div className="flex flex-wrap items-center gap-1.5 pr-8">
              <StatusBadge status={project.status} />
              {project.archived && (
                <Badge variant="destructive">Archived</Badge>
              )}
              {domain && <Badge variant="outline">{domain.label}</Badge>}
            </div>
            <CardTitle className="mt-1.5 line-clamp-1">
              {project.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {project.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground/70">Team</span>
              <PersonAvatars people={team} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground/70">Mentor</span>
              <PersonAvatars people={mentors} />
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Updated{" "}
            {formatDistanceToNow(new Date(project.updatedAt), {
              addSuffix: true,
            })}
          </CardFooter>
        </Card>
      </Link>
    </div>
  )
}
