import type { Artefact, Database } from "@/lib/types"

/** The Project progress log: one entry for each thing handed in.
 *
 * A submission with several links is one entry, not one row per link. The
 * links that belong to a submission are the ones created in the same moment as
 * it, which is how they are told apart from work attached earlier. A link added
 * on its own is an entry of its own. */
export type ProgressEntry = {
  /** The first link's id, which stands for the whole entry. */
  id: string
  projectId: string
  artefacts: Artefact[]
  label: string
  /** Who handed it in. */
  by: string
  at: string
  note: string
  /** When the team last changed it, if it has. */
  editedAt?: string
}

export function progressEntries(
  db: Database,
  projectId: string
): ProgressEntry[] {
  const mine = db.artefacts.filter((a) => a.projectId === projectId)
  const byId = new Map(mine.map((a) => [a.id, a]))
  const claimed = new Set<string>()
  const out: ProgressEntry[] = []

  db.submissions
    .filter((s) => s.projectId === projectId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .forEach((sub) => {
      const group = sub.artefactIds
        .map((id) => byId.get(id))
        .filter(
          (a): a is Artefact =>
            Boolean(a) && !claimed.has(a!.id) && a!.addedAt === sub.submittedAt
        )
      if (group.length === 0) return
      group.forEach((a) => claimed.add(a.id))
      out.push({
        id: group[0].id,
        projectId,
        artefacts: group,
        label: group[0].label,
        by: sub.submittedBy,
        at: sub.submittedAt,
        note: group[0].note ?? sub.note ?? "",
        editedAt: group[0].editedAt,
      })
    })

  mine
    .filter((a) => !claimed.has(a.id))
    .forEach((a) =>
      out.push({
        id: a.id,
        projectId,
        artefacts: [a],
        label: a.label,
        by: a.addedBy,
        at: a.addedAt,
        note: a.note ?? "",
        editedAt: a.editedAt,
      })
    )

  return out.sort((a, b) => b.at.localeCompare(a.at))
}

/** The entry a given link belongs to. */
export function entryContaining(
  db: Database,
  artefactId: string
): ProgressEntry | undefined {
  const artefact = db.artefacts.find((a) => a.id === artefactId)
  if (!artefact) return undefined
  return progressEntries(db, artefact.projectId).find((e) =>
    e.artefacts.some((a) => a.id === artefactId)
  )
}
