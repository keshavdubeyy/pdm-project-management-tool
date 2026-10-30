"use client"

import { CoordinatorTeams } from "@/components/coordinator/teams-view"
import { EmptyState } from "@/components/common"
import { isCoordinator } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"

/** Every team in the batch. The programme coordinator's list; a mentor's teams
 * are on their own home page. */
export default function TeamsPage() {
  const { actor } = useProjectsStore()
  if (!actor) return null
  if (!isCoordinator(actor))
    return (
      <EmptyState
        title="This list belongs to the programme coordinator"
        body="Mentors find their teams on their home page, and students open their own project from there."
      />
    )
  return <CoordinatorTeams />
}
