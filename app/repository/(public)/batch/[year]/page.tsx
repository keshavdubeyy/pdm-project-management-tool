import Link from "next/link"
import { notFound } from "next/navigation"

import { BATCHES, listPublished } from "@/lib/repository"

import { ChevronLeft } from "@untitledui/icons"

import { RepositoryBrowser } from "../../browser"

/** One batch folder: every published project from that batch. */

export const dynamic = "force-dynamic"

export default async function BatchPage({
  params,
}: {
  params: Promise<{ year: string }>
}) {
  const { year } = await params
  const batch = BATCHES.find((b) => String(b.graduationYear) === year)
  if (!batch) notFound()

  const projects = (await listPublished()).filter(
    (p) => p.graduation_year === batch.graduationYear
  )

  return (
    <>
      <Link
        href="/repository"
        className="inline-flex items-center gap-1 text-meta text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        All batches
      </Link>
      <h1 className="text-page text-foreground">Batch {batch.label}</h1>
      <RepositoryBrowser projects={projects} />
    </>
  )
}
