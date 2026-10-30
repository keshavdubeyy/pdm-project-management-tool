"use client"

import * as React from "react"

/** How long the scrollbar lingers after the last scroll. */
const LINGER_MS = 900

/** Makes `scrollbar-subtle` areas behave like an overlay scrollbar: nothing is
 * drawn at rest, a thin bar appears while the area is being scrolled, and it
 * goes again a moment after. Mounted once for the whole app.
 *
 * Scroll events do not bubble, so one listener in the capture phase on the
 * document catches every scrolling area, including ones that open later in a
 * popover or a sheet. */
export function ScrollbarReveal() {
  React.useEffect(() => {
    const timers = new WeakMap<Element, number>()

    const onScroll = (event: Event) => {
      const el = event.target
      if (
        !(el instanceof HTMLElement) ||
        !el.classList.contains("scrollbar-subtle")
      )
        return
      el.dataset.scrolling = "true"
      window.clearTimeout(timers.get(el))
      timers.set(
        el,
        window.setTimeout(() => {
          delete el.dataset.scrolling
        }, LINGER_MS)
      )
    }

    document.addEventListener("scroll", onScroll, true)
    return () => document.removeEventListener("scroll", onScroll, true)
  }, [])

  return null
}
