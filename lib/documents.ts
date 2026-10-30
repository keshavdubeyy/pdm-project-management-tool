import type { Artefact, Database } from "@/lib/types"

/** The project's documentation: every link the team has, and which checkpoints
 * each one supports.
 *
 * A document can be tied to a checkpoint two ways: it was handed in on it (its
 * `milestoneInstanceId`), or the team linked it there from the library
 * (`linkedTo`). Both count, and this is the one place that says so, so the
 * library, the checkpoint and the log agree. */

/** The checkpoints (instance ids) a document is connected to, handed in on or
 * linked, without repeats. */
export function linkedCheckpoints(artefact: Artefact): string[] {
  return Array.from(
    new Set(
      [artefact.milestoneInstanceId, ...(artefact.linkedTo ?? [])].filter(
        (id): id is string => Boolean(id)
      )
    )
  )
}

/** Every document of a project, newest first. */
export function documentsOf(db: Database, projectId: string): Artefact[] {
  return db.artefacts
    .filter((a) => a.projectId === projectId)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
}

/** The documents connected to one checkpoint. */
export function documentsOfCheckpoint(
  db: Database,
  projectId: string,
  milestoneInstanceId: string
): Artefact[] {
  return documentsOf(db, projectId).filter((a) =>
    linkedCheckpoints(a).includes(milestoneInstanceId)
  )
}
