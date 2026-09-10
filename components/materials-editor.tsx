"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon, Link02Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { MaterialLink } from "@/lib/types"

type MaterialsEditorProps = {
  value: MaterialLink[]
  onChange: (materials: MaterialLink[]) => void
}

export function MaterialsEditor({ value, onChange }: MaterialsEditorProps) {
  const [label, setLabel] = React.useState("")
  const [url, setUrl] = React.useState("")

  function addMaterial() {
    if (!label.trim() || !url.trim()) return
    onChange([
      ...value,
      {
        id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        label: label.trim(),
        url: url.trim(),
      },
    ])
    setLabel("")
    setUrl("")
  }

  function removeMaterial(id: string) {
    onChange(value.filter((m) => m.id !== id))
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <ul className="flex flex-col gap-2">
          {value.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-2 rounded-2xl bg-input/50 px-3 py-2 text-sm"
            >
              <HugeiconsIcon
                icon={Link02Icon}
                strokeWidth={2}
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="shrink-0 font-medium">{m.label}</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{m.url}</span>
              <button
                type="button"
                onClick={() => removeMaterial(m.id)}
                className="shrink-0 rounded-full p-1 hover:bg-foreground/10"
                aria-label={`Remove ${m.label}`}
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Link name, e.g. Report"
          className="sm:w-44"
        />
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://..."
        />
        <Button
          type="button"
          variant="outline"
          onClick={addMaterial}
          disabled={!label.trim() || !url.trim()}
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          Add
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Adding a link doesn&apos;t grant access to the file — make sure sharing permissions are
        set separately.
      </p>
    </div>
  )
}
