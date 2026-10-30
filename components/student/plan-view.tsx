"use client"

import * as React from "react"
import { DueBadge, StatusText } from "@/components/common"
import { buildPlan, type PlanSemester } from "@/lib/plan"
import { milestoneViews } from "@/lib/selectors"
import { AWAITING_TEAM } from "@/lib/status"
import { useProjectsStore } from "@/lib/store"
import { cn } from "@/lib/utils"

import { ChevronDown, ChevronRight } from "@untitledui/icons"

/** The programme plan, read the way the sheet reads: every semester, phase and
 * checkpoint on one scrolling page, with Semester → Phase pinned beside it.
 *
 * The nav stays in view as the page scrolls and lights the phase you are in; a
 * click on it scrolls to that part. Opening a checkpoint is the page's job, not
 * this view's: it hands back the checkpoint's id so the sheet can be mounted
 * outside the tabs. */
export function PlanView({
  projectId,
  onOpen,
}: {
  projectId: string
  onOpen: (templateId: string) => void
}) {
  const { db } = useProjectsStore()
  const plan = React.useMemo(
    () => buildPlan(milestoneViews(db, [projectId])),
    [db, projectId]
  )
  // The phase on screen, worked out by scrolling. Until the first reading it is
  // the first phase.
  const [seen, setSeen] = React.useState<string | null>(null)
  const active = seen ?? plan[0]?.phases[0]?.key ?? null
  const [closed, setClosed] = React.useState<Set<string>>(new Set())
  // Lookups stay inside this view, so nothing outside it can be matched.
  const root = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const sections = Array.from(
      root.current?.querySelectorAll<HTMLElement>("[data-plan-phase]") ?? []
    )
    if (sections.length === 0) return
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const key = (entry.target as HTMLElement).dataset.planPhase!
          if (entry.isIntersecting) visible.add(key)
          else visible.delete(key)
        })
        // The first phase, in page order, that is in the upper part of the
        // screen under the top bar.
        const first = sections
          .map((el) => el.dataset.planPhase!)
          .find((key) => visible.has(key))
        if (first) setSeen(first)
      },
      { rootMargin: "-96px 0px -55% 0px" }
    )
    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [plan])

  const jump = (anchor: string) => {
    const el = root.current?.querySelector<HTMLElement>(
      `[id="${anchor.replace(/"/g, '\\"')}"]`
    )
    if (!el) return
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    el.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" })
    // Light it straight away rather than waiting for the scroll to land.
    if (el.dataset.planPhase) setSeen(el.dataset.planPhase)
  }

  const toggle = (key: string) =>
    setClosed((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  if (plan.length === 0) return null

  // Phases are numbered 1, 2, 3 … down the whole plan, across semesters, and a
  // checkpoint is its phase's number and its place in it: 1.1, 2.1, 3.1, 3.2.
  const firstPhase = plan.map((_, i) =>
    plan.slice(0, i).reduce((total, s) => total + s.phases.length, 0)
  )

  return (
    <div
      ref={root}
      className="grid items-start gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]"
    >
      {/* Pinned under the top bar; scrolls inside itself if it is ever taller
        than the screen. */}
      <nav
        aria-label="Programme plan"
        className="space-y-4 rounded-xl border border-border p-3 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto"
      >
        {plan.map((sem) => (
          <div key={sem.key} className="space-y-1">
            <Row
              strong
              expanded={!closed.has(sem.key)}
              selected={false}
              onToggle={() => toggle(sem.key)}
              onSelect={() => jump(sem.key)}
              label={`Semester ${sem.semester}`}
            />
            {!closed.has(sem.key) && (
              <div className="ml-4 space-y-1 border-l border-border pl-2">
                {sem.phases.map((phase) => (
                  <Row
                    key={phase.key}
                    selected={active === phase.key}
                    onSelect={() => jump(phase.key)}
                    label={phase.name}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="min-w-0 space-y-12">
        {plan.map((sem, i) => (
          <SemesterBlock
            key={sem.key}
            sem={sem}
            firstPhase={firstPhase[i]}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  )
}

function weeks(from: number, to: number) {
  return from === to ? `Week ${from}` : `Weeks ${from}–${to}`
}

/* ---------------------------------------------------------------- tree */

/** One line of the nav. The chevron opens and closes; the label selects. They
 * are separate buttons so each is a real target. A row with nothing to open
 * keeps the chevron's width so labels line up. */
function Row({
  strong,
  expanded,
  selected,
  onToggle,
  onSelect,
  label,
}: {
  strong?: boolean
  expanded?: boolean
  selected: boolean
  onToggle?: () => void
  onSelect: () => void
  label: string
}) {
  return (
    <div
      className={cn(
        "flex items-center rounded-lg",
        selected ? "bg-brand-solid/[0.08]" : "hover:bg-muted/60"
      )}
    >
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${label}`}
          aria-expanded={expanded}
          className="grid size-9 shrink-0 place-items-center text-muted-foreground"
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>
      ) : (
        <span className="w-3 shrink-0" aria-hidden />
      )}
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className="flex min-h-9 min-w-0 flex-1 items-center py-1.5 pr-3 text-left"
      >
        <span
          className={cn(
            "min-w-0 flex-1",
            strong ? "text-subhead" : "text-meta",
            selected ? "font-semibold text-foreground" : "text-foreground"
          )}
        >
          {label}
        </span>
      </button>
    </div>
  )
}

/* ------------------------------------------------------------- content */

function SemesterBlock({
  sem,
  firstPhase,
  onOpen,
}: {
  sem: PlanSemester
  /** How many phases come before this semester's, so numbering carries on. */
  firstPhase: number
  onOpen: (templateId: string) => void
}) {
  return (
    // The nav's Semester rows jump here; the page itself has no semester
    // heading, so the phases read as one list.
    <section id={sem.key} className="scroll-mt-24 space-y-8">
      {sem.phases.map((phase, phaseIndex) => (
        <div
          key={phase.key}
          id={phase.key}
          data-plan-phase={phase.key}
          className="scroll-mt-24 space-y-3"
        >
          <h3 className="text-section text-foreground">
            <span className="mr-2 text-muted-foreground tabular-nums">
              {firstPhase + phaseIndex + 1}
            </span>
            {phase.name}{" "}
            <span className="text-meta font-normal text-muted-foreground">
              ({weeks(phase.fromWeek, phase.toWeek)})
            </span>
          </h3>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {phase.checkpoints.map((c, checkpointIndex) => (
              <li key={c.template.id}>
                <button
                  type="button"
                  onClick={() => onOpen(c.template.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 text-left hover:bg-muted/50"
                >
                  <span className="flex min-w-0 items-baseline gap-3">
                    <span className="w-9 shrink-0 text-meta text-muted-foreground tabular-nums">
                      {firstPhase + phaseIndex + 1}.{checkpointIndex + 1}
                    </span>
                    <span className="text-subhead text-foreground">
                      {c.template.title}
                    </span>
                  </span>
                  {/* One thing beside the arrow: how late or how soon while
                    the team owes work, and where it stands once it is with the
                    mentor or done. */}
                  <span className="flex items-center gap-3">
                    {AWAITING_TEAM.includes(c.status) ? (
                      <DueBadge dueDate={c.dueDate} hideIcon small plain />
                    ) : (
                      <StatusText
                        status={c.status}
                        submittedAt={c.instance.submittedAt}
                        small
                      />
                    )}
                    <ChevronRight
                      className="size-5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
