"use client"

import { MetricTile, PageHeader, SectionHeading } from "@/components/common"
import { StatusLegend } from "@/components/status/status-legend"
import { isCoordinator, projectsFor } from "@/lib/permissions"
import { measures, milestoneViews, statusCounts } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"

/** The numbers the project said it should be judged on.
 *
 * Four of the twelve decide whether any of this was worth building. They are
 * listed first, with their targets next to them, so the answer is checkable
 * rather than asserted. Where a measure has no data yet, it says so instead of
 * showing a zero that looks like a result. */
export default function MeasuresPage() {
  const { db, actor } = useProjectsStore()
  if (!actor) return null

  const projects = projectsFor(db, actor)
  const ids = projects.map((p) => p.id)
  const stats = measures(db, ids)
  const views = milestoneViews(db, ids)
  const counts = statusCounts(views)

  const headline = [
    {
      ref: "K1",
      label: "On-time deliverable rate",
      value: stats.onTimeRate === null ? "No data yet" : `${Math.round(stats.onTimeRate * 100)}%`,
      target: "Baseline, then +20 points",
      hint: `${stats.dueSoFar} checkpoints due so far`,
      tone: stats.onTimeRate !== null && stats.onTimeRate < 0.6 ? ("warn" as const) : ("good" as const),
    },
    {
      ref: "K2",
      label: "Time from turning in to feedback",
      value:
        stats.medianHoursToFeedback === null
          ? "No data yet"
          : `${Math.round(stats.medianHoursToFeedback)}h`,
      target: "Under 72 hours",
      hint: "Median across every review",
      tone:
        stats.medianHoursToFeedback !== null && stats.medianHoursToFeedback > 72
          ? ("warn" as const)
          : ("good" as const),
    },
    {
      ref: "K3",
      label: "Actions closed before the next meeting",
      value:
        stats.actionClosureRate === null
          ? "No data yet"
          : `${Math.round(stats.actionClosureRate * 100)}%`,
      target: "Above 70%",
      hint: "Across every project in scope",
      tone:
        stats.actionClosureRate !== null && stats.actionClosureRate < 0.7
          ? ("warn" as const)
          : ("good" as const),
    },
    {
      ref: "K4",
      label: "Teams active this week",
      value: `${stats.teamsActiveThisWeek} of ${stats.totalTeams}`,
      target: "Above 80%",
      hint: "Any recorded work in the last seven days",
      tone:
        stats.totalTeams > 0 && stats.teamsActiveThisWeek / stats.totalTeams < 0.8
          ? ("warn" as const)
          : ("good" as const),
    },
  ]

  return (
    <>
      <PageHeader
        title="Measures"
        description={
          isCoordinator(actor)
            ? "Across every project in the batch."
            : "Across the teams you mentor."
        }
      />

      <section>
        <SectionHeading hint="if these do not move, the rest does not matter">
          The four that decide it
        </SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {headline.map((item) => (
            <div key={item.ref} className="relative">
              <span className="absolute top-3 right-3 text-caption font-semibold text-muted-foreground/60">
                {item.ref}
              </span>
              <MetricTile
                label={item.label}
                value={item.value}
                hint={`${item.hint} · target ${item.target}`}
                tone={item.value === "No data yet" ? "default" : item.tone}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading>Alongside them</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Meetings with minutes"
            value={
              stats.meetingsWithMinutes === null
                ? "No data yet"
                : `${Math.round(stats.meetingsWithMinutes * 100)}%`
            }
            hint="Target above 80%"
          />
          <MetricTile
            label="Checkpoints accepted"
            value={String(stats.acceptedCount)}
            hint={`of ${views.length} across ${stats.totalTeams} projects`}
          />
          <MetricTile
            label="Reach a mentor's whole group"
            value="1 action"
            hint="Was 6 to 8 separate messages"
            tone="good"
          />
          <MetricTile
            label="Batch status view"
            value="Immediate"
            hint="Was hours, by asking each mentor"
            tone="good"
          />
        </div>
      </section>

      <section>
        <SectionHeading hint="every checkpoint in scope">Spread of states</SectionHeading>
        <StatusLegend counts={counts} />
      </section>

      <p className="max-w-2xl text-caption text-muted-foreground">
        Two of these are stated rather than measured: reaching a mentoring line in one action, and
        producing a batch status view immediately, are properties of the system rather than numbers
        that move. They are listed because the companion document commits to them.
      </p>
    </>
  )
}
