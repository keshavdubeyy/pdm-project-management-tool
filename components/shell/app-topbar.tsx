"use client"

import Link from "next/link"

import { AccountMenu } from "@/components/shell/account-menu"
import { useProjectsStore } from "@/lib/store"

/** The one bar across the top: the PDM mark and the product name on the left,
 * the person on the right. Every page opens from the name, so there is no
 * menu to learn; the way back from a team or a note is a link on that page. */
export function AppTopbar() {
  const { actor } = useProjectsStore()
  if (!actor) return null

  return (
    <header className="sticky top-0 z-30 border-b border-secondary bg-primary">
      <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-color.svg" alt="PDM" className="h-6 w-auto" />
          <span className="text-md font-semibold text-primary">
            Project Space
          </span>
        </Link>

        <AccountMenu />
      </div>
    </header>
  )
}
