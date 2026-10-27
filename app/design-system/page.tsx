"use client"

import * as React from "react"
import {
  DueBadge,
  MetricTile,
  PageHeader,
  SectionHeading,
} from "@/components/common"
import { StatusLegend } from "@/components/status/status-legend"
import {
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
} from "react-aria-components"
import { DialogTrigger } from "@/components/untitled/application/modals/modal"
import { ModalDialog } from "@/components/untitled/application/modals/modal-dialog"
import { SlideoutMenu } from "@/components/untitled/application/slideout-menus/slideout-menu"
import { Table, TableCard } from "@/components/untitled/application/table/table"
import { Avatar } from "@/components/untitled/base/avatar/avatar"
import { Dropdown } from "@/components/untitled/base/dropdown/dropdown"
import { Popover } from "@/components/untitled/base/select/popover"
import { Toggle } from "@/components/untitled/base/toggle/toggle"
import { StatusGlyph, StatusPill } from "@/components/status/status-pill"
import { Badge } from "@/components/untitled/base/badges/badges"
import { Button } from "@/components/untitled/base/buttons/button"
import { Checkbox } from "@/components/untitled/base/checkbox/checkbox"
import { Input } from "@/components/untitled/base/input/input"
import { Label } from "@/components/untitled/base/input/label"
import {
  RadioButton,
  RadioGroup,
} from "@/components/untitled/base/radio-buttons/radio-buttons"
import { Select } from "@/components/untitled/base/select/select"
import { TextArea } from "@/components/untitled/base/textarea/textarea"
import {
  Tooltip,
  TooltipTrigger,
} from "@/components/untitled/base/tooltip/tooltip"
import { addDays, todayIso } from "@/lib/dates"
import { say } from "@/lib/toast"
import { STATUS_ORDER, statusMeta } from "@/lib/status"

import {
  AlarmClock,
  Announcement01,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Clock,
  DotsHorizontal,
  Edit05,
  FilterLines,
  Flag03,
  Grid01,
  Inbox01,
  LinkExternal01,
  Paperclip,
  Plus,
  Scales01,
  SearchLg,
  Trash01,
  Send01,
  Shield01,
  UserCheck01,
  Users01,
} from "@untitledui/icons"

/** The design system, as a page in the product rather than a slide about it.
 *
 * Everything here is the real component, reading the real tokens. If a colour
 * or a rule changes, this page changes with it — which is the only way a style
 * guide stays true. */
export default function DesignSystemPage() {
  const today = todayIso()
  const [visibility, setVisibility] = React.useState("team_and_mentor")
  const [pinned, setPinned] = React.useState(false)
  const [flagged, setFlagged] = React.useState(true)
  const [agreed, setAgreed] = React.useState(false)
  const [decision, setDecision] = React.useState("accept")

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
      <PageHeader
        title="Design system"
        description="The rules this interface follows, and why each one is there."
        actions={
          <Button color="secondary" href="/">
            Back to the app
          </Button>
        }
      />

      {/* ------------------------------------------------------- colour */}
      <section className="mt-8">
        <SectionHeading hint="where the palette comes from">
          Colour
        </SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          Untitled UI&rsquo;s tokens, unchanged, with its default purple as the
          brand colour: one accent, one neutral ramp, and seven status colours
          that only ever appear on a status. Light and dark are the same names
          resolving to different values, so nothing on this page is written
          twice.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-th text-muted-foreground uppercase">Accent</p>
            <div className="mt-2.5 flex items-center gap-2">
              <Swatch className="bg-brand-solid" />
              <Swatch className="bg-brand-solid_hover" />
              <Swatch className="bg-brand-primary" />
            </div>
            <p className="mt-2.5 text-caption text-muted-foreground">
              Solid, hover, and the tint behind a selected navigation item. Used
              for one action per screen, never as decoration.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-th text-muted-foreground uppercase">Neutrals</p>
            <div className="mt-2.5 flex items-center gap-2">
              <Swatch className="bg-background" />
              <Swatch className="bg-muted" />
              <Swatch className="bg-accent" />
              <Swatch className="bg-border-strong" />
              <Swatch className="bg-foreground" />
            </div>
            <p className="mt-2.5 text-caption text-muted-foreground">
              Untitled UI&rsquo;s neutral ramp. Text steps down from 900 to 500,
              and borders sit at 200 for a divider and 300 for a control.
            </p>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-caption text-muted-foreground">
          Two things are on purpose. Green belongs to <em>accepted</em> and red
          to <em>overdue</em>, so neither is available as a brand colour. And a
          card is separated from the page by a single hairline rather than a
          shadow, which is how Untitled UI draws its own cards.
        </p>
      </section>

      <Divider />

      {/* ------------------------------------------- radius and elevation */}
      <section>
        <SectionHeading>Shape and depth</SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          Untitled UI&rsquo;s radius scale: a control is rounder than a tag, a
          card is rounder than a control.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          {[
            { cls: "rounded-md", label: "6px", use: "tag, small control" },
            {
              cls: "rounded-lg",
              label: "8px",
              use: "button, input, menu item",
            },
            {
              cls: "rounded-xl",
              label: "12px",
              use: "card, menu, dialog, sheet",
            },
            { cls: "rounded-2xl", label: "16px", use: "large panel" },
          ].map((r) => (
            <div key={r.label} className="text-center">
              <div
                className={`size-16 border border-border-strong bg-muted ${r.cls}`}
              />
              <p className="mt-1.5 text-caption font-medium text-foreground">
                {r.label}
              </p>
              <p className="text-caption text-muted-foreground">{r.use}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 max-w-2xl text-meta text-muted-foreground">
          Depth works the same way. A card sits on the page, so it gets a border
          and no shadow. A shadow means the thing is genuinely floating and will
          go away again: a menu, a popover, a dialog, a sheet. Buttons carry
          Untitled UI&rsquo;s skeuomorphic inner ring, which is what gives the
          primary button its lit edge.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-meta">
            Card · border, no shadow
          </div>
          <div className="rounded-xl bg-popover px-4 py-3 text-meta shadow-overlay">
            Menu · shadow-overlay
          </div>
          <div className="rounded-xl bg-popover px-4 py-3 text-meta shadow-modal">
            Dialog · shadow-modal
          </div>
        </div>
      </section>

      <Divider />

      {/* -------------------------------------------------------- motion */}
      <section>
        <SectionHeading hint="short, and only where it orients someone">
          Motion
        </SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          Three easing curves, taken from Carbon&rsquo;s productive set, and six
          durations. Something arriving uses the entrance curve, something
          leaving uses the exit curve, and anything that stays on screen from
          start to finish uses the standard curve. A side panel is the stated
          exception: it leaves but stays nearby, ready to come back, so it exits
          on the standard curve too.
        </p>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-th text-muted-foreground uppercase">
                  Moment
                </th>
                <th className="px-3 py-2 text-th text-muted-foreground uppercase">
                  In
                </th>
                <th className="px-3 py-2 text-th text-muted-foreground uppercase">
                  Out
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Row or cell under the pointer", "50ms", "50ms"],
                ["Button hover, toggle, focus", "70ms", "70ms"],
                ["Menu, select, popover, status pill", "150ms", "100ms"],
                ["Dialog, sheet, toast", "240ms", "200ms"],
                ["Anything inside the grid", "none", "none"],
              ].map(([moment, into, out]) => (
                <tr key={moment}>
                  <td className="px-3 py-2.5 text-meta text-foreground">
                    {moment}
                  </td>
                  <td className="px-3 py-2.5 text-meta text-muted-foreground tabular-nums">
                    {into}
                  </td>
                  <td className="px-3 py-2.5 text-meta text-muted-foreground tabular-nums">
                    {out}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-2xl text-caption text-muted-foreground">
          A dialog scales from 98 per cent rather than the usual 95, because a
          five per cent jump on a projector reads as a lurch. With reduced
          motion switched on, colour and opacity still cross-fade in 70ms and
          everything that moves or scales stops moving — reducing motion, not
          removing every cue that something happened.
        </p>
      </section>

      <Divider />

      {/* ------------------------------------------------------- status */}
      <section>
        <SectionHeading hint="the one thing this product has to get right">
          Milestone status
        </SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          Seven states, each carrying three independent signals: a distinct
          glyph, a word, and a colour. They are listed in that order on purpose.
          Under deuteranopia the pale accepted and overdue fills are almost the
          same colour, so colour is the least reliable of the three and never
          appears on its own.
        </p>

        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-th text-muted-foreground uppercase">
                  Glyph
                </th>
                <th className="px-3 py-2 text-th text-muted-foreground uppercase">
                  Pill
                </th>
                <th className="px-3 py-2 text-th text-muted-foreground uppercase">
                  Means
                </th>
                <th className="px-3 py-2 text-th text-muted-foreground uppercase">
                  Who moves it
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {STATUS_ORDER.map((status) => {
                const meta = statusMeta(status)
                const mentorOnly = [
                  "under_review",
                  "returned",
                  "accepted",
                ].includes(status)
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
                      {calendar
                        ? "The calendar"
                        : mentorOnly
                          ? "Mentor only"
                          : "The team"}
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
              <span className="font-medium text-foreground">
                Returned is amber, not red.
              </span>{" "}
              Returning work is a normal stop in the pipeline, not a failure.
              Red is kept for a checkpoint that has actually gone past its date
              with nothing handed in.
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

      <Divider />

      {/* --------------------------------------------------------- type */}
      <section>
        <SectionHeading>Type</SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          Named by role rather than by size, so a table header cannot drift into
          a heading. Set in Inter, as Untitled UI specifies. Where figures need
          to line up, a column of dates for instance, use the{" "}
          <code className="text-foreground">tabular-nums</code> class.
        </p>
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <p className="text-page">Page · 24/32 · the name of the screen</p>
          <p className="text-stat">1,284 · the same size, for a figure</p>
          <p className="text-title">Title · 20/30 · a panel or a dialog</p>
          <p className="text-section">
            Section · 16/22 · a block within a screen
          </p>
          <p className="text-subhead">
            Subhead · 14/20 semibold · a card or a row title
          </p>
          <p className="text-body">
            Body · 14/20 · ordinary prose and table cells
          </p>
          <p className="text-meta text-muted-foreground">
            Meta · 14/20 · the second line of a row, most secondary text
          </p>
          <p className="text-th text-muted-foreground uppercase">
            Table header · 12/18 · +0.02em, the only place small caps are used
          </p>
          <p className="text-caption text-muted-foreground">
            Caption · 12/18 · timestamps, hints
          </p>
        </div>
        <p className="mt-3 max-w-2xl text-caption text-muted-foreground">
          The steps are Untitled UI&rsquo;s own, kept short: nothing above
          thirty pixels, because larger type is for an expressive product and a
          supervision meeting is not one.
        </p>
      </section>

      <Divider />

      {/* -------------------------------------------------------- icons */}
      <section>
        <SectionHeading>Icons</SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          One meaning per icon, fixed. 16px inline with text, 20px standalone.
          An icon on its own always carries an accessible name; a tooltip is not
          one.
        </p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {[
            { icon: Flag03, label: "Checkpoint" },
            { icon: Send01, label: "Turn in" },
            { icon: Scales01, label: "Review" },
            { icon: CheckCircle, label: "Accept" },
            { icon: AlarmClock, label: "Overdue" },
            { icon: Clock, label: "Meeting" },
            { icon: Edit05, label: "Minutes" },
            { icon: ClipboardCheck, label: "Action" },
            { icon: Announcement01, label: "Announcement" },
            { icon: UserCheck01, label: "Mentor" },
            { icon: Users01, label: "Team" },
            { icon: Shield01, label: "Coordinator" },
            { icon: Grid01, label: "Grid" },
            { icon: Inbox01, label: "Queue" },
            { icon: FilterLines, label: "Filter" },
            { icon: Paperclip, label: "Attached work" },
          ].map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5"
            >
              <Icon className="size-4 text-foreground" />
              <span className="text-meta">{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <Divider />

      {/* --------------------------------------------------------- dates */}
      <section>
        <SectionHeading>Dates</SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          The absolute date leads, because a deadline is something people refer
          back to. The relative part only appears inside a week, where it is the
          half that actually changes what somebody does today. The full date is
          always in the tooltip.
        </p>
        <div className="space-y-2 rounded-xl border border-border bg-card p-5">
          <DueBadge dueDate={addDays(today, -2)} hideIcon />
          <DueBadge dueDate={today} hideIcon />
          <DueBadge dueDate={addDays(today, 1)} hideIcon />
          <DueBadge dueDate={addDays(today, 3)} hideIcon />
          <DueBadge dueDate={addDays(today, 26)} hideIcon />
        </div>
      </section>

      <Divider />

      {/* ------------------------------------------------------ surfaces */}
      <section>
        <SectionHeading>Surfaces and controls</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile
            label="A measure"
            value="68%"
            hint="With its target beside it"
            tone="good"
          />
          <MetricTile
            label="Off target"
            value="31h"
            hint="Target under 72 hours"
            tone="warn"
          />
          <MetricTile
            label="No data yet"
            value="—"
            hint="Said plainly, not shown as zero"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button color="secondary">Outline</Button>
          <Button color="secondary">Secondary</Button>
          <Button color="tertiary">Ghost</Button>
          <Button color="primary-destructive">Destructive</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge size="sm" color="brand">
            Default
          </Badge>
          <Badge size="sm" color="gray">
            Secondary
          </Badge>
          <Badge size="sm" type="modern" color="gray">
            Outline
          </Badge>
          <Badge size="sm" color="error">
            Destructive
          </Badge>
        </div>
      </section>

      <Divider />

      {/* ---------------------------------------------------- components */}
      <section>
        <SectionHeading hint="the real import, reading the real tokens">
          Components
        </SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          Untitled UI&rsquo;s own components, live below rather than pictured:
          the same Modal that confirms a decision, the same Table that lists a
          team&rsquo;s notes, the same Slideout that opens a checkpoint. They
          are React Aria underneath, so keyboard and screen-reader behaviour
          comes with them.
        </p>

        <div className="space-y-6">
          <ComponentGroup label="Toggle">
            <div className="flex flex-wrap gap-6">
              <Toggle
                isSelected={pinned}
                onChange={setPinned}
                label="Pinned"
                size="md"
              />
              <Toggle
                isSelected={flagged}
                onChange={setFlagged}
                label="Needs follow-up"
                size="md"
              />
            </div>
          </ComponentGroup>

          <ComponentGroup label="Form fields — Input, TextArea, Checkbox, RadioGroup, Select">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Project name" placeholder="Attendance tracker" />
              <Select
                selectedKey={visibility}
                onSelectionChange={(value) =>
                  setVisibility(String(value ?? "team_and_mentor"))
                }
                size="md"
                className="w-full"
                label="Who can see this"
              >
                <Select.Item id="team_and_mentor" label="Team and mentor" />
                <Select.Item id="mentor_group" label="Mentor group" />
                <Select.Item id="batch" label="Whole batch" />
              </Select>
              <div className="sm:col-span-2">
                <TextArea
                  label="Notes"
                  placeholder="What the mentor should know before reviewing this."
                />
              </div>
              <RadioGroup
                value={decision}
                onChange={setDecision}
                className="gap-3"
              >
                <Label>Decision</Label>
                <RadioButton value="accept" label="Accept" />
                <RadioButton value="return" label="Return for revisions" />
              </RadioGroup>
              <div className="space-y-3">
                <Input
                  label="Search, with an icon"
                  icon={SearchLg}
                  placeholder="Filter people…"
                />
                <Checkbox
                  isSelected={agreed}
                  onChange={() => setAgreed((v) => !v)}
                  label="Notify the team once submitted"
                />
              </div>
            </div>
          </ComponentGroup>

          <ComponentGroup label="Overlays — Modal, Slideout, Popover, Dropdown">
            <div className="flex flex-wrap gap-2">
              <DialogTrigger>
                <Button color="secondary">Accept checkpoint</Button>
                <ModalDialog
                  size="md"
                  title="Accept this checkpoint?"
                  description="The team is notified immediately. This is the deliberate-stop pattern: a modal for a decision, never for a form."
                  footer={
                    <>
                      <Button color="secondary" slot="close">
                        Cancel
                      </Button>
                      <Button slot="close">Accept</Button>
                    </>
                  }
                />
              </DialogTrigger>

              <SlideoutMenu.Trigger>
                <Button color="secondary">Open a milestone</Button>
                <SlideoutMenu isDismissable>
                  <SlideoutMenu.Header className="border-b border-secondary pb-4">
                    <h2 className="text-lg font-semibold text-primary">
                      Week 4 checkpoint
                    </h2>
                    <p className="mt-1 text-sm text-tertiary">
                      A slide-over, not a modal — the grid behind it is the
                      context for whatever gets decided in here.
                    </p>
                  </SlideoutMenu.Header>
                  <SlideoutMenu.Content className="pb-6">
                    <p className="text-sm text-tertiary">
                      Same component as the real milestone panel.
                    </p>
                  </SlideoutMenu.Content>
                </SlideoutMenu>
              </SlideoutMenu.Trigger>

              <AriaDialogTrigger>
                <Button color="secondary">Due date</Button>
                <Popover size="md" placement="bottom start" className="w-64">
                  <AriaDialog className="p-3 outline-hidden">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Calendar className="size-4" />
                      Tuesday, week 7
                    </div>
                    <p className="mt-1 text-sm text-tertiary">
                      The full date always lives in a tooltip or a popover,
                      never only in a relative label.
                    </p>
                  </AriaDialog>
                </Popover>
              </AriaDialogTrigger>

              <Dropdown.Root>
                <Button color="secondary" iconTrailing={DotsHorizontal}>
                  Row actions
                </Button>
                <Dropdown.Popover className="w-56">
                  <Dropdown.Menu>
                    <Dropdown.Section>
                      <Dropdown.Item icon={LinkExternal01}>
                        Open in a new tab
                      </Dropdown.Item>
                      <Dropdown.Item icon={Plus}>Add a note</Dropdown.Item>
                    </Dropdown.Section>
                    <Dropdown.Separator />
                    <Dropdown.Item icon={Trash01}>
                      Withdraw submission
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown.Root>
            </div>
          </ComponentGroup>

          <ComponentGroup label="Combobox — the search list person-combobox is built from">
            <Select.ComboBox
              label="Person"
              placeholder="Search people…"
              size="md"
              className="max-w-sm"
              items={[
                { id: "aarav", label: "Aarav Mehta" },
                { id: "priya", label: "Priya Rao" },
                { id: "rohan", label: "Rohan Shah" },
              ]}
            >
              {(item) => <Select.Item {...item} />}
            </Select.ComboBox>
          </ComponentGroup>

          <ComponentGroup label="Tooltip and keyboard hint">
            <div className="flex flex-wrap items-center gap-4">
              <Tooltip title="The full explanation goes here, not in the label.">
                <TooltipTrigger className="rounded-lg px-3 py-2 text-sm font-semibold text-secondary shadow-xs-skeuomorphic ring-1 ring-primary ring-inset hover:bg-primary_hover">
                  Hover me
                </TooltipTrigger>
              </Tooltip>
              <span className="flex gap-1">
                {["⌘", "K"].map((key) => (
                  <kbd
                    key={key}
                    className="rounded-md bg-primary px-1.5 py-px text-xs font-medium text-quaternary ring-1 ring-secondary ring-inset"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
              <span className="text-sm text-tertiary">
                opens the command palette
              </span>
            </div>
          </ComponentGroup>

          <ComponentGroup label="Table">
            <TableCard.Root size="sm">
              <Table aria-label="Example batch table">
                <Table.Header>
                  <Table.Head id="team" isRowHeader label="Team" />
                  <Table.Head id="checkpoint" label="Checkpoint" />
                  <Table.Head id="status" label="Status" />
                </Table.Header>
                <Table.Body
                  items={[
                    {
                      id: "nimbus",
                      team: "Team Nimbus",
                      status: "accepted" as const,
                    },
                    {
                      id: "vertex",
                      team: "Team Vertex",
                      status: "submitted" as const,
                    },
                    {
                      id: "orbit",
                      team: "Team Orbit",
                      status: "overdue" as const,
                    },
                  ]}
                >
                  {(row) => (
                    <Table.Row id={row.id}>
                      <Table.Cell className="font-medium text-primary">
                        {row.team}
                      </Table.Cell>
                      <Table.Cell>Week 4</Table.Cell>
                      <Table.Cell>
                        <StatusPill status={row.status} />
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
            </TableCard.Root>
          </ComponentGroup>

          <ComponentGroup label="Avatar, a loading placeholder, and a Toast">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar size="md" initials="PR" />
                <div className="space-y-1.5">
                  <div className="h-3 w-28 animate-pulse rounded-md bg-quaternary" />
                  <div className="h-3 w-16 animate-pulse rounded-md bg-quaternary" />
                </div>
              </div>
              <Button
                color="secondary"
                size="xs"
                onPress={() =>
                  say(
                    "Saved",
                    "This is what an off-screen confirmation looks like."
                  )
                }
              >
                Fire a toast
              </Button>
            </div>
          </ComponentGroup>
        </div>
      </section>

      <Divider />

      {/* ----------------------------------------------------- the rules */}
      <section>
        <SectionHeading>The rules, in short</SectionHeading>
        <ol className="space-y-2.5 text-meta text-muted-foreground">
          <Rule n={1}>
            Status is a glyph, a word and a colour, in that order. If space
            forces the word out, the glyph keeps a screen-reader label.
          </Rule>
          <Rule n={2}>
            Colour never carries meaning alone. The grid is readable in
            greyscale, and every cell has an accessible name that says the team,
            the checkpoint, the state and the date.
          </Rule>
          <Rule n={3}>
            The grid is an ARIA grid, not a table. Arrow keys move a cell at a
            time, Home and End jump along a row, and Enter opens a checkpoint.
            As a table it would be 264 tab stops.
          </Rule>
          <Rule n={4}>
            No zebra striping. Tracking a row across twelve columns is solved by
            lighting up the row and the column under the pointer, which is more
            precise than stripes.
          </Rule>
          <Rule n={5}>
            A slide-over when the background is the context, a modal when the
            decision deserves a stop, a page when someone will send a link to
            it.
          </Rule>
          <Rule n={6}>
            Confirmation goes where the user is looking. If the thing they
            changed is on screen and it changes, that is the confirmation; a
            toast on top of it is noise. Toasts are for refusals and for things
            that happened off-screen.
          </Rule>
          <Rule n={7}>
            Nothing animates in a data view. Rows appearing or leaving, a
            re-sort, a filter re-flowing and a figure changing all happen
            instantly. Carbon actually endorses animating a sort, so this is a
            deliberate departure: this grid is read by a room looking at one
            projected screen, and movement there makes people lose their place.
            Overlays — things that arrive and leave — do animate.
          </Rule>
          <Rule n={8}>
            Empty states say what will appear here, and only offer an action if
            it belongs to the person reading. A mentor with no teams is not told
            to create one.
          </Rule>
        </ol>
      </section>

      <Divider />

      <section>
        <SectionHeading>What this is built on</SectionHeading>
        <p className="max-w-2xl text-meta text-muted-foreground">
          Tailwind v4 with Untitled UI&rsquo;s tokens defined once in{" "}
          <code className="text-foreground">styles/theme.css</code>, the
          app&rsquo;s own names mapped onto them in{" "}
          <code className="text-foreground">globals.css</code>, Untitled
          UI&rsquo;s own React Aria components in{" "}
          <code className="text-foreground">components/untitled</code>, and its
          icon set. Where Untitled UI has no component (toasts are PRO-only; it
          has no separator or skeleton) the app builds one from its tokens.
          Every ratio claimed on this page is recomputed from the token files by{" "}
          <code className="text-foreground">npm run contrast</code>, which fails
          the build rather than letting a colour drift. One deviation is
          recorded there: Untitled UI&rsquo;s input border is lighter than the
          3:1 that WCAG asks of a control boundary.
        </p>
      </section>
    </div>
  )
}

/** Untitled UI has no separator component; a hairline in its border token. */
function Divider() {
  return <hr className="my-8 h-px border-none bg-border-secondary" />
}

function ComponentGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-th text-muted-foreground uppercase">{label}</p>
      {children}
    </div>
  )
}

function Swatch({ className }: { className: string }) {
  return (
    <span
      className={`size-8 rounded-md border border-border-strong/60 ${className}`}
    />
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
