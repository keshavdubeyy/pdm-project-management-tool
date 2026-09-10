"use client"

import * as React from "react"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon } from "@hugeicons/core-free-icons"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled,
}: {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: (date: Date) => boolean
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !date && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-4" />
        {date ? format(date, "PPP") : <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(value) => {
            onDateChange?.(value)
            setOpen(false)
          }}
          disabled={disabled}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
