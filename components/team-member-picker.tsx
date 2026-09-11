"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Person } from "@/lib/types"

const ROLL_NUMBER_PATTERN = /^\d{10}$/

type TeamMemberPickerProps = {
  people: Person[]
  value: string[]
  onChange: (ids: string[]) => void
  onCreatePerson: (name: string, rollNumber?: string) => Person
  placeholder?: string
  /** The batch's admission year, e.g. 2025 — roll numbers are prefixed with
   * it, so new-member roll numbers are pre-filled and checked against it. */
  batchAdmissionYear?: number
}

export function TeamMemberPicker({
  people,
  value,
  onChange,
  onCreatePerson,
  placeholder,
  batchAdmissionYear,
}: TeamMemberPickerProps) {
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [pendingName, setPendingName] = React.useState<string | null>(null)
  const [rollNumber, setRollNumber] = React.useState("")
  const [rollNumberError, setRollNumberError] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  const selected = value
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => Boolean(p))

  const trimmedQuery = query.trim()

  const suggestions = React.useMemo(() => {
    const q = trimmedQuery.toLowerCase()
    return people
      .filter((p) => !value.includes(p.id))
      .filter((p) => q.length === 0 || p.name.toLowerCase().includes(q))
      .slice(0, 6)
  }, [people, value, trimmedQuery])

  const hasExactMatch = people.some(
    (p) => p.name.trim().toLowerCase() === trimmedQuery.toLowerCase()
  )

  function addExisting(id: string) {
    onChange([...value, id])
    setQuery("")
    setOpen(false)
  }

  function startCreate() {
    if (!trimmedQuery) return
    setPendingName(trimmedQuery)
    setRollNumber(batchAdmissionYear ? String(batchAdmissionYear) : "")
    setRollNumberError("")
    setOpen(false)
  }

  function confirmCreate() {
    if (!pendingName) return
    const trimmedRollNumber = rollNumber.trim()

    if (!ROLL_NUMBER_PATTERN.test(trimmedRollNumber)) {
      setRollNumberError("Enter a 10-digit roll number, e.g. 2025204041.")
      return
    }
    if (batchAdmissionYear && !trimmedRollNumber.startsWith(String(batchAdmissionYear))) {
      setRollNumberError(`Roll number should start with ${batchAdmissionYear} for this batch.`)
      return
    }

    const person = onCreatePerson(pendingName, trimmedRollNumber)
    onChange([...value, person.id])
    setPendingName(null)
    setRollNumber("")
    setRollNumberError("")
    setQuery("")
  }

  function cancelCreate() {
    setPendingName(null)
    setRollNumber("")
    setRollNumberError("")
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
            addExisting(suggestions[0].id)
          } else if (trimmedQuery.length > 0) {
            startCreate()
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
              onClick={() => addExisting(p.id)}
            >
              {p.name}
              <span className="ml-auto text-xs text-muted-foreground">
                {p.rollNumber ?? "No roll no."}
              </span>
            </button>
          ))}
          {!hasExactMatch && (
            <button
              type="button"
              className="flex w-full items-center gap-1.5 rounded-xl px-3 py-2 text-left text-sm text-primary hover:bg-accent"
              onClick={startCreate}
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
              Add &ldquo;{trimmedQuery}&rdquo;
            </button>
          )}
        </div>
      )}

      {pendingName && (
        <div className="flex flex-col gap-2 rounded-2xl border border-border p-3">
          <p className="text-sm">
            Add <span className="font-medium">{pendingName}</span> as a new team member
          </p>
          <Input
            autoFocus
            inputMode="numeric"
            value={rollNumber}
            onChange={(event) => {
              setRollNumber(event.target.value)
              if (rollNumberError) setRollNumberError("")
            }}
            placeholder="e.g. 2025204041"
            aria-invalid={Boolean(rollNumberError)}
          />
          {rollNumberError && <p className="text-sm text-destructive">{rollNumberError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={cancelCreate}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={confirmCreate}>
              Add
            </Button>
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <tbody>
              {selected.map((p, index) => (
                <tr key={p.id} className={index > 0 ? "border-t border-border" : undefined}>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.rollNumber ?? "—"}</td>
                  <td className="w-9 px-2 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removePerson(p.id)}
                      className="rounded-full p-1 hover:bg-muted"
                      aria-label={`Remove ${p.name}`}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
