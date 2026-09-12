# Must-have coverage

Where each of the forty must-have features from [`02-feature-catalogue-moscow.md`](./02-feature-catalogue-moscow.md) lives in the running app, and how to see it working.

Sign in at `/signin` by typing a few letters of a name. Sessions are held per browser tab, so open a second tab and sign in as somebody else to watch work move between two people.

## Accounts and access

| Ref | Feature | Where it is | How to check it |
|---|---|---|---|
| A1 | Three roles | `lib/types.ts`, sidebar | The sidebar changes with the role. A student never sees a greyed-out coordinator item |
| A2 | Permission checks on every action, not just hidden buttons | `lib/permissions.ts`, enforced inside `lib/store.tsx` | Every mutation runs the check before it writes. Hiding a button is not the control |
| A3 | Real login | `/signin`, `lib/session.ts` | Session is per tab, in `sessionStorage`. A new tab starts from the last identity used |
| A4 | Mentor rights come from allocation, not a role flag | `projectsFor`, `isMentorOf` | Sign in as Prakash Yalla: Projects holds his six teams and nobody else's |
| A5 | One person, both roles | Account menu, "Acting as" | Dr. Raman Saxena is both a mentor and the coordinator. Switching changes what is permitted, not only what is shown |

## Batch, teams and allocation

| Ref | Feature | Where it is | How to check it |
|---|---|---|---|
| B1 | Batches | `/admin` → Milestone calendar | Start date drives every due date in the batch |
| B2 | Student and mentor directory | `/admin` → Roster, `/projects` | 41 students, 22 teams, 5 mentoring lines |
| B3 | Teams with a named lead | `/admin` → Roster → Edit | Three of the 22 are individual projects and are labelled as such |
| B4 | Project record per team | `/projects/[id]` | — |
| B5 | Preferred and assigned mentor recorded separately | `/admin` → Mentor allocation | Both are editable; where they differ the project shows "reassigned" |

## Milestones

| Ref | Feature | Where it is | How to check it |
|---|---|---|---|
| C1 | The twelve checkpoints as editable data | `/admin` → Milestone calendar | Add a checkpoint and a new column appears under Checkpoints for every team |
| C2 | Every team has its own copy | `lib/seed.ts`, `milestoneViews` | 22 × 12 = 264 instances |
| C3 | The status flow | `lib/status.ts`, `ALLOWED_TRANSITIONS` | Overdue is computed from the calendar rather than set by anyone |
| C4 | Week arithmetic | `lib/dates.ts` | The header reads "Week N of 28", derived from the batch start date |
| C5 | Deliverables as a checklist | Checkpoint slide-over | Week 14 carries ten separate artefacts |
| C6 | What is due next | Today, and the project rail | Four checkpoints, nearest first |

## Deliverables

| Ref | Feature | Where it is | How to check it |
|---|---|---|---|
| D1 | Attach a link to a checkpoint | Checkpoint slide-over, `lib/links.ts` | Paste a Google, Figma, Miro, GitHub, Notion, Loom or YouTube URL — the service is recognised and the title inferred |
| D2 | Submit | Checkpoint slide-over → Turn in | Timestamps it, records the attempt number and notifies the mentor |
| D3 | One place listing every artefact | Project → Work tab | Grouped by the checkpoint it belongs to |

## Review and sign-off

| Ref | Feature | Where it is | How to check it |
|---|---|---|---|
| E1 | Only the mentor can accept | `canSetMilestoneStatus` | A student has no Accept button, and the store refuses it even if one were forged |
| E2 | Written feedback kept permanently | Project → Feedback tab | Every review a project has ever had, in order |
| E3 | Return with a stated reason | Review dialog | A category and at least a sentence are both required |
| E4 | Feedback history | Checkpoint slide-over → History | Reviews and submissions in one stream |

## Meetings and actions

| Ref | Feature | Where it is | How to check it |
|---|---|---|---|
| F1 | Meeting record | Project → Meetings and actions | Date, attendees and the call link |
| F2 | Minutes against the project | Same tab | Discussed, decided, next. Both sides can confirm the record |
| F3 | Actions with an owner and a date | Same tab | Owners are individuals, never a whole team |
| F4 | Open since the last meeting | Top of the same tab | The answer to "did you do what we agreed?", without anyone asking |

## Communication

| Ref | Feature | Where it is | How to check it |
|---|---|---|---|
| G1 | Announcements with a chosen audience | `/messages` | The live count under each option shows the blast radius before sending; the batch-wide option asks again |
| G2 | A mentor's teams as one group | Same screen, "All my teams" | One action reaches all of a mentoring line |

## Dashboards

| Ref | Feature | Where it is | How to check it |
|---|---|---|---|
| H1 | The batch grid | `/checkpoints` | 22 rows, 12 columns, frozen first column, arrow-key navigation |
| H2 | Drill down from a cell | Click or press Enter on a cell | Opens that checkpoint beside the grid |
| H3 | Filter by mentor, status and text | Grid header and legend | The legend doubles as the filter |
| H4 | A mentor's own board | `/` as a mentor | Waiting on you, and what is drifting. The full list of their teams lives once, under Projects |

## Notifications and platform

| Ref | Feature | Where it is | How to check it |
|---|---|---|---|
| I1 | Deadline reminders | `lib/store.tsx`, generated on load | A week out and the day before. Keyed by checkpoint and date, so running again changes nothing |
| I2 | The mentor is told when a team turns work in | On submit | Appears in the bell within a second, in any open tab |
| I3 | The team is told when a mentor reviews | On accept or return | Deep-links straight to the checkpoint |
| J1 | Search | `/projects`, and ⌘K anywhere | Grouped results: pages, projects, role switching |
| J2 | Nothing is lost on reload | `lib/db.ts` | Data in `localStorage`, shared across tabs, broadcast on write |
| J3 | Coordinator area | `/admin` | Allocation, calendar, roster, audit trail |
| J4 | Milestone template editor | `/admin` → Milestone calendar | Change the calendar without a new release |

## What the app does not do

Everything in section 7 of the feature plan is absent by design: no marks or grades, no effort tracking, no mentor comparison, no video calling, no document co-editing, no general whiteboard, no attempt to replace WhatsApp.

Two limits are worth stating plainly rather than discovering:

**Data lives in one browser.** This was chosen deliberately for a prototype under review. Two tabs in the same browser share data and update each other live, which is enough to exercise every workflow across two roles. Two people on two laptops do not share anything. Moving to a shared database is a change to `lib/db.ts` and nothing else — every read and write already goes through it.

**Notifications stay inside the app.** There is no email, because there is no server to send it from. The notification records are real and correctly addressed; only the delivery channel is missing.

## Checked end to end

A scripted run drives two tabs as two different people and verifies twenty-one things, including: a student turning in a checkpoint, the mentor's queue picking it up in the other tab, opening it moving the checkpoint into review on its own, returning it with a required reason, the reason and its category being stored, an action being raised for the team automatically, the student's tab updating without a reload, the student not being offered an Accept button, and every grid cell carrying a spoken label. All twenty-one pass.

## Where things moved

The interface was rebuilt in the direction chosen at review ("Studio wall"), and the
navigation was restructured at the same time. Four routes folded into three:

| Was | Now | Why |
|---|---|---|
| `/` with a different name per role | **Today** | The first item was called "My work", "My teams" or "Programme" depending on who you were, so nobody could be told where to click. Same four words for everyone; only the scope differs |
| `/directory`, `/review`, and the mentor home's "all my teams" | **Projects** | The same teams were listed three times. One register, with the question you are asking as a chip above it |
| `/grid` | **Checkpoints** | A student now gets their own twelve here rather than nothing |
| `/announcements` | **Messages** | — |
| `/actions` | folded into **Today** | A student's actions belong beside what is due, not on a page of their own |

Two other changes came out of the same review:

**Permissions are stated, not discovered.** A panel at the foot of the rail says what
this role may do and what it may not, in the words a person would use. It reads from
`lib/nav.ts`, the same file the navigation reads, so the two cannot drift.

**Pick a person by typing.** Sign-in was forty-five names scrolling; mentor allocation
was forty-four stacked dropdowns. Both are now one field you type three letters into
(`components/person-combobox.tsx`).
