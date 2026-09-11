"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ProjectForm } from "@/components/project-form"

type AddProjectSheetProps = {
  batchId: string
  triggerSize?: "default" | "sm"
}

const FORM_ID = "add-project-form"

export function AddProjectSheet({ batchId, triggerSize = "default" }: AddProjectSheetProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size={triggerSize} />}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
        Add project
      </SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Add a project</SheetTitle>
          <SheetDescription>This project will be added to this batch.</SheetDescription>
        </SheetHeader>
        {open && (
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <ProjectForm
              mode="create"
              initialBatchId={batchId}
              onCancel={() => setOpen(false)}
              formId={FORM_ID}
              showActions={false}
            />
          </div>
        )}
        <SheetFooter className="flex-row justify-end border-t p-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID}>
            Save project
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
