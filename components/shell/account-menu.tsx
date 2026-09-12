"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  CheckmarkCircle02Icon,
  Logout01Icon,
  Moon02Icon,
  Refresh01Icon,
  Sun01Icon,
} from "@hugeicons/core-free-icons"
import { useTheme } from "next-themes"

import { PersonAvatar } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ROLE_LABEL, ROLE_SCOPE } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"
import type { Role } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Who you are, and which hat you are wearing.
 *
 * Labels live inside a group because that is what the menu primitive requires,
 * and because the grouping is real: the top block is identity, the next is the
 * role you are acting in, the last is the tab itself.
 */
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
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="h-8 gap-2 pr-2 pl-1.5" />}>
        <PersonAvatar person={currentUser} size="xs" />
        <span className="hidden max-w-[14ch] truncate text-meta font-medium sm:inline">
          {currentUser.name}
        </span>
        <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 opacity-60" strokeWidth={2} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2.5 py-2">
            <PersonAvatar person={currentUser} size="default" />
            <span className="min-w-0">
              <span className="block truncate text-subhead">{currentUser.name}</span>
              <span className="block truncate text-caption font-normal text-muted-foreground">
                {currentUser.affiliation ?? currentUser.email}
              </span>
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        {roles.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-caption font-normal text-muted-foreground">
                Acting as
              </DropdownMenuLabel>
              {roles.map((role: Role) => {
                const active = role === session.activeRole
                return (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => setActiveRole(role)}
                    className="items-start gap-2.5"
                  >
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      className={cn("mt-0.5 size-4", active ? "text-primary" : "opacity-0")}
                      strokeWidth={2}
                    />
                    <span className="min-w-0">
                      <span className="block text-meta font-medium">{ROLE_LABEL[role]}</span>
                      <span className="block text-caption text-muted-foreground">
                        Sees {ROLE_SCOPE[role]}
                      </span>
                    </span>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
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
                  "Put every project, submission, review and meeting back to how it started? This cannot be undone."
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
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
