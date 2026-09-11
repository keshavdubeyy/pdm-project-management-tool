"use client"

import * as React from "react"

import { BatchFormFields } from "@/components/batch-form-fields"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { toast } from "@/components/ui/toast"
import { useBatchForm } from "@/hooks/use-batch-form"
import { useProjectsStore } from "@/lib/store"
import type { Batch } from "@/lib/types"

const FORM_ID = "edit-batch-form"

type EditBatchSheetProps = {
  batch: Batch
  open: boolean
  onOpenChange: (open: boolean) => void
}

function EditBatchForm({
  batch,
  onOpenChange,
}: {
  batch: Batch
  onOpenChange: (open: boolean) => void
}) {
  const { batches, updateBatch } = useProjectsStore()
  const form = useBatchForm(batches, batch)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const draft = form.buildDraft()
    if (!draft) return

    updateBatch(batch.id, draft)
    toast.add({
      title: "Batch updated",
      description: draft.label,
      type: "success",
    })
    onOpenChange(false)
  }

  return (
    <>
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6"
      >
        <BatchFormFields
          idPrefix="edit-batch"
          admissionYear={form.admissionYear}
          onAdmissionYearChange={form.setAdmissionYear}
          graduationYear={form.graduationYear}
          onGraduationYearChange={form.setGraduationYear}
          name={form.name}
          onNameChange={form.setName}
          description={form.description}
          onDescriptionChange={form.setDescription}
          errors={form.errors}
        />
      </form>
      <SheetFooter className="flex-row justify-end gap-2 border-t border-border/60">
        <SheetClose render={<Button type="button" variant="outline" />}>
          Cancel
        </SheetClose>
        <Button type="submit" form={FORM_ID}>
          Save changes
        </Button>
      </SheetFooter>
    </>
  )
}

export function EditBatchSheet({
  batch,
  open,
  onOpenChange,
}: EditBatchSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0">
        <SheetHeader>
          <SheetTitle>Edit batch</SheetTitle>
          <SheetDescription>
            Update the batch&apos;s years, name or description.
          </SheetDescription>
        </SheetHeader>
        {open && <EditBatchForm batch={batch} onOpenChange={onOpenChange} />}
      </SheetContent>
    </Sheet>
  )
}
