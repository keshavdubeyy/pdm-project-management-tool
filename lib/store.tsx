"use client"

import * as React from "react"

import { currentWeek, dueDateForWeek, todayIso } from "@/lib/dates"
import { loadDatabase, resetDatabase, saveDatabase, subscribeToChanges } from "@/lib/db"
import { detectService } from "@/lib/links"
import { milestoneTemplateFor } from "@/lib/milestone-template"
import {
  type Actor,
  canAnnounceTo,
  canReview,
  canSetMilestoneStatus,
  canSubmitMilestone,
  effectiveStatus,
  isCoordinator,
  isMemberOf,
  isMentorOf,
  isOverride,
} from "@/lib/permissions"
import { audienceMembers } from "@/lib/selectors"
import { readSession, signIn as persistSignIn, clearSession, writeSession } from "@/lib/session"
import type {
  ActionItem,
  Announcement,
  AnnouncementAudience,
  AppNotification,
  Artefact,
  Batch,
  BatchDraft,
  Database,
  Meeting,
  MilestoneInstance,
  MilestoneStatus,
  MilestoneTemplateItem,
  Minutes,
  Person,
  Project,
  ProjectDraft,
  ReturnCategory,
  Review,
  Role,
  Session,
  Submission,
  Team,
  TeamDraft,
} from "@/lib/types"

/* ------------------------------------------------------------------ types */

export type ActionResult = { ok: true } | { ok: false; reason: string }

const ok: ActionResult = { ok: true }
const deny = (reason: string): ActionResult => ({ ok: false, reason })

type StoreValue = {
  db: Database
  ready: boolean
  session: Session | null
  /** Null until a session exists. Everything role-aware reads this. */
  actor: Actor | null
  currentUser: Person | null
  /** Current project week, derived from the batch start date. */
  week: number
  batch: Batch

  signIn: (personId: string, role?: Role) => void
  signOut: () => void
  setActiveRole: (role: Role) => void

  // milestones
  setMilestoneStatus: (milestoneId: string, next: MilestoneStatus) => ActionResult
  toggleDeliverable: (milestoneId: string, deliverable: string) => ActionResult
  submitMilestone: (milestoneId: string, note: string, artefactIds: string[]) => ActionResult
  reviewSubmission: (
    milestoneId: string,
    verdict: "accept" | "return",
    body: string,
    category?: ReturnCategory
  ) => ActionResult
  openForReview: (milestoneId: string) => ActionResult
  setDueWeekOverride: (milestoneId: string, week: number | null, reason: string) => ActionResult
  markFeedbackAddressed: (reviewId: string, note: string) => ActionResult
  confirmFeedbackAddressed: (reviewId: string) => ActionResult

  // artefacts
  addArtefact: (
    projectId: string,
    input: { url: string; label?: string; milestoneInstanceId?: string | null; note?: string }
  ) => ActionResult
  removeArtefact: (artefactId: string) => ActionResult

  // meetings, minutes, actions
  addMeeting: (
    projectId: string,
    input: { title: string; date: string; time?: string; attendeeIds: string[]; callUrl?: string }
  ) => ActionResult
  saveMinutes: (
    meetingId: string,
    input: { discussed: string; decided: string; next: string }
  ) => ActionResult
  confirmMinutes: (minutesId: string) => ActionResult
  addActionItem: (
    projectId: string,
    input: { text: string; ownerId: string; dueDate: string; meetingId?: string }
  ) => ActionResult
  toggleActionItem: (actionItemId: string) => ActionResult
  verifyActionItem: (actionItemId: string) => ActionResult
  deleteActionItem: (actionItemId: string) => ActionResult

  // announcements
  postAnnouncement: (input: {
    title: string
    body: string
    audience: AnnouncementAudience
    pinned?: boolean
    milestoneTemplateItemId?: string
  }) => ActionResult
  markAnnouncementRead: (announcementId: string) => void
  togglePinned: (announcementId: string) => ActionResult

  // notifications
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  // programme administration
  addPerson: (input: { name: string; email: string; roles: Role[]; rollNumber?: string }) => Person
  updateAllocation: (
    projectId: string,
    mentorIds: string[],
    preferredMentorId: string | null
  ) => ActionResult
  saveTeam: (teamId: string, draft: TeamDraft) => ActionResult
  createTeam: (draft: TeamDraft) => ActionResult
  addProject: (draft: ProjectDraft) => ActionResult
  updateProject: (id: string, draft: ProjectDraft) => ActionResult
  archiveProject: (id: string) => ActionResult
  restoreProject: (id: string) => ActionResult
  setProjectVisibility: (id: string, visibility: Project["visibility"]) => ActionResult
  addBatch: (draft: BatchDraft) => ActionResult
  updateBatch: (id: string, draft: BatchDraft) => ActionResult
  addDomain: (label: string) => ActionResult
  saveMilestoneTemplateItem: (
    id: string | null,
    draft: Omit<MilestoneTemplateItem, "id" | "batchId">
  ) => ActionResult
  deleteMilestoneTemplateItem: (id: string) => ActionResult
  resetAll: () => void
}

const StoreContext = React.createContext<StoreValue | null>(null)

/* --------------------------------------------------------------- provider */

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = React.useState<Database>(() => loadDatabase())
  const [session, setSession] = React.useState<Session | null>(null)
  const [ready, setReady] = React.useState(false)

  // localStorage is not available while rendering on the server, so the real
  // state lands on mount. `ready` keeps the UI from flashing a signed-out
  // shell before we know who this tab is.
  React.useEffect(() => {
    setDb(loadDatabase())
    setSession(readSession())
    setReady(true)
  }, [])

  // Another tab wrote. Pick it up so a mentor watching in a second window sees
  // a submission land without refreshing.
  React.useEffect(() => subscribeToChanges(() => setDb(loadDatabase())), [])

  // Deadline reminders. There is no server to run a nightly job, so they are
  // generated when the app loads and keyed by checkpoint and date, which makes
  // running it again harmless.
  React.useEffect(() => {
    if (!ready) return
    const current = loadDatabase()
    const batchStart = current.batches[0]?.startDate
    if (!batchStart) return

    const today = todayIso()
    const templates = new Map(current.milestoneTemplate.map((t) => [t.id, t]))
    const projects = new Map(current.projects.map((p) => [p.id, p]))
    const existing = new Set(current.notifications.map((n) => n.id))
    const fresh: AppNotification[] = []

    current.milestones.forEach((milestone) => {
      if (milestone.status === "accepted") return
      const template = templates.get(milestone.templateItemId)
      const project = projects.get(milestone.projectId)
      if (!template || !project || project.archived) return

      const dueWeek = milestone.dueWeekOverride ?? template.dueWeek
      const due = dueDateForWeek(dueWeek, batchStart)
      const daysOut = Math.round(
        (new Date(`${due}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) /
          86_400_000
      )
      // A week out and the day before. Two reminders, not a stream.
      if (daysOut !== 7 && daysOut !== 1) return

      project.teamMemberIds.forEach((personId) => {
        const id = `deadline-${milestone.id}-${due}-${daysOut}-${personId}`
        if (existing.has(id)) return
        fresh.push({
          id,
          personId,
          kind: "deadline",
          title:
            daysOut === 1
              ? `${template.title} is due tomorrow`
              : `${template.title} is due in a week`,
          body: `Week ${dueWeek}, closing ${due}.`,
          href: `/projects/${project.id}?milestone=${milestone.id}`,
          createdAt: new Date().toISOString(),
        })
      })
    })

    if (!fresh.length) return
    const next = { ...current, notifications: [...fresh, ...current.notifications].slice(0, 1000) }
    setDb(next)
    saveDatabase(next)
  }, [ready])

  const commit = React.useCallback((next: Database) => {
    setDb(next)
    saveDatabase(next)
  }, [])

  const currentUser = React.useMemo(
    () => (session ? (db.people.find((p) => p.id === session.personId) ?? null) : null),
    [db.people, session]
  )

  const actor = React.useMemo<Actor | null>(
    () => (currentUser && session ? { person: currentUser, role: session.activeRole } : null),
    [currentUser, session]
  )

  const batch = db.batches[0]
  const week = React.useMemo(() => currentWeek(batch.startDate), [batch.startDate])

  /* ------------------------------------------------------------ helpers */

  const findProject = React.useCallback(
    (projectId: string) => db.projects.find((p) => p.id === projectId),
    [db.projects]
  )

  const projectOfMilestone = React.useCallback(
    (milestoneId: string) => {
      const milestone = db.milestones.find((m) => m.id === milestoneId)
      if (!milestone) return null
      const project = db.projects.find((p) => p.id === milestone.projectId)
      return project ? { milestone, project } : null
    },
    [db.milestones, db.projects]
  )

  const templateOf = React.useCallback(
    (templateItemId: string) => db.milestoneTemplate.find((t) => t.id === templateItemId),
    [db.milestoneTemplate]
  )

  /** Every mutation goes through here so that nothing bypasses the audit
   * trail, and so a coordinator acting outside their own mentees is recorded
   * as an override rather than silently allowed. */
  const write = React.useCallback(
    (mutate: (draft: Database) => void, audit?: { action: string; subject: string; detail?: string }) => {
      const next: Database = structuredClone(db)
      mutate(next)
      if (audit && actor) {
        next.audit = [
          {
            id: id("aud"),
            actorId: actor.person.id,
            action: audit.action,
            subject: audit.subject,
            detail: audit.detail,
            createdAt: new Date().toISOString(),
          },
          ...next.audit,
        ].slice(0, 500)
      }
      commit(next)
    },
    [actor, commit, db]
  )

  const notify = (
    draft: Database,
    personIds: string[],
    payload: Omit<AppNotification, "id" | "personId">
  ) => {
    const unique = Array.from(new Set(personIds))
    draft.notifications = [
      ...unique.map((personId) => ({ id: id("ntf"), personId, ...payload })),
      ...draft.notifications,
    ].slice(0, 1000)
  }

  /* ------------------------------------------------------------ session */

  const doSignIn = React.useCallback((personId: string, role?: Role) => {
    const person = loadDatabase().people.find((p) => p.id === personId)
    if (!person) return
    const chosen = role && person.roles.includes(role) ? role : preferredRole(person)
    setSession(persistSignIn(personId, chosen))
  }, [])

  const doSignOut = React.useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  const setActiveRole = React.useCallback(
    (role: Role) => {
      if (!session || !currentUser?.roles.includes(role)) return
      const next: Session = { ...session, activeRole: role }
      writeSession(next)
      setSession(next)
    },
    [currentUser, session]
  )

  /* --------------------------------------------------------- milestones */

  const setMilestoneStatus = React.useCallback(
    (milestoneId: string, next: MilestoneStatus): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const found = projectOfMilestone(milestoneId)
      if (!found) return deny("That checkpoint no longer exists.")
      const check = canSetMilestoneStatus(actor, found.project, next)
      if (!check.allowed) return deny(check.reason ?? "Not permitted.")

      write(
        (draft) => {
          const m = draft.milestones.find((x) => x.id === milestoneId)!
          m.status = next
          m.updatedAt = new Date().toISOString()
          if (next === "in_progress" && !m.startedAt) m.startedAt = m.updatedAt
        },
        {
          action: "milestone.status",
          subject: milestoneId,
          detail: `${next}${isOverride(actor, found.project) ? " (coordinator override)" : ""}`,
        }
      )
      return ok
    },
    [actor, projectOfMilestone, write]
  )

  const toggleDeliverable = React.useCallback(
    (milestoneId: string, deliverable: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const found = projectOfMilestone(milestoneId)
      if (!found) return deny("That checkpoint no longer exists.")
      if (!isMemberOf(actor, found.project) && !isCoordinator(actor)) {
        return deny("Only the team ticks off its own deliverables.")
      }
      write((draft) => {
        const m = draft.milestones.find((x) => x.id === milestoneId)!
        m.completedDeliverables = m.completedDeliverables.includes(deliverable)
          ? m.completedDeliverables.filter((d) => d !== deliverable)
          : [...m.completedDeliverables, deliverable]
        if (m.status === "not_started" && m.completedDeliverables.length) {
          m.status = "in_progress"
          m.startedAt = m.startedAt ?? new Date().toISOString()
        }
        m.updatedAt = new Date().toISOString()
      })
      return ok
    },
    [actor, projectOfMilestone, write]
  )

  const submitMilestone = React.useCallback(
    (milestoneId: string, note: string, artefactIds: string[]): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const found = projectOfMilestone(milestoneId)
      if (!found) return deny("That checkpoint no longer exists.")
      const check = canSubmitMilestone(actor, found.project)
      if (!check.allowed) return deny(check.reason ?? "Not permitted.")
      if (!artefactIds.length) return deny("Attach at least one piece of work before turning it in.")

      const now = new Date().toISOString()
      const attempt =
        db.submissions.filter((s) => s.milestoneInstanceId === milestoneId).length + 1

      write(
        (draft) => {
          const m = draft.milestones.find((x) => x.id === milestoneId)!
          m.status = "submitted"
          m.submittedAt = now
          m.updatedAt = now
          const submission: Submission = {
            id: id("sub"),
            milestoneInstanceId: milestoneId,
            projectId: found.project.id,
            attempt,
            submittedBy: actor.person.id,
            submittedAt: now,
            note,
            artefactIds,
          }
          draft.submissions = [submission, ...draft.submissions]
          const item = draft.milestoneTemplate.find((t) => t.id === m.templateItemId)
          notify(draft, found.project.mentorIds, {
            kind: "submission",
            title: `${found.project.title.slice(0, 48)} turned in ${item?.title ?? "a checkpoint"}`,
            body: attempt > 1 ? `Resubmission, attempt ${attempt}.` : "Waiting on your review.",
            href: "/review",
            createdAt: now,
          })
        },
        { action: "milestone.submit", subject: milestoneId, detail: `attempt ${attempt}` }
      )
      return ok
    },
    [actor, db.submissions, projectOfMilestone, write]
  )

  const openForReview = React.useCallback(
    (milestoneId: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const found = projectOfMilestone(milestoneId)
      if (!found) return deny("That checkpoint no longer exists.")
      const check = canReview(actor, found.project)
      if (!check.allowed) return deny(check.reason ?? "Not permitted.")
      if (found.milestone.status !== "submitted") return ok
      write((draft) => {
        const m = draft.milestones.find((x) => x.id === milestoneId)!
        m.status = "under_review"
        m.updatedAt = new Date().toISOString()
      })
      return ok
    },
    [actor, projectOfMilestone, write]
  )

  const reviewSubmission = React.useCallback(
    (
      milestoneId: string,
      verdict: "accept" | "return",
      body: string,
      category?: ReturnCategory
    ): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const found = projectOfMilestone(milestoneId)
      if (!found) return deny("That checkpoint no longer exists.")
      const check = canReview(actor, found.project)
      if (!check.allowed) return deny(check.reason ?? "Not permitted.")
      if (verdict === "return" && body.trim().length < 20) {
        return deny("Say what needs to change — at least a sentence.")
      }
      if (verdict === "return" && !category) return deny("Pick what kind of change is needed.")

      const submission = db.submissions
        .filter((s) => s.milestoneInstanceId === milestoneId)
        .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))[0]
      if (!submission) return deny("There is nothing turned in to review.")

      const now = new Date().toISOString()
      write(
        (draft) => {
          const m = draft.milestones.find((x) => x.id === milestoneId)!
          const review: Review = {
            id: id("rev"),
            submissionId: submission.id,
            milestoneInstanceId: milestoneId,
            projectId: found.project.id,
            reviewerId: actor.person.id,
            verdict,
            category: verdict === "return" ? category : undefined,
            body: body.trim(),
            createdAt: now,
          }
          draft.reviews = [review, ...draft.reviews]

          if (verdict === "accept") {
            m.status = "accepted"
            m.acceptedAt = now
            m.acceptedBy = actor.person.id
          } else {
            m.status = "returned"
            m.returnedAt = now
          }
          m.updatedAt = now

          const item = draft.milestoneTemplate.find((t) => t.id === m.templateItemId)
          notify(draft, found.project.teamMemberIds, {
            kind: "review",
            title:
              verdict === "accept"
                ? `${item?.title ?? "Checkpoint"} accepted`
                : `${item?.title ?? "Checkpoint"} returned for revisions`,
            body: body.trim().slice(0, 100),
            href: `/projects/${found.project.id}?milestone=${milestoneId}`,
            createdAt: now,
          })

          if (verdict === "return") {
            draft.actionItems = [
              {
                id: id("ai"),
                projectId: found.project.id,
                source: "review",
                reviewId: review.id,
                text: `Address the feedback on ${item?.title ?? "the checkpoint"} and resubmit`,
                ownerId: found.project.teamMemberIds[0],
                dueDate: addDaysIso(todayIso(), 7),
                status: "open",
                createdBy: actor.person.id,
                createdAt: now,
              },
              ...draft.actionItems,
            ]
          }
        },
        {
          action: `milestone.${verdict}`,
          subject: milestoneId,
          detail: isOverride(actor, found.project) ? "coordinator override" : undefined,
        }
      )
      return ok
    },
    [actor, db.submissions, projectOfMilestone, write]
  )

  const setDueWeekOverride = React.useCallback(
    (milestoneId: string, weekValue: number | null, reason: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const found = projectOfMilestone(milestoneId)
      if (!found) return deny("That checkpoint no longer exists.")
      if (!isMentorOf(actor, found.project) && !isCoordinator(actor)) {
        return deny("Only a mentor or the coordinator can move a due date.")
      }
      if (weekValue !== null && reason.trim().length < 5) {
        return deny("A moved deadline needs a reason on the record.")
      }
      write(
        (draft) => {
          const m = draft.milestones.find((x) => x.id === milestoneId)!
          if (weekValue === null) {
            delete m.dueWeekOverride
            delete m.dueWeekOverrideReason
          } else {
            m.dueWeekOverride = weekValue
            m.dueWeekOverrideReason = reason.trim()
          }
          m.updatedAt = new Date().toISOString()
        },
        { action: "milestone.dueDate", subject: milestoneId, detail: reason }
      )
      return ok
    },
    [actor, projectOfMilestone, write]
  )

  const markFeedbackAddressed = React.useCallback(
    (reviewId: string, note: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const review = db.reviews.find((r) => r.id === reviewId)
      const project = review ? findProject(review.projectId) : undefined
      if (!review || !project) return deny("That feedback no longer exists.")
      if (!isMemberOf(actor, project)) return deny("Only the team records how they addressed it.")
      write((draft) => {
        const r = draft.reviews.find((x) => x.id === reviewId)!
        r.addressedNote = note.trim()
        r.addressedAt = new Date().toISOString()
      })
      return ok
    },
    [actor, db.reviews, findProject, write]
  )

  const confirmFeedbackAddressed = React.useCallback(
    (reviewId: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const review = db.reviews.find((r) => r.id === reviewId)
      const project = review ? findProject(review.projectId) : undefined
      if (!review || !project) return deny("That feedback no longer exists.")
      if (!isMentorOf(actor, project) && !isCoordinator(actor)) {
        return deny("Only the mentor confirms this.")
      }
      write((draft) => {
        const r = draft.reviews.find((x) => x.id === reviewId)!
        r.confirmedBy = actor.person.id
        r.confirmedAt = new Date().toISOString()
      })
      return ok
    },
    [actor, db.reviews, findProject, write]
  )

  /* ---------------------------------------------------------- artefacts */

  const addArtefact = React.useCallback(
    (
      projectId: string,
      input: { url: string; label?: string; milestoneInstanceId?: string | null; note?: string }
    ): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const project = findProject(projectId)
      if (!project) return deny("That project no longer exists.")
      if (!isMemberOf(actor, project) && !isMentorOf(actor, project) && !isCoordinator(actor)) {
        return deny("This project is not yours to change.")
      }
      const artefact: Artefact = {
        id: id("art"),
        projectId,
        milestoneInstanceId: input.milestoneInstanceId ?? null,
        label: input.label?.trim() || "Untitled",
        url: input.url.trim(),
        service: detectService(input.url),
        note: input.note?.trim() || undefined,
        addedBy: actor.person.id,
        addedAt: new Date().toISOString(),
      }
      write((draft) => {
        draft.artefacts = [artefact, ...draft.artefacts]
      })
      return ok
    },
    [actor, findProject, write]
  )

  const removeArtefact = React.useCallback(
    (artefactId: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const artefact = db.artefacts.find((a) => a.id === artefactId)
      const project = artefact ? findProject(artefact.projectId) : undefined
      if (!artefact || !project) return deny("That link no longer exists.")
      if (!isMemberOf(actor, project) && !isCoordinator(actor)) {
        return deny("Only the team can remove its own links.")
      }
      const used = db.submissions.some((s) => s.artefactIds.includes(artefactId))
      if (used) return deny("This is attached to work already turned in, so it stays on the record.")
      write((draft) => {
        draft.artefacts = draft.artefacts.filter((a) => a.id !== artefactId)
      })
      return ok
    },
    [actor, db.artefacts, db.submissions, findProject, write]
  )

  /* ------------------------------------------------ meetings and actions */

  const addMeeting = React.useCallback(
    (
      projectId: string,
      input: { title: string; date: string; time?: string; attendeeIds: string[]; callUrl?: string }
    ): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const project = findProject(projectId)
      if (!project) return deny("That project no longer exists.")
      if (!isMemberOf(actor, project) && !isMentorOf(actor, project) && !isCoordinator(actor)) {
        return deny("This project is not yours to change.")
      }
      const meeting: Meeting = {
        id: id("mtg"),
        projectId,
        title: input.title.trim() || "Mentor meeting",
        date: input.date,
        time: input.time,
        attendeeIds: input.attendeeIds,
        callUrl: input.callUrl?.trim() || undefined,
        createdBy: actor.person.id,
        createdAt: new Date().toISOString(),
      }
      write(
        (draft) => {
          draft.meetings = [meeting, ...draft.meetings]
          notify(
            draft,
            input.attendeeIds.filter((a) => a !== actor.person.id),
            {
              kind: "meeting",
              title: `${meeting.title} on ${meeting.date}`,
              body: `${project.title.slice(0, 60)}`,
              href: `/projects/${projectId}?tab=meetings`,
              createdAt: meeting.createdAt,
            }
          )
        },
        { action: "meeting.create", subject: meeting.id }
      )
      return ok
    },
    [actor, findProject, write]
  )

  const saveMinutes = React.useCallback(
    (
      meetingId: string,
      input: { discussed: string; decided: string; next: string }
    ): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const meeting = db.meetings.find((m) => m.id === meetingId)
      const project = meeting ? findProject(meeting.projectId) : undefined
      if (!meeting || !project) return deny("That meeting no longer exists.")
      if (!isMemberOf(actor, project) && !isMentorOf(actor, project) && !isCoordinator(actor)) {
        return deny("This project is not yours to change.")
      }
      const now = new Date().toISOString()
      write(
        (draft) => {
          const existing = draft.minutes.find((m) => m.meetingId === meetingId)
          if (existing) {
            existing.discussed = input.discussed
            existing.decided = input.decided
            existing.next = input.next
            existing.recordedBy = actor.person.id
            existing.recordedAt = now
          } else {
            const minutes: Minutes = {
              id: id("min"),
              meetingId,
              projectId: meeting.projectId,
              discussed: input.discussed,
              decided: input.decided,
              next: input.next,
              recordedBy: actor.person.id,
              recordedAt: now,
              ...(isMemberOf(actor, project)
                ? { confirmedByTeamAt: now }
                : { confirmedByMentorAt: now }),
            }
            draft.minutes = [minutes, ...draft.minutes]
          }
        },
        { action: "minutes.save", subject: meetingId }
      )
      return ok
    },
    [actor, db.meetings, findProject, write]
  )

  const confirmMinutes = React.useCallback(
    (minutesId: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const minutes = db.minutes.find((m) => m.id === minutesId)
      const project = minutes ? findProject(minutes.projectId) : undefined
      if (!minutes || !project) return deny("Those minutes no longer exist.")
      const now = new Date().toISOString()
      write((draft) => {
        const m = draft.minutes.find((x) => x.id === minutesId)!
        if (isMemberOf(actor, project)) m.confirmedByTeamAt = now
        else if (isMentorOf(actor, project) || isCoordinator(actor)) m.confirmedByMentorAt = now
      })
      return ok
    },
    [actor, db.minutes, findProject, write]
  )

  const addActionItem = React.useCallback(
    (
      projectId: string,
      input: { text: string; ownerId: string; dueDate: string; meetingId?: string }
    ): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const project = findProject(projectId)
      if (!project) return deny("That project no longer exists.")
      if (!input.text.trim()) return deny("An action needs a description.")
      if (!input.ownerId) return deny("An action needs one named owner.")
      const item: ActionItem = {
        id: id("ai"),
        projectId,
        source: input.meetingId ? "meeting" : "self",
        meetingId: input.meetingId,
        text: input.text.trim(),
        ownerId: input.ownerId,
        dueDate: input.dueDate,
        status: "open",
        createdBy: actor.person.id,
        createdAt: new Date().toISOString(),
      }
      write((draft) => {
        draft.actionItems = [item, ...draft.actionItems]
        if (input.ownerId !== actor.person.id) {
          notify(draft, [input.ownerId], {
            kind: "action_item",
            title: "You were given an action",
            body: item.text,
            href: `/projects/${projectId}?tab=meetings`,
            createdAt: item.createdAt,
          })
        }
      })
      return ok
    },
    [actor, findProject, write]
  )

  const toggleActionItem = React.useCallback(
    (actionItemId: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const item = db.actionItems.find((a) => a.id === actionItemId)
      const project = item ? findProject(item.projectId) : undefined
      if (!item || !project) return deny("That action no longer exists.")
      if (
        item.ownerId !== actor.person.id &&
        !isMentorOf(actor, project) &&
        !isCoordinator(actor)
      ) {
        return deny("Only the owner or the mentor can close this.")
      }
      write((draft) => {
        const a = draft.actionItems.find((x) => x.id === actionItemId)!
        if (a.status === "open") {
          a.status = "done"
          a.completedAt = new Date().toISOString()
        } else {
          a.status = "open"
          delete a.completedAt
          delete a.verifiedBy
          delete a.verifiedAt
        }
      })
      return ok
    },
    [actor, db.actionItems, findProject, write]
  )

  const verifyActionItem = React.useCallback(
    (actionItemId: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const item = db.actionItems.find((a) => a.id === actionItemId)
      const project = item ? findProject(item.projectId) : undefined
      if (!item || !project) return deny("That action no longer exists.")
      if (!isMentorOf(actor, project) && !isCoordinator(actor)) {
        return deny("Only the mentor confirms an action is done.")
      }
      write((draft) => {
        const a = draft.actionItems.find((x) => x.id === actionItemId)!
        a.verifiedBy = actor.person.id
        a.verifiedAt = new Date().toISOString()
        a.status = "done"
        a.completedAt = a.completedAt ?? a.verifiedAt
      })
      return ok
    },
    [actor, db.actionItems, findProject, write]
  )

  const deleteActionItem = React.useCallback(
    (actionItemId: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const item = db.actionItems.find((a) => a.id === actionItemId)
      const project = item ? findProject(item.projectId) : undefined
      if (!item || !project) return deny("That action no longer exists.")
      if (item.createdBy !== actor.person.id && !isCoordinator(actor)) {
        return deny("Only whoever raised it can remove it.")
      }
      write((draft) => {
        draft.actionItems = draft.actionItems.filter((a) => a.id !== actionItemId)
      })
      return ok
    },
    [actor, db.actionItems, findProject, write]
  )

  /* ------------------------------------------------------ announcements */

  const postAnnouncement = React.useCallback(
    (input: {
      title: string
      body: string
      audience: AnnouncementAudience
      pinned?: boolean
      milestoneTemplateItemId?: string
    }): ActionResult => {
      if (!actor) return deny("Sign in first.")
      if (!canAnnounceTo(actor, input.audience.kind)) {
        return deny("Your role cannot post to that audience.")
      }
      if (!input.title.trim()) return deny("Give it a subject line.")
      if (!input.body.trim()) return deny("An announcement needs a message.")

      const now = new Date().toISOString()
      const announcement: Announcement = {
        id: id("ann"),
        authorId: actor.person.id,
        audience: input.audience,
        title: input.title.trim(),
        body: input.body.trim(),
        milestoneTemplateItemId: input.milestoneTemplateItemId,
        pinned: input.pinned ?? false,
        createdAt: now,
      }
      write(
        (draft) => {
          draft.announcements = [announcement, ...draft.announcements]
          const recipients = audienceMembers(draft, announcement)
          notify(
            draft,
            recipients.filter((r) => r !== actor.person.id),
            {
              kind: "announcement",
              title: announcement.title,
              body: announcement.body.slice(0, 110),
              href: "/announcements",
              createdAt: now,
            }
          )
        },
        { action: "announcement.post", subject: announcement.id, detail: input.audience.kind }
      )
      return ok
    },
    [actor, write]
  )

  const markAnnouncementRead = React.useCallback(
    (announcementId: string) => {
      if (!actor) return
      const already = db.announcementReads.some(
        (r) => r.announcementId === announcementId && r.personId === actor.person.id
      )
      if (already) return
      write((draft) => {
        draft.announcementReads = [
          { announcementId, personId: actor.person.id, readAt: new Date().toISOString() },
          ...draft.announcementReads,
        ]
      })
    },
    [actor, db.announcementReads, write]
  )

  const togglePinned = React.useCallback(
    (announcementId: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const announcement = db.announcements.find((a) => a.id === announcementId)
      if (!announcement) return deny("That announcement no longer exists.")
      if (announcement.authorId !== actor.person.id && !isCoordinator(actor)) {
        return deny("Only the author or the coordinator can pin this.")
      }
      write((draft) => {
        const a = draft.announcements.find((x) => x.id === announcementId)!
        a.pinned = !a.pinned
      })
      return ok
    },
    [actor, db.announcements, write]
  )

  /* ------------------------------------------------------ notifications */

  const markNotificationRead = React.useCallback(
    (notificationId: string) => {
      write((draft) => {
        const n = draft.notifications.find((x) => x.id === notificationId)
        if (n && !n.readAt) n.readAt = new Date().toISOString()
      })
    },
    [write]
  )

  const markAllNotificationsRead = React.useCallback(() => {
    if (!actor) return
    write((draft) => {
      draft.notifications.forEach((n) => {
        if (n.personId === actor.person.id && !n.readAt) n.readAt = new Date().toISOString()
      })
    })
  }, [actor, write])

  /* --------------------------------------------------------- programme */

  const requireCoordinator = React.useCallback((): ActionResult | null => {
    if (!actor) return deny("Sign in first.")
    if (!isCoordinator(actor)) return deny("Only the programme coordinator can change this.")
    return null
  }, [actor])

  const addPerson = React.useCallback(
    (input: { name: string; email: string; roles: Role[]; rollNumber?: string }): Person => {
      const person: Person = {
        id: id("p"),
        name: input.name.trim(),
        email: input.email.trim(),
        roles: input.roles.length ? input.roles : ["student"],
        rollNumber: input.rollNumber?.trim() || undefined,
      }
      write((draft) => {
        draft.people = [...draft.people, person]
      })
      return person
    },
    [write]
  )

  const updateAllocation = React.useCallback(
    (projectId: string, mentorIds: string[], preferredMentorId: string | null): ActionResult => {
      const denied = requireCoordinator()
      if (denied) return denied
      if (!mentorIds.length) return deny("A project needs at least one mentor.")
      write(
        (draft) => {
          const p = draft.projects.find((x) => x.id === projectId)!
          p.mentorIds = mentorIds
          p.preferredMentorId = preferredMentorId
          p.updatedAt = new Date().toISOString()
          p.updatedBy = actor!.person.id
        },
        { action: "allocation.update", subject: projectId, detail: mentorIds.join(", ") }
      )
      return ok
    },
    [actor, requireCoordinator, write]
  )

  const saveTeam = React.useCallback(
    (teamId: string, draftTeam: TeamDraft): ActionResult => {
      const denied = requireCoordinator()
      if (denied) return denied
      if (!draftTeam.memberIds.length) return deny("A team needs at least one member.")
      write(
        (draft) => {
          const team = draft.teams.find((t) => t.id === teamId)!
          team.name = draftTeam.name.trim() || team.name
          team.memberIds = draftTeam.memberIds
          team.leadId = draftTeam.leadId
          draft.projects
            .filter((p) => p.teamId === teamId)
            .forEach((p) => {
              p.teamMemberIds = draftTeam.memberIds
            })
        },
        { action: "team.update", subject: teamId }
      )
      return ok
    },
    [requireCoordinator, write]
  )

  const createTeam = React.useCallback(
    (draftTeam: TeamDraft): ActionResult => {
      const denied = requireCoordinator()
      if (denied) return denied
      if (!draftTeam.memberIds.length) return deny("A team needs at least one member.")
      const team: Team = {
        id: id("team"),
        batchId: batch.id,
        name: draftTeam.name.trim() || "New team",
        memberIds: draftTeam.memberIds,
        leadId: draftTeam.leadId,
        createdAt: new Date().toISOString(),
      }
      write((draft) => {
        draft.teams = [...draft.teams, team]
      })
      return ok
    },
    [batch.id, requireCoordinator, write]
  )

  const addProject = React.useCallback(
    (draftProject: ProjectDraft): ActionResult => {
      if (!actor) return deny("Sign in first.")
      if (!isCoordinator(actor) && actor.role !== "mentor") {
        return deny("Only a mentor or the coordinator can add a project.")
      }
      const now = new Date().toISOString()
      const project: Project = {
        id: id("proj"),
        ...draftProject,
        archived: false,
        createdBy: actor.person.id,
        createdAt: now,
        updatedBy: actor.person.id,
        updatedAt: now,
      }
      write(
        (draft) => {
          draft.projects = [...draft.projects, project]
          // A new project gets the whole calendar, not a blank slate.
          const template = draft.milestoneTemplate.filter((t) => t.batchId === project.batchId)
          draft.milestones = [
            ...draft.milestones,
            ...template.map<MilestoneInstance>((t) => ({
              id: id("ms"),
              projectId: project.id,
              templateItemId: t.id,
              status: "not_started",
              completedDeliverables: [],
              updatedAt: now,
            })),
          ]
        },
        { action: "project.create", subject: project.id }
      )
      return ok
    },
    [actor, write]
  )

  const updateProject = React.useCallback(
    (projectId: string, draftProject: ProjectDraft): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const project = findProject(projectId)
      if (!project) return deny("That project no longer exists.")
      if (!isMemberOf(actor, project) && !isMentorOf(actor, project) && !isCoordinator(actor)) {
        return deny("This project is not yours to change.")
      }
      write(
        (draft) => {
          const p = draft.projects.find((x) => x.id === projectId)!
          Object.assign(p, draftProject)
          p.updatedAt = new Date().toISOString()
          p.updatedBy = actor.person.id
        },
        { action: "project.update", subject: projectId }
      )
      return ok
    },
    [actor, findProject, write]
  )

  const archiveProject = React.useCallback(
    (projectId: string): ActionResult => {
      const denied = requireCoordinator()
      if (denied) return denied
      write(
        (draft) => {
          const p = draft.projects.find((x) => x.id === projectId)!
          p.archived = true
        },
        { action: "project.archive", subject: projectId }
      )
      return ok
    },
    [requireCoordinator, write]
  )

  const restoreProject = React.useCallback(
    (projectId: string): ActionResult => {
      const denied = requireCoordinator()
      if (denied) return denied
      write(
        (draft) => {
          const p = draft.projects.find((x) => x.id === projectId)!
          p.archived = false
        },
        { action: "project.restore", subject: projectId }
      )
      return ok
    },
    [requireCoordinator, write]
  )

  const setProjectVisibility = React.useCallback(
    (projectId: string, visibility: Project["visibility"]): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const project = findProject(projectId)
      if (!project) return deny("That project no longer exists.")
      if (!isMemberOf(actor, project) && !isCoordinator(actor)) {
        return deny("The team or the coordinator decides who can see this.")
      }
      write(
        (draft) => {
          const p = draft.projects.find((x) => x.id === projectId)!
          p.visibility = visibility
        },
        { action: "project.visibility", subject: projectId, detail: visibility }
      )
      return ok
    },
    [actor, findProject, write]
  )

  const addBatch = React.useCallback(
    (draftBatch: BatchDraft): ActionResult => {
      const denied = requireCoordinator()
      if (denied) return denied
      const newBatch: Batch = {
        id: id("b"),
        ...draftBatch,
        archived: false,
        createdAt: new Date().toISOString(),
      }
      write(
        (draft) => {
          draft.batches = [...draft.batches, newBatch]
          draft.milestoneTemplate = [
            ...draft.milestoneTemplate,
            ...milestoneTemplateFor(newBatch.id),
          ]
        },
        { action: "batch.create", subject: newBatch.id }
      )
      return ok
    },
    [requireCoordinator, write]
  )

  const updateBatch = React.useCallback(
    (batchId: string, draftBatch: BatchDraft): ActionResult => {
      const denied = requireCoordinator()
      if (denied) return denied
      write(
        (draft) => {
          const b = draft.batches.find((x) => x.id === batchId)!
          Object.assign(b, draftBatch)
        },
        { action: "batch.update", subject: batchId }
      )
      return ok
    },
    [requireCoordinator, write]
  )

  const addDomain = React.useCallback(
    (label: string): ActionResult => {
      const denied = requireCoordinator()
      if (denied) return denied
      if (!label.trim()) return deny("Give the domain a name.")
      write((draft) => {
        draft.domains = [...draft.domains, { id: id("d"), label: label.trim() }]
      })
      return ok
    },
    [requireCoordinator, write]
  )

  const saveMilestoneTemplateItem = React.useCallback(
    (
      itemId: string | null,
      draftItem: Omit<MilestoneTemplateItem, "id" | "batchId">
    ): ActionResult => {
      const denied = requireCoordinator()
      if (denied) return denied
      if (!draftItem.title.trim()) return deny("A checkpoint needs a title.")
      if (draftItem.dueWeek < 1 || draftItem.dueWeek > 60) return deny("Week must be between 1 and 60.")

      write(
        (draft) => {
          if (itemId) {
            const item = draft.milestoneTemplate.find((t) => t.id === itemId)!
            Object.assign(item, draftItem)
          } else {
            const created: MilestoneTemplateItem = {
              id: id("mt"),
              batchId: batch.id,
              ...draftItem,
            }
            draft.milestoneTemplate = [...draft.milestoneTemplate, created]
            // Every existing project gets the new checkpoint too, otherwise
            // the grid would have a column some teams simply do not have.
            draft.milestones = [
              ...draft.milestones,
              ...draft.projects
                .filter((p) => p.batchId === batch.id)
                .map<MilestoneInstance>((p) => ({
                  id: id("ms"),
                  projectId: p.id,
                  templateItemId: created.id,
                  status: "not_started",
                  completedDeliverables: [],
                  updatedAt: new Date().toISOString(),
                })),
            ]
          }
          draft.milestoneTemplate.sort((a, b) => a.dueWeek - b.dueWeek)
          draft.milestoneTemplate.forEach((t, index) => {
            t.order = index + 1
          })
        },
        { action: itemId ? "template.update" : "template.create", subject: itemId ?? draftItem.title }
      )
      return ok
    },
    [batch.id, requireCoordinator, write]
  )

  const deleteMilestoneTemplateItem = React.useCallback(
    (itemId: string): ActionResult => {
      const denied = requireCoordinator()
      if (denied) return denied
      const hasWork = db.milestones.some(
        (m) => m.templateItemId === itemId && m.status !== "not_started"
      )
      if (hasWork) {
        return deny("Teams have already worked against this checkpoint, so it cannot be removed.")
      }
      write(
        (draft) => {
          draft.milestoneTemplate = draft.milestoneTemplate.filter((t) => t.id !== itemId)
          draft.milestones = draft.milestones.filter((m) => m.templateItemId !== itemId)
          draft.milestoneTemplate.forEach((t, index) => {
            t.order = index + 1
          })
        },
        { action: "template.delete", subject: itemId }
      )
      return ok
    },
    [db.milestones, requireCoordinator, write]
  )

  const resetAll = React.useCallback(() => {
    setDb(resetDatabase())
  }, [])

  const value = React.useMemo<StoreValue>(
    () => ({
      db,
      ready,
      session,
      actor,
      currentUser,
      week,
      batch,
      signIn: doSignIn,
      signOut: doSignOut,
      setActiveRole,
      setMilestoneStatus,
      toggleDeliverable,
      submitMilestone,
      reviewSubmission,
      openForReview,
      setDueWeekOverride,
      markFeedbackAddressed,
      confirmFeedbackAddressed,
      addArtefact,
      removeArtefact,
      addMeeting,
      saveMinutes,
      confirmMinutes,
      addActionItem,
      toggleActionItem,
      verifyActionItem,
      deleteActionItem,
      postAnnouncement,
      markAnnouncementRead,
      togglePinned,
      markNotificationRead,
      markAllNotificationsRead,
      addPerson,
      updateAllocation,
      saveTeam,
      createTeam,
      addProject,
      updateProject,
      archiveProject,
      restoreProject,
      setProjectVisibility,
      addBatch,
      updateBatch,
      addDomain,
      saveMilestoneTemplateItem,
      deleteMilestoneTemplateItem,
      resetAll,
    }),
    [
      db, ready, session, actor, currentUser, week, batch,
      doSignIn, doSignOut, setActiveRole,
      setMilestoneStatus, toggleDeliverable, submitMilestone, reviewSubmission, openForReview,
      setDueWeekOverride, markFeedbackAddressed, confirmFeedbackAddressed,
      addArtefact, removeArtefact,
      addMeeting, saveMinutes, confirmMinutes, addActionItem, toggleActionItem, verifyActionItem,
      deleteActionItem,
      postAnnouncement, markAnnouncementRead, togglePinned,
      markNotificationRead, markAllNotificationsRead,
      addPerson, updateAllocation, saveTeam, createTeam, addProject, updateProject,
      archiveProject, restoreProject, setProjectVisibility, addBatch, updateBatch, addDomain,
      saveMilestoneTemplateItem, deleteMilestoneTemplateItem, resetAll,
    ]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useProjectsStore() {
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error("useProjectsStore must be used inside ProjectsProvider")
  return ctx
}

/* ------------------------------------------------------------- selectors */

function preferredRole(person: Person): Role {
  if (person.roles.includes("coordinator")) return "coordinator"
  if (person.roles.includes("mentor")) return "mentor"
  return "student"
}

let counter = 0
function id(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter}`
}

function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export { effectiveStatus, dueDateForWeek }
