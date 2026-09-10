"use client"

import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  Archive01Icon,
  ArrowLeft02Icon,
  Link02Icon,
  PencilEdit02Icon,
  ReloadIcon,
} from "@hugeicons/core-free-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { findLikelyDuplicates } from "@/lib/duplicates"
import { backHrefOrDefault, batchHref } from "@/lib/navigation"
import { canEditProject, canManageRecords } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { projects, people, batches, domains, currentUser, archiveProject, restoreProject } =
    useProjectsStore()

  const project = projects.find((p) => p.id === params.id)
  const visible = project && (!project.archived || currentUser.role === "coordinator")

  if (!visible) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Project not found</EmptyTitle>
            <EmptyDescription>
              This project doesn&apos;t exist, or it has been archived and isn&apos;t visible in
              the regular directory.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" render={<Link href="/" />} nativeButton={false}>
              Back to directory
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  const backHref = backHrefOrDefault(searchParams.get("back"), batchHref(project.batchId))

  const batch = batches.find((b) => b.id === project.batchId)
  const domain = domains.find((d) => d.id === project.domainId)
  const team = project.teamMemberIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
  const mentors = project.mentorIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
  const createdBy = people.find((p) => p.id === project.createdBy)
  const updatedBy = people.find((p) => p.id === project.updatedBy)

  const editable = canEditProject(project, currentUser)
  const manageable = canManageRecords(currentUser)
  const duplicates = project.archived
    ? []
    : findLikelyDuplicates(projects, project.title, project.id)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-4" />
        Back to batch
      </Link>

      {project.archived && (
        <Alert variant="destructive">
          <HugeiconsIcon icon={Archive01Icon} strokeWidth={2} />
          <AlertTitle>This project is archived</AlertTitle>
          <AlertDescription>
            It&apos;s hidden from the regular directory. Restore it to make it browsable again.
          </AlertDescription>
        </Alert>
      )}

      {manageable && duplicates.length > 0 && (
        <Alert>
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
          <AlertTitle>Possible duplicate</AlertTitle>
          <AlertDescription>
            Similar title to: {duplicates.map((d) => d.title).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={project.status} />
            {domain && <Badge variant="outline">{domain.label}</Badge>}
            {batch && <Badge variant="outline">{batch.label}</Badge>}
          </div>
          <h1 className="font-heading text-2xl font-medium text-balance">{project.title}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {editable && (
            <Button
              variant="outline"
              render={
                <Link
                  href={`/projects/${project.id}/edit?back=${encodeURIComponent(backHref)}`}
                />
              }
              nativeButton={false}
            >
              <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
              Edit
            </Button>
          )}
          {manageable &&
            (project.archived ? (
              <Button variant="outline" onClick={() => restoreProject(project.id)}>
                <HugeiconsIcon icon={ReloadIcon} strokeWidth={2} />
                Restore
              </Button>
            ) : (
              <Button variant="outline" onClick={() => archiveProject(project.id)}>
                <HugeiconsIcon icon={Archive01Icon} strokeWidth={2} />
                Archive
              </Button>
            ))}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-medium">Team</h2>
          {team.length > 0 ? (
            <ul className="flex flex-col gap-1 text-sm">
              {team.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Unassigned</p>
          )}
        </div>
        <div>
          <h2 className="mb-2 text-sm font-medium">Mentor</h2>
          {mentors.length > 0 ? (
            <ul className="flex flex-col gap-1 text-sm">
              {mentors.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Unassigned</p>
          )}
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="mb-2 text-sm font-medium">Problem</h2>
        <p className="text-sm text-muted-foreground">
          {project.problem || "Not added yet."}
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium">Work so far or outcome</h2>
        <p className="text-sm text-muted-foreground">
          {project.workOrOutcome || "Not added yet."}
        </p>
      </div>

      <Separator />

      <div>
        <h2 className="mb-2 text-sm font-medium">Project materials</h2>
        {project.materials.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {project.materials.map((m) => (
              <li key={m.id}>
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-2 rounded-2xl bg-input/50 px-3 py-2 text-sm hover:bg-input"
                >
                  <HugeiconsIcon icon={Link02Icon} strokeWidth={2} className="size-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium">{m.label}</span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{m.url}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No materials added yet.</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          These are links only — opening one doesn&apos;t guarantee you have access to the file.
        </p>
      </div>

      <Separator />

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span>Project ID: {project.id}</span>
        <span>
          Created by {createdBy?.name ?? "Unknown"} on {format(new Date(project.createdAt), "MMM d, yyyy")}
        </span>
        <span>
          Last updated by {updatedBy?.name ?? "Unknown"} on {format(new Date(project.updatedAt), "MMM d, yyyy")}
        </span>
      </div>
    </div>
  )
}
