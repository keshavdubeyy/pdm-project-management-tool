# PDM ProjectGarage

Milestones, reviews, meetings and announcements for the year-long final project on the
M.Tech in Product Design and Management at IIIT Hyderabad.

Twenty-two teams, four mentoring lines and one coordinator, running twelve dated
checkpoints across twenty-eight weeks.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000/signin. Choose Student, Mentor or Coordinator, then
sign in with the email and password the coordinator issued.

**Issuing passwords.** Accounts live in Supabase Auth. To create them, run
`SUPABASE_SERVICE_ROLE_KEY=<key> node --env-file=.env.local scripts/create-accounts.mjs`.
It writes `scripts/credentials.csv` (email and a generated password for each
person) and skips anyone who already has an account; add `--reset` to give
existing accounts a new password. The service-role key is in the Supabase
dashboard under Project Settings → API. It is never put in the app. Everyone can
change their own password on the Profile page.

**Sessions are per browser tab.** Open a second tab, sign in as somebody else, and put
the two side by side — a student's note shows up for their mentor in the other tab
within a second, and the mentor's comment comes back the same way.

Accounts worth signing in as:

| Email | Tab | What you see |
|---|---|---|
| `raman.saxena@iiit.ac.in` | Coordinator, or Mentor | The whole batch; or just his own teams |
| `prakash.yalla@iiit.ac.in` | Mentor | A picker of his teams, a review queue |
| `rahul.saha@students.iiit.ac.in` (Rahul Saha) | Student | Notes, to-dos and progress for their team |

The app starts empty. **Populate demo data** in the header fills it with generated
activity for stress-testing; **Clear demo data** removes it again.

## Design system

Untitled UI, with its default purple brand. Every screen is built from its components,
which live in `components/untitled` (React Aria underneath) and are used as installed:
`npx untitledui@latest add <component> -y -t base|application` adds more. Its tokens
are in `styles/theme.css` unchanged; `app/globals.css` maps the older names the app
used (`background`, `primary`, `border` …) onto them and loads the React Aria
variants plugin the components need. Dark mode is the `.dark-mode` class, set by
next-themes. Icons are `@untitledui/icons`.

Where Untitled UI has nothing free to use, the app builds the piece from its tokens:
toasts (its notifications component is PRO-only; ours is Sonner plus Untitled's
FeaturedIcon and CloseButton), separators, and skeletons.

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
