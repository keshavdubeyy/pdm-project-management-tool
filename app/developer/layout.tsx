"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

/** The developer's one place: a row of tabs over every developer page. The top
 * bar has a single Developer button that opens this. */
const TABS = [
  { href: "/developer", label: "People" },
  { href: "/developer/mail", label: "Mail" },
  { href: "/developer/storage", label: "Storage" },
  { href: "/developer/measures", label: "Measures" },
  { href: "/developer/design-system", label: "Design system" },
] as const

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  return (
    <>
      <nav aria-label="Developer" className="flex flex-wrap gap-1">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={pathname === t.href ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-meta font-semibold outline-brand focus-visible:outline-2",
              pathname === t.href
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </>
  )
}
