import {
  Analytics01Icon,
  CalendarCheckIn01Icon,
  Grid02Icon,
  Megaphone01Icon,
  Settings02Icon,
  Target01Icon,
} from "@hugeicons/core-free-icons"

import type { Role } from "@/lib/types"

/** Navigation and reach, defined once.
 *
 * Every role gets the SAME four words. What differs is how much sits inside
 * them: Projects is one project for a student, six for a mentor, twenty-two for
 * the coordinator. Naming the first item "My work", "My teams" or "Programme"
 * depending on who you were meant nobody could be told where to click.
 */

export type NavItem = {
  label: string
  href: string
  icon: typeof Grid02Icon
  /** What this holds for the current role, shown beside the label. */
  scope?: string
}

export type NavGroup = {
  label?: string
  items: NavItem[]
}

export function navFor(role: Role, counts: { projects: number; waiting: number }): NavGroup[] {
  const main: NavItem[] = [
    { label: "Today", href: "/", icon: Target01Icon },
    {
      label: "Projects",
      href: "/projects",
      icon: Grid02Icon,
      scope: String(counts.projects),
    },
    { label: "Checkpoints", href: "/checkpoints", icon: CalendarCheckIn01Icon },
    { label: "Messages", href: "/messages", icon: Megaphone01Icon },
  ]

  if (role !== "coordinator") return [{ items: main }]

  return [
    { items: main },
    {
      label: "Programme",
      items: [
        { label: "Measures", href: "/measures", icon: Analytics01Icon },
        { label: "Settings", href: "/admin", icon: Settings02Icon },
      ],
    },
  ]
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
