"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { PasswordSetupPrompt } from "@/components/password-setup-prompt"
import { ProjectTitlePrompt } from "@/components/project-title-prompt"
import { AppTopbar } from "@/components/shell/app-topbar"
import { hasServerSession } from "@/lib/remote"
import { useProjectsStore } from "@/lib/store"

const PUBLIC_ROUTES = ["/signin", "/design-system", "/updates"]

/** The frame around every page, and the gate in front of it.
 *
 * Sign-in is enforced here rather than in each page so there is one place that
 * decides whether a person is allowed to be looking at anything at all. */
export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { ready, session, signOut } = useProjectsStore()
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  React.useEffect(() => {
    if (ready && !session && !isPublic) router.replace("/signin")
  }, [isPublic, ready, router, session])

  // A tab that remembers a person but holds no server sign-in (an old session,
  // or one that expired) is signed out, so it is never shown data it cannot
  // save.
  React.useEffect(() => {
    if (!ready || !session) return
    let cancelled = false
    hasServerSession().then((ok) => {
      if (!ok && !cancelled) signOut()
    })
    return () => {
      cancelled = true
    }
  }, [ready, session, signOut])

  if (!ready) return <BootSkeleton />

  if (!session) {
    if (isPublic) return <>{children}</>
    return <BootSkeleton />
  }

  if (pathname.startsWith("/signin")) return <>{children}</>

  return (
    <div className="flex min-h-svh flex-col">
      <AppTopbar />
      <PasswordSetupPrompt />
      <ProjectTitlePrompt />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        <main className="flex min-w-0 flex-1 flex-col gap-6 overflow-x-clip p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-secondary ${className ?? ""}`}
    />
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
