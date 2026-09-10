"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Batch, Domain, Role } from "@/lib/types"

export const ALL = "all"

export type ViewMode = "cards" | "table"

export type DirectoryFilters = {
  q: string
  batchId: string
  domainId: string
  status: string
  onlyMine: boolean
  showArchived: boolean
  view: ViewMode
}

export const defaultFilters: DirectoryFilters = {
  q: "",
  batchId: ALL,
  domainId: ALL,
  status: ALL,
  onlyMine: false,
  showArchived: false,
  view: "cards",
}

type ProjectFiltersProps = {
  filters: DirectoryFilters
  onChange: (filters: DirectoryFilters) => void
  batches: Batch[]
  domains: Domain[]
  role: Role
  showBatchFilter?: boolean
}

export function ProjectFilters({
  filters,
  onChange,
  batches,
  domains,
  role,
  showBatchFilter = true,
}: ProjectFiltersProps) {
  function set<K extends keyof DirectoryFilters>(key: K, value: DirectoryFilters[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative sm:max-w-sm sm:flex-1">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={filters.q}
          onChange={(event) => set("q", event.target.value)}
          placeholder="Search by title, topic or team member"
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {showBatchFilter && (
          <Select
            items={{ [ALL]: "All batches", ...Object.fromEntries(batches.map((b) => [b.id, b.label])) }}
            value={filters.batchId}
            onValueChange={(value) => set("batchId", value as string)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All batches</SelectItem>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          items={{ [ALL]: "All domains", ...Object.fromEntries(domains.map((d) => [d.id, d.label])) }}
          value={filters.domainId}
          onValueChange={(value) => set("domainId", value as string)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All domains</SelectItem>
            {domains.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={{ [ALL]: "Ongoing or completed", ongoing: "Ongoing", completed: "Completed" }}
          value={filters.status}
          onValueChange={(value) => set("status", value as string)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Ongoing or completed</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {role !== "coordinator" && (
          <Label className="flex items-center gap-2 rounded-3xl border border-border bg-background px-3 py-2 text-sm has-[:focus-visible]:border-ring">
            <Switch
              size="sm"
              checked={filters.onlyMine}
              onCheckedChange={(checked) => set("onlyMine", Boolean(checked))}
            />
            {role === "mentor" ? "Only projects I mentor" : "Only my projects"}
          </Label>
        )}

        {role === "coordinator" && (
          <Label className="flex items-center gap-2 rounded-3xl border border-border bg-background px-3 py-2 text-sm has-[:focus-visible]:border-ring">
            <Switch
              size="sm"
              checked={filters.showArchived}
              onCheckedChange={(checked) => set("showArchived", Boolean(checked))}
            />
            Show archived
          </Label>
        )}
      </div>
    </div>
  )
}
