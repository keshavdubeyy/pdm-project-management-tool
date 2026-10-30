import type { Person } from "@/lib/types"

/** What every email is built from, before it is turned into HTML and text.
 * The mails differ in what they say, not in how they are laid out. */

export type MailItem = {
  title: string
  body?: string
  /** A small line under the title, such as who wrote it or when. */
  meta?: string
  /** Where the link goes, relative to the site. */
  href?: string
  tone?: "alert" | "warn" | "good"
}

export type MailSection = {
  heading: string
  note?: string
  items: MailItem[]
}

export type MailKind =
  | "activity"
  | "student-reminder"
  | "mentor-weekly"
  | "coordinator-weekly"
  | "escalation"

export type Mail = {
  kind: MailKind
  to: Person
  subject: string
  intro: string
  sections: MailSection[]
  /** Why this person is getting it, shown at the foot. */
  reason: string
}
