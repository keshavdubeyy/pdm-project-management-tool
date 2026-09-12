"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { LockIcon, Search01Icon } from "@hugeicons/core-free-icons"

import { EmptyState, PageHeader, PersonAvatar } from "@/components/common"
import { StatusPill } from "@/components/status/status-pill"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { canViewProject } from "@/lib/permissions"
import { milestoneViews, personById } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { cn } from "@/lib/utils"

/** Every project in the batch, at the level of detail you are allowed.
 *
 * A student sees the shape of the cohort without seeing anybody's feedback;
 * their own project and anything a team has opened up is clickable, and the
 * rest is a title and a mentor. Being able to see that twenty-two teams exist
 * is not the same as being able to read their work. */
export default function DirectoryPage() {
  const { db, actor } = useProjectsStore()
  const [query, setQuery] = React.useState("")
  const [mentorId, setMentorId] = React.useState("all")

  if (!actor) return null

  const mentors = db.people.filter((p) => p.roles.includes("mentor"))
  const q = query.trim().toLowerCase()

  const projects = db.projects
    .filter((p) => !p.archived)
    .filter((p) => (mentorId === "all" ? true : p.mentorIds.includes(mentorId)))
    .filter((p) => {
      if (!q) return true
      const team = db.teams.find((t) => t.id === p.teamId)
      return (
        p.title.toLowerCase().includes(q) ||
        (team?.name.toLowerCase().includes(q) ?? false) ||
        p.description.toLowerCase().includes(q)
      )
    })

  return (
    <>
      <PageHeader
        title="Project directory"
        description={`${projects.length} projects in ${db.batches[0]?.label}.`}
        meta={
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
                placeholder="Search projects…"
                className="h-8 w-64 pl-8"
              />
            </div>
            <Select value={mentorId} onValueChange={(value) => setMentorId(value ?? "all")}>
              <SelectTrigger size="sm" className="w-52">
                <SelectValue placeholder="Every mentor">
                  {(value) =>
                    value === "all"
                      ? "Every mentor"
                      : (mentors.find((m) => m.id === value)?.name ?? "Every mentor")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Every mentor</SelectItem>
                {mentors.map((mentor) => (
                  <SelectItem key={mentor.id} value={mentor.id}>
                    {mentor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {projects.length === 0 ? (
        <EmptyState title={`No projects match “${query}”`} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const team = db.teams.find((t) => t.id === project.teamId)
            const open = canViewProject(actor, project, db)
            const views = milestoneViews(db, [project.id])
            const next = views.find((v) => v.status !== "accepted")
            const accepted = views.filter((v) => v.status === "accepted").length

            const card = (
              <div
                className={cn(
                  "flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors",
                  open && "hover:bg-muted/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-th text-muted-foreground uppercase">{team?.name}</p>
                  {!open && (
                    <HugeiconsIcon
                      icon={LockIcon}
                      className="size-3.5 shrink-0 text-muted-foreground"
                      strokeWidth={2}
                    />
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-subhead text-foreground">{project.title}</p>
                <p className="mt-1 line-clamp-2 flex-1 text-caption text-muted-foreground">
                  {project.description}
                </p>

                <div className="mt-3 flex items-center gap-2 border-t border-border pt-2.5">
                  <PersonAvatar person={personById(db, project.mentorIds[0])} size="xs" />
                  <span className="min-w-0 flex-1 truncate text-caption text-muted-foreground">
                    {personById(db, project.mentorIds[0])?.name}
                  </span>
                  {open && next ? (
                    <StatusPill status={next.status} size="sm" />
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      {accepted}/{views.length}
                    </Badge>
                  )}
                </div>
              </div>
            )

            return (
              <li key={project.id}>
                {open ? <Link href={`/projects/${project.id}`}>{card}</Link> : card}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
