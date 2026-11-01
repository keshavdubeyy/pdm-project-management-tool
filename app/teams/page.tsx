"use client"

import { CoordinatorTeams } from "@/components/coordinator/teams-view"
import { EmptyState } from "@/components/common"
import { MentorTeams } from "@/components/mentor/mentor-teams"
import { isCoordinator } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"

/** Every team in the batch for the programme coordinator; a mentor sees the
 * teams they mentor. */
export default function TeamsPage() {
  const { actor } = useProjectsStore()
  if (!actor) return null
  if (actor.role === "mentor") return <MentorTeams />
  if (!isCoordinator(actor))
    return (
      <EmptyState
        title="This list belongs to the programme coordinator"
        body="Students open their own project from their home page."
      />
    )
  return <CoordinatorTeams />
}
