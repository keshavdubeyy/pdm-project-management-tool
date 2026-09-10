import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight02Icon, FolderLibraryIcon } from "@hugeicons/core-free-icons"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { batchHref } from "@/lib/navigation"
import type { Batch } from "@/lib/types"

type BatchCardProps = {
  batch: Batch
  projectCount: number
}

export function BatchCard({ batch, projectCount }: BatchCardProps) {
  return (
    <Link
      href={batchHref(batch.id)}
      className="block rounded-4xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader>
          <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <HugeiconsIcon icon={FolderLibraryIcon} strokeWidth={2} />
          </div>
          <CardTitle className="mt-1">{batch.label}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {projectCount} {projectCount === 1 ? "project" : "projects"}
        </CardContent>
        <CardFooter className="text-sm font-medium text-foreground">
          View batch
          <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} className="size-4" />
        </CardFooter>
      </Card>
    </Link>
  )
}
