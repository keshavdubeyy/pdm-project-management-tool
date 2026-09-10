import type { Person, Project } from "@/lib/types"

/** Students may add projects and edit the ones they're a member of; the
 * coordinator can edit anything. Mentors are browse-only per the PRD. */
export function canAddProject(user: Person) {
  return user.role === "student" || user.role === "coordinator"
}

export function canEditProject(project: Project, user: Person) {
  if (user.role === "coordinator") return true
  return project.teamMemberIds.includes(user.id)
}

/** Archiving, restoring and batch/domain upkeep are coordinator-only. */
export function canManageRecords(user: Person) {
  return user.role === "coordinator"
}
