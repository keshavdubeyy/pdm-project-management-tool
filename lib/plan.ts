import type { MilestoneView } from "@/lib/selectors"

/** The programme plan as a tree: Semester → Phase → Checkpoint.
 *
 * Nothing here is stored. The tree is read off the milestone views, so a
 * coordinator moving a week or a team's override shows up in it at once. A
 * phase's weeks run from the day after the previous phase ended to its own
 * last checkpoint, which is what lets a week be placed in a phase. */

export type PlanCheckpoint = MilestoneView

export type PlanPhase = {
  key: string
  name: string
  semester: 3 | 4
  /** First and last week of the phase. */
  fromWeek: number
  toWeek: number
  checkpoints: PlanCheckpoint[]
}

export type PlanSemester = {
  key: string
  semester: 3 | 4
  fromWeek: number
  toWeek: number
  phases: PlanPhase[]
}

export function buildPlan(views: MilestoneView[]): PlanSemester[] {
  const sorted = [...views].sort((a, b) => a.dueWeek - b.dueWeek)
  const phases: PlanPhase[] = []

  sorted.forEach((view) => {
    const name = view.template.phase
    const semester = view.template.semester
    let phase = phases.find((p) => p.name === name && p.semester === semester)
    if (!phase) {
      phase = {
        key: `p:${semester}:${name}`,
        name,
        semester,
        fromWeek: 1,
        toWeek: view.dueWeek,
        checkpoints: [],
      }
      phases.push(phase)
    }
    phase.checkpoints.push(view)
    phase.toWeek = Math.max(phase.toWeek, view.dueWeek)
  })

  phases.forEach((phase, index) => {
    phase.fromWeek = index === 0 ? 1 : phases[index - 1].toWeek + 1
  })

  return ([3, 4] as const)
    .map((semester) => {
      const own = phases.filter((p) => p.semester === semester)
      return {
        key: `s:${semester}`,
        semester,
        fromWeek: own[0]?.fromWeek ?? 0,
        toWeek: own[own.length - 1]?.toWeek ?? 0,
        phases: own,
      }
    })
    .filter((s) => s.phases.length > 0)
}

/** The checkpoint a team should be looking at now: the first one that is not
 * accepted. Falls back to the last when everything is done. */
export function currentCheckpoint(
  plan: PlanSemester[]
): PlanCheckpoint | undefined {
  const all = plan.flatMap((s) => s.phases.flatMap((p) => p.checkpoints))
  return all.find((c) => c.status !== "accepted") ?? all[all.length - 1]
}

export function checkpointKey(view: PlanCheckpoint) {
  return `c:${view.template.id}`
}

/** How a branch reads at a glance. Overdue wins, because it is the one a
 * student has to act on. */
export type Rollup = {
  total: number
  accepted: number
  overdue: number
}

export function rollup(checkpoints: PlanCheckpoint[]): Rollup {
  return {
    total: checkpoints.length,
    accepted: checkpoints.filter((c) => c.status === "accepted").length,
    overdue: checkpoints.filter((c) => c.status === "overdue").length,
  }
}

/** The weeks each checkpoint covers: from the week after the previous
 * checkpoint was due, through its own. The first one starts at week 1. */
export function checkpointWindows(
  plan: PlanSemester[]
): Map<string, { from: number; to: number }> {
  const out = new Map<string, { from: number; to: number }>()
  let previous = 0
  plan
    .flatMap((s) => s.phases.flatMap((p) => p.checkpoints))
    .forEach((c) => {
      out.set(c.template.id, {
        from: Math.min(previous + 1, c.dueWeek),
        to: c.dueWeek,
      })
      previous = c.dueWeek
    })
  return out
}

/** Each checkpoint's number in the plan: 1.1, 2.1, 3.1, 3.2 … Phases are counted
 * straight through, across semesters, and a checkpoint is its phase and its place
 * in it. The same numbering the Project plan shows, by template id. */
export function checkpointNumbers(plan: PlanSemester[]): Map<string, string> {
  const out = new Map<string, string>()
  let phaseNumber = 0
  plan.forEach((semester) =>
    semester.phases.forEach((phase) => {
      phaseNumber += 1
      phase.checkpoints.forEach((c, i) =>
        out.set(c.template.id, `${phaseNumber}.${i + 1}`)
      )
    })
  )
  return out
}
