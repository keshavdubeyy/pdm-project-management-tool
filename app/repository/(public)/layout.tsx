import Link from "next/link"

export const metadata = {
  title: "Graduation Project Repository · PDM ProjectGarage",
  description:
    "Final projects from every graduated batch of the M.Tech in Product Design and Management at IIIT Hyderabad.",
}

/** Shared by the public repository pages, which carry no app top bar of their
 * own (no profile, no notifications): a plain navigation bar with the logo. */
export default function RepositoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <nav className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4">
          <Link href="/repository" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-color.svg" alt="PDM" className="h-6 w-auto" />
            <span className="text-md font-semibold text-primary">
              ProjectGarage
            </span>
          </Link>
        </div>
      </nav>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:py-12">
        {children}
      </main>
    </div>
  )
}
