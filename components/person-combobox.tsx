"use client"

import { Select } from "@/components/untitled/base/select/select"
import type { Person } from "@/lib/types"

/** Sentinel key for the "nobody" row, since a combobox key cannot be null. */
const NONE = "__none__"

/** Pick a person by typing three letters.
 *
 * Replaces the walls this app used to put up: forty-five names scrolling on the
 * sign-in screen, and forty-four stacked dropdowns on the allocation page. One
 * field, type, done. */
export function PersonCombobox({
  people,
  value,
  onChange,
  placeholder = "Search people…",
  emptyLabel = "Nobody",
  allowEmpty = false,
  describe,
  className,
}: {
  people: Person[]
  value: string | null
  onChange: (personId: string | null) => void
  placeholder?: string
  emptyLabel?: string
  allowEmpty?: boolean
  describe?: (person: Person) => string | undefined
  className?: string
}) {
  const items = [
    ...(allowEmpty ? [{ id: NONE, label: emptyLabel }] : []),
    ...people.map((person) => ({
      id: person.id,
      label: person.name,
      supportingText: describe?.(person),
    })),
  ]

  return (
    <Select.ComboBox
      size="sm"
      aria-label={placeholder}
      placeholder={value === null ? emptyLabel : placeholder}
      items={items}
      selectedKey={value ?? (allowEmpty ? NONE : null)}
      onSelectionChange={(key) => {
        if (key === null) return
        onChange(key === NONE ? null : String(key))
      }}
      className={className}
    >
      {(item) => <Select.Item {...item} />}
    </Select.ComboBox>
  )
}
