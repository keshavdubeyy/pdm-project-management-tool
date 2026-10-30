"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

/** The developer pages share one row of tabs. */
const TABS = [
  { href: "/developer", label: "People" },
  { href: "/developer/mail", label: "Mail" },
  { href: "/developer/storage", label: "Storage" },
] as const

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  return (
    <>
      <nav className="flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-md border px-3 py-1 text-sm ${
              pathname === t.href
                ? "border-foreground font-semibold"
                : "border-border text-muted-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </>
  )
}
