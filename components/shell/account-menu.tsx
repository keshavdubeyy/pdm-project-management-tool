"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

import { PersonAvatar } from "@/components/common"
import { Button } from "@/components/untitled/base/buttons/button"
import { Dropdown } from "@/components/untitled/base/dropdown/dropdown"
import { signOutOfServer } from "@/lib/auth"
import { useProjectsStore } from "@/lib/store"

import { ChevronDown, LogOut01, Moon01, Sun, SwitchHorizontal01, User01 } from "@untitledui/icons"

/** Who you are, and the few things that belong to you: profile, appearance,
 * sign out. */
export function AccountMenu() {
  const router = useRouter()
  const { currentUser, session, signOut, setActiveRole } = useProjectsStore()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!currentUser || !session) return null

  return (
    <>
      <Dropdown.Root>
        <Button color="tertiary" size="xs" className="max-w-full pr-2 pl-1.5">
          {/* One row, never two: avatar, name, chevron. The name gives way
              first, so a long one is cut with an ellipsis. */}
          <span className="flex min-w-0 items-center gap-2 whitespace-nowrap">
            <PersonAvatar person={currentUser} size="xs" />
            <span
              title={currentUser.name}
              className="max-w-32 truncate text-sm font-semibold sm:max-w-44"
            >
              {currentUser.name}
            </span>
            <ChevronDown className="size-3.5 shrink-0 opacity-60" />
          </span>
        </Button>

        <Dropdown.Popover placement="bottom end" className="w-72">
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <PersonAvatar person={currentUser} size="default" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-secondary">
                {currentUser.name}
              </span>
              <span className="block truncate text-xs text-tertiary">
                {currentUser.affiliation ?? currentUser.email}
              </span>
            </span>
          </div>

          <Dropdown.Menu>
            <Dropdown.Section>
              <Dropdown.Item
                id="profile"
                icon={User01}
                label="Profile"
                onAction={() => router.push("/profile")}
              />
              {currentUser.roles
                .filter((role) => role !== session.activeRole)
                .map((role) => (
                  <Dropdown.Item
                    key={role}
                    id={`role-${role}`}
                    icon={SwitchHorizontal01}
                    label={
                      role === "coordinator"
                        ? "Switch to program coordinator"
                        : `Switch to ${role}`
                    }
                    onAction={() => {
                      setActiveRole(role)
                      router.push("/")
                    }}
                  />
                ))}
              {mounted && (
                <Dropdown.Item
                  id="theme"
                  icon={resolvedTheme === "dark" ? Sun : Moon01}
                  label={
                    resolvedTheme === "dark"
                      ? "Light appearance"
                      : "Dark appearance"
                  }
                  onAction={() =>
                    setTheme(resolvedTheme === "dark" ? "light" : "dark")
                  }
                />
              )}
              <Dropdown.Item
                id="signout"
                icon={LogOut01}
                label="Sign out of this tab"
                className="[&_span]:text-error-primary [&_svg]:text-fg-error-secondary"
                onAction={() => {
                  signOut()
                  void signOutOfServer()
                  router.push("/signin")
                }}
              />
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.Root>
    </>
  )
}
