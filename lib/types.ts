/** Domain model for the PDM final-project lifecycle.
 *
 * Two shapes here are load-bearing and worth reading before the rest:
 *
 * 1. `Person.roles` is a list, not a single value. The programme coordinator is
 *    also one of the mentoring faculty, so a role is a view someone switches
 *    into, not an account type they were issued.
 *
 * 2. `MilestoneTemplateItem` is data owned by a batch, not an enum in code. The
 *    2025–27 curriculum runs the project as one 24-credit unit and the 2026–28
 *    curriculum splits it in two, so a hard-coded checkpoint list would be
 *    wrong for the next cohort before it ever shipped.
 */

export type Role = "student" | "mentor" | "coordinator"

export type Person = {
  id: string
  name: string
  email: string
  /** Every role this person can act in. Order is not significant. */
  roles: Role[]
  /** Student roll number. Not applicable to mentors or coordinators. */
  rollNumber?: string
  /** Falls back to initials wherever a person is shown when unset. */
  avatarUrl?: string
  /** Short affiliation shown on the sign-in screen and hover cards. */
  affiliation?: string
}

export type Batch = {
  id: string
  label: string
  admissionYear: number
  graduationYear: number
  description?: string
  /** Calendar date (YYYY-MM-DD) that week 1 of the project starts from.
   * Every due date in the batch is derived from this. */
  startDate: string
  archived: boolean
  createdAt: string
}

export type BatchDraft = {
  label: string
  admissionYear: number
  graduationYear: number
  description?: string
  startDate: string
}

export type Domain = { id: string; label: string }

/* -------------------------------------------------------------- teams */

export type Team = {
  id: string
  batchId: string
  /** Display name. Falls back to the members' surnames when a team has not
   * named itself. */
  name: string
  memberIds: string[]
  /** The member who speaks for the team. Must be one of `memberIds`. */
  leadId: string | null
  createdAt: string
}

export type TeamDraft = {
  name: string
  memberIds: string[]
  leadId: string | null
}

/* ----------------------------------------------------------- projects */

export type ProjectStatus = "ongoing" | "completed"

export type MaterialLink = { id: string; label: string; url: string }

export type Project = {
  id: string
  title: string
  description: string
  coverImage?: string
  teamId: string
  /** Kept in sync with the team's members. Read this, write via the team. */
  teamMemberIds: string[]
  batchId: string
  /** The mentor actually assigned to the project. */
  mentorIds: string[]
  /** The mentor the team asked for. Differs from `mentorIds` often enough that
   * the difference is worth showing. */
  preferredMentorId: string | null
  domainId: string | null
  status: ProjectStatus
  problem: string
  workOrOutcome: string
  materials: MaterialLink[]
  /** Who may see this project beyond its own team and mentors. */
  visibility: "team_and_mentor" | "mentor_group" | "batch"
  archived: boolean
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export type ProjectDraft = {
  title: string
  description: string
  coverImage?: string
  teamId: string
  teamMemberIds: string[]
  batchId: string
  mentorIds: string[]
  preferredMentorId: string | null
  domainId: string | null
  status: ProjectStatus
  problem: string
  workOrOutcome: string
  materials: MaterialLink[]
  visibility: Project["visibility"]
}

/* --------------------------------------------------------- milestones */

/** One dated checkpoint in a batch's calendar. */
export type MilestoneTemplateItem = {
  id: string
  batchId: string
  /** Sort order within the batch. */
  order: number
  semester: 3 | 4
  /** The milestone block it belongs to, e.g. "Customer discovery". */
  phase: string
  /** What has to be handed in, e.g. "Customer Validation Report". */
  title: string
  /** Week number counted from the batch start date. */
  dueWeek: number
  /** The named artefacts inside this checkpoint. */
  deliverables: string[]
  /** Set on the two checkpoints the programme treats as gates. */
  isGate?: boolean
  description?: string
}

export type MilestoneTemplateDraft = Omit<MilestoneTemplateItem, "id" | "batchId">

export type MilestoneStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "returned"
  | "accepted"
  | "overdue"

/** Only a mentor or the coordinator may move a milestone into these. */
export const MENTOR_ONLY_STATUSES: MilestoneStatus[] = ["under_review", "returned", "accepted"]

/** A team's own copy of one checkpoint. */
export type MilestoneInstance = {
  id: string
  projectId: string
  templateItemId: string
  status: MilestoneStatus
  /** Set when the team legitimately needs a different date. Always carries a
   * reason, and always shows alongside the original. */
  dueWeekOverride?: number
  dueWeekOverrideReason?: string
  /** Deliverable names inside this checkpoint that the team has ticked off. */
  completedDeliverables: string[]
  startedAt?: string
  submittedAt?: string
  acceptedAt?: string
  acceptedBy?: string
  returnedAt?: string
  updatedAt: string
}

/* -------------------------------------------------------- submissions */

export type ArtefactService =
  | "google_doc"
  | "google_sheet"
  | "google_slide"
  | "google_drive"
  | "figma"
  | "figjam"
  | "miro"
  | "github"
  | "notion"
  | "loom"
  | "youtube"
  | "canva"
  | "link"

export type Artefact = {
  id: string
  projectId: string
  /** Null when the artefact belongs to the project generally rather than to a
   * specific checkpoint. */
  milestoneInstanceId: string | null
  label: string
  url: string
  service: ArtefactService
  note?: string
  addedBy: string
  addedAt: string
}

export type Submission = {
  id: string
  milestoneInstanceId: string
  projectId: string
  /** 1 for the first attempt, incrementing on every resubmission. Nothing is
   * overwritten; a returned submission stays readable. */
  attempt: number
  submittedBy: string
  submittedAt: string
  note: string
  artefactIds: string[]
}

export type ReviewVerdict = "accept" | "return"

export type ReturnCategory = "scope" | "evidence" | "depth" | "incomplete" | "other"

export type Review = {
  id: string
  submissionId: string
  milestoneInstanceId: string
  projectId: string
  reviewerId: string
  verdict: ReviewVerdict
  /** Required when the verdict is "return". */
  category?: ReturnCategory
  body: string
  createdAt: string
  /** The team records how they addressed it; the mentor can then confirm. */
  addressedNote?: string
  addressedAt?: string
  confirmedBy?: string
  confirmedAt?: string
}

/* ------------------------------------------------- meetings & actions */

export type Meeting = {
  id: string
  projectId: string
  title: string
  /** Calendar date, YYYY-MM-DD. */
  date: string
  time?: string
  attendeeIds: string[]
  /** Meet, Zoom or Teams link. We hold the link; we do not host the call. */
  callUrl?: string
  createdBy: string
  createdAt: string
}

export type Minutes = {
  id: string
  meetingId: string
  projectId: string
  discussed: string
  decided: string
  next: string
  recordedBy: string
  recordedAt: string
  /** Both sides confirm the record, and both timestamps are kept. */
  confirmedByTeamAt?: string
  confirmedByMentorAt?: string
}

export type ActionItemSource = "meeting" | "review" | "self"

export type ActionItem = {
  id: string
  projectId: string
  source: ActionItemSource
  meetingId?: string
  reviewId?: string
  text: string
  ownerId: string
  /** Calendar date, YYYY-MM-DD. */
  dueDate: string
  status: "open" | "done"
  createdBy: string
  createdAt: string
  completedAt?: string
  /** A mentor confirming the work actually happened. */
  verifiedBy?: string
  verifiedAt?: string
}

/* --------------------------------------------------- communication */

export type AnnouncementAudience =
  | { kind: "team"; teamId: string }
  | { kind: "my_teams" }
  | { kind: "batch"; batchId: string }
  | { kind: "faculty" }

export type Announcement = {
  id: string
  authorId: string
  audience: AnnouncementAudience
  title: string
  body: string
  /** Milestone this is about, when it is about one. */
  milestoneTemplateItemId?: string
  pinned: boolean
  createdAt: string
}

export type AnnouncementRead = {
  announcementId: string
  personId: string
  readAt: string
}

/* -------------------------------------------------- notifications */

export type NotificationKind =
  | "deadline"
  | "submission"
  | "review"
  | "action_item"
  | "announcement"
  | "meeting"

export type AppNotification = {
  id: string
  personId: string
  kind: NotificationKind
  title: string
  body: string
  href: string
  createdAt: string
  readAt?: string
}

/* --------------------------------------------------------- audit */

export type AuditEvent = {
  id: string
  actorId: string
  action: string
  subject: string
  detail?: string
  createdAt: string
}

/* --------------------------------------------------------- session */

export type Session = {
  personId: string
  /** Which of the person's roles they are currently acting in. */
  activeRole: Role
  signedInAt: string
}

/* ------------------------------------------------------------ store */

export type Database = {
  version: number
  people: Person[]
  batches: Batch[]
  domains: Domain[]
  teams: Team[]
  projects: Project[]
  milestoneTemplate: MilestoneTemplateItem[]
  milestones: MilestoneInstance[]
  artefacts: Artefact[]
  submissions: Submission[]
  reviews: Review[]
  meetings: Meeting[]
  minutes: Minutes[]
  actionItems: ActionItem[]
  announcements: Announcement[]
  announcementReads: AnnouncementRead[]
  notifications: AppNotification[]
  audit: AuditEvent[]
}
