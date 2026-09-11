"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { RoleSwitcher } from "@/components/role-switcher"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { backHrefOrDefault } from "@/lib/navigation"
import { useProjectsStore } from "@/lib/store"

function HeaderBreadcrumb() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { batches } = useProjectsStore()

  const batchId = pathname.match(/^\/batches\/([^/]+)/)?.[1]
  const batch = batchId ? batches.find((b) => b.id === batchId) : undefined

  if (!batch) return null

  const directoryHref = backHrefOrDefault(searchParams.get("back"), "/")

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href={directoryHref} />}>Project directory</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{batch.label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="data-vertical:h-4 data-vertical:self-auto" />
      <React.Suspense fallback={null}>
        <HeaderBreadcrumb />
      </React.Suspense>
      <div className="ml-auto flex items-center gap-2">
        <RoleSwitcher />
      </div>
    </header>
  )
}
