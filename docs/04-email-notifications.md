# Email notifications

Working plan for the emails ProjectGarage sends. Edit this file as decisions change; nothing is built until it is agreed.

Status: **draft**. Open decisions are marked **OPEN**.

## Principles

- **Batch, don't stream.** One email per person per delivery window, never one per event. Items are grouped by project, then by thread.
- **The bell stays real-time.** Email is the catch-up channel. An item the person has already seen in the app is not mailed.
- **Quiet hours: 9 pm to 8 am.** Nothing is sent in that window. Anything that falls in it goes out at 8 am.
- **Account emails are not notifications.** Password and reset mails are instant and separate from this plan.
- **Empty means silent.** If there is nothing to say, no mail is sent.
- **Same activity batch for everyone.** Students, mentors and the coordinator all get the same kind of activity batch: 2 to 3 hours after the first unread item, later items merge into it.

## What is out of scope

| Left out | Why |
|---|---|
| Review, return and return category | Feedback is given in comments, so comments cover it. |
| Action item due soon or overdue | Action items have no real due date. |
| Announcements | There are none until something is commented on. |
| Mentor daily digest | Replaced by the weekly report. |
| Rollout counts (assigned, signed in, own password) in the coordinator digest | The coordinator digest is about team progress only. |

The app still has review and accept code, and an announcements page. They keep working in-app. The email layer skips the `review` and `announcement` notification kinds.

## Student

| Mail | Contents | When |
|---|---|---|
| **Activity batch** | Comments and replies on their threads, @mentions, new action items assigned to them, meetings scheduled or changed | 2 to 3 hours after the first unread item; later items merge into the same mail |
| **Twice-weekly reminder** | Checkpoints due in the next 7 days, overdue checkpoints, weekly progress not filed | 8 am on **Tuesday and Thursday**. Only if there is something to say |

Why the reminder lists "the next 7 days" and not "7 days" or "1 day" exactly: with two mails a week, an exact-day reminder can be missed. Each mail lists everything due in the next 7 days plus anything overdue.

## Mentor

| Mail | Contents | When |
|---|---|---|
| **Activity batch** | @mentions of them, and comments on threads in their teams' projects, on any thread or project deliverable | 2 to 3 hours after the first unread item; later items merge |
| **Weekly report** | Their teams only: on track, lagging, coming up | Weekly (**OPEN**: day and time) |

## Coordinator

| Mail | Contents | When |
|---|---|---|
| **Activity batch** | @tags of them, and comments on threads they are in | 2 to 3 hours after the first unread item; later items merge |
| **Weekly digest** | All teams: going well, lagging, coming up. No rollout counts | Weekly (**OPEN**: day and time) |
| **Escalations** | **PAUSED**, see below | Immediate. Kept rare |

### Escalations (paused)

Not needed for the coordinator for now. The code is kept and switched off with `ESCALATIONS_ENABLED` in `lib/mail/compose.ts`. When it comes back:

- A team has **missed two checkpoints**.
- A team has had **no activity for 14 days**.

## Comment emails

Comments, replies and @mentions are never sent one by one, and never instantly.

- **Quiet period with a cap.** The first unread item starts a timer. Send once the person has had **30 minutes with nothing new**, or when the oldest item has waited **3 hours**, whichever comes first. Quiet hours (9 pm to 8 am) still apply.
- **@mentions use the same timing** as other comments. They are listed first in the mail.
- **Dropped if read.** Anything the person has opened in the app before the send time is left out. If nothing is left, no mail goes out. People are never mailed about their own comments.
- **One mail per person per batch,** grouped by project, then thread. Each thread shows who wrote, the first two comments, "+N more", and one link. Maximum 10 threads; the rest are summarised as "N more in the app".
- **Subject:** one thread uses its own title ("Name commented on Checkpoint 4"); several use "5 updates across 2 projects".

Only two things are ever immediate: account mails (password, reset) and coordinator escalations.

## Weekly report and digest: how a team is classed

Proposed definitions, to be confirmed:

| Class | Meaning |
|---|---|
| **Going well** | No overdue checkpoint, and weekly progress filed for the latest week |
| **Lagging** | One overdue checkpoint, or the latest weekly progress missing |
| **At risk** | Two or more missed checkpoints (also triggers an escalation) |
| **Coming up** | A checkpoint falls due in the next 14 days |

A mentor's report lists only their teams. The coordinator's digest lists every team, with the mentor named beside each.

## Built so far (preview only, nothing sends on its own)

| Piece | Where |
|---|---|
| Composing each mail from the database | `lib/mail/compose.ts`, `lib/mail/team-status.ts` |
| HTML and text rendering | `lib/mail/render.ts` |
| Reading live data from Supabase | `lib/mail/load.ts` |
| Preview script, sends to one address only | `scripts/preview-mails.ts` |

Run `npx tsx --env-file=.env.local scripts/preview-mails.ts --data demo --send` to send all five previews to your own inbox. Not built yet: the scheduled job, and remembering what has already been mailed.

## Open decisions

1. **OPEN. Day and time of the weekly mentor report and coordinator digest.** Proposal: Monday 8 am, so it covers the week ahead and the one just gone.
2. **OPEN. The class definitions above** (going well, lagging, at risk, coming up), in particular whether "weekly progress missing" alone makes a team lagging.

Decided: student delay is 2 to 3 hours; student reminders are Tuesday and Thursday at 8 am; escalations are two missed checkpoints and 14 days without activity.

## Existing in-app notification kinds

`deadline`, `submission`, `review`, `action_item`, `announcement`, `meeting`, `mention`, `comment`. The email layer can read these and hold them until their send time, so the activity batches need no new event wiring.

Not in the app yet, and needed for the plan: weekly-progress-missing, overdue checkpoint, team-status classing, and the two weekly reports.

## Build order

1. Batching job with a dry-run mode that prints what it would send.
2. Activity batch, for all three roles.
3. Student twice-weekly reminder.
4. Weekly mentor report and coordinator digest, then escalations.

Sending is through Gmail (Nodemailer), scheduled with Vercel cron. Nothing is sent until a dry run has been reviewed.
