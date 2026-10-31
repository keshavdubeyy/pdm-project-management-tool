import { listPublished } from "@/lib/repository"

import { BatchFolders } from "./folders"

/** Every batch as a folder, open to anyone. Each folder lists its projects. */

export const dynamic = "force-dynamic"

export default async function RepositoryPage() {
  const projects = await listPublished()
  return (
    <>
      <header className="space-y-2">
        <h1 className="text-page text-foreground">Graduation Project Repository</h1>
        <p className="max-w-2xl text-body text-muted-foreground">
          Graduation projects from every batch of the M.Tech in Product Design
          and Management. Open a batch to see its projects, or search across all
          of them.
        </p>
      </header>
      <BatchFolders projects={projects} />
    </>
  )
}
