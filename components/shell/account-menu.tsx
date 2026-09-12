"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Logout01Icon,
  Moon02Icon,
  Refresh01Icon,
  Sun01Icon,
  UserSwitchIcon,
} from "@hugeicons/core-free-icons"
import { useTheme } from "next-themes"

import { PersonAvatar } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ROLE_LABEL, ROLE_SCOPE } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"
import type { Role } from "@/lib/types"

/** Who you are, and which hat you are wearing.
 *
 * The coordinator is also a mentor, so switching is a normal thing to do
 * rather than an edge case — and it changes what the person is allowed to do,
 * not just what they can see. That makes it worth stating the consequence in
 * the menu rather than showing a bare role name. */
export function AccountMenu() {
  const router = useRouter()
  const { currentUser, session, setActiveRole, signOut, resetAll } = useProjectsStore()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!currentUser || !session) return null

  const roles = currentUser.roles

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="h-8 gap-2 pr-2 pl-1.5" />
        }
      >
        <PersonAvatar person={currentUser} size="xs" />
        <span className="hidden max-w-[14ch] truncate text-meta font-medium sm:inline">
          {currentUser.name}
        </span>
        <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 opacity-60" strokeWidth={2} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2.5 py-2">
          <PersonAvatar person={currentUser} size="default" />
          <span className="min-w-0">
            <span className="block truncate text-subhead">{currentUser.name}</span>
            <span className="block truncate text-caption font-normal text-muted-foreground">
              {currentUser.affiliation ?? currentUser.email}
            </span>
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-caption text-muted-foreground">
          Acting as
        </DropdownMenuLabel>
        {roles.map((role: Role) => (
          <DropdownMenuItem
            key={role}
            onClick={() => setActiveRole(role)}
            className="items-start gap-2.5"
          >
            <HugeiconsIcon
              icon={UserSwitchIcon}
              className={role === session.activeRole ? "mt-0.5 size-4" : "mt-0.5 size-4 opacity-35"}
              strokeWidth={2}
            />
            <span className="min-w-0">
              <span className="block text-meta font-medium">
                {ROLE_LABEL[role]}
                {role === session.activeRole && (
                  <span className="ml-1.5 text-caption font-normal text-muted-foreground">
                    current
                  </span>
                )}
              </span>
              <span className="block text-caption text-muted-foreground">
                Sees {ROLE_SCOPE[role]}
              </span>
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {mounted && (
          <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
            <HugeiconsIcon
              icon={resolvedTheme === "dark" ? Sun01Icon : Moon02Icon}
              className="size-4"
              strokeWidth={2}
            />
            {resolvedTheme === "dark" ? "Light appearance" : "Dark appearance"}
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() => {
            if (
              window.confirm(
                "Reset every project, submission, review and meeting back to the seeded state? This cannot be undone."
              )
            ) {
              resetAll()
            }
          }}
        >
          <HugeiconsIcon icon={Refresh01Icon} className="size-4" strokeWidth={2} />
          Reset demo data
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            signOut()
            router.push("/signin")
          }}
        >
          <HugeiconsIcon icon={Logout01Icon} className="size-4" strokeWidth={2} />
          Sign out of this tab
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
