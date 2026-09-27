"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { CancelCircleIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"

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
          <span className="block group-data-[collapsible=icon]:hidden">
            <span className="block text-section text-sidebar-foreground">PDM Project Space</span>
            <span className="mt-0.5 block text-caption text-muted-foreground">IIIT Hyderabad</span>
          </span>
          <span
            aria-hidden
            className="hidden size-7 place-items-center rounded-lg bg-sidebar-primary text-caption font-semibold text-sidebar-primary-foreground group-data-[collapsible=icon]:grid"
          >
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
                        "rounded-lg font-medium",
                        "transition-colors duration-fast-01 ease-standard",
                        // Carbon's side-nav convention: a tinted fill plus a
                        // solid rule in the accent down the leading edge, so
                        // "where am I" survives greyscale and a projector.
                        "data-active:bg-primary-subtle data-active:text-primary-subtle-foreground",
                        "data-active:shadow-[inset_3px_0_0_0_var(--primary)]",
                        "data-active:hover:bg-primary-subtle data-active:hover:text-primary-subtle-foreground"
                      )}
                    >
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                      <span className="flex-1">{item.label}</span>
                      {item.scope && (
                        <span
                          className={cn(
                            "text-caption font-medium tabular-nums",
                            active ? "opacity-80" : "text-muted-foreground"
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
        <div className="rounded-xl border border-sidebar-border bg-card p-3">
          <p className="text-th text-muted-foreground uppercase">Your permissions</p>
          <p className="mt-1.5 text-meta font-semibold text-sidebar-foreground">
            {reach.headline}
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {reach.can.slice(0, 2).map((line) => (
              <li key={line} className="flex items-start gap-2 text-caption text-foreground">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="mt-px size-3.5 shrink-0 text-status-accepted-solid"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>
                  <span className="sr-only">You can: </span>
                  {line}
                </span>
              </li>
            ))}
            {reach.cannot.map((line) => (
              <li key={line} className="flex items-start gap-2 text-caption text-muted-foreground">
                <HugeiconsIcon
                  icon={CancelCircleIcon}
                  className="mt-px size-3.5 shrink-0 text-status-overdue-solid"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>
                  <span className="sr-only">You cannot: </span>
                  {line}
                </span>
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
