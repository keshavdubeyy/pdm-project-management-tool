"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { RoleSwitcher } from "@/components/role-switcher"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { canAddProject } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"

export function SiteHeader() {
  const { currentUser } = useProjectsStore()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="data-vertical:h-4 data-vertical:self-auto" />
      <div className="ml-auto flex items-center gap-2">
        <RoleSwitcher />
        {canAddProject(currentUser) && (
          <Button size="sm" render={<Link href="/projects/new" />} nativeButton={false}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Add project
          </Button>
        )}
      </div>
    </header>
  )
}
