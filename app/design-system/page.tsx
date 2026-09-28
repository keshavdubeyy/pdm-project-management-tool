"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlarmClockIcon,
  Attachment01Icon,
  Calendar01Icon,
  CalendarClockIcon,
  CheckListIcon,
  CheckmarkCircle02Icon,
  DeliverySent02Icon,
  ExternalLinkIcon,
  FilterIcon,
  Grid02Icon,
  InboxIcon,
  LegalHammerIcon,
  Megaphone01Icon,
  MilestoneIcon,
  MoreHorizontalCircle01Icon,
  NoteEditIcon,
  PlusSignIcon,
  Search01Icon,
  Shield01Icon,
  UserCheck01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { DueBadge, MetricTile, PageHeader, SectionHeading } from "@/components/common"
import { StatusLegend } from "@/components/status/status-legend"
import { StatusGlyph, StatusPill } from "@/components/status/status-pill"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { addDays, todayIso } from "@/lib/dates"
import { say } from "@/lib/toast"
import { STATUS_ORDER, statusMeta } from "@/lib/status"

const UNUSED_PRIMITIVES = [
  { name: "Accordion", note: "collapsible sections" },
  { name: "Alert", note: "inline banner" },
  { name: "AlertDialog", note: "confirm-then-destroy" },
  { name: "AspectRatio", note: "ratio-locked media box" },
  { name: "Attachment", note: "file/media chip" },
  { name: "Breadcrumb", note: "path trail" },
  { name: "Bubble", note: "chat bubble" },
  { name: "ButtonGroup", note: "segmented buttons" },
  { name: "Card", note: "the app builds cards from raw divs instead" },
  { name: "Carousel", note: "slide viewer" },
  { name: "Chart", note: "recharts wrapper" },
  { name: "Collapsible", note: "single show/hide region" },
  { name: "Combobox", note: "raw primitive — the app composes Command + Popover instead" },
  { name: "ContextMenu", note: "right-click menu" },
  { name: "DataTable", note: "TanStack Table wrapper" },
  { name: "DatePicker", note: "calendar popover" },
  { name: "Drawer", note: "bottom sheet" },
  { name: "Empty", note: "empty state — the app uses its own EmptyState instead" },
  { name: "Field", note: "form field layout" },
  { name: "InputOTP", note: "one-time-code boxes" },
  { name: "Item", note: "generic list-row layout" },
  { name: "Marker", note: "map/canvas pin" },
  { name: "Menubar", note: "app-menu bar" },
  { name: "Message", note: "chat message block" },
  { name: "MessageScroller", note: "auto-scrolling chat log" },
  { name: "NativeSelect", note: "plain <select> wrapper" },
  { name: "NavigationMenu", note: "mega-menu nav" },
  { name: "Pagination", note: "page-number controls" },
  { name: "Progress", note: "determinate bar" },
  { name: "Questionnaire", note: "step-by-step form flow" },
  { name: "Resizable", note: "draggable split panes" },
  { name: "ScrollArea", note: "styled scroll container" },
  { name: "Slider", note: "range input" },
  { name: "Spinner", note: "loading glyph" },
  { name: "Switch", note: "on/off toggle" },
  { name: "ToggleGroup", note: "grouped toggles" },
  { name: "Typography", note: "prose helpers" },
]

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
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            Back to the app
          </Button>
        }
      />

      {/* ------------------------------------------------------- colour */}
      <section className="mt-8">
        <SectionHeading hint="where the palette comes from">Colour</SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          One accent, one warm neutral ramp, and seven status colours that only ever appear on a
          status. The accent is the indigo this project started with, pulled back: sixteen per cent
          less chroma and seven per cent darker, which takes it from 6.8:1 on white to 7.6:1. Side
          by side it is recognisably the same blue, with the brightness taken out of it.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-th text-muted-foreground uppercase">Accent</p>
            <div className="mt-2.5 flex items-center gap-2">
              <Swatch className="bg-primary" />
              <Swatch className="bg-primary-hover" />
              <Swatch className="bg-primary-subtle" />
            </div>
            <p className="mt-2.5 text-caption text-muted-foreground">
              Solid, hover, and the tint behind a selected navigation item. Used for one action per
              screen, never as decoration.
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
              Warm rather than grey — the same hue family Oxford and Yale pair with a cool
              institutional blue. It is where the paper feeling comes from.
            </p>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-caption text-muted-foreground">
          Two things are on purpose. Green belongs to <em>accepted</em> and red to{" "}
          <em>overdue</em>, so neither is available as a brand colour. And the ground is off-white
          while a card is pure white, which is what lets a card be separated by a single hairline
          instead of a shadow.
        </p>
      </section>

      <Separator className="my-8" />

      {/* ------------------------------------------- radius and elevation */}
      <section>
        <SectionHeading>Shape and depth</SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          One radius for everything flattens the hierarchy radius exists to express, so there is a
          scale: a pill is rounder than nothing, a control is rounder than a pill, a card is rounder
          than a control.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          {[
            { cls: "rounded-md", label: "4px", use: "pill, tag" },
            { cls: "rounded-lg", label: "6px", use: "button, input, nav item" },
            { cls: "rounded-xl", label: "8px", use: "panel, list container" },
            { cls: "rounded-4xl", label: "12px", use: "card, dialog, sheet" },
          ].map((r) => (
            <div key={r.label} className="text-center">
              <div className={`size-16 border border-border-strong bg-muted ${r.cls}`} />
              <p className="mt-1.5 text-caption font-medium text-foreground">{r.label}</p>
              <p className="text-caption text-muted-foreground">{r.use}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 max-w-2xl text-meta text-muted-foreground">
          Depth works the same way. A card sits on the page, so it gets a border and no shadow — the
          rule Carbon states for tiles and Atlassian states for its default surface. A shadow means
          the thing is genuinely floating and will go away again: a menu, a popover, a dialog, a
          sheet. In dark mode the shadows come off entirely and the surfaces climb in lightness
          instead.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="rounded-4xl border border-border bg-card px-4 py-3 text-meta">
            Card · border, no shadow
          </div>
          <div className="rounded-xl bg-popover px-4 py-3 text-meta shadow-overlay">
            Menu · shadow-overlay
          </div>
          <div className="rounded-4xl bg-popover px-4 py-3 text-meta shadow-modal">
            Dialog · shadow-modal
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      {/* -------------------------------------------------------- motion */}
      <section>
        <SectionHeading hint="short, and only where it orients someone">Motion</SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          Three easing curves, taken from Carbon&rsquo;s productive set, and six durations.
          Something arriving uses the entrance curve, something leaving uses the exit curve, and
          anything that stays on screen from start to finish uses the standard curve. A side panel is
          the stated exception: it leaves but stays nearby, ready to come back, so it exits on the
          standard curve too.
        </p>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-th text-muted-foreground uppercase">Moment</th>
                <th className="px-3 py-2 text-th text-muted-foreground uppercase">In</th>
                <th className="px-3 py-2 text-th text-muted-foreground uppercase">Out</th>
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
                  <td className="px-3 py-2.5 text-meta text-foreground">{moment}</td>
                  <td className="px-3 py-2.5 text-meta tabular-nums text-muted-foreground">{into}</td>
                  <td className="px-3 py-2.5 text-meta tabular-nums text-muted-foreground">{out}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-2xl text-caption text-muted-foreground">
          A dialog scales from 98 per cent rather than the usual 95, because a five per cent jump on
          a projector reads as a lurch. With reduced motion switched on, colour and opacity still
          cross-fade in 70ms and everything that moves or scales stops moving — reducing motion, not
          removing every cue that something happened.
        </p>
      </section>

      <Separator className="my-8" />

      {/* ------------------------------------------------------- status */}
      <section>
        <SectionHeading hint="the one thing this product has to get right">
          Milestone status
        </SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          Seven states, each carrying three independent signals: a distinct glyph, a word, and a
          colour. They are listed in that order on purpose. Under deuteranopia the pale accepted and
          overdue fills are almost the same colour, so colour is the least reliable of the three and
          never appears on its own.
        </p>

        <div className="overflow-hidden rounded-xl border border-border">
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
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <p className="text-page">Page · 28/36 · the name of the screen</p>
          <p className="text-stat">1,284 · the same size, for a figure</p>
          <p className="text-title">Title · 20/28 · a panel or a dialog</p>
          <p className="text-section">Section · 16/22 · a block within a screen</p>
          <p className="text-subhead">Subhead · 14/18 semibold · a card or a row title</p>
          <p className="text-body">Body · 14/20 · ordinary prose and table cells</p>
          <p className="text-meta text-muted-foreground">
            Meta · 13/18 · the second line of a row, most secondary text
          </p>
          <p className="text-th text-muted-foreground uppercase">
            Table header · 12/16 · +0.04em, the only place small caps are used
          </p>
          <p className="text-caption text-muted-foreground">Caption · 12/16 · timestamps, hints</p>
        </div>
        <p className="mt-3 max-w-2xl text-caption text-muted-foreground">
          Twenty-eight pixels is the ceiling. Carbon calls this the productive set and caps it at
          the same place: larger type is for an expressive product, and a supervision meeting is not
          one. Geist carries tabular figures but does not switch them on by itself, so the tokens do
          it globally.
        </p>
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
              className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5"
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
        <div className="space-y-2 rounded-xl border border-border bg-card p-5">
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

      {/* ---------------------------------------------------- components */}
      <section>
        <SectionHeading hint="the real import, reading the real tokens">Components</SectionHeading>
        <p className="mb-4 max-w-2xl text-meta text-muted-foreground">
          Twenty-five primitives from shadcn over Base UI carry the whole product — the same
          Dialog that opens a checkpoint, the same Table that lists a batch, live below rather
          than pictured. The registry in <code className="text-foreground">components/ui</code>{" "}
          holds roughly thirty more that no screen imports yet; those are named at the end
          instead of demonstrated; a component nothing calls is not part of this design system
          yet, whatever the folder says.
        </p>

        <div className="space-y-6">
          <ComponentGroup label="Toggle — the pressed state a filter chip is built from">
            <div className="flex flex-wrap gap-2">
              <Toggle pressed={pinned} onPressedChange={setPinned} variant="outline">
                Pinned
              </Toggle>
              <Toggle pressed={flagged} onPressedChange={setFlagged} variant="outline">
                Needs follow-up
              </Toggle>
            </div>
          </ComponentGroup>

          <ComponentGroup label="Form fields — Label, Input, Textarea, Checkbox, RadioGroup, Select, InputGroup">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ds-name">Project name</Label>
                <Input id="ds-name" placeholder="Attendance tracker" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ds-visibility">Who can see this</Label>
                <Select value={visibility} onValueChange={(value) => setVisibility(value ?? "team_and_mentor")}>
                  <SelectTrigger id="ds-visibility" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team_and_mentor">Team and mentor</SelectItem>
                    <SelectItem value="mentor_group">Mentor group</SelectItem>
                    <SelectItem value="batch">Whole batch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ds-notes">Notes</Label>
                <Textarea id="ds-notes" placeholder="What the mentor should know before reviewing this." />
              </div>
              <div className="space-y-1.5">
                <Label>Decision</Label>
                <RadioGroup value={decision} onValueChange={setDecision} className="gap-2.5">
                  <label className="flex items-center gap-2 text-meta">
                    <RadioGroupItem value="accept" /> Accept
                  </label>
                  <label className="flex items-center gap-2 text-meta">
                    <RadioGroupItem value="return" /> Return for revisions
                  </label>
                </RadioGroup>
              </div>
              <div className="space-y-1.5">
                <Label>Search, with an addon</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput placeholder="Filter people…" />
                </InputGroup>
                <label className="mt-1 flex items-center gap-2 text-meta text-muted-foreground">
                  <Checkbox checked={agreed} onCheckedChange={() => setAgreed((v) => !v)} />
                  Notify the team once submitted
                </label>
              </div>
            </div>
          </ComponentGroup>

          <ComponentGroup label="Overlays — Dialog, Sheet, Popover, DropdownMenu">
            <div className="flex flex-wrap gap-2">
              <Dialog>
                <DialogTrigger render={<Button variant="outline" />}>Accept checkpoint</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Accept this checkpoint?</DialogTitle>
                    <DialogDescription>
                      The team is notified immediately. This is the deliberate-stop pattern: a
                      modal for a decision, never for a form.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                    <DialogClose render={<Button />}>Accept</DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Sheet>
                <SheetTrigger render={<Button variant="outline" />}>Open a milestone</SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Week 4 checkpoint</SheetTitle>
                    <SheetDescription>
                      A slide-over, not a modal — the grid behind it is the context for whatever
                      gets decided in here.
                    </SheetDescription>
                  </SheetHeader>
                  <SheetFooter>
                    <p className="text-meta text-muted-foreground">
                      Same component as the real milestone panel, side is right by default.
                    </p>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              <Popover>
                <PopoverTrigger render={<Button variant="outline" />}>Due date</PopoverTrigger>
                <PopoverContent className="w-64 p-3 text-meta">
                  <div className="flex items-center gap-2 text-foreground">
                    <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-4" />
                    Tuesday, week 7
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    The full date always lives in a tooltip or a popover, never only in a relative
                    label.
                  </p>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" />}>
                  Row actions
                  <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Checkpoint</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <HugeiconsIcon icon={ExternalLinkIcon} strokeWidth={2} className="size-4" />
                    Open in a new tab
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4" />
                    Add a note
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">Withdraw submission</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </ComponentGroup>

          <ComponentGroup label="Command — the list a search combobox is built from (person-combobox, ⌘K)">
            <Command className="max-w-sm border border-border">
              <CommandInput placeholder="Search people…" />
              <CommandList>
                <CommandEmpty>Nobody matches.</CommandEmpty>
                <CommandGroup>
                  {["Aarav Mehta", "Priya Rao", "Rohan Shah"].map((name) => (
                    <CommandItem key={name} className="gap-2.5">
                      <Avatar className="size-5">
                        <AvatarFallback className="text-[9px]">
                          {name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </ComponentGroup>

          <ComponentGroup label="Tooltip and Kbd">
            <div className="flex flex-wrap items-center gap-4">
              <Tooltip>
                <TooltipTrigger render={<Button variant="outline" size="sm" />}>
                  Hover me
                </TooltipTrigger>
                <TooltipContent>The full explanation goes here, not in the label.</TooltipContent>
              </Tooltip>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
              <span className="text-meta text-muted-foreground">opens the command palette</span>
            </div>
          </ComponentGroup>

          <ComponentGroup label="Table">
            <div className="overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Checkpoint</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { team: "Team Nimbus", checkpoint: "Week 4", status: "accepted" as const },
                    { team: "Team Vertex", checkpoint: "Week 4", status: "submitted" as const },
                    { team: "Team Orbit", checkpoint: "Week 4", status: "overdue" as const },
                  ].map((row) => (
                    <TableRow key={row.team}>
                      <TableCell className="font-medium text-foreground">{row.team}</TableCell>
                      <TableCell className="text-muted-foreground">{row.checkpoint}</TableCell>
                      <TableCell>
                        <StatusPill status={row.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ComponentGroup>

          <ComponentGroup label="Avatar, Skeleton, and a Toast">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback>PR</AvatarFallback>
                </Avatar>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => say("Saved", "This is what an off-screen confirmation looks like.")}
              >
                Fire a toast
              </Button>
            </div>
          </ComponentGroup>
        </div>

        <p className="mt-6 max-w-2xl text-caption text-muted-foreground">
          Not yet imported anywhere in the app —{" "}
          {UNUSED_PRIMITIVES.map((p, i) => (
            <React.Fragment key={p.name}>
              <span className="font-medium text-foreground/80">{p.name}</span>
              <span> ({p.note})</span>
              {i < UNUSED_PRIMITIVES.length - 1 ? ", " : "."}
            </React.Fragment>
          ))}
        </p>
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
            Nothing animates in a data view. Rows appearing or leaving, a re-sort, a filter
            re-flowing and a figure changing all happen instantly. Carbon actually endorses
            animating a sort, so this is a deliberate departure: this grid is read by a room looking
            at one projected screen, and movement there makes people lose their place. Overlays —
            things that arrive and leave — do animate.
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
          shadcn components over Base UI primitives, Hugeicons, and a status palette built on the
          Radix scale semantics — step 3 fills a surface, step 7 draws its border, step 12 writes on
          it. Step 11 is deliberately not used for text on a filled pill: it measures around 4.2:1,
          under the 4.5:1 that small text needs. Every ratio claimed on this page is recomputed from
          the token file by <code className="text-foreground">npm run contrast</code>, which fails
          the build rather than letting a colour drift.
        </p>
      </section>
    </div>
  )
}

function ComponentGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-th text-muted-foreground uppercase">{label}</p>
      {children}
    </div>
  )
}

function Swatch({ className }: { className: string }) {
  return <span className={`size-8 rounded-md border border-border-strong/60 ${className}`} />
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
