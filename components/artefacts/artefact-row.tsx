"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, ExternalLinkIcon, ViewIcon } from "@hugeicons/core-free-icons"

import { PersonAvatar } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { timeAgo } from "@/lib/dates"
import { embedUrl, hostOf, SERVICE_META } from "@/lib/links"
import { personById } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { Artefact } from "@/lib/types"
import { cn } from "@/lib/utils"

/** A piece of work that lives somewhere else.
 *
 * The system holds the link and the context around it rather than the file.
 * Where the service publishes an embed, the work can be read without leaving
 * the review — which is the difference between a mentor glancing at it and a
 * mentor opening five tabs. */
export function ArtefactRow({
  artefact,
  onRemove,
  compact,
}: {
  artefact: Artefact
  onRemove?: boolean
  compact?: boolean
}) {
  const { db, removeArtefact } = useProjectsStore()
  const [previewing, setPreviewing] = React.useState(false)
  const meta = SERVICE_META[artefact.service]
  const embed = embedUrl(artefact.url)
  const addedBy = personById(db, artefact.addedBy)

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-sm border border-border bg-card px-3",
          compact ? "py-2" : "py-2.5"
        )}
      >
        <HugeiconsIcon
          icon={meta.icon}
          className={cn("size-4 shrink-0", meta.tint)}
          strokeWidth={2}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-meta font-medium text-foreground">{artefact.label}</p>
          <p className="truncate text-caption text-muted-foreground">
            {meta.label}
            {!compact && addedBy && ` · added by ${addedBy.name.split(" ")[0]}`}
            {!compact && ` · ${timeAgo(artefact.addedAt)}`}
            {compact && ` · ${hostOf(artefact.url)}`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {embed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPreviewing(true)}
              aria-label={`Preview ${artefact.label}`}
            >
              <HugeiconsIcon icon={ViewIcon} className="size-4" strokeWidth={2} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            nativeButton={false}
            render={
              <a href={artefact.url} target="_blank" rel="noreferrer" aria-label={`Open ${artefact.label}`} />
            }
          >
            <HugeiconsIcon icon={ExternalLinkIcon} className="size-4" strokeWidth={2} />
          </Button>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${artefact.label}`}
              onClick={() => report(removeArtefact(artefact.id), "Link removed")}
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} />
            </Button>
          )}
        </div>
      </div>

      {embed && (
        <Dialog open={previewing} onOpenChange={setPreviewing}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{artefact.label}</DialogTitle>
            </DialogHeader>
            <div className="aspect-[4/3] w-full overflow-hidden rounded-sm border border-border bg-muted">
              <iframe
                src={embed}
                title={artefact.label}
                className="size-full"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
            <p className="text-caption text-muted-foreground">
              Shown from {meta.label}. If it stays blank, the document is private and only its
              owner can open it —{" "}
              <a href={artefact.url} target="_blank" rel="noreferrer" className="underline">
                open it there instead
              </a>
              .
            </p>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
