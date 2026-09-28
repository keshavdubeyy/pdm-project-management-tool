import type {
  ActionItem,
  Database,
  MilestoneInstance,
  MilestoneStatus,
  Person,
  Project,
  Role,
} from "@/lib/types"

/** Who may do what.
 *
 * Two rules shape everything here.
 *
 * A mentor's rights come from their allocation, not from holding the mentor
 * role. Being a mentor grants nothing by itself; mentoring *this project* is
 * what grants something. The role decides which screens exist, the allocation
 * decides which rows appear on them.
 *
 * And a team can carry its own work as far as "turned in" but no further. Only
 * a mentor closes a checkpoint. That is the programme's rule, not a technical
 * one, so it is enforced in the store rather than by hiding a button.
 */

export type Actor = {
  person: Person
  /** The role the person is currently acting in. */
  role: Role
}

export function hasRole(person: Person, role: Role) {
  return person.roles.includes(role)
}

export function isCoordinator(actor: Actor) {
  return actor.role === "coordinator" && hasRole(actor.person, "coordinator")
}

export function isMentorOf(actor: Actor, project: Project) {
  return (
    actor.role === "mentor" &&
    hasRole(actor.person, "mentor") &&
    project.mentorIds.includes(actor.person.id)
  )
}

export function isMemberOf(actor: Actor, project: Project) {
  return actor.role === "student" && project.teamMemberIds.includes(actor.person.id)
}

/** Every project this actor is responsible for, in their current role. */
export function projectsFor(db: Database, actor: Actor): Project[] {
  const live = db.projects.filter((p) => !p.archived)
  if (isCoordinator(actor)) return live
  if (actor.role === "mentor") return live.filter((p) => p.mentorIds.includes(actor.person.id))
  return live.filter((p) => p.teamMemberIds.includes(actor.person.id))
}

/** Whether this actor may open the project at all.
 *
 * Visibility beyond the team and its mentors is a per-project setting rather
 * than a default, because whether mentors want to see each other's projects is
 * still an open question with the faculty. The safe default is closed. */
export function canViewProject(actor: Actor, project: Project, db: Database): boolean {
  if (isCoordinator(actor)) return true
  if (isMentorOf(actor, project)) return true
  if (isMemberOf(actor, project)) return true

  if (project.visibility === "batch") {
    if (actor.role === "student") {
      return db.projects.some(
        (p) => p.batchId === project.batchId && p.teamMemberIds.includes(actor.person.id)
      )
    }
    return true
  }
  if (project.visibility === "mentor_group" && actor.role === "mentor") {
    return hasRole(actor.person, "mentor")
  }
  return false
}

export function canEditProject(actor: Actor, project: Project) {
  return isCoordinator(actor) || isMemberOf(actor, project) || isMentorOf(actor, project)
}

export function canCreateProject(actor: Actor) {
  return isCoordinator(actor) || actor.role === "mentor"
}

/** Archiving, the roster, allocation and the milestone calendar. */
export function canManageProgramme(actor: Actor) {
  return isCoordinator(actor)
}

/* ------------------------------------------------------ milestone moves */

export type TransitionCheck = { allowed: boolean; reason?: string }

/** The one rule the programme asked for by name: a team can hand work in, and
 * only a mentor can say it is good enough. */
export function canSetMilestoneStatus(
  actor: Actor,
  project: Project,
  next: MilestoneStatus
): TransitionCheck {
  const mentor = isMentorOf(actor, project)
  const coordinator = isCoordinator(actor)
  const member = isMemberOf(actor, project)

  if (!mentor && !coordinator && !member) {
    return { allowed: false, reason: "This project is not yours to change." }
  }

  if (next === "accepted" || next === "returned" || next === "under_review") {
    if (mentor || coordinator) return { allowed: true }
    return {
      allowed: false,
      reason: "Only the mentor can accept or return a checkpoint. Your team can turn it in.",
    }
  }

  if (next === "overdue") {
    return { allowed: false, reason: "Overdue is set by the calendar, not by a person." }
  }

  return { allowed: true }
}

export function canSubmitMilestone(actor: Actor, project: Project): TransitionCheck {
  if (isMemberOf(actor, project)) return { allowed: true }
  if (isCoordinator(actor)) return { allowed: true }
  if (isMentorOf(actor, project)) {
    return { allowed: false, reason: "Only the team can turn their own work in." }
  }
  return { allowed: false, reason: "This project is not yours to change." }
}

export function canReview(actor: Actor, project: Project): TransitionCheck {
  if (isMentorOf(actor, project) || isCoordinator(actor)) return { allowed: true }
  return { allowed: false, reason: "Only this project's mentor can review it." }
}

/** A coordinator overriding a mentor's decision is allowed, and logged. */
export function isOverride(actor: Actor, project: Project) {
  return isCoordinator(actor) && !project.mentorIds.includes(actor.person.id)
}

/* ---------------------------------------------------- meetings & actions */

export function canRecordMeeting(actor: Actor, project: Project) {
  return isMemberOf(actor, project) || isMentorOf(actor, project) || isCoordinator(actor)
}

export function canCompleteAction(actor: Actor, project: Project, item: ActionItem) {
  if (isCoordinator(actor)) return true
  if (item.ownerId === actor.person.id) return true
  return isMentorOf(actor, project)
}

export function canVerifyAction(actor: Actor, project: Project) {
  return isMentorOf(actor, project) || isCoordinator(actor)
}

/* ------------------------------------------------------- announcements */

export function canAnnounceTo(
  actor: Actor,
  audience: "team" | "my_teams" | "batch" | "faculty"
): boolean {
  if (isCoordinator(actor)) return true
  if (actor.role === "mentor") return audience !== "batch"
  return false
}

export function canSeeFacultyChannel(actor: Actor) {
  return actor.role === "mentor" || isCoordinator(actor)
}

/* ------------------------------------------------------------ artefacts */

export function canAddArtefact(actor: Actor, project: Project) {
  return isMemberOf(actor, project) || isMentorOf(actor, project) || isCoordinator(actor)
}

/* ------------------------------------------------------------ describing */

export const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  mentor: "Faculty mentor",
  coordinator: "Programme coordinator",
}

export const ROLE_SCOPE: Record<Role, string> = {
  student: "your own project",
  mentor: "the teams you mentor",
  coordinator: "every project in the batch",
}

/** A milestone whose week has passed with nothing handed in reads as overdue,
 * whatever the stored value says. The calendar decides this, not a person, so
 * it is computed rather than written. */
export function effectiveStatus(
  milestone: MilestoneInstance,
  dueWeek: number,
  currentWeek: number
): MilestoneStatus {
  if (
    currentWeek > dueWeek &&
    (milestone.status === "not_started" || milestone.status === "in_progress")
  ) {
    return "overdue"
  }
  return milestone.status
}
