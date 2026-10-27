"use client"

import type { RefAttributes } from "react"
import type { PopoverProps as AriaPopoverProps } from "react-aria-components"
import { Popover as AriaPopover } from "react-aria-components"
import { cx } from "@/utils/cx"

interface PopoverProps extends AriaPopoverProps, RefAttributes<HTMLElement> {
  /** Caps how tall the popover can grow before its list starts scrolling: 14rem for `sm`, 16rem for `md`, and 20rem for `lg`. */
  size: "sm" | "md" | "lg"
}

export const Popover = (props: PopoverProps) => {
  return (
    <AriaPopover
      placement="bottom"
      containerPadding={0}
      offset={4}
      {...props}
      className={(state) =>
        cx(
          "w-(--trigger-width) origin-(--trigger-anchor-point) overflow-x-hidden overflow-y-auto rounded-lg bg-primary py-1 shadow-lg ring-1 ring-secondary_alt outline-hidden will-change-transform",

          state.isEntering &&
            "placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5 animate-in duration-150 ease-out fade-in",
          state.isExiting &&
            "placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5 animate-out duration-100 ease-in fade-out",

          props.size === "sm" && "max-h-56!",
          props.size === "md" && "max-h-64!",
          props.size === "lg" && "max-h-80!",

          typeof props.className === "function"
            ? props.className(state)
            : props.className
        )
      }
    />
  )
}
