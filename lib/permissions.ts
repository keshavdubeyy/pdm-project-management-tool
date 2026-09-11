import type { Person, Project } from "@/lib/types"

/** Only mentors and the coordinator can add projects. Students can still
 * edit the ones they're a member of, but can't create new ones. */
export function canAddProject(user: Person) {
  return user.role === "mentor" || user.role === "coordinator"
}

export function canEditProject(project: Project, user: Person) {
  if (user.role === "coordinator") return true
  return project.teamMemberIds.includes(user.id)
}

/** Archiving, restoring and batch/domain upkeep are coordinator-only. */
export function canManageRecords(user: Person) {
  return user.role === "coordinator"
}
