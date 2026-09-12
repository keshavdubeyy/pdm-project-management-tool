"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

import { PersonAvatar } from "@/components/common"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Person } from "@/lib/types"
import { cn } from "@/lib/utils"

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
  align = "start",
}: {
  people: Person[]
  value: string | null
  onChange: (personId: string | null) => void
  placeholder?: string
  emptyLabel?: string
  allowEmpty?: boolean
  describe?: (person: Person) => string | undefined
  className?: string
  align?: "start" | "center" | "end"
}) {
  const [open, setOpen] = React.useState(false)
  const selected = people.find((person) => person.id === value) ?? null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex h-8 w-full items-center gap-2 rounded-sm border border-border bg-card px-2.5 text-left text-meta transition-colors hover:bg-muted",
              className
            )}
          />
        }
      >
        {selected ? (
          <>
            <PersonAvatar person={selected} size="xs" />
            <span className="min-w-0 flex-1 truncate">{selected.name}</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{emptyLabel}</span>
        )}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className="size-3.5 shrink-0 opacity-50"
          strokeWidth={2}
        />
      </PopoverTrigger>

      <PopoverContent align={align} className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No match. Try a surname or a roll number.</CommandEmpty>
            <CommandGroup>
              {allowEmpty && (
                <CommandItem
                  value="none not recorded"
                  onSelect={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                >
                  <span className="size-5" />
                  <span className="flex-1 text-muted-foreground">{emptyLabel}</span>
                  {value === null && (
                    <HugeiconsIcon icon={Tick02Icon} className="size-4" strokeWidth={2} />
                  )}
                </CommandItem>
              )}
              {people.map((person) => (
                <CommandItem
                  key={person.id}
                  value={`${person.name} ${person.rollNumber ?? ""} ${person.email}`}
                  onSelect={() => {
                    onChange(person.id)
                    setOpen(false)
                  }}
                >
                  <PersonAvatar person={person} size="xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{person.name}</span>
                    {describe?.(person) && (
                      <span className="block truncate text-caption text-muted-foreground">
                        {describe(person)}
                      </span>
                    )}
                  </span>
                  {value === person.id && (
                    <HugeiconsIcon icon={Tick02Icon} className="size-4" strokeWidth={2} />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
