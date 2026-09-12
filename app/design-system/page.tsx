"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlarmClockIcon,
  Attachment01Icon,
  CalendarClockIcon,
  CheckListIcon,
  CheckmarkCircle02Icon,
  DeliverySent02Icon,
  FilterIcon,
  Grid02Icon,
  InboxIcon,
  LegalHammerIcon,
  Megaphone01Icon,
  MilestoneIcon,
  NoteEditIcon,
  Shield01Icon,
  UserCheck01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { DueBadge, MetricTile, PageHeader, SectionHeading } from "@/components/common"
import { StatusLegend } from "@/components/status/status-legend"
import { StatusGlyph, StatusPill } from "@/components/status/status-pill"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { addDays, todayIso } from "@/lib/dates"
import { STATUS_ORDER, statusMeta } from "@/lib/status"

/** The design system, as a page in the product rather than a slide about it.
 *
 * Everything here is the real component, reading the real tokens. If a colour
 * or a rule changes, this page changes with it — which is the only way a style
 * guide stays true. */
export default function DesignSystemPage() {
  const today = todayIso()

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
      <PageHeader
        title="Design system"
        description="The rules this interface follows, and why each one is there."
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            Back to the app
          </Button>
        }
      />

      {/* ------------------------------------------------------- status */}
      <section className="mt-8">
        <SectionHeading hint="the one thing this product has to get right">
          Milestone status
        </SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          Seven states, each carrying three independent signals: a distinct glyph, a word, and a
          colour. They are listed in that order on purpose. Under deuteranopia the pale accepted and
          overdue fills are almost the same colour, so colour is the least reliable of the three and
          never appears on its own.
        </p>

        <div className="overflow-hidden rounded-sm border border-border">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-th text-muted-foreground uppercase">Glyph</th>
                <th className="px-3 py-2 text-th text-muted-foreground uppercase">Pill</th>
                <th className="px-3 py-2 text-th text-muted-foreground uppercase">Means</th>
                <th className="px-3 py-2 text-th text-muted-foreground uppercase">Who moves it</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {STATUS_ORDER.map((status) => {
                const meta = statusMeta(status)
                const mentorOnly = ["under_review", "returned", "accepted"].includes(status)
                const calendar = status === "overdue"
                return (
                  <tr key={status}>
                    <td className="px-3 py-2.5">
                      <StatusGlyph status={status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={status} />
                    </td>
                    <td className="px-3 py-2.5 text-meta text-muted-foreground">
                      {meta.description}
                    </td>
                    <td className="px-3 py-2.5 text-meta text-muted-foreground">
                      {calendar ? "The calendar" : mentorOnly ? "Mentor only" : "The team"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-subhead">Two decisions worth defending</p>
          <ul className="space-y-1.5 text-meta text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Returned is amber, not red.</span>{" "}
              Returning work is a normal stop in the pipeline, not a failure. Red is kept for a
              checkpoint that has actually gone past its date with nothing handed in.
            </li>
            <li>
              <span className="font-medium text-foreground">
                The wording is the wording students already know.
              </span>{" "}
              “Turned in” and “Returned for revisions”, never “Rejected”.
            </li>
          </ul>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-subhead">In the grid, as a filter</p>
          <StatusLegend />
        </div>
      </section>

      <Separator className="my-8" />

      {/* --------------------------------------------------------- type */}
      <section>
        <SectionHeading>Type</SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          Named by role rather than by size, so a table header cannot drift into a heading. Figures
          are tabular everywhere: a column of dates that wobbles row to row is unreadable at
          twenty-two rows.
        </p>
        <div className="space-y-3 rounded-sm border border-border bg-card p-5">
          <p className="text-display">Display · 28/34 · a page that is mostly one number</p>
          <p className="text-title">Title · 20/28 · the name of the screen</p>
          <p className="text-section">Section · 16/24 · a block within a screen</p>
          <p className="text-subhead">Subhead · 14/20 semibold · a card or a row title</p>
          <p className="text-body">Body · 14/21 · ordinary prose and table cells</p>
          <p className="text-meta text-muted-foreground">
            Meta · 13/18 · the second line of a row, most secondary text
          </p>
          <p className="text-th text-muted-foreground uppercase">
            Table header · 12/16 · +0.02em, never all-caps beyond this
          </p>
          <p className="text-caption text-muted-foreground">Caption · 12/16 · timestamps, hints</p>
          <p className="text-kpi">1,284</p>
        </div>
      </section>

      <Separator className="my-8" />

      {/* -------------------------------------------------------- icons */}
      <section>
        <SectionHeading>Icons</SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          One meaning per icon, fixed. 16px inline with text, 20px standalone. An icon on its own
          always carries an accessible name; a tooltip is not one.
        </p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {[
            { icon: MilestoneIcon, label: "Checkpoint" },
            { icon: DeliverySent02Icon, label: "Turn in" },
            { icon: LegalHammerIcon, label: "Review" },
            { icon: CheckmarkCircle02Icon, label: "Accept" },
            { icon: AlarmClockIcon, label: "Overdue" },
            { icon: CalendarClockIcon, label: "Meeting" },
            { icon: NoteEditIcon, label: "Minutes" },
            { icon: CheckListIcon, label: "Action" },
            { icon: Megaphone01Icon, label: "Announcement" },
            { icon: UserCheck01Icon, label: "Mentor" },
            { icon: UserGroupIcon, label: "Team" },
            { icon: Shield01Icon, label: "Coordinator" },
            { icon: Grid02Icon, label: "Grid" },
            { icon: InboxIcon, label: "Queue" },
            { icon: FilterIcon, label: "Filter" },
            { icon: Attachment01Icon, label: "Attached work" },
          ].map(({ icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2.5 rounded-sm border border-border bg-card px-3 py-2.5"
            >
              <HugeiconsIcon icon={icon} className="size-4 text-foreground" strokeWidth={2} />
              <span className="text-meta">{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <Separator className="my-8" />

      {/* --------------------------------------------------------- dates */}
      <section>
        <SectionHeading>Dates</SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          The absolute date leads, because a deadline is something people refer back to. The
          relative part only appears inside a week, where it is the half that actually changes what
          somebody does today. The full date is always in the tooltip.
        </p>
        <div className="space-y-2 rounded-sm border border-border bg-card p-5">
          <DueBadge dueDate={addDays(today, -2)} hideIcon />
          <DueBadge dueDate={today} hideIcon />
          <DueBadge dueDate={addDays(today, 1)} hideIcon />
          <DueBadge dueDate={addDays(today, 3)} hideIcon />
          <DueBadge dueDate={addDays(today, 26)} hideIcon />
        </div>
      </section>

      <Separator className="my-8" />

      {/* ------------------------------------------------------ surfaces */}
      <section>
        <SectionHeading>Surfaces and controls</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile label="A measure" value="68%" hint="With its target beside it" tone="good" />
          <MetricTile label="Off target" value="31h" hint="Target under 72 hours" tone="warn" />
          <MetricTile label="No data yet" value="—" hint="Said plainly, not shown as zero" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

      <Separator className="my-8" />

      {/* ----------------------------------------------------- the rules */}
      <section>
        <SectionHeading>The rules, in short</SectionHeading>
        <ol className="space-y-2.5 text-meta text-muted-foreground">
          <Rule n={1}>
            Status is a glyph, a word and a colour, in that order. If space forces the word out, the
            glyph keeps a screen-reader label.
          </Rule>
          <Rule n={2}>
            Colour never carries meaning alone. The grid is readable in greyscale, and every cell
            has an accessible name that says the team, the checkpoint, the state and the date.
          </Rule>
          <Rule n={3}>
            The grid is an ARIA grid, not a table. Arrow keys move a cell at a time, Home and End
            jump along a row, and Enter opens a checkpoint. As a table it would be 264 tab stops.
          </Rule>
          <Rule n={4}>
            No zebra striping. Tracking a row across twelve columns is solved by lighting up the row
            and the column under the pointer, which is more precise than stripes.
          </Rule>
          <Rule n={5}>
            A slide-over when the background is the context, a modal when the decision deserves a
            stop, a page when someone will send a link to it.
          </Rule>
          <Rule n={6}>
            Confirmation goes where the user is looking. If the thing they changed is on screen and
            it changes, that is the confirmation; a toast on top of it is noise. Toasts are for
            refusals and for things that happened off-screen.
          </Rule>
          <Rule n={7}>
            Nothing animates in a data view. Rows appearing, status changing and sorting all happen
            instantly, because motion in a grid makes a reader lose their place.
          </Rule>
          <Rule n={8}>
            Empty states say what will appear here, and only offer an action if it belongs to the
            person reading. A mentor with no teams is not told to create one.
          </Rule>
        </ol>
      </section>

      <Separator className="my-8" />

      <section>
        <SectionHeading>What this is built on</SectionHeading>
        <p className="max-w-2xl text-meta text-muted-foreground">
          Tailwind v4 with the tokens defined once in <code className="text-foreground">globals.css</code>,
          shadcn components over Base UI primitives, Hugeicons, and a status palette derived from
          the Radix scales — step 3 fills a surface, step 7 draws its border, step 12 writes on it.
          Step 11 is deliberately not used for text on a filled pill: it measures around 4.2:1,
          under the 4.5:1 that small text needs.
        </p>
      </section>
    </div>
  )
}

function Rule({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-caption font-semibold text-foreground">
        {n}
      </span>
      <span>{children}</span>
    </li>
  )
}
