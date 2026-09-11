import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight02Icon, FolderLibraryIcon } from "@hugeicons/core-free-icons"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { batchHref } from "@/lib/navigation"
import type { Batch } from "@/lib/types"

type BatchCardProps = {
  batch: Batch
  projectCount: number
  ongoingCount: number
  completedCount: number
  backHref?: string
}

export function BatchCard({ batch, projectCount, ongoingCount, completedCount, backHref }: BatchCardProps) {
  return (
    <Link
      href={batchHref(batch.id, backHref)}
      className="block rounded-4xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <HugeiconsIcon icon={FolderLibraryIcon} strokeWidth={2} className="size-4.5" />
          </div>
          <CardTitle className="truncate">{batch.label}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          {projectCount === 0 ? (
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-foreground">0 projects</p>
              <p className="text-sm text-muted-foreground">No projects added yet.</p>
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
          <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} className="size-4" />
        </CardFooter>
      </Card>
    </Link>
  )
}
