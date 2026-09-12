"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { AccountMenu } from "@/components/shell/account-menu"
import { AppSidebar } from "@/components/shell/app-sidebar"
import { CommandPalette } from "@/components/shell/command-palette"
import { NotificationBell } from "@/components/shell/notification-bell"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useProjectsStore } from "@/lib/store"

const PUBLIC_ROUTES = ["/signin", "/design-system"]

/** The frame around every page, and the gate in front of it.
 *
 * Sign-in is enforced here rather than in each page so there is one place that
 * decides whether a person is allowed to be looking at anything at all. */
export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { ready, session } = useProjectsStore()
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  React.useEffect(() => {
    if (ready && !session && !isPublic) router.replace("/signin")
  }, [isPublic, ready, router, session])

  if (!ready) return <BootSkeleton />

  if (!session) {
    if (isPublic) return <>{children}</>
    return <BootSkeleton />
  }

  if (pathname.startsWith("/signin")) return <>{children}</>

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 supports-backdrop-filter:bg-background/70 supports-backdrop-filter:backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="data-vertical:h-4 data-vertical:self-auto" />
          <WeekIndicator />
          <div className="ml-auto flex items-center gap-2">
            <CommandPalette />
            <NotificationBell />
            <AccountMenu />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function WeekIndicator() {
  const { week, batch } = useProjectsStore()
  return (
    <Link href="/grid" className="flex min-w-0 items-baseline gap-2 rounded-md px-1 py-0.5">
      <span className="truncate text-meta font-medium text-foreground">{batch.label}</span>
      <span className="hidden shrink-0 text-caption text-muted-foreground sm:inline">
        Week {week} of 28
      </span>
    </Link>
  )
}

function BootSkeleton() {
  return (
    <div className="flex min-h-svh">
      <div className="hidden w-64 shrink-0 flex-col gap-2 border-r border-border p-4 md:flex">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-4 h-7 w-full" />
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-7 w-full" />
      </div>
      <div className="flex-1 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-96" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    </div>
  )
}
