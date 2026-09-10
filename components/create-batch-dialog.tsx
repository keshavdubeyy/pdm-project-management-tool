"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { batchHref } from "@/lib/navigation"
import { useProjectsStore } from "@/lib/store"

export function CreateBatchDialog() {
  const router = useRouter()
  const { addBatch } = useProjectsStore()
  const [open, setOpen] = React.useState(false)
  const [label, setLabel] = React.useState("")
  const [error, setError] = React.useState("")

  function reset() {
    setLabel("")
    setError("")
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!label.trim()) {
      setError("Give the batch a name, e.g. Batch 2027.")
      return
    }
    const batch = addBatch(label.trim())
    setOpen(false)
    reset()
    router.push(batchHref(batch.id))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
        Create batch
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a batch</DialogTitle>
          <DialogDescription>
            Batches group projects by cohort, e.g. by graduation year. Add students, projects and
            mentors to it right after.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="batch-label">Batch name</FieldLabel>
            <Input
              id="batch-label"
              autoFocus
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="e.g. Batch 2027"
              aria-invalid={Boolean(error)}
            />
            <FieldError>{error}</FieldError>
          </Field>
          <DialogFooter>
            <Button type="submit">Create batch</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
