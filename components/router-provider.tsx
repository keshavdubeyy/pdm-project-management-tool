"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { RouterProvider as AriaRouterProvider } from "react-aria-components"

declare module "react-aria-components" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >
  }
}

/** Lets Untitled UI links and buttons with `href` navigate client-side. */
export function RouterProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <AriaRouterProvider navigate={router.push}>{children}</AriaRouterProvider>
  )
}
