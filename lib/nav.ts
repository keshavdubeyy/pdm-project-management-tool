import type { Role } from "@/lib/types"

import type { Grid01 } from "@untitledui/icons"

/** Navigation and reach, defined once.
 *
 * Every role gets the SAME words. What differs is how much sits inside
 * them: Projects is one project for a student, six for a mentor, twenty-two for
 * the coordinator. Naming the first item "My work", "My teams" or "Programme"
 * depending on who you were meant nobody could be told where to click.
 */

export type NavItem = {
  label: string
  href: string
  icon: typeof Grid01
  /** What this holds for the current role, shown beside the label. */
  scope?: string
}

export type NavGroup = {
  label?: string
  items: NavItem[]
}

/** The top bar carries no page links, so there is nothing to list. Kept so the
 * command palette has a single place to ask. */
export function navFor(
  _role: Role,
  _counts: { projects: number; waiting: number }
): NavGroup[] {
  return []
}

/** What this role may and may not do, in the words a person would use.
 *
 * Shown permanently in the rail rather than discovered when a button refuses
 * you. `can` is what you are trusted with; `cannot` is the boundary, stated
 * before you walk into it. */
export type Reach = {
  headline: string
  can: string[]
  cannot: string[]
}

export function reachFor(role: Role, counts: { projects: number }): Reach {
  switch (role) {
    case "student":
      return {
        headline: "Your project",
        can: [
          "Turn work in and tick off deliverables",
          "Record meetings, minutes and actions",
          "Reply to your mentor's feedback",
        ],
        cannot: ["Accept your own checkpoint", "Open another team's project"],
      }
    case "mentor":
      return {
        headline: `${counts.projects} ${counts.projects === 1 ? "team" : "teams"}`,
        can: [
          "Accept or return their work",
          "Reach all of them in one message",
          "Move a due date, with a reason",
        ],
        cannot: ["See another mentor's teams", "Change the milestone calendar"],
      }
    case "coordinator":
      return {
        headline: "The whole batch",
        can: [
          "Everything a mentor can, on any project",
          "Edit the calendar and the allocation",
          "Message the entire batch",
        ],
        cannot: ["Act on a mentor's team without it being recorded"],
      }
  }
}
