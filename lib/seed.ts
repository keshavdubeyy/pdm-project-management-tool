import { addDays, dueDateForWeek, todayIso, weekNumber } from "@/lib/dates"
import { seedBatches, seedDomains, seedPeople, seedProjects, seedTeams } from "@/lib/mock-data"
import { milestoneTemplateFor } from "@/lib/milestone-template"
import type {
  ActionItem,
  Announcement,
  AnnouncementRead,
  Artefact,
  AppNotification,
  Database,
  Meeting,
  MilestoneInstance,
  MilestoneStatus,
  Minutes,
  Review,
  Submission,
} from "@/lib/types"

export const DB_VERSION = 1

/** Builds the starting state of the database.
 *
 * The roster, the teams, the projects and the milestone calendar are real. The
 * activity on top of them — who has submitted what, which reviews have been
 * written, which meetings happened — is generated, because none of it exists
 * yet in the real programme. It is generated deterministically from the
 * project's position in the list so that the app looks the same every time it
 * is reset, and so a demo can be rehearsed.
 *
 * The point of seeding activity at all is that an empty milestone grid teaches
 * a reviewer nothing. A grid with a realistic spread of states shows them what
 * the programme would actually look like on a Tuesday in week six.
 */
export function buildSeedDatabase(): Database {
  const batch = seedBatches[0]
  const template = milestoneTemplateFor(batch.id)
  const today = todayIso()
  const nowWeek = weekNumber(today, batch.startDate)

  const milestones: MilestoneInstance[] = []
  const submissions: Submission[] = []
  const reviews: Review[] = []
  const artefacts: Artefact[] = []
  const meetings: Meeting[] = []
  const minutes: Minutes[] = []
  const actionItems: ActionItem[] = []
  const notifications: AppNotification[] = []

  seedProjects.forEach((project, projectIndex) => {
    const rand = mulberry(projectIndex * 7919 + 13)
    const mentorId = project.mentorIds[0]
    const lead = project.teamMemberIds[0]

    template.forEach((item) => {
      const dueIso = dueDateForWeek(item.dueWeek, batch.startDate)
      const id = `ms-${project.id}-${item.order}`
      const base: MilestoneInstance = {
        id,
        projectId: project.id,
        templateItemId: item.id,
        status: "not_started",
        completedDeliverables: [],
        updatedAt: `${dueIso}T09:00:00.000Z`,
      }

      if (item.dueWeek < nowWeek) {
        // A checkpoint whose week has passed. Most teams cleared it.
        const roll = rand()
        if (roll < 0.68) {
          const submittedAt = `${addDays(dueIso, -2)}T14:20:00.000Z`
          const acceptedAt = `${addDays(dueIso, 1)}T10:05:00.000Z`
          milestones.push({
            ...base,
            status: "accepted",
            completedDeliverables: [...item.deliverables],
            startedAt: `${addDays(dueIso, -18)}T09:00:00.000Z`,
            submittedAt,
            acceptedAt,
            acceptedBy: mentorId,
            updatedAt: acceptedAt,
          })
          const sub = pushSubmission(submissions, {
            milestoneInstanceId: id,
            projectId: project.id,
            attempt: 1,
            submittedBy: lead,
            submittedAt,
            note: `${item.title} attached. Happy to walk through it in the next meeting.`,
            artefactIds: [],
          })
          const artefact = pushArtefact(artefacts, {
            projectId: project.id,
            milestoneInstanceId: id,
            label: item.title,
            url: driveUrl(project.id, item.order),
            service: "google_doc",
            addedBy: lead,
            addedAt: submittedAt,
          })
          sub.artefactIds.push(artefact.id)
          reviews.push({
            id: `rev-${project.id}-${item.order}-1`,
            submissionId: sub.id,
            milestoneInstanceId: id,
            projectId: project.id,
            reviewerId: mentorId,
            verdict: "accept",
            body: ACCEPT_NOTES[item.order % ACCEPT_NOTES.length],
            createdAt: acceptedAt,
          })
        } else if (roll < 0.86) {
          // Returned, and the team is working on it again.
          const submittedAt = `${addDays(dueIso, -1)}T18:40:00.000Z`
          const returnedAt = `${addDays(dueIso, 2)}T11:15:00.000Z`
          milestones.push({
            ...base,
            status: "returned",
            completedDeliverables: item.deliverables.slice(0, Math.ceil(item.deliverables.length / 2)),
            startedAt: `${addDays(dueIso, -16)}T09:00:00.000Z`,
            submittedAt,
            returnedAt,
            updatedAt: returnedAt,
          })
          const sub = pushSubmission(submissions, {
            milestoneInstanceId: id,
            projectId: project.id,
            attempt: 1,
            submittedBy: lead,
            submittedAt,
            note: "First pass at this one.",
            artefactIds: [],
          })
          const artefact = pushArtefact(artefacts, {
            projectId: project.id,
            milestoneInstanceId: id,
            label: `${item.title} (draft)`,
            url: driveUrl(project.id, item.order),
            service: "google_doc",
            addedBy: lead,
            addedAt: submittedAt,
          })
          sub.artefactIds.push(artefact.id)
          const review: Review = {
            id: `rev-${project.id}-${item.order}-1`,
            submissionId: sub.id,
            milestoneInstanceId: id,
            projectId: project.id,
            reviewerId: mentorId,
            verdict: "return",
            category: "evidence",
            body: RETURN_NOTES[item.order % RETURN_NOTES.length],
            createdAt: returnedAt,
          }
          reviews.push(review)
          actionItems.push({
            id: `ai-${project.id}-${item.order}-r`,
            projectId: project.id,
            source: "review",
            reviewId: review.id,
            text: "Rework the section the mentor flagged and resubmit",
            ownerId: lead,
            dueDate: addDays(today, 4),
            status: "open",
            createdBy: mentorId,
            createdAt: returnedAt,
          })
          notifications.push(...notifyTeam(project.teamMemberIds, {
            kind: "review",
            title: `${item.title} returned for revisions`,
            body: review.body.slice(0, 90),
            href: `/projects/${project.id}?milestone=${id}`,
            createdAt: returnedAt,
          }))
        } else {
          // Nothing handed in and the week has gone.
          milestones.push({
            ...base,
            status: "overdue",
            startedAt: `${addDays(dueIso, -10)}T09:00:00.000Z`,
            completedDeliverables: item.deliverables.slice(0, 1),
            updatedAt: `${addDays(dueIso, -6)}T09:00:00.000Z`,
          })
        }
        return
      }

      if (item.dueWeek === nowWeek || item.dueWeek === nowWeek + 1) {
        // The checkpoint the batch is actually working on right now.
        const roll = rand()
        if (roll < 0.22) {
          const submittedAt = `${addDays(today, -1)}T16:30:00.000Z`
          milestones.push({
            ...base,
            status: "submitted",
            completedDeliverables: [...item.deliverables],
            startedAt: `${addDays(today, -12)}T09:00:00.000Z`,
            submittedAt,
            updatedAt: submittedAt,
          })
          const sub = pushSubmission(submissions, {
            milestoneInstanceId: id,
            projectId: project.id,
            attempt: 1,
            submittedBy: lead,
            submittedAt,
            note: "Turning this in ahead of the review.",
            artefactIds: [],
          })
          const artefact = pushArtefact(artefacts, {
            projectId: project.id,
            milestoneInstanceId: id,
            label: item.title,
            url: driveUrl(project.id, item.order),
            service: "google_doc",
            addedBy: lead,
            addedAt: submittedAt,
          })
          sub.artefactIds.push(artefact.id)
          notifications.push({
            id: notifId(),
            personId: mentorId,
            kind: "submission",
            title: `${project.title.slice(0, 44)} turned in ${item.title}`,
            body: "Waiting on your review.",
            href: `/projects?filter=waiting`,
            createdAt: submittedAt,
          })
        } else if (roll < 0.34) {
          const submittedAt = `${addDays(today, -3)}T12:10:00.000Z`
          milestones.push({
            ...base,
            status: "under_review",
            completedDeliverables: [...item.deliverables],
            startedAt: `${addDays(today, -14)}T09:00:00.000Z`,
            submittedAt,
            updatedAt: `${addDays(today, -1)}T09:30:00.000Z`,
          })
          const sub = pushSubmission(submissions, {
            milestoneInstanceId: id,
            projectId: project.id,
            attempt: 1,
            submittedBy: lead,
            submittedAt,
            note: "",
            artefactIds: [],
          })
          const artefact = pushArtefact(artefacts, {
            projectId: project.id,
            milestoneInstanceId: id,
            label: item.title,
            url: driveUrl(project.id, item.order),
            service: "google_doc",
            addedBy: lead,
            addedAt: submittedAt,
          })
          sub.artefactIds.push(artefact.id)
        } else if (roll < 0.82) {
          milestones.push({
            ...base,
            status: "in_progress",
            startedAt: `${addDays(today, -9)}T09:00:00.000Z`,
            completedDeliverables: item.deliverables.slice(
              0,
              Math.max(1, Math.floor(item.deliverables.length * rand()))
            ),
            updatedAt: `${addDays(today, -2)}T09:00:00.000Z`,
          })
        } else {
          milestones.push(base)
        }
        return
      }

      milestones.push(base)
    })

    // A recent mentor meeting for roughly two thirds of the teams, with
    // minutes and a couple of actions hanging off it.
    if (rand() < 0.68) {
      const meetingDate = addDays(today, -(3 + Math.floor(rand() * 8)))
      const meeting: Meeting = {
        id: `mtg-${project.id}-1`,
        projectId: project.id,
        title: "Weekly mentor review",
        date: meetingDate,
        time: "15:00",
        attendeeIds: [...project.teamMemberIds, mentorId],
        callUrl: "https://meet.google.com/pdm-weekly",
        createdBy: mentorId,
        createdAt: `${meetingDate}T09:00:00.000Z`,
      }
      meetings.push(meeting)
      minutes.push({
        id: `min-${meeting.id}`,
        meetingId: meeting.id,
        projectId: project.id,
        discussed: MINUTE_DISCUSSED[projectIndex % MINUTE_DISCUSSED.length],
        decided: MINUTE_DECIDED[projectIndex % MINUTE_DECIDED.length],
        next: "Bring the reworked section and the updated interview notes to the next meeting.",
        recordedBy: lead,
        recordedAt: `${meetingDate}T16:05:00.000Z`,
        confirmedByTeamAt: `${meetingDate}T16:05:00.000Z`,
      })
      actionItems.push(
        {
          id: `ai-${project.id}-m1`,
          projectId: project.id,
          source: "meeting",
          meetingId: meeting.id,
          text: ACTION_TEXTS[projectIndex % ACTION_TEXTS.length],
          ownerId: lead,
          dueDate: addDays(meetingDate, 7),
          status: rand() < 0.45 ? "done" : "open",
          createdBy: mentorId,
          createdAt: `${meetingDate}T16:05:00.000Z`,
          completedAt: undefined,
        },
        {
          id: `ai-${project.id}-m2`,
          projectId: project.id,
          source: "meeting",
          meetingId: meeting.id,
          text: "Write up the interview notes and link them to the checkpoint",
          ownerId: project.teamMemberIds[1] ?? lead,
          dueDate: addDays(meetingDate, 5),
          status: "open",
          createdBy: mentorId,
          createdAt: `${meetingDate}T16:06:00.000Z`,
        }
      )
    }
  })

  // Mark the "done" action items as actually completed.
  actionItems.forEach((a) => {
    if (a.status === "done" && !a.completedAt) a.completedAt = `${addDays(a.dueDate, -1)}T11:00:00.000Z`
  })

  const coordinator = seedPeople.find((p) => p.roles.includes("coordinator"))!
  const announcements: Announcement[] = [
    {
      id: "ann-1",
      authorId: coordinator.id,
      audience: { kind: "batch", batchId: batch.id },
      title: "Week 6 — Domain Research Report is due this Sunday",
      body:
        "A reminder that the Domain Research Report closes at the end of week 6. Cover the technical trends, the competitors and the existing products in the market. If your team is blocked on finding comparable products, say so in your next mentor meeting rather than waiting.",
      milestoneTemplateItemId: template[1].id,
      pinned: true,
      createdAt: `${addDays(today, -4)}T08:30:00.000Z`,
    },
    {
      id: "ann-2",
      authorId: "p-mentor-raghu",
      audience: { kind: "my_teams" },
      title: "Office hours moved to Thursday this week",
      body:
        "I am travelling on Wednesday, so this week's slots move to Thursday afternoon. Same room. If that does not work for your team, message me and we will find another time.",
      pinned: false,
      createdAt: `${addDays(today, -2)}T17:10:00.000Z`,
    },
    {
      id: "ann-3",
      authorId: coordinator.id,
      audience: { kind: "faculty" },
      title: "Calibrating what we accept at week 8",
      body:
        "Before the Customer Validation Report lands, it would help if the four of us agreed roughly what a pass looks like. My view: at least five real conversations, assumptions written down before the conversations rather than after, and evidence that at least one assumption was wrong. Shout if you would set the bar elsewhere.",
      pinned: false,
      createdAt: `${addDays(today, -6)}T19:00:00.000Z`,
    },
  ]

  const announcementReads: AnnouncementRead[] = seedProjects
    .slice(0, 9)
    .flatMap((p) =>
      p.teamMemberIds.slice(0, 1).map((personId) => ({
        announcementId: "ann-1",
        personId,
        readAt: `${addDays(today, -3)}T09:12:00.000Z`,
      }))
    )

  // Deadline reminders for whatever is due next.
  seedProjects.forEach((project) => {
    const next = template.find((t) => t.dueWeek >= nowWeek)
    if (!next) return
    const due = dueDateForWeek(next.dueWeek, batch.startDate)
    notifications.push(
      ...notifyTeam(project.teamMemberIds, {
        kind: "deadline",
        title: `${next.title} is due soon`,
        body: `Week ${next.dueWeek}, closing ${due}.`,
        href: `/projects/${project.id}`,
        createdAt: `${addDays(today, -1)}T07:00:00.000Z`,
      })
    )
  })

  return {
    version: DB_VERSION,
    people: seedPeople,
    batches: seedBatches,
    domains: seedDomains,
    teams: seedTeams,
    projects: seedProjects,
    milestoneTemplate: template,
    milestones,
    artefacts,
    submissions,
    reviews,
    meetings,
    minutes,
    actionItems,
    announcements,
    announcementReads,
    notifications,
    audit: [],
  }
}

/* ------------------------------------------------------------------ bits */

/** Small deterministic PRNG so the seeded state is identical on every reset. */
function mulberry(seed: number) {
  let a = seed >>> 0
  return function next() {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let submissionCounter = 0
function pushSubmission(list: Submission[], data: Omit<Submission, "id">): Submission {
  submissionCounter += 1
  const submission: Submission = { id: `sub-${submissionCounter}`, ...data }
  list.push(submission)
  return submission
}

let artefactCounter = 0
function pushArtefact(list: Artefact[], data: Omit<Artefact, "id">): Artefact {
  artefactCounter += 1
  const artefact: Artefact = { id: `art-${artefactCounter}`, ...data }
  list.push(artefact)
  return artefact
}

let notifCounter = 0
function notifId() {
  notifCounter += 1
  return `ntf-${notifCounter}`
}

function notifyTeam(
  memberIds: string[],
  data: Omit<AppNotification, "id" | "personId">
): AppNotification[] {
  return memberIds.map((personId) => ({ id: notifId(), personId, ...data }))
}

function driveUrl(projectId: string, order: number) {
  return `https://docs.google.com/document/d/${projectId.replace("proj-", "pdm")}-m${order}-report/edit`
}

const ACCEPT_NOTES = [
  "Clear and well evidenced. The competitor section in particular is stronger than last time.",
  "Good. The assumptions are specific enough to actually test, which is the part most teams skip.",
  "Accepted. Keep the same level of detail going into the next checkpoint.",
  "This reads well and the sourcing is honest about what you could not find.",
]

const RETURN_NOTES = [
  "The argument is fine but it rests on two claims with nothing behind them. Add the evidence or soften the claims, then send it back to me.",
  "You have described the market rather than the customer. I need to see who specifically has this problem before we go further.",
  "Most of this is there. The competitor comparison needs to say why each one fails the customer, not just that they exist.",
  "Good direction. The assumptions need to be written so that they could actually turn out false — right now each one is phrased so it cannot lose.",
]

const MINUTE_DISCUSSED = [
  "Walked through the current draft and where the evidence is thin. Talked about which customer segment to commit to first.",
  "Reviewed the competitor table and agreed two of the entries are not really competitors. Discussed how to reach interviewees.",
  "Looked at the interview notes so far and where the pattern is starting to show. Agreed the sample is still too small to conclude from.",
  "Went through the plan against the calendar and where the team is likely to slip.",
]

const MINUTE_DECIDED = [
  "Commit to the first segment for now and revisit after five more conversations.",
  "Drop the two entries that are not competitors and add one that is.",
  "Five more interviews before drawing any conclusion from the pattern.",
  "Move the heavier writing earlier so week 14 is not a cliff.",
]

const ACTION_TEXTS = [
  "Run five more customer interviews and write them up",
  "Rewrite the assumptions so each one could turn out false",
  "Add the evidence behind the two unsupported claims",
  "Redo the competitor table with a why-it-fails column",
]
