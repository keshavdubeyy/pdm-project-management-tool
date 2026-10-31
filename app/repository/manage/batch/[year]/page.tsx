"use client"

import Link from "next/link"
import { notFound, useParams } from "next/navigation"

import { Button } from "@/components/untitled/base/buttons/button"
import { BATCHES } from "@/lib/repository"

import { ChevronLeft, Download01 } from "@untitledui/icons"

import { RepositoryBrowser } from "../../../(public)/browser"
import { TileSkeletons } from "../../../(public)/tile"
import { useManagedRepository } from "../../use-managed-repository"

/** One batch, as the coordinator sees it: every project, hidden ones too, and
 * this batch's CSV. */
export default function ManageBatchPage() {
  const { year } = useParams<{ year: string }>()
  const batch = BATCHES.find((b) => String(b.graduationYear) === year)
  const { allowed, rows, error, download, extras } = useManagedRepository()
  if (!batch) notFound()
  if (!allowed) return null

  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/repository/manage"
        className="inline-flex items-center gap-1 text-meta text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        All batches
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-page text-foreground">Batch {batch.label}</h1>
        <Button
          color="secondary"
          iconLeading={Download01}
          onPress={() => download(batch.graduationYear)}
        >
          Download CSV
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-meta text-destructive">
          {error}
        </p>
      )}

      {!rows && !error && (
        <TileSkeletons
          count={4}
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
        />
      )}

      {rows && (
        <RepositoryBrowser
          projects={rows.filter((p) => p.graduation_year === batch.graduationYear)}
          extras={extras}
        />
      )}
    </div>
  )
}
