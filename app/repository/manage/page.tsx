"use client"

import Link from "next/link"

import { Button } from "@/components/untitled/base/buttons/button"
import { BATCHES } from "@/lib/repository"

import { LinkExternal01 } from "@untitledui/icons"

import { BatchFolders } from "../(public)/folders"
import { TileSkeletons } from "../(public)/tile"
import { useManagedRepository } from "./use-managed-repository"

/** The coordinator's repository: the public page as visitors see it, with
 * hidden projects included and a way to hide, delete and export them. */
export default function ManageRepositoryPage() {
  const { allowed, rows, error, extras } = useManagedRepository()
  if (!allowed) return null

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header className="space-y-2">
          <h1 className="text-page text-foreground">
            Graduation Project Repository
          </h1>
          <p className="max-w-2xl text-body text-muted-foreground">
            Graduates add their projects through the submission form, and they
            go live at once. Open a batch to hide, delete or export its
            projects.
          </p>
        </header>
        <div className="flex flex-wrap gap-2">
          <Link href="/submit-project" target="_blank">
            <Button color="secondary" iconTrailing={LinkExternal01}>
              Open submission form
            </Button>
          </Link>
          <Link href="/repository" target="_blank">
            <Button color="secondary" iconTrailing={LinkExternal01}>
              Open public repository
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-meta text-destructive">
          {error}
        </p>
      )}

      {!rows && !error && (
        <>
          <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-secondary" />
          <TileSkeletons
            count={BATCHES.length}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
          />
        </>
      )}

      {rows && (
        <BatchFolders
          projects={rows}
          batchHref={(year) => `/repository/manage/batch/${year}`}
          extras={extras}
        />
      )}
    </div>
  )
}
