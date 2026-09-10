"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"

import { ProjectForm } from "@/components/project-form"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { batchHref } from "@/lib/navigation"
import { canAddProject } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"

function NewProjectContent() {
  const { currentUser } = useProjectsStore()
  const searchParams = useSearchParams()
  const batchId = searchParams.get("batch") ?? undefined
  const backHref = batchId ? batchHref(batchId) : "/"

  if (!canAddProject(currentUser)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Mentors can&apos;t add projects</EmptyTitle>
            <EmptyDescription>
              Mentors have browse access in this prototype. Switch to Student or Coordinator to
              add a project.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" render={<Link href={backHref} />} nativeButton={false}>
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
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-4" />
        Back to directory
      </Link>
      <h1 className="mb-1 font-heading text-xl font-medium">Add a project</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Enter the basics now — the problem, outcome and materials can be added or updated later.
      </p>
      <ProjectForm mode="create" initialBatchId={batchId} />
    </div>
  )
}

export default function NewProjectPage() {
  return (
    <Suspense>
      <NewProjectContent />
    </Suspense>
  )
}
