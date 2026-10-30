"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { AccountMenu } from "@/components/shell/account-menu"
import { NotificationBell } from "@/components/shell/notification-bell"
import { isCoordinator } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"
import { cn } from "@/lib/utils"

/** The one bar across the top: the PDM mark and the product name on the left,
 * the notifications and the person on the right. Every page opens from the name,
 * so there is no menu to learn, except for the coordinator, who also gets
 * Overview and Teams beside the name. The way back from a team or a note is a
 * link on that page. */
export function AppTopbar() {
  const { actor } = useProjectsStore()
  const pathname = usePathname()
  if (!actor) return null

  // The coordinator works across the whole batch, so has two places to start:
  // how it is doing, and the list of teams. Students and mentors have one home,
  // which is the name on the left.
  const tabs = isCoordinator(actor)
    ? [
        { label: "Overview", href: "/", active: pathname === "/" },
        {
          label: "Teams",
          href: "/teams",
          active:
            pathname.startsWith("/teams") || pathname.startsWith("/projects"),
        },
      ]
    : []

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

        {tabs.length > 0 && (
          <nav aria-label="Main" className="ml-2 flex items-center gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
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
