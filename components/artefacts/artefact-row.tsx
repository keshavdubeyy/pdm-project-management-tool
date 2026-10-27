"use client"

import * as React from "react"
import { PersonAvatar } from "@/components/common"
import { useConfirm } from "@/components/confirm-dialog"
import { Button } from "@/components/untitled/base/buttons/button"
import { ModalDialog } from "@/components/untitled/application/modals/modal-dialog"
import { timeAgo } from "@/lib/dates"
import { embedUrl, hostOf, SERVICE_META } from "@/lib/links"
import { personById } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { Artefact } from "@/lib/types"
import { cn } from "@/lib/utils"

import { Eye, LinkExternal01, Trash01 } from "@untitledui/icons"

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
  const { confirm, dialog: confirmDialog } = useConfirm()
  const [previewing, setPreviewing] = React.useState(false)
  const meta = SERVICE_META[artefact.service]
  const embed = embedUrl(artefact.url)
  const addedBy = personById(db, artefact.addedBy)

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border bg-card px-3",
          compact ? "py-2" : "py-2.5"
        )}
      >
        <meta.icon className={cn("size-4 shrink-0", meta.tint)} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-meta font-medium text-foreground">
            {artefact.label}
          </p>
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
              color="tertiary"
              size="xs"
              onPress={() => setPreviewing(true)}
              aria-label={`Preview ${artefact.label}`}
              iconLeading={Eye}
            />
          )}
          <Button
            color="tertiary"
            size="xs"
            href={artefact.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${artefact.label}`}
            iconLeading={LinkExternal01}
          />
          {onRemove && (
            <Button
              color="tertiary-destructive"
              size="xs"
              aria-label={`Remove ${artefact.label}`}
              onPress={() =>
                confirm({
                  title: `Remove "${artefact.label}"?`,
                  description: "The link is removed from this project.",
                  confirmLabel: "Remove",
                  destructive: true,
                  onConfirm: () =>
                    report(removeArtefact(artefact.id), "Link removed"),
                })
              }
              iconLeading={Trash01}
            />
          )}
        </div>
      </div>

      {confirmDialog}
      {embed && (
        <ModalDialog
          isOpen={previewing}
          onOpenChange={setPreviewing}
          size="4xl"
          title={artefact.label}
        >
          <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted">
            <iframe
              src={embed}
              title={artefact.label}
              className="size-full"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>
          <p className="text-caption text-muted-foreground">
            Shown from {meta.label}. If it stays blank, the document is private
            and only its owner can open it —{" "}
            <a
              href={artefact.url}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              open it there instead
            </a>
            .
          </p>
        </ModalDialog>
      )}
    </>
  )
}
