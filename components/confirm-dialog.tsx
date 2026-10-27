"use client"

import * as React from "react"

import { ModalDialog } from "@/components/untitled/application/modals/modal-dialog"
import { Button } from "@/components/untitled/base/buttons/button"

type ConfirmOptions = {
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  /** Styles the confirm button red, for anything that deletes or cannot be undone. */
  destructive?: boolean
  onConfirm: () => void
}

/** A confirmation modal in place of `window.confirm`.
 *
 * Call `confirm({ ... })` from an event handler and render `dialog` once
 * alongside the trigger. */
export function useConfirm() {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null)
  // Keep the last options while the modal animates out, so its text doesn't blank.
  const [shown, setShown] = React.useState<ConfirmOptions | null>(null)
  const show = (next: ConfirmOptions | null) => {
    setOptions(next)
    if (next) setShown(next)
  }

  const dialog = (
    <ModalDialog
      isOpen={options !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) show(null)
      }}
      size="md"
      title={shown?.title ?? ""}
      description={shown?.description}
      footer={
        <>
          <Button color="secondary" slot="close">
            Cancel
          </Button>
          <Button
            color={shown?.destructive ? "primary-destructive" : "primary"}
            onPress={() => {
              const action = options?.onConfirm
              show(null)
              action?.()
            }}
          >
            {shown?.confirmLabel ?? "Confirm"}
          </Button>
        </>
      }
    />
  )

  return { confirm: show, dialog }
}
