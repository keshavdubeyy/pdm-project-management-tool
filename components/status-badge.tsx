import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ProjectStatus } from "@/lib/types"

const statusStyles: Record<ProjectStatus, string> = {
  ongoing:
    "border-transparent bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  completed:
    "border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
}

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus
  className?: string
}) {
  return <Badge className={cn("capitalize", statusStyles[status], className)}>{status}</Badge>
}
