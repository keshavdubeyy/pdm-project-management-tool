"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { Person, Role } from "@/lib/types"

type PeoplePickerProps = {
  people: Person[]
  value: string[]
  onChange: (ids: string[]) => void
  onCreatePerson: (name: string) => Person
  roleFilter?: Role
  placeholder?: string
}

export function PeoplePicker({
  people,
  value,
  onChange,
  onCreatePerson,
  roleFilter,
  placeholder,
}: PeoplePickerProps) {
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const selected = value
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => Boolean(p))

  const trimmedQuery = query.trim()

  const suggestions = React.useMemo(() => {
    const q = trimmedQuery.toLowerCase()
    return people
      .filter((p) => !value.includes(p.id))
      .filter((p) => !roleFilter || p.role === roleFilter)
      .filter((p) => q.length === 0 || p.name.toLowerCase().includes(q))
      .slice(0, 6)
  }, [people, value, roleFilter, trimmedQuery])

  const hasExactMatch = people.some(
    (p) => p.name.trim().toLowerCase() === trimmedQuery.toLowerCase()
  )

  function addPerson(id: string) {
    onChange([...value, id])
    setQuery("")
  }

  function createAndAdd() {
    if (!trimmedQuery) return
    const person = onCreatePerson(trimmedQuery)
    onChange([...value, person.id])
    setQuery("")
  }

  function removePerson(id: string) {
    onChange(value.filter((v) => v !== id))
  }

  React.useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <Badge key={p.id} variant="secondary" className="h-6 gap-1 pr-1">
              {p.name}
              <button
                type="button"
                onClick={() => removePerson(p.id)}
                className="rounded-full p-0.5 hover:bg-foreground/10"
                aria-label={`Remove ${p.name}`}
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return
          event.preventDefault()
          if (suggestions[0] && hasExactMatch) {
            addPerson(suggestions[0].id)
          } else if (trimmedQuery.length > 0) {
            createAndAdd()
          }
        }}
        placeholder={placeholder}
      />
      {open && trimmedQuery.length > 0 && (
        <div className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-2xl bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/5 dark:ring-foreground/10">
          {suggestions.map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => addPerson(p.id)}
            >
              {p.name}
              <span className="ml-auto text-xs text-muted-foreground capitalize">{p.role}</span>
            </button>
          ))}
          {!hasExactMatch && (
            <button
              type="button"
              className="flex w-full items-center gap-1.5 rounded-xl px-3 py-2 text-left text-sm text-primary hover:bg-accent"
              onClick={createAndAdd}
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
              Add &ldquo;{trimmedQuery}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
