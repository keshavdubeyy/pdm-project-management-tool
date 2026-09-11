"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Archive01Icon,
  ArchiveRestoreIcon,
  ArrowRight02Icon,
  FolderLibraryIcon,
  MoreVerticalIcon,
  PencilEdit02Icon,
  Share08Icon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
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
import { EditBatchSheet } from "@/components/edit-batch-sheet"
import { batchHref } from "@/lib/navigation"
import { canManageRecords } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"
import type { Batch } from "@/lib/types"

type BatchCardProps = {
  batch: Batch
  projectCount: number
  ongoingCount: number
  completedCount: number
  backHref?: string
}

export function BatchCard({
  batch,
  projectCount,
  ongoingCount,
  completedCount,
  backHref,
}: BatchCardProps) {
  const { projects, currentUser, archiveBatch, restoreBatch } =
    useProjectsStore()
  const [editOpen, setEditOpen] = React.useState(false)
  const hasActiveProjects = projects.some(
    (p) => p.batchId === batch.id && !p.archived
  )

  function handleShare() {
    const url = `${window.location.origin}${batchHref(batch.id)}`
    navigator.clipboard.writeText(url)
    toast.add({
      title: "Link copied",
      description: batch.label,
      type: "success",
    })
  }

  function handleArchiveToggle() {
    if (batch.archived) {
      restoreBatch(batch.id)
      toast.add({
        title: "Batch restored",
        description: batch.label,
        type: "success",
      })
    } else if (hasActiveProjects) {
      toast.add({
        title: "Can't archive this batch",
        description:
          "It still has projects in it. Archive or move those first.",
        type: "error",
      })
    } else {
      archiveBatch(batch.id)
      toast.add({
        title: "Batch archived",
        description: batch.label,
        type: "success",
      })
    }
  }

  return (
    <div className="relative">
      <Link
        href={batchHref(batch.id, backHref)}
        className="block rounded-4xl focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
      >
        <Card className="h-full transition-shadow hover:shadow-lg">
          <CardHeader className="flex-row items-center gap-3 space-y-0 pr-12">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <HugeiconsIcon
                icon={FolderLibraryIcon}
                strokeWidth={2}
                className="size-4.5"
              />
            </div>
            <CardTitle className="truncate">{batch.label}</CardTitle>
            {batch.archived && (
              <Badge variant="destructive" className="shrink-0">
                Archived
              </Badge>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            {projectCount === 0 ? (
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-foreground">
                  0 projects
                </p>
                <p className="text-sm text-muted-foreground">
                  No projects added yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-foreground">
                  {projectCount} {projectCount === 1 ? "project" : "projects"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {ongoingCount} ongoing &middot; {completedCount} completed
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="mt-auto justify-between text-sm font-medium text-foreground">
            Open batch
            <HugeiconsIcon
              icon={ArrowRight02Icon}
              strokeWidth={2}
              className="size-4"
            />
          </CardFooter>
        </Card>
      </Link>

      <div className="absolute top-4 right-4">
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
            <span className="sr-only">Batch actions</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canManageRecords(currentUser) && (
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
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
                variant={batch.archived ? "default" : "destructive"}
                disabled={!batch.archived && hasActiveProjects}
                onClick={handleArchiveToggle}
              >
                <HugeiconsIcon
                  icon={batch.archived ? ArchiveRestoreIcon : Archive01Icon}
                  strokeWidth={2}
                />
                {batch.archived ? "Restore" : "Archive"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditBatchSheet
        batch={batch}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  )
}
