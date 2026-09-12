# PDM Project Space

Milestones, reviews, meetings and announcements for the year-long final project on the
M.Tech in Product Design and Management at IIIT Hyderabad.

Twenty-two teams, four mentoring lines and one coordinator, running twelve dated
checkpoints across twenty-eight weeks.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000 and pick who you are — type three letters into the
field rather than scrolling a list. There are no passwords: the
sign-in list is the real roster, and the point is to be able to move between people
quickly while testing.

**Sessions are per browser tab.** Open a second tab, sign in as somebody else, and put
the two side by side — a student turning work in shows up in their mentor's queue in the
other tab within a second, and the mentor's decision comes back the same way.

Three people worth signing in as:

| Person | Role | What you see |
|---|---|---|
| Dr. Raman Saxena | Coordinator and mentor | The whole batch, and a switch between the two roles |
| Prakash Yalla | Mentor | Six teams, a review queue, what needs a look |
| Rahul Saha | Student | One project, what is due next, what the mentor last said |

`Reset demo data` in the account menu puts everything back.

## Checking it still works

```bash
npm run dev     # in one terminal
npm run smoke   # in another
```

`npm run smoke` drives a real browser through every screen as all three roles and
opens every overlay — the command palette, the account menu, notifications, every tab,
every dropdown, every dialog and the checkpoint slide-over — failing on any runtime
error. It exists because two crashes shipped that a page-level check could not catch:
both lived inside overlays that only exist after a click. Rendering a route is not
evidence that the route works.

## Where things are

| Path | What it holds |
|---|---|
| `lib/types.ts` | The domain model |
| `lib/permissions.ts` | Who may do what — enforced in the store, not in the UI |
| `lib/store.tsx` | Every mutation, with the permission check and the audit entry |
| `lib/selectors.ts` | Derived reads. Nothing here writes |
| `lib/status.ts` | The seven checkpoint states and how each is shown |
| `lib/milestone-template.ts` | The 2026 milestone sheet, as data |
| `lib/db.ts` | Persistence and the cross-tab broadcast |
| `lib/links.ts` | Recognising where a pasted link lives |
| `app/globals.css` | The design tokens |
| `lib/nav.ts` | Navigation and what each role may do — one source for the rail and the palette |

## Documentation

| Document | What it covers |
|---|---|
| [Workflow map](./docs/01-workflow-map.md) | The process, the friction, the scope |
| [Feature plan](./docs/02-feature-catalogue-moscow.md) | 162 features, prioritised |
| [Must-have coverage](./docs/03-must-have-coverage.md) | Where each must-have lives in the app |
| `/design-system` | The interface rules, as a page in the app |

Two Word documents for faculty review sit in `docs/` alongside them.

## Two limits worth knowing

Data lives in one browser. Two tabs share it and update each other live; two laptops do
not share anything. Moving to a shared database is a change to `lib/db.ts` and nothing
else, because every read and write already goes through it.

Notifications stay inside the app. The records are real and correctly addressed; there is
no server to send email from.
