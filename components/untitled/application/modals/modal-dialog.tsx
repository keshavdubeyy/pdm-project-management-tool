"use client"

import type { ReactNode } from "react"
import { Heading as AriaHeading } from "react-aria-components"
import { CloseButton } from "@/components/untitled/base/buttons/close-button"
import {
  Dialog,
  Modal,
  ModalOverlay,
} from "@/components/untitled/application/modals/modal"
import { cx } from "@/utils/cx"

const widths = {
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "4xl": "sm:max-w-4xl",
}

interface ModalDialogProps {
  /** Controlled open state. Leave out inside a `DialogTrigger`. */
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
  title: ReactNode
  description?: ReactNode
  /** Buttons, right-aligned. A Button with `slot="close"` closes the dialog. */
  footer?: ReactNode
  size?: keyof typeof widths
  /** The dialog cannot be closed until its form is done: no close button, and
   * neither Escape nor a click outside dismisses it. */
  required?: boolean
  children?: ReactNode
}

/** Untitled UI's modal, composed the way its modal examples are laid out:
 * a title block with a close button, a body, and a right-aligned footer. */
export function ModalDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  footer,
  size = "lg",
  required = false,
  children,
}: ModalDialogProps) {
  return (
    <ModalOverlay
      isDismissable={!required}
      isKeyboardDismissDisabled={required}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Modal className={cx("w-full", widths[size])}>
        <Dialog className="flex flex-col">
          <div className="flex items-start justify-between gap-4 px-6 pt-6">
            <div className="min-w-0 space-y-1">
              <AriaHeading
                slot="title"
                className="text-lg font-semibold text-primary"
              >
                {title}
              </AriaHeading>
              {description ? (
                <p className="text-sm text-tertiary">{description}</p>
              ) : null}
            </div>
            {required ? null : (
              <CloseButton size="sm" className="-mt-1 -mr-2 shrink-0" />
            )}
          </div>
          {children ? (
            <div className="space-y-4 px-6 py-5">{children}</div>
          ) : null}
          {footer ? (
            <div className="flex justify-end gap-3 px-6 pt-2 pb-6">
              {footer}
            </div>
          ) : null}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
