"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"

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
  SheetTrigger,
} from "@/components/ui/sheet"
import { useBatchForm } from "@/hooks/use-batch-form"
import { batchHref } from "@/lib/navigation"
import { useProjectsStore } from "@/lib/store"

const FORM_ID = "add-batch-form"

export function CreateBatchSheet() {
  const router = useRouter()
  const { batches, addBatch } = useProjectsStore()
  const [open, setOpen] = React.useState(false)
  const form = useBatchForm(batches)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const draft = form.buildDraft()
    if (!draft) return

    const batch = addBatch(draft)
    setOpen(false)
    form.reset()
    router.push(batchHref(batch.id))
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) form.reset()
      }}
    >
      <SheetTrigger render={<Button />}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
        Add batch
      </SheetTrigger>
      <SheetContent className="gap-0">
        <SheetHeader>
          <SheetTitle>Add a batch</SheetTitle>
          <SheetDescription>
            Batches group projects by cohort. Add projects to it right after.
          </SheetDescription>
        </SheetHeader>
        <form
          id={FORM_ID}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6"
        >
          <BatchFormFields
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
          <SheetClose render={<Button type="button" variant="outline" />}>Cancel</SheetClose>
          <Button type="submit" form={FORM_ID}>
            Create batch
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
