"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChartHistogramIcon, Layers01Icon } from "@hugeicons/core-free-icons"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  SidebarSeparator,
} from "@/components/ui/sidebar"

const navItems = [{ title: "Project directory", url: "/", icon: Layers01Icon }]

const buildTeam = [
  { name: "Keshav Dubey", initials: "KD" },
  { name: "Sri Peri Charan", initials: "SC" },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />} className="h-auto py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-color.svg"
                alt="PDM Project Space"
                className="h-9 w-auto dark:hidden"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-white.svg"
                alt="PDM Project Space"
                className="hidden h-9 w-auto dark:block"
              />
              <span className="sr-only">PDM Project Space</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Browse</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton isActive={pathname === item.url} render={<Link href={item.url} />}>
                  <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                  {item.title}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <div className="px-2 py-1.5">
          <span className="text-xs font-medium text-sidebar-foreground/70">Collaborators</span>
          <div className="mt-2 flex flex-col gap-2">
            {buildTeam.map((person) => (
              <div key={person.name} className="flex items-center gap-2">
                <Avatar size="sm">
                  <AvatarFallback className="text-[10px]">{person.initials}</AvatarFallback>
                </Avatar>
                <span className="truncate text-xs font-medium text-sidebar-foreground">
                  {person.name}
                </span>
              </div>
            ))}
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={pathname === "/updates"} render={<Link href="/updates" />}>
              <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} />
              Project progress
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
