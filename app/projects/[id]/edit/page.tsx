"use client"

import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"

import { ProjectForm } from "@/components/project-form"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { backHrefOrDefault, projectHref } from "@/lib/navigation"
import { canEditProject } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"

export default function EditProjectPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const back = searchParams.get("back")
  const { projects, currentUser } = useProjectsStore()
  const project = projects.find((p) => p.id === params.id)

  if (!project || !canEditProject(project, currentUser)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Can&apos;t edit this project</EmptyTitle>
            <EmptyDescription>
              {project
                ? "Only project members and the coordinator can edit this record."
                : "This project doesn't exist."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              render={<Link href={backHrefOrDefault(back, "/")} />}
              nativeButton={false}
            >
              Back to directory
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <Link
        href={projectHref(project.id, back ?? undefined)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-4" />
        Back to project
      </Link>
      <h1 className="mb-1 font-heading text-xl font-medium">Edit project</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Update details as the project develops. Changes are visible in the directory right away.
      </p>
      <ProjectForm mode="edit" project={project} />
    </div>
  )
}
