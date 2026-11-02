"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { AccountMenu } from "@/components/shell/account-menu"
import { NotificationBell } from "@/components/shell/notification-bell"
import { isCoordinator } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"
import { cn } from "@/lib/utils"

/** Shortcuts to the developer dashboards, shown to the developer only. This
 * only decides what is drawn: the /developer routes check the same address on
 * the server (lib/developer-auth.ts), so hiding a link is not what protects them. */
const DEVELOPER_EMAIL = "keshav.dubey@students.iiit.ac.in"

/** The one bar across the top: the PDM mark and the product name on the left,
 * the notifications and the person on the right. Every page opens from the name,
 * so there is no menu to learn, except for the coordinator and mentors, who
 * also get Overview and Teams beside the name. The way back from a team or a note is a
 * link on that page. */
export function AppTopbar() {
  const { actor } = useProjectsStore()
  const pathname = usePathname()
  if (!actor) return null

  // The coordinator and mentors have two places to start: how their teams are
  // doing, and the list of them; the coordinator also runs the repository.
  // Students have one home, which is the name on the left.
  const teamsTabs = [
    { label: "Overview", href: "/", active: pathname === "/" },
    {
      label: "Teams",
      href: "/teams",
      active: pathname.startsWith("/teams") || pathname.startsWith("/projects"),
    },
  ]
  const tabs = isCoordinator(actor)
    ? [
        { label: "Overview", href: "/", active: pathname === "/" },
        {
          label: "Teams",
          href: "/teams",
          active:
            pathname.startsWith("/teams") || pathname.startsWith("/projects"),
        },
        {
          label: "Repository",
          href: "/repository/manage",
          active: pathname.startsWith("/repository/manage"),
        },
      ]
    : actor.role === "mentor"
      ? teamsTabs
      : []

  const devTabs =
    actor.person.email?.toLowerCase() === DEVELOPER_EMAIL
      ? [
          {
            label: "Developer",
            href: "/developer",
            active: pathname.startsWith("/developer"),
          },
        ]
      : []
  const allTabs = [...tabs, ...devTabs]

  return (
    <header className="sticky top-0 z-30 border-b border-secondary bg-primary">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-color.svg" alt="PDM" className="h-6 w-auto" />
          <span className="text-md font-semibold text-primary">
            ProjectGarage
          </span>
        </Link>

        {allTabs.length > 0 && (
          <nav aria-label="Main" className="ml-2 flex items-center gap-1">
            {allTabs.map((tab, i) => (
              <React.Fragment key={tab.href}>
                {devTabs.length > 0 && i === tabs.length && tabs.length > 0 && (
                  <span aria-hidden className="mx-1 h-5 w-px bg-border" />
                )}
                <Link
                  href={tab.href}
                  aria-current={tab.active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-meta font-semibold outline-brand focus-visible:outline-2",
                    tab.active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {tab.label}
                </Link>
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* The bell sits beside the person: what is new for them, and then who
          they are. */}
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}
