"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { navFor, reachFor } from "@/lib/nav"
import { projectsFor } from "@/lib/permissions"
import { reviewQueue } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { db, actor } = useProjectsStore()

  const counts = React.useMemo(() => {
    if (!actor) return { projects: 0, waiting: 0 }
    return {
      projects: projectsFor(db, actor).length,
      waiting: reviewQueue(db, actor).length,
    }
  }, [actor, db])

  if (!actor) return null

  const groups = navFor(actor.role, counts)
  const reach = reachFor(actor.role, counts)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-3 pt-4 pb-2 group-data-[collapsible=icon]:px-1.5">
        <Link href="/" className="block">
          <span className="font-display block text-[19px] leading-[0.95] font-extrabold tracking-[-0.03em] text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            PDM
            <span className="block text-sidebar-primary">Project Space</span>
          </span>
          <span className="font-display hidden text-[15px] font-extrabold text-sidebar-primary group-data-[collapsible=icon]:block">
            P
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group, index) => (
          <SidebarGroup key={group.label ?? index}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => {
                const active = isActive(pathname, item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                      className={cn(
                        "rounded-sm font-medium",
                        "data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground",
                        "data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground"
                      )}
                    >
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                      <span className="flex-1">{item.label}</span>
                      {item.scope && (
                        <span
                          className={cn(
                            "text-caption font-semibold tabular-nums",
                            active ? "opacity-70" : "text-sidebar-foreground/45"
                          )}
                        >
                          {item.scope}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* What you are allowed to do, stated rather than discovered. */}
      <SidebarFooter className="pb-12 group-data-[collapsible=icon]:hidden">
        <div className="rounded-sm border border-sidebar-border p-3">
          <p className="text-th text-sidebar-primary uppercase">Your reach</p>
          <p className="mt-1.5 text-meta font-semibold text-sidebar-foreground">
            {reach.headline}
          </p>
          <ul className="mt-2 space-y-1">
            {reach.can.slice(0, 2).map((line) => (
              <li key={line} className="flex gap-1.5 text-caption text-sidebar-foreground/75">
                <span aria-hidden className="text-sidebar-primary">
                  +
                </span>
                <span>{line}</span>
              </li>
            ))}
            {reach.cannot.map((line) => (
              <li key={line} className="flex gap-1.5 text-caption text-sidebar-foreground/40">
                <span aria-hidden>–</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}
