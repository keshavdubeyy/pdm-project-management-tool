"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { detectService, guessLabel, isValidUrl, SERVICE_META } from "@/lib/links"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import { cn } from "@/lib/utils"

/** Paste a link, get a labelled artefact.
 *
 * The service is recognised from the URL and the title is inferred from it, so
 * the common case is paste-and-add. Nothing is fetched: a private Drive
 * document would refuse the request anyway, and asking for Drive permissions
 * to read a title nobody disputes is a bad trade. */
export function AddArtefact({
  projectId,
  milestoneInstanceId,
  onAdded,
  className,
}: {
  projectId: string
  milestoneInstanceId?: string | null
  onAdded?: () => void
  className?: string
}) {
  const { addArtefact } = useProjectsStore()
  const [url, setUrl] = React.useState("")
  const [label, setLabel] = React.useState("")
  const [touchedLabel, setTouchedLabel] = React.useState(false)

  const valid = isValidUrl(url)
  const service = valid ? detectService(url) : null
  const meta = service ? SERVICE_META[service] : null

  React.useEffect(() => {
    if (!touchedLabel && valid) setLabel(guessLabel(url))
  }, [touchedLabel, url, valid])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!valid) return
    const result = addArtefact(projectId, {
      url,
      label,
      milestoneInstanceId: milestoneInstanceId ?? null,
    })
    if (report(result, "Link added")) {
      setUrl("")
      setLabel("")
      setTouchedLabel(false)
      onAdded?.()
    }
  }

  return (
    <form onSubmit={submit} className={cn("space-y-3", className)}>
      <div className="space-y-1.5">
        <Label htmlFor="artefact-url">Link to the work</Label>
        <Input
          id="artefact-url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Paste a Google Doc, Figma file, Miro board or GitHub repo…"
          autoComplete="off"
          spellCheck={false}
        />
        {url && !valid && (
          <p className="text-caption text-destructive">
            That does not look like a web address. It should start with https://
          </p>
        )}
        {meta && (
          <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <HugeiconsIcon icon={meta.icon} className={cn("size-3.5", meta.tint)} strokeWidth={2} />
            Recognised as {meta.label}
            {meta.embeddable && " · can be previewed inside a review"}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="artefact-label">What is it called?</Label>
        <Input
          id="artefact-label"
          value={label}
          onChange={(event) => {
            setTouchedLabel(true)
            setLabel(event.target.value)
          }}
          placeholder="Customer Validation Report"
        />
      </div>

      <Button type="submit" size="sm" disabled={!valid || !label.trim()}>
        <HugeiconsIcon icon={PlusSignIcon} className="size-4" strokeWidth={2} />
        Add link
      </Button>
    </form>
  )
}
