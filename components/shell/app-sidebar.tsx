"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Analytics01Icon,
  Archive02Icon,
  CheckListIcon,
  DashboardSquare01Icon,
  Grid02Icon,
  InboxIcon,
  Layers01Icon,
  Megaphone01Icon,
  MilestoneIcon,
  Settings02Icon,
  SparklesIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ROLE_LABEL, projectsFor } from "@/lib/permissions"
import { actionItemsFor, reviewQueue } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"

/** Navigation is scoped to the role rather than gated inside it.
 *
 * A student never sees a greyed-out "Programme" item they cannot use. The
 * screens that exist are the screens their role has business on, which keeps
 * the rail short enough to read at a glance. */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { db, actor, session } = useProjectsStore()

  const items = React.useMemo(() => {
    if (!actor) return []

    const myProjects = projectsFor(db, actor)
    const firstProject = myProjects[0]

    if (actor.role === "student") {
      const openActions = actionItemsFor(db, actor.person.id).length
      return [
        { title: "My work", url: "/", icon: DashboardSquare01Icon },
        firstProject
          ? { title: "Our project", url: `/projects/${firstProject.id}`, icon: MilestoneIcon }
          : null,
        { title: "Actions", url: "/actions", icon: CheckListIcon, badge: openActions || undefined },
        { title: "Announcements", url: "/announcements", icon: Megaphone01Icon },
        { title: "Project directory", url: "/directory", icon: Layers01Icon },
      ].filter(Boolean) as NavItem[]
    }

    if (actor.role === "mentor") {
      const queue = reviewQueue(db, actor).length
      return [
        { title: "My teams", url: "/", icon: UserGroupIcon },
        { title: "Review queue", url: "/review", icon: InboxIcon, badge: queue || undefined },
        { title: "Milestone grid", url: "/grid", icon: Grid02Icon },
        { title: "Announcements", url: "/announcements", icon: Megaphone01Icon },
        { title: "Project directory", url: "/directory", icon: Layers01Icon },
      ]
    }

    const queue = reviewQueue(db, actor).length
    return [
      { title: "Programme", url: "/", icon: DashboardSquare01Icon },
      { title: "Milestone grid", url: "/grid", icon: Grid02Icon },
      { title: "Review queue", url: "/review", icon: InboxIcon, badge: queue || undefined },
      { title: "Measures", url: "/measures", icon: Analytics01Icon },
      { title: "Announcements", url: "/announcements", icon: Megaphone01Icon },
      { title: "Project directory", url: "/directory", icon: Layers01Icon },
      { title: "Programme settings", url: "/admin", icon: Settings02Icon },
    ]
  }, [actor, db])

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />} className="h-auto py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-color.svg"
                alt="PDM Project Space"
                className="h-8 w-auto dark:hidden"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-white.svg"
                alt="PDM Project Space"
                className="hidden h-8 w-auto dark:block"
              />
              <span className="sr-only">PDM Project Space</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {session ? ROLE_LABEL[session.activeRole] : "Signed out"}
          </SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  isActive={isActive(pathname, item.url)}
                  tooltip={item.title}
                  render={<Link href={item.url} />}
                >
                  <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                  {item.title}
                </SidebarMenuButton>
                {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/design-system"}
              tooltip="Design system"
              render={<Link href="/design-system" />}
            >
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
              Design system
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/updates"}
              tooltip="Build log"
              render={<Link href="/updates" />}
            >
              <HugeiconsIcon icon={Archive02Icon} strokeWidth={2} />
              Build log
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

type NavItem = {
  title: string
  url: string
  icon: typeof Layers01Icon
  badge?: number
}

function isActive(pathname: string, url: string) {
  if (url === "/") return pathname === "/"
  return pathname === url || pathname.startsWith(`${url}/`)
}
