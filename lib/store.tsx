"use client"

import * as React from "react"

import { currentWeek, dueDateForWeek, formatDate, todayIso } from "@/lib/dates"
import {
  loadDatabase,
  withSeedEmails,
  resetDatabase,
  saveDatabase,
  subscribeToChanges,
} from "@/lib/db"
import {
  appendActivity,
  applyChange,
  fetchShared,
  migrateLocal,
  pushDiff,
  subscribeShared,
} from "@/lib/remote"
import {
  buildSeedDatabase,
  withDemoActivity,
  withoutActivity,
} from "@/lib/seed"
import { detectService, normalizeUrl } from "@/lib/links"
import { milestoneTemplateFor } from "@/lib/milestone-template"
import {
  type Actor,
  canAnnounceTo,
  canComment,
  canEditProject,
  canReview,
  canSetMilestoneStatus,
  canSubmitMilestone,
  canSubmitWeekly,
  effectiveStatus,
  isCoordinator,
  isMemberOf,
  isMentorOf,
  isOverride,
} from "@/lib/permissions"
import {
  audienceMembers,
  mentionablePeople,
  projectLabel,
} from "@/lib/selectors"
import {
  readSession,
  signIn as persistSignIn,
  clearSession,
  writeSession,
} from "@/lib/session"
import type {
  ActionItem,
  ActivityChange,
  ActivityEvent,
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
  Note,
  NoteComment,
  Person,
  ProgressComment,
  Project,
  ProjectDraft,
  ReturnCategory,
  Review,
  Role,
  Session,
  Submission,
  Team,
  TeamDraft,
  WeeklyFile,
  WeeklyProgress,
} from "@/lib/types"

/* ------------------------------------------------------------------ types */

export type ActionResult =
  | {
      ok: true
      /** The id of what was made, when something was. */ id?: string
    }
  | { ok: false; reason: string }

/** Of the checkpoints (instance ids) someone asked to link, those that really
 * are this project's, once each. */
function ownCheckpoints(
  db: Database,
  projectId: string,
  ids: string[] | undefined
): string[] {
  const own = new Set(
    db.milestones.filter((m) => m.projectId === projectId).map((m) => m.id)
  )
  return Array.from(new Set(ids ?? [])).filter((x) => own.has(x))
}

/** The tagged people who are allowed to be: on the thread, and not the author. */
function validMentions(
  ids: string[] | undefined,
  allowed: { id: string }[],
  author: string
): string[] {
  const ok = new Set(allowed.map((p) => p.id))
  return Array.from(new Set(ids ?? [])).filter((x) => ok.has(x) && x !== author)
}

/** Notes save as you type, so a note edit goes in the log at most once in this
 * long per person per note, not once for every pause in typing. A rename is
 * always logged. Kept in memory: it only has to stop one sitting from flooding
 * the log. */
const NOTE_EDIT_LOG_MS = 10 * 60 * 1000
const noteEditLogged = new Map<string, number>()

/** A line of free text, short enough for a log entry. */
const clip = (text: string, max = 200) =>
  text.length > max ? `${text.slice(0, max)}…` : text

/** What an action says about itself for the activity log. The rest of an entry,
 * who and when, is filled in by `write`. */
type LogInput = {
  action: string
  projectId: string
  target: ActivityEvent["target"]
  summary: string
  changes?: ActivityChange[]
}

const ok: ActionResult = { ok: true }
const deny = (reason: string): ActionResult => ({ ok: false, reason })

type StoreValue = {
  db: Database
  ready: boolean
  /** True once the server's copy has been loaded (or could not be). Until then
   * a title, a note or a photo may look missing only because it has not
   * arrived. */
  sharedReady: boolean
  session: Session | null
  /** Null until a session exists. Everything role-aware reads this. */
  actor: Actor | null
  currentUser: Person | null
  /** Current project week, derived from the batch start date. */
  week: number
  batch: Batch

  signIn: (personId: string, role?: Role, preview?: boolean) => void
  signOut: () => void
  setActiveRole: (role: Role) => void

  // milestones
  setMilestoneStatus: (
    milestoneId: string,
    next: MilestoneStatus
  ) => ActionResult
  toggleDeliverable: (milestoneId: string, deliverable: string) => ActionResult
  submitMilestone: (
    milestoneId: string,
    note: string,
    artefactIds: string[],
    /** Links added in the same step, so one form can attach and hand in. */
    newLinks?: { url: string; label?: string }[]
  ) => ActionResult
  reviewSubmission: (
    milestoneId: string,
    verdict: "accept" | "return",
    body: string,
    category?: ReturnCategory
  ) => ActionResult
  openForReview: (milestoneId: string) => ActionResult
  setDueWeekOverride: (
    milestoneId: string,
    week: number | null,
    reason: string
  ) => ActionResult
  markFeedbackAddressed: (reviewId: string, note: string) => ActionResult
  confirmFeedbackAddressed: (reviewId: string) => ActionResult

  // artefacts
  addArtefact: (
    projectId: string,
    input: {
      url: string
      label?: string
      milestoneInstanceId?: string | null
      note?: string
      /** Checkpoints (instance ids) the document supports. */
      linkedTo?: string[]
    }
  ) => ActionResult
  removeArtefact: (artefactId: string) => ActionResult
  updateArtefact: (
    artefactId: string,
    input: {
      url: string
      label?: string
      note?: string
      /** Replaces the linked checkpoints when given; left alone when not. */
      linkedTo?: string[]
    }
  ) => ActionResult
  /** One entry in the progress log is several links; these act on all of them
   * in a single change, so the log never holds half of one. */
  removeProgressEntry: (artefactIds: string[]) => ActionResult

  // comments on a checkpoint's progress
  addComment: (
    milestoneId: string,
    body: string,
    parentId?: string,
    /** People tagged with @name in the body. */
    mentions?: string[]
  ) => ActionResult
  editComment: (
    commentId: string,
    body: string,
    mentions?: string[]
  ) => ActionResult
  deleteComment: (commentId: string) => ActionResult

  updateProgressEntry: (
    artefactIds: string[],
    input: { title: string; urls: string[]; note?: string }
  ) => ActionResult

  // weekly progress
  submitWeeklyProgress: (
    projectId: string,
    week: number,
    input: { summary: string; files: WeeklyFile[] }
  ) => ActionResult

  // meetings, minutes, actions
  addMeeting: (
    projectId: string,
    input: {
      title: string
      date: string
      time?: string
      attendeeIds: string[]
      callUrl?: string
    }
  ) => ActionResult
  saveMinutes: (
    meetingId: string,
    input: { discussed: string; decided: string; next: string }
  ) => ActionResult
  confirmMinutes: (minutesId: string) => ActionResult
  addActionItem: (
    projectId: string,
    input: {
      text: string
      ownerId: string
      dueDate: string
      meetingId?: string
      noteId?: string
    }
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

  /** Your own photo. Nothing else about you is editable here. */
  updateProfile: (input: { avatarUrl?: string | null }) => ActionResult

  // programme administration
  addPerson: (input: {
    name: string
    email: string
    roles: Role[]
    rollNumber?: string
  }) => Person
  updateAllocation: (
    projectId: string,
    mentorIds: string[],
    preferredMentorId: string | null
  ) => ActionResult
  saveTeam: (teamId: string, draft: TeamDraft) => ActionResult
  createTeam: (draft: TeamDraft) => ActionResult
  addProject: (draft: ProjectDraft) => ActionResult
  updateProject: (id: string, draft: ProjectDraft) => ActionResult
  setProjectTitle: (projectId: string, title: string) => ActionResult
  archiveProject: (id: string) => ActionResult
  restoreProject: (id: string) => ActionResult
  setProjectVisibility: (
    id: string,
    visibility: Project["visibility"]
  ) => ActionResult
  addBatch: (draft: BatchDraft) => ActionResult
  updateBatch: (id: string, draft: BatchDraft) => ActionResult
  addDomain: (label: string) => ActionResult
  saveMilestoneTemplateItem: (
    id: string | null,
    draft: Omit<MilestoneTemplateItem, "id" | "batchId">
  ) => ActionResult
  deleteMilestoneTemplateItem: (id: string) => ActionResult
  // notes
  createNote: (projectId: string) => string | null
  updateNote: (
    noteId: string,
    patch: { title?: string; content?: string }
  ) => ActionResult
  deleteNote: (noteId: string) => ActionResult
  addNoteComment: (
    noteId: string,
    input: {
      body: string
      quote?: string
      anchorId?: string
      parentId?: string
      /** The note's content with the new anchor applied, saved in the same
       * write so the comment and its highlight can never disagree. */
      content?: string
    }
  ) => ActionResult

  /** Submits an existing document as the progress for checkpoints it has been
   * linked to, in one step: each becomes Submitted and its mentors are told. */
  submitDocument: (artefactId: string, milestoneIds: string[]) => ActionResult
  /** Coordinator only: empties the comments on progress and everyone's
   * notifications, for when what is there is test data. */
  clearCommentsAndNotifications: () => ActionResult
  resetAll: () => void
  /** Loads generated activity for stress-testing, or clears it again. */
  setDemoData: (on: boolean) => void
}

const StoreContext = React.createContext<StoreValue | null>(null)

/* --------------------------------------------------------------- provider */

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = React.useState<Database>(() => loadDatabase())
  // The latest state, so a save can be compared with what came before it.
  const dbRef = React.useRef(db)
  React.useEffect(() => {
    dbRef.current = db
  }, [db])
  const [session, setSession] = React.useState<Session | null>(null)
  // Whose server copy has been loaded; compared with the signed-in person so a
  // second sign-in in the same tab waits for its own load.
  const [sharedFor, setSharedFor] = React.useState<string | null>(null)
  const sharedReady = Boolean(session) && sharedFor === session?.personId
  const [ready, setReady] = React.useState(false)
  // preview: a testing session never reads or writes the server.
  const previewRef = React.useRef(false)
  React.useEffect(() => {
    previewRef.current = Boolean(session?.preview)
  }, [session?.preview])

  // localStorage is not available while rendering on the server, so the real
  // state lands on mount. `ready` keeps the UI from flashing a signed-out
  // shell before we know who this tab is.
  React.useEffect(() => {
    setDb(loadDatabase())
    setSession(readSession())
    setReady(true)
  }, [])

  // Notes, action items and progress links live on the server. Load them once
  // we know who this tab is, then take every change anyone else makes.
  React.useEffect(() => {
    if (!ready) return
    let cancelled = false
    const who = session?.personId ?? null
    // preview: a testing session loads nothing from the server.
    ;(session?.preview ? Promise.resolve(null) : fetchShared()).then(
      (remote) => {
        if (cancelled) return
        if (!remote) {
          setSharedFor(who)
          return
        }
        // Titles are written by students now, so a browser's older copy of the
        // projects must never seed the server; the seed's blank titles do.
        const local = {
          ...loadDatabase(),
          projects: buildSeedDatabase().projects,
        }
        const useRemote = migrateLocal(local, remote)
        setDb((current) => {
          const merged = { ...current, ...useRemote }
          // The server may still hold an earlier email for someone; the roster's
          // wins, and the correction is written back for everyone else.
          const next = withSeedEmails(merged)
          if (next !== merged) pushDiff(merged, next)
          saveDatabase(next, { broadcast: false })
          dbRef.current = next
          return next
        })
        setSharedFor(who)
      }
    )
    const stop = session?.preview
      ? () => {}
      : subscribeShared((change) =>
          setDb((current) => {
            const next = applyChange(current, change)
            saveDatabase(next, { broadcast: false })
            dbRef.current = next
            return next
          })
        )
    return () => {
      cancelled = true
      stop()
    }
  }, [ready, session?.personId, session?.preview])

  // Another tab wrote. Pick it up so a mentor watching in a second window sees
  // a submission land without refreshing.
  React.useEffect(() => subscribeToChanges(() => setDb(loadDatabase())), [])

  const commit = React.useCallback((next: Database) => {
    if (!previewRef.current) pushDiff(dbRef.current, next) // preview
    dbRef.current = next
    setDb(next)
    saveDatabase(next)
  }, [])

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
        (new Date(`${due}T00:00:00Z`).getTime() -
          new Date(`${today}T00:00:00Z`).getTime()) /
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
    // Through `commit`, so the reminders reach the server too: notifications
    // are shared now, and a reminder that stayed in this browser would be wiped
    // when the server's copy loads. Each has a fixed id, so every browser
    // making the same one is the same row.
    commit({
      ...current,
      notifications: [...fresh, ...current.notifications].slice(0, 1000),
    })
  }, [ready, commit])

  const currentUser = React.useMemo(
    () =>
      session
        ? (db.people.find((p) => p.id === session.personId) ?? null)
        : null,
    [db.people, session]
  )

  const actor = React.useMemo<Actor | null>(
    () =>
      currentUser && session
        ? { person: currentUser, role: session.activeRole }
        : null,
    [currentUser, session]
  )

  const batch = db.batches[0]
  const week = React.useMemo(
    () => currentWeek(batch.startDate),
    [batch.startDate]
  )

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
    (templateItemId: string) =>
      db.milestoneTemplate.find((t) => t.id === templateItemId),
    [db.milestoneTemplate]
  )

  /** What to call a checkpoint in the log. */
  const checkpointTitle = React.useCallback(
    (milestoneId: string) => {
      const m = db.milestones.find((x) => x.id === milestoneId)
      return (
        db.milestoneTemplate.find((t) => t.id === m?.templateItemId)?.title ??
        "Checkpoint"
      )
    },
    [db.milestones, db.milestoneTemplate]
  )

  /** Every mutation goes through here so that nothing bypasses the audit
   * trail, and so a coordinator acting outside their own mentees is recorded
   * as an override rather than silently allowed. */
  const write = React.useCallback(
    (
      mutate: (draft: Database) => void,
      audit?: { action: string; subject: string; detail?: string },
      log?: LogInput | LogInput[]
    ) => {
      const next: Database = structuredClone(db)
      mutate(next)
      // Whatever notices this change created are from the person making it, so
      // the panel can show who. Set here once, not at each place that notifies.
      if (actor) {
        const had = new Set(db.notifications.map((n) => n.id))
        next.notifications = next.notifications.map((n) =>
          had.has(n.id) || n.actorId ? n : { ...n, actorId: actor.person.id }
        )
      }
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
      // The activity log is written once and kept: it is sent to the server as
      // it happens and is never part of the data that can be edited or cleared.
      if (log && actor && !previewRef.current /* preview */) {
        const at = new Date().toISOString()
        appendActivity(
          (Array.isArray(log) ? log : [log]).map((entry) => ({
            id: id("log"),
            at,
            actorId: actor.person.id,
            actorName: actor.person.name,
            actorRole: actor.role,
            ...entry,
          }))
        )
      }
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

  const doSignIn = React.useCallback(
    (personId: string, role?: Role, preview?: boolean) => {
      const person = loadDatabase().people.find((p) => p.id === personId)
      if (!person) return
      const chosen =
        role && person.roles.includes(role) ? role : preferredRole(person)
      const next = persistSignIn(personId, chosen)
      if (preview) {
        // preview: testing session, kept off the server.
        next.preview = true
        writeSession(next)
      }
      setSession(next)
    },
    []
  )

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
        },
        {
          action: "checkpoint.status_changed",
          projectId: found.project.id,
          target: {
            type: "checkpoint",
            id: milestoneId,
            label: checkpointTitle(milestoneId),
          },
          summary: `Status changed from ${found.milestone.status} to ${next}`,
          changes: [
            { field: "status", from: found.milestone.status, to: next },
          ],
        }
      )
      return ok
    },
    [actor, checkpointTitle, projectOfMilestone, write]
  )

  const toggleDeliverable = React.useCallback(
    (milestoneId: string, deliverable: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const found = projectOfMilestone(milestoneId)
      if (!found) return deny("That checkpoint no longer exists.")
      if (!isMemberOf(actor, found.project) && !isCoordinator(actor)) {
        return deny("Only the team ticks off its own deliverables.")
      }
      const ticking =
        !found.milestone.completedDeliverables.includes(deliverable)
      write(
        (draft) => {
          const m = draft.milestones.find((x) => x.id === milestoneId)!
          m.completedDeliverables = m.completedDeliverables.includes(
            deliverable
          )
            ? m.completedDeliverables.filter((d) => d !== deliverable)
            : [...m.completedDeliverables, deliverable]
          if (m.status === "not_started" && m.completedDeliverables.length) {
            m.status = "in_progress"
            m.startedAt = m.startedAt ?? new Date().toISOString()
          }
          m.updatedAt = new Date().toISOString()
        },
        undefined,
        {
          action: ticking
            ? "checkpoint.item_ticked"
            : "checkpoint.item_unticked",
          projectId: found.project.id,
          target: {
            type: "checkpoint",
            id: milestoneId,
            label: checkpointTitle(milestoneId),
          },
          summary: `${ticking ? "Ticked" : "Unticked"} “${deliverable}”`,
        }
      )
      return ok
    },
    [actor, checkpointTitle, projectOfMilestone, write]
  )

  const submitMilestone = React.useCallback(
    (
      milestoneId: string,
      note: string,
      artefactIds: string[],
      newLinks?: { url: string; label?: string }[]
    ): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const found = projectOfMilestone(milestoneId)
      if (!found) return deny("That checkpoint no longer exists.")
      const check = canSubmitMilestone(actor, found.project)
      if (!check.allowed) return deny(check.reason ?? "Not permitted.")
      const links = (newLinks ?? []).filter((l) => l.url.trim())
      if (!artefactIds.length && links.length === 0)
        return deny("Add a link to your work before submitting.")

      const now = new Date().toISOString()
      // The note belongs to the submission, so it sits on the first link only
      // and is not repeated down the log.
      const created: Artefact[] = links.map((link, i) => ({
        id: id("art"),
        projectId: found.project.id,
        milestoneInstanceId: milestoneId,
        label: link.label?.trim() || "Untitled",
        url: normalizeUrl(link.url),
        service: detectService(normalizeUrl(link.url)),
        note: i === 0 ? note.trim() || undefined : undefined,
        addedBy: actor.person.id,
        addedAt: now,
      }))
      const attached = [...created.map((a) => a.id), ...artefactIds]
      const attempt =
        db.submissions.filter((s) => s.milestoneInstanceId === milestoneId)
          .length + 1

      write(
        (draft) => {
          if (created.length) draft.artefacts = [...created, ...draft.artefacts]
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
            artefactIds: attached,
          }
          draft.submissions = [submission, ...draft.submissions]
          const item = draft.milestoneTemplate.find(
            (t) => t.id === m.templateItemId
          )
          notify(draft, found.project.mentorIds, {
            kind: "submission",
            title: `${projectLabel(found.project).slice(0, 48)} submitted ${item?.title ?? "a checkpoint"}`,
            body:
              attempt > 1
                ? `Resubmission, attempt ${attempt}.`
                : "Waiting on your review.",
            href: `/projects/${found.project.id}?tab=plan&milestone=${milestoneId}`,
            createdAt: now,
          })
        },
        {
          action: "milestone.submit",
          subject: milestoneId,
          detail: `attempt ${attempt}`,
        },
        {
          action: attempt > 1 ? "progress.resubmitted" : "progress.submitted",
          projectId: found.project.id,
          target: {
            type: "progress",
            id: milestoneId,
            label: checkpointTitle(milestoneId),
          },
          summary: `Submitted ${checkpointTitle(milestoneId)} with ${created.length} ${created.length === 1 ? "link" : "links"}${attempt > 1 ? ` (attempt ${attempt})` : ""}`,
          changes: [
            { field: "status", from: found.milestone.status, to: "submitted" },
            ...(created.length
              ? [
                  {
                    field: "links",
                    to: created.map((a) => a.url).join(", "),
                  },
                ]
              : []),
            ...(note.trim() ? [{ field: "note", to: note.trim() }] : []),
          ],
        }
      )
      return ok
    },
    [actor, checkpointTitle, db.submissions, projectOfMilestone, write]
  )

  const submitDocument = React.useCallback(
    (artefactId: string, milestoneIds: string[]): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const artefact = db.artefacts.find((a) => a.id === artefactId)
      const project = artefact ? findProject(artefact.projectId) : undefined
      if (!artefact || !project) return deny("That document no longer exists.")
      const check = canSubmitMilestone(actor, project)
      if (!check.allowed) return deny(check.reason ?? "Not permitted.")

      // Only this project's checkpoints that are still waiting on the team: one
      // that is already in, or accepted, is left as it is.
      const targets = ownCheckpoints(db, project.id, milestoneIds)
        .map((mid) => db.milestones.find((m) => m.id === mid))
        .filter(
          (m): m is MilestoneInstance =>
            Boolean(m) &&
            m!.status !== "submitted" &&
            m!.status !== "under_review" &&
            m!.status !== "accepted"
        )
      if (targets.length === 0)
        return deny("Those checkpoints are already submitted.")

      const now = new Date().toISOString()
      const attempts = new Map(
        targets.map((t) => [
          t.id,
          db.submissions.filter((s) => s.milestoneInstanceId === t.id).length +
            1,
        ])
      )

      // One change for all of them: separate ones would each start from the same
      // old data and overwrite one another.
      write(
        (draft) => {
          targets.forEach((target) => {
            const m = draft.milestones.find((x) => x.id === target.id)!
            const attempt = attempts.get(target.id)!
            m.status = "submitted"
            m.submittedAt = now
            m.updatedAt = now
            const submission: Submission = {
              id: id("sub"),
              milestoneInstanceId: target.id,
              projectId: project.id,
              attempt,
              submittedBy: actor.person.id,
              submittedAt: now,
              note: "",
              artefactIds: [artefactId],
            }
            draft.submissions = [submission, ...draft.submissions]
            const item = draft.milestoneTemplate.find(
              (t) => t.id === m.templateItemId
            )
            notify(draft, project.mentorIds, {
              kind: "submission",
              title: `${projectLabel(project).slice(0, 48)} submitted ${item?.title ?? "a checkpoint"}`,
              body:
                attempt > 1
                  ? `Resubmission, attempt ${attempt}.`
                  : "Waiting on your review.",
              href: `/projects/${project.id}?tab=plan&milestone=${target.id}`,
              createdAt: now,
            })
          })
        },
        {
          action: "milestone.submit",
          subject: targets[0].id,
          detail: "document",
        },
        targets.map((target) => ({
          action:
            attempts.get(target.id)! > 1
              ? "progress.resubmitted"
              : "progress.submitted",
          projectId: project.id,
          target: {
            type: "progress",
            id: target.id,
            label: checkpointTitle(target.id),
          },
          summary: `Submitted ${checkpointTitle(target.id)} with the document “${artefact.label}”`,
          changes: [
            { field: "status", from: target.status, to: "submitted" },
            { field: "document", to: artefact.url },
          ],
        }))
      )
      return ok
    },
    [actor, checkpointTitle, db, findProject, write]
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
      if (verdict === "return" && !category)
        return deny("Pick what kind of change is needed.")

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

          const item = draft.milestoneTemplate.find(
            (t) => t.id === m.templateItemId
          )
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
          detail: isOverride(actor, found.project)
            ? "coordinator override"
            : undefined,
        },
        {
          action:
            verdict === "accept"
              ? "checkpoint.accepted"
              : "checkpoint.returned",
          projectId: found.project.id,
          target: {
            type: "checkpoint",
            id: milestoneId,
            label: checkpointTitle(milestoneId),
          },
          summary:
            verdict === "accept"
              ? `Accepted ${checkpointTitle(milestoneId)}${isOverride(actor, found.project) ? " (coordinator override)" : ""}`
              : `Returned ${checkpointTitle(milestoneId)} for revisions`,
          changes: [
            {
              field: "status",
              from: found.milestone.status,
              to: verdict === "accept" ? "accepted" : "returned",
            },
            ...(verdict === "return" && category
              ? [{ field: "reason", to: category }]
              : []),
            { field: "feedback", to: body.trim() },
          ],
        }
      )
      return ok
    },
    [actor, checkpointTitle, db.submissions, projectOfMilestone, write]
  )

  const setDueWeekOverride = React.useCallback(
    (
      milestoneId: string,
      weekValue: number | null,
      reason: string
    ): ActionResult => {
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
        { action: "milestone.dueDate", subject: milestoneId, detail: reason },
        {
          action: "checkpoint.due_week_changed",
          projectId: found.project.id,
          target: {
            type: "checkpoint",
            id: milestoneId,
            label: checkpointTitle(milestoneId),
          },
          summary:
            weekValue === null
              ? "Put the due week back to the original"
              : `Moved the due week to week ${weekValue}`,
          changes: [
            {
              field: "due week",
              from: String(found.milestone.dueWeekOverride ?? ""),
              to: weekValue === null ? "" : String(weekValue),
            },
            ...(reason.trim() ? [{ field: "reason", to: reason.trim() }] : []),
          ],
        }
      )
      return ok
    },
    [actor, checkpointTitle, projectOfMilestone, write]
  )

  const markFeedbackAddressed = React.useCallback(
    (reviewId: string, note: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const review = db.reviews.find((r) => r.id === reviewId)
      const project = review ? findProject(review.projectId) : undefined
      if (!review || !project) return deny("That feedback no longer exists.")
      if (!isMemberOf(actor, project))
        return deny("Only the team records how they addressed it.")
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
      input: {
        url: string
        label?: string
        milestoneInstanceId?: string | null
        note?: string
        linkedTo?: string[]
      }
    ): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const project = findProject(projectId)
      if (!project) return deny("That project no longer exists.")
      // Documentation is the team's own record: mentors and the coordinator read
      // it.
      if (!isMemberOf(actor, project)) {
        return deny("This project is not yours to change.")
      }
      const linkedTo = ownCheckpoints(db, projectId, input.linkedTo)
      const artefact: Artefact = {
        id: id("art"),
        projectId,
        milestoneInstanceId: input.milestoneInstanceId ?? null,
        label: input.label?.trim() || "Untitled",
        url: normalizeUrl(input.url),
        service: detectService(input.url),
        note: input.note?.trim() || undefined,
        linkedTo: linkedTo.length ? linkedTo : undefined,
        addedBy: actor.person.id,
        addedAt: new Date().toISOString(),
      }
      write(
        (draft) => {
          draft.artefacts = [artefact, ...draft.artefacts]
        },
        undefined,
        {
          action: "document.added",
          projectId,
          target: { type: "document", id: artefact.id, label: artefact.label },
          summary: `Added the document “${artefact.label}”`,
          changes: [
            { field: "link", to: artefact.url },
            ...(linkedTo.length
              ? [
                  {
                    field: "linked to",
                    to: linkedTo.map(checkpointTitle).join(", "),
                  },
                ]
              : []),
          ],
        }
      )
      return { ok: true, id: artefact.id }
    },
    [actor, checkpointTitle, db, findProject, write]
  )

  /** The checkpoint an upload belongs to, if it belongs to one. */
  const milestoneOfArtefact = React.useCallback(
    (artefact: Artefact) =>
      artefact.milestoneInstanceId
        ? db.milestones.find((m) => m.id === artefact.milestoneInstanceId)
        : undefined,
    [db.milestones]
  )

  const removeArtefact = React.useCallback(
    (artefactId: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const artefact = db.artefacts.find((a) => a.id === artefactId)
      const project = artefact ? findProject(artefact.projectId) : undefined
      if (!artefact || !project) return deny("That upload no longer exists.")
      if (!isMemberOf(actor, project) && !isCoordinator(actor)) {
        return deny("Only the team can delete its own progress.")
      }
      const milestone = milestoneOfArtefact(artefact)
      if (milestone?.status === "accepted")
        return deny("Your mentor has accepted this, so it stays on the record.")

      write(
        (draft) => {
          draft.artefacts = draft.artefacts.filter((a) => a.id !== artefactId)
          // A submission keeps its place in the history; it just no longer
          // points at work that is gone.
          draft.submissions.forEach((sub) => {
            sub.artefactIds = sub.artefactIds.filter((x) => x !== artefactId)
          })
          // Take back the last thing handed in and the checkpoint is no longer
          // submitted.
          if (milestone) {
            const m = draft.milestones.find((x) => x.id === milestone.id)
            const left = draft.artefacts.some(
              (a) => a.milestoneInstanceId === milestone.id
            )
            if (
              m &&
              !left &&
              (m.status === "submitted" || m.status === "under_review")
            ) {
              m.status = "in_progress"
              delete m.submittedAt
              m.updatedAt = new Date().toISOString()
            }
          }
        },
        { action: "artefact.remove", subject: artefactId },
        {
          action: "document.deleted",
          projectId: project.id,
          target: { type: "document", id: artefactId, label: artefact.label },
          summary: `Deleted the document “${artefact.label}”`,
          changes: [{ field: "link", from: artefact.url }],
        }
      )
      return ok
    },
    [actor, db.artefacts, findProject, milestoneOfArtefact, write]
  )

  const updateArtefact = React.useCallback(
    (
      artefactId: string,
      input: {
        url: string
        label?: string
        note?: string
        linkedTo?: string[]
      }
    ): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const artefact = db.artefacts.find((a) => a.id === artefactId)
      const project = artefact ? findProject(artefact.projectId) : undefined
      if (!artefact || !project) return deny("That upload no longer exists.")
      if (!isMemberOf(actor, project))
        return deny("Only the team can edit its own progress.")
      if (!input.url.trim()) return deny("Add a link to your work.")
      if (milestoneOfArtefact(artefact)?.status === "accepted")
        return deny("Your mentor has accepted this, so it stays on the record.")

      const url = normalizeUrl(input.url)
      const label = input.label?.trim() || artefact.label
      const note = input.note?.trim() || undefined
      const linkedTo =
        input.linkedTo === undefined
          ? artefact.linkedTo
          : ownCheckpoints(db, project.id, input.linkedTo)
      const before = (artefact.linkedTo ?? []).join(",")
      const after = (linkedTo ?? []).join(",")
      const changes = [
        ...(artefact.label !== label
          ? [{ field: "title", from: artefact.label, to: label }]
          : []),
        ...(artefact.url !== url
          ? [{ field: "link", from: artefact.url, to: url }]
          : []),
        ...((artefact.note ?? "") !== (note ?? "")
          ? [{ field: "note", from: artefact.note ?? "", to: note ?? "" }]
          : []),
        ...(before !== after
          ? [
              {
                field: "linked to",
                from: (artefact.linkedTo ?? []).map(checkpointTitle).join(", "),
                to: (linkedTo ?? []).map(checkpointTitle).join(", "),
              },
            ]
          : []),
      ]
      if (changes.length === 0) return ok

      write(
        (draft) => {
          const a = draft.artefacts.find((x) => x.id === artefactId)!
          a.url = url
          a.service = detectService(a.url)
          a.label = label
          a.note = note
          a.linkedTo = linkedTo?.length ? linkedTo : undefined
        },
        { action: "artefact.update", subject: artefactId },
        {
          action: "document.edited",
          projectId: project.id,
          target: { type: "document", id: artefactId, label },
          summary: `Edited the document “${label}”`,
          changes,
        }
      )
      return ok
    },
    [actor, checkpointTitle, db, findProject, milestoneOfArtefact, write]
  )

  const removeProgressEntry = React.useCallback(
    (artefactIds: string[]): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const items = artefactIds
        .map((x) => db.artefacts.find((a) => a.id === x))
        .filter((a): a is Artefact => Boolean(a))
      const project = items[0] ? findProject(items[0].projectId) : undefined
      if (!items[0] || !project) return deny("That upload no longer exists.")
      if (!isMemberOf(actor, project) && !isCoordinator(actor))
        return deny("Only the team can delete its own progress.")
      const milestone = milestoneOfArtefact(items[0])
      if (milestone?.status === "accepted")
        return deny("Your mentor has accepted this, so it stays on the record.")

      const gone = new Set(items.map((a) => a.id))
      write(
        (draft) => {
          draft.artefacts = draft.artefacts.filter((a) => !gone.has(a.id))
          draft.submissions.forEach((sub) => {
            sub.artefactIds = sub.artefactIds.filter((x) => !gone.has(x))
          })
          if (milestone) {
            const m = draft.milestones.find((x) => x.id === milestone.id)
            const left = draft.artefacts.some(
              (a) => a.milestoneInstanceId === milestone.id
            )
            if (
              m &&
              !left &&
              (m.status === "submitted" || m.status === "under_review")
            ) {
              m.status = "in_progress"
              delete m.submittedAt
              m.updatedAt = new Date().toISOString()
            }
          }
        },
        { action: "artefact.remove", subject: items[0].id },
        {
          action: "progress.deleted",
          projectId: project.id,
          target: {
            type: "progress",
            id: items[0].id,
            label: items[0].label,
          },
          summary: `Deleted “${items[0].label}” (${items.length} ${items.length === 1 ? "link" : "links"})`,
          changes: [
            { field: "links", from: items.map((a) => a.url).join(", ") },
          ],
        }
      )
      return ok
    },
    [actor, db.artefacts, findProject, milestoneOfArtefact, write]
  )

  const updateProgressEntry = React.useCallback(
    (
      artefactIds: string[],
      input: { title: string; urls: string[]; note?: string }
    ): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const items = artefactIds
        .map((x) => db.artefacts.find((a) => a.id === x))
        .filter((a): a is Artefact => Boolean(a))
      const first = items[0]
      const project = first ? findProject(first.projectId) : undefined
      if (!first || !project) return deny("That upload no longer exists.")
      if (!isMemberOf(actor, project))
        return deny("Only the team can edit its own progress.")
      const title = input.title.trim()
      const urls = input.urls.map((u) => u.trim()).filter(Boolean)
      if (!title) return deny("Give it a title.")
      if (urls.length === 0) return deny("Add at least one link.")
      if (milestoneOfArtefact(first)?.status === "accepted")
        return deny("Your mentor has accepted this, so it stays on the record.")

      // Saving without changing anything is not an edit, so it leaves no stamp.
      const nextUrls = urls.map(normalizeUrl)
      const unchanged =
        nextUrls.length === items.length &&
        nextUrls.every((u, i) => u === items[i].url) &&
        items.every((a) => a.label === title) &&
        (items[0].note ?? "") === (input.note?.trim() ?? "")
      if (unchanged) return ok

      const editedAt = new Date().toISOString()
      write(
        (draft) => {
          const added: Artefact[] = []
          urls.forEach((raw, i) => {
            const url = normalizeUrl(raw)
            const existing = items[i]
            if (existing) {
              const a = draft.artefacts.find((x) => x.id === existing.id)!
              a.url = url
              a.service = detectService(url)
              a.label = title
              // The note belongs to the entry, so it sits on the first link.
              a.note = i === 0 ? input.note?.trim() || undefined : undefined
              if (i === 0) a.editedAt = editedAt
            } else {
              added.push({
                id: id("art"),
                projectId: first.projectId,
                milestoneInstanceId: first.milestoneInstanceId,
                label: title,
                url,
                service: detectService(url),
                addedBy: first.addedBy,
                // Same moment as the rest, which is what keeps it in the entry.
                addedAt: first.addedAt,
              })
            }
          })
          const gone = new Set(items.slice(urls.length).map((a) => a.id))
          draft.artefacts = [
            ...added,
            ...draft.artefacts.filter((a) => !gone.has(a.id)),
          ]
          draft.submissions.forEach((sub) => {
            const kept = sub.artefactIds.filter((x) => !gone.has(x))
            sub.artefactIds = sub.artefactIds.includes(first.id)
              ? [...kept, ...added.map((a) => a.id)]
              : kept
          })
        },
        { action: "artefact.update", subject: first.id },
        {
          action: "progress.edited",
          projectId: project.id,
          target: { type: "progress", id: first.id, label: title },
          summary: `Edited “${title}”`,
          changes: [
            ...(items[0].label !== title
              ? [{ field: "title", from: items[0].label, to: title }]
              : []),
            ...(items.map((a) => a.url).join(", ") !== nextUrls.join(", ")
              ? [
                  {
                    field: "links",
                    from: items.map((a) => a.url).join(", "),
                    to: nextUrls.join(", "),
                  },
                ]
              : []),
            ...((items[0].note ?? "") !== (input.note?.trim() ?? "")
              ? [
                  {
                    field: "note",
                    from: items[0].note ?? "",
                    to: input.note?.trim() ?? "",
                  },
                ]
              : []),
          ],
        }
      )
      return ok
    },
    [actor, db.artefacts, findProject, milestoneOfArtefact, write]
  )

  /* ----------------------------------------------------------- comments */

  /** Where a comment notice goes: the checkpoint, with the comment named so the
   * page can open it, scroll to it and mark it. */
  const threadHref = (
    projectId: string,
    milestoneId: string,
    commentId?: string
  ) =>
    `/projects/${projectId}?tab=plan&milestone=${milestoneId}${commentId ? `&comment=${commentId}` : ""}`

  const addComment = React.useCallback(
    (
      milestoneId: string,
      body: string,
      parentId?: string,
      mentionIds?: string[]
    ): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const found = projectOfMilestone(milestoneId)
      if (!found) return deny("That checkpoint no longer exists.")
      if (!canComment(actor, found.project))
        return deny("Only the team and its mentors can comment here.")
      const text = body.trim()
      if (!text) return deny("Write something first.")

      const parent = parentId
        ? db.comments.find((c) => c.id === parentId)
        : undefined
      if (
        parentId &&
        (!parent ||
          parent.milestoneInstanceId !== milestoneId ||
          parent.parentId ||
          parent.deletedAt)
      )
        return deny("That comment is no longer there to reply to.")

      // Only people who can read the thread can be tagged in it, and not oneself.
      const tagged = validMentions(
        mentionIds,
        mentionablePeople(db, found.project),
        actor.person.id
      )

      const now = new Date().toISOString()
      const comment: ProgressComment = {
        id: id("cmt"),
        projectId: found.project.id,
        milestoneInstanceId: milestoneId,
        parentId,
        authorId: actor.person.id,
        body: text,
        mentions: tagged.length ? tagged : undefined,
        createdAt: now,
      }
      // The other side hears about it, and so does anyone already in the thread.
      const fromTeam = isMemberOf(actor, found.project)
      const thread = parent
        ? [parent, ...db.comments.filter((c) => c.parentId === parent.id)]
        : []
      // Someone tagged gets the notice that says so, not a second, general one.
      const recipients = [
        ...(fromTeam ? found.project.mentorIds : found.project.teamMemberIds),
        ...thread.map((c) => c.authorId),
      ].filter((x) => x !== actor.person.id && !tagged.includes(x))
      const title = checkpointTitle(milestoneId)

      write(
        (draft) => {
          draft.comments = [...draft.comments, comment]
          notify(draft, recipients, {
            kind: "comment",
            title: `${actor.person.name} ${parent ? "replied on" : "commented on"} ${title}`,
            body: text.slice(0, 100),
            href: threadHref(found.project.id, milestoneId, comment.id),
            createdAt: now,
          })
          notify(draft, tagged, {
            kind: "mention",
            title: `${actor.person.name} mentioned you on ${title}`,
            body: text.slice(0, 100),
            href: threadHref(found.project.id, milestoneId, comment.id),
            createdAt: now,
          })
        },
        undefined,
        {
          action: parent ? "comment.replied" : "comment.created",
          projectId: found.project.id,
          target: { type: "comment", id: comment.id, label: title },
          summary: `${parent ? "Replied" : "Commented"} on ${title}`,
          changes: [
            { field: "comment", to: text },
            ...(tagged.length
              ? [
                  {
                    field: "mentions",
                    to: tagged
                      .map((x) => db.people.find((p) => p.id === x)?.name ?? x)
                      .join(", "),
                  },
                ]
              : []),
          ],
        }
      )
      return ok
    },
    [actor, checkpointTitle, db, projectOfMilestone, write]
  )

  const editComment = React.useCallback(
    (commentId: string, body: string, mentionIds?: string[]): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const comment = db.comments.find((c) => c.id === commentId)
      if (!comment || comment.deletedAt)
        return deny("That comment is no longer there.")
      if (comment.authorId !== actor.person.id)
        return deny("You can only edit your own comments.")
      const project = findProject(comment.projectId)
      const text = body.trim()
      if (!text) return deny("A comment cannot be empty.")
      if (text === comment.body) return ok

      const tagged = project
        ? validMentions(
            mentionIds,
            mentionablePeople(db, project),
            actor.person.id
          )
        : []
      // Only people newly tagged in the edit are told; the rest already were.
      const added = tagged.filter((x) => !(comment.mentions ?? []).includes(x))
      const title = checkpointTitle(comment.milestoneInstanceId)

      write(
        (draft) => {
          const c = draft.comments.find((x) => x.id === commentId)!
          c.body = text
          c.mentions = tagged.length ? tagged : undefined
          c.editedAt = new Date().toISOString()
          notify(draft, added, {
            kind: "mention",
            title: `${actor.person.name} mentioned you on ${title}`,
            body: text.slice(0, 100),
            href: threadHref(
              comment.projectId,
              comment.milestoneInstanceId,
              commentId
            ),
            createdAt: c.editedAt,
          })
        },
        undefined,
        {
          action: "comment.edited",
          projectId: comment.projectId,
          target: {
            type: "comment",
            id: commentId,
            label: checkpointTitle(comment.milestoneInstanceId),
          },
          summary: `Edited a comment on ${checkpointTitle(comment.milestoneInstanceId)}`,
          changes: [{ field: "comment", from: comment.body, to: text }],
        }
      )
      return ok
    },
    [actor, checkpointTitle, db, findProject, write]
  )

  const deleteComment = React.useCallback(
    (commentId: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const comment = db.comments.find((c) => c.id === commentId)
      if (!comment || comment.deletedAt)
        return deny("That comment is no longer there.")
      if (comment.authorId !== actor.person.id)
        return deny("You can only delete your own comments.")

      // The comment stays in the thread as "deleted", and its words stay in the
      // log, so nothing said here is ever lost from the record.
      write(
        (draft) => {
          const c = draft.comments.find((x) => x.id === commentId)!
          c.deletedAt = new Date().toISOString()
        },
        undefined,
        {
          action: "comment.deleted",
          projectId: comment.projectId,
          target: {
            type: "comment",
            id: commentId,
            label: checkpointTitle(comment.milestoneInstanceId),
          },
          summary: `Deleted a comment on ${checkpointTitle(comment.milestoneInstanceId)}`,
          changes: [{ field: "comment", from: comment.body }],
        }
      )
      return ok
    },
    [actor, checkpointTitle, db.comments, write]
  )

  /* ------------------------------------------------ meetings and actions */

  /* ---------------------------------------------------- weekly progress */

  const submitWeeklyProgress = React.useCallback(
    (
      projectId: string,
      week: number,
      input: { summary: string; files: WeeklyFile[] }
    ): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const project = findProject(projectId)
      if (!project) return deny("That project no longer exists.")
      const check = canSubmitWeekly(actor, project)
      if (!check.allowed) return deny(check.reason ?? "Not permitted.")
      if (week < 1 || week > currentWeek(batch.startDate))
        return deny("That week has not started yet.")
      if (
        db.weeklyProgress.some(
          (r) => r.projectId === projectId && r.week === week
        )
      )
        return deny(`Week ${week} has already been submitted.`)
      const summary = input.summary.trim()
      if (!summary && input.files.length === 0)
        return deny("Add a short summary or at least one file.")

      const report: WeeklyProgress = {
        id: id("wk"),
        projectId,
        week,
        summary,
        files: input.files,
        submittedBy: actor.person.id,
        submittedAt: new Date().toISOString(),
      }
      write(
        (draft) => {
          draft.weeklyProgress = [report, ...draft.weeklyProgress]
        },
        {
          action: "weekly.submit",
          subject: projectId,
          detail: `week ${week}`,
        }
      )
      return ok
    },
    [actor, batch.startDate, db.weeklyProgress, findProject, write]
  )

  const addMeeting = React.useCallback(
    (
      projectId: string,
      input: {
        title: string
        date: string
        time?: string
        attendeeIds: string[]
        callUrl?: string
      }
    ): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const project = findProject(projectId)
      if (!project) return deny("That project no longer exists.")
      if (
        !isMemberOf(actor, project) &&
        !isMentorOf(actor, project) &&
        !isCoordinator(actor)
      ) {
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
              body: `${projectLabel(project).slice(0, 60)}`,
              href: `/projects/${projectId}?tab=notes`,
              createdAt: meeting.createdAt,
            }
          )
        },
        { action: "meeting.create", subject: meeting.id },
        {
          action: "meeting.created",
          projectId,
          target: { type: "meeting", id: meeting.id, label: meeting.title },
          summary: `Scheduled “${meeting.title}” for ${meeting.date}${meeting.time ? ` at ${meeting.time}` : ""}`,
          changes: [
            {
              field: "attendees",
              to: meeting.attendeeIds
                .map((x) => db.people.find((p) => p.id === x)?.name ?? x)
                .join(", "),
            },
            ...(meeting.callUrl
              ? [{ field: "call link", to: meeting.callUrl }]
              : []),
          ],
        }
      )
      return ok
    },
    [actor, db.people, findProject, write]
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
      if (
        !isMemberOf(actor, project) &&
        !isMentorOf(actor, project) &&
        !isCoordinator(actor)
      ) {
        return deny("This project is not yours to change.")
      }
      const now = new Date().toISOString()
      const existingMinutes = db.minutes.find((m) => m.meetingId === meetingId)
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
        { action: "minutes.save", subject: meetingId },
        {
          action: existingMinutes ? "minutes.edited" : "minutes.recorded",
          projectId: meeting.projectId,
          target: { type: "meeting", id: meetingId, label: meeting.title },
          summary: `${existingMinutes ? "Edited" : "Recorded"} the minutes of “${meeting.title}”`,
          // Only the parts that differ from what was there before, kept short.
          changes: (
            [
              ["discussed", existingMinutes?.discussed, input.discussed],
              ["decided", existingMinutes?.decided, input.decided],
              ["next", existingMinutes?.next, input.next],
            ] as const
          )
            .filter(([, before, after]) => (before ?? "") !== after)
            .map(([field, before, after]) => ({
              field,
              from: before ? clip(before) : undefined,
              to: clip(after),
            })),
        }
      )
      return ok
    },
    [actor, db.meetings, db.minutes, findProject, write]
  )

  const confirmMinutes = React.useCallback(
    (minutesId: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const minutes = db.minutes.find((m) => m.id === minutesId)
      const project = minutes ? findProject(minutes.projectId) : undefined
      if (!minutes || !project) return deny("Those minutes no longer exist.")
      const now = new Date().toISOString()
      const meetingTitle =
        db.meetings.find((m) => m.id === minutes.meetingId)?.title ??
        "a meeting"
      write(
        (draft) => {
          const m = draft.minutes.find((x) => x.id === minutesId)!
          if (isMemberOf(actor, project)) m.confirmedByTeamAt = now
          else if (isMentorOf(actor, project) || isCoordinator(actor))
            m.confirmedByMentorAt = now
        },
        undefined,
        {
          action: "minutes.confirmed",
          projectId: project.id,
          target: {
            type: "meeting",
            id: minutes.meetingId,
            label: meetingTitle,
          },
          summary: `Confirmed the minutes of “${meetingTitle}” as ${isMemberOf(actor, project) ? "the team" : "a mentor"}`,
        }
      )
      return ok
    },
    [actor, db.meetings, db.minutes, findProject, write]
  )

  const addActionItem = React.useCallback(
    (
      projectId: string,
      input: {
        text: string
        ownerId: string
        dueDate: string
        meetingId?: string
        noteId?: string
      }
    ): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const project = findProject(projectId)
      if (!project) return deny("That project no longer exists.")
      // The coordinator reads a team's actions; the team and its mentors add them.
      if (isCoordinator(actor))
        return deny("Only the team and its mentors can add action items.")
      if (!input.text.trim()) return deny("An action needs a description.")
      if (!input.ownerId) return deny("An action needs one named owner.")
      const item: ActionItem = {
        id: id("ai"),
        projectId,
        source: input.meetingId || input.noteId ? "meeting" : "self",
        meetingId: input.meetingId,
        noteId: input.noteId,
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
            href: `/projects/${projectId}?tab=notes`,
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
      if (
        item.createdBy !== actor.person.id &&
        !isMentorOf(actor, project) &&
        !isCoordinator(actor)
      ) {
        return deny("Only whoever raised it, or the mentor, can remove it.")
      }
      write((draft) => {
        draft.actionItems = draft.actionItems.filter(
          (a) => a.id !== actionItemId
        )
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
              href: "/messages",
              createdAt: now,
            }
          )
        },
        {
          action: "announcement.post",
          subject: announcement.id,
          detail: input.audience.kind,
        }
      )
      return ok
    },
    [actor, write]
  )

  const markAnnouncementRead = React.useCallback(
    (announcementId: string) => {
      if (!actor) return
      const already = db.announcementReads.some(
        (r) =>
          r.announcementId === announcementId && r.personId === actor.person.id
      )
      if (already) return
      write((draft) => {
        draft.announcementReads = [
          {
            announcementId,
            personId: actor.person.id,
            readAt: new Date().toISOString(),
          },
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
        if (n.personId === actor.person.id && !n.readAt)
          n.readAt = new Date().toISOString()
      })
    })
  }, [actor, write])

  /* --------------------------------------------------------- programme */

  const requireCoordinator = React.useCallback((): ActionResult | null => {
    if (!actor) return deny("Sign in first.")
    if (!isCoordinator(actor))
      return deny("Only the programme coordinator can change this.")
    return null
  }, [actor])

  const updateProfile = React.useCallback(
    (input: { avatarUrl?: string | null }): ActionResult => {
      if (!actor) return deny("Sign in first.")
      // Name, email and roll number come from the roster; only the photo is
      // the person's own to change.
      write((draft) => {
        const me = draft.people.find((p) => p.id === actor.person.id)
        if (!me) return
        if (input.avatarUrl !== undefined)
          me.avatarUrl = input.avatarUrl ?? undefined
      })
      return ok
    },
    [actor, write]
  )

  const addPerson = React.useCallback(
    (input: {
      name: string
      email: string
      roles: Role[]
      rollNumber?: string
    }): Person => {
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
    (
      projectId: string,
      mentorIds: string[],
      preferredMentorId: string | null
    ): ActionResult => {
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
        {
          action: "allocation.update",
          subject: projectId,
          detail: mentorIds.join(", "),
        }
      )
      return ok
    },
    [actor, requireCoordinator, write]
  )

  const saveTeam = React.useCallback(
    (teamId: string, draftTeam: TeamDraft): ActionResult => {
      const denied = requireCoordinator()
      if (denied) return denied
      if (!draftTeam.memberIds.length)
        return deny("A team needs at least one member.")
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
      if (!draftTeam.memberIds.length)
        return deny("A team needs at least one member.")
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
          const template = draft.milestoneTemplate.filter(
            (t) => t.batchId === project.batchId
          )
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
      if (
        !isMemberOf(actor, project) &&
        !isMentorOf(actor, project) &&
        !isCoordinator(actor)
      ) {
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

  const setProjectTitle = React.useCallback(
    (projectId: string, title: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const project = findProject(projectId)
      if (!project) return deny("That project no longer exists.")
      // The team names its project; its mentors may correct it.
      if (!isMemberOf(actor, project) && !isMentorOf(actor, project)) {
        return deny("Only the team and its mentors can name the project.")
      }
      const clean = title.trim().replace(/\s+/g, " ")
      if (!clean) return deny("A project needs a title.")
      if (clean.length > 120)
        return deny("Keep the title under 120 characters.")
      write(
        (draft) => {
          const p = draft.projects.find((x) => x.id === projectId)!
          p.title = clean
          p.updatedAt = new Date().toISOString()
          p.updatedBy = actor.person.id
        },
        { action: "project.title", subject: projectId }
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
      if (draftItem.dueWeek < 1 || draftItem.dueWeek > 60)
        return deny("Week must be between 1 and 60.")

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
        {
          action: itemId ? "template.update" : "template.create",
          subject: itemId ?? draftItem.title,
        }
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
        return deny(
          "Teams have already worked against this checkpoint, so it cannot be removed."
        )
      }
      write(
        (draft) => {
          draft.milestoneTemplate = draft.milestoneTemplate.filter(
            (t) => t.id !== itemId
          )
          draft.milestones = draft.milestones.filter(
            (m) => m.templateItemId !== itemId
          )
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

  /* -------------------------------------------------------------- notes */

  const createNote = React.useCallback(
    (projectId: string): string | null => {
      if (!actor) return null
      const project = findProject(projectId)
      // The coordinator reads notes; the team and its mentors write them.
      if (isCoordinator(actor)) return null
      if (!project || !canEditProject(actor, project)) return null
      const now = new Date().toISOString()
      const note: Note = {
        id: id("note"),
        projectId,
        title: `${formatDate(todayIso(), { withYear: true })} Meeting notes`,
        content: "",
        authorId: actor.person.id,
        createdAt: now,
        updatedAt: now,
      }
      write(
        (draft) => {
          draft.notes = [note, ...draft.notes]
        },
        undefined,
        {
          action: "note.created",
          projectId,
          target: { type: "note", id: note.id, label: note.title },
          summary: `Created the note “${note.title}”`,
        }
      )
      return note.id
    },
    [actor, findProject, write]
  )

  const updateNote = React.useCallback(
    (
      noteId: string,
      patch: { title?: string; content?: string }
    ): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const note = db.notes.find((n) => n.id === noteId)
      const project = note ? findProject(note.projectId) : undefined
      if (!note || !project) return deny("That note no longer exists.")
      // The team and its mentors write the same notes.
      if (
        !isMemberOf(actor, project) &&
        !isMentorOf(actor, project) &&
        note.authorId !== actor.person.id
      ) {
        return deny("Only the team and its mentors can edit its notes.")
      }
      const renamed = patch.title !== undefined && patch.title !== note.title
      const changed =
        renamed ||
        (patch.content !== undefined && patch.content !== note.content)
      const key = `${noteId}:${actor.person.id}`
      const last = noteEditLogged.get(key) ?? 0
      const logIt = changed && (renamed || Date.now() - last > NOTE_EDIT_LOG_MS)
      if (logIt) noteEditLogged.set(key, Date.now())

      write(
        (draft) => {
          const n = draft.notes.find((x) => x.id === noteId)!
          if (patch.title !== undefined) n.title = patch.title
          if (patch.content !== undefined) n.content = patch.content
          n.updatedAt = new Date().toISOString()
        },
        undefined,
        logIt
          ? {
              action: renamed ? "note.renamed" : "note.edited",
              projectId: project.id,
              target: {
                type: "note",
                id: noteId,
                label: patch.title ?? note.title,
              },
              summary: renamed
                ? `Renamed the note “${note.title}”`
                : `Edited the note “${note.title}”`,
              changes: renamed
                ? [{ field: "title", from: note.title, to: patch.title }]
                : undefined,
            }
          : undefined
      )
      return ok
    },
    [actor, db.notes, findProject, write]
  )

  const deleteNote = React.useCallback(
    (noteId: string): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const note = db.notes.find((n) => n.id === noteId)
      if (!note) return deny("That note no longer exists.")
      const project = findProject(note.projectId)
      // The whole team shares its notes: any member can edit or delete one.
      const onTeam =
        !!project && (isMemberOf(actor, project) || isMentorOf(actor, project))
      if (!onTeam && note.authorId !== actor.person.id) {
        return deny("Only the team and its mentors can delete its notes.")
      }
      write(
        (draft) => {
          draft.notes = draft.notes.filter((n) => n.id !== noteId)
          draft.actionItems = draft.actionItems.filter(
            (a) => a.noteId !== noteId
          )
          draft.noteComments = draft.noteComments.filter(
            (c) => c.noteId !== noteId
          )
        },
        undefined,
        {
          action: "note.deleted",
          projectId: note.projectId,
          target: { type: "note", id: noteId, label: note.title },
          summary: `Deleted the note “${note.title}”`,
        }
      )
      return ok
    },
    [actor, db.notes, findProject, write]
  )

  const addNoteComment = React.useCallback(
    (
      noteId: string,
      input: {
        body: string
        quote?: string
        anchorId?: string
        parentId?: string
        content?: string
      }
    ): ActionResult => {
      if (!actor) return deny("Sign in first.")
      const note = db.notes.find((n) => n.id === noteId)
      const project = note ? findProject(note.projectId) : undefined
      if (!note || !project) return deny("That note no longer exists.")
      if (!canEditProject(actor, project))
        return deny("This note is not yours to comment on.")
      if (!input.body.trim()) return deny("A comment needs some text.")
      const comment: NoteComment = {
        id: id("nc"),
        noteId,
        projectId: project.id,
        authorId: actor.person.id,
        body: input.body.trim(),
        quote: input.quote,
        anchorId: input.anchorId,
        parentId: input.parentId,
        createdAt: new Date().toISOString(),
      }
      write(
        (draft) => {
          draft.noteComments = [...draft.noteComments, comment]
          if (input.content !== undefined) {
            const n = draft.notes.find((x) => x.id === noteId)!
            n.content = input.content
            n.updatedAt = comment.createdAt
          }
          notify(
            draft,
            [...project.teamMemberIds, ...project.mentorIds].filter(
              (p) => p !== actor.person.id
            ),
            {
              kind: "comment",
              title: `${actor.person.name} commented on "${note.title}"`,
              body: comment.body.slice(0, 80),
              href: `/notes/${noteId}`,
              createdAt: comment.createdAt,
            }
          )
        },
        undefined,
        {
          action: input.parentId ? "note.comment_replied" : "note.commented",
          projectId: project.id,
          target: { type: "note", id: noteId, label: note.title },
          summary: `${input.parentId ? "Replied" : "Commented"} on the note “${note.title}”`,
          changes: [
            ...(input.quote ? [{ field: "on", to: clip(input.quote) }] : []),
            { field: "comment", to: comment.body },
          ],
        }
      )
      return ok
    },
    [actor, db.notes, findProject, write]
  )

  const clearCommentsAndNotifications = React.useCallback((): ActionResult => {
    const denied = requireCoordinator()
    if (denied) return denied
    // Through `write`, so the emptied lists are also taken off the server when
    // there is one. The activity log is not touched: it is append-only, and it
    // keeps its own record of what was said.
    write(
      (draft) => {
        draft.comments = []
        draft.notifications = []
      },
      {
        action: "data.cleared",
        subject: "comments and notifications",
        detail: `${db.comments.length} comments, ${db.notifications.length} notifications`,
      }
    )
    return ok
  }, [db.comments.length, db.notifications.length, requireCoordinator, write])

  const resetAll = React.useCallback(() => {
    setDb(resetDatabase())
  }, [])

  const setDemoData = React.useCallback(
    (on: boolean) => {
      commit(on ? withDemoActivity(db) : withoutActivity(db))
    },
    [commit, db]
  )

  const value = React.useMemo<StoreValue>(
    () => ({
      db,
      ready,
      sharedReady,
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
      submitDocument,
      reviewSubmission,
      openForReview,
      setDueWeekOverride,
      markFeedbackAddressed,
      confirmFeedbackAddressed,
      addArtefact,
      removeArtefact,
      updateArtefact,
      removeProgressEntry,
      updateProgressEntry,
      addComment,
      editComment,
      deleteComment,
      submitWeeklyProgress,
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
      updateProfile,
      updateAllocation,
      saveTeam,
      createTeam,
      addProject,
      updateProject,
      setProjectTitle,
      archiveProject,
      restoreProject,
      setProjectVisibility,
      addBatch,
      updateBatch,
      addDomain,
      saveMilestoneTemplateItem,
      deleteMilestoneTemplateItem,
      createNote,
      updateNote,
      deleteNote,
      addNoteComment,
      clearCommentsAndNotifications,
      resetAll,
      setDemoData,
    }),
    [
      db,
      ready,
      sharedReady,
      session,
      actor,
      currentUser,
      week,
      batch,
      doSignIn,
      doSignOut,
      setActiveRole,
      setMilestoneStatus,
      toggleDeliverable,
      submitMilestone,
      submitDocument,
      reviewSubmission,
      openForReview,
      setDueWeekOverride,
      markFeedbackAddressed,
      confirmFeedbackAddressed,
      addArtefact,
      removeArtefact,
      updateArtefact,
      removeProgressEntry,
      updateProgressEntry,
      addComment,
      editComment,
      deleteComment,
      submitWeeklyProgress,
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
      updateProfile,
      updateAllocation,
      saveTeam,
      createTeam,
      addProject,
      updateProject,
      setProjectTitle,
      archiveProject,
      restoreProject,
      setProjectVisibility,
      addBatch,
      updateBatch,
      addDomain,
      saveMilestoneTemplateItem,
      deleteMilestoneTemplateItem,
      clearCommentsAndNotifications,
      resetAll,
      setDemoData,
      createNote,
      updateNote,
      deleteNote,
      addNoteComment,
    ]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useProjectsStore() {
  const ctx = React.useContext(StoreContext)
  if (!ctx)
    throw new Error("useProjectsStore must be used inside ProjectsProvider")
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
