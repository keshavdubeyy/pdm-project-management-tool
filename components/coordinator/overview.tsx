"use client"

import * as React from "react"
import Link from "next/link"
import { MetricTile, PageHeader } from "@/components/common"
import { batchOverview, type TeamHealth } from "@/lib/overview"
import { useProjectsStore } from "@/lib/store"
import { cn } from "@/lib/utils"

/** How many teams each ranked list shows. */
const SHOWN = 5

/** The first names of a team, the way a mentor's list names it. */
const teamName = (t: TeamHealth) =>
  t.students.map((s) => s.name.split(" ")[0]).join(" & ") || "Team"

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

/** The programme coordinator's home: how the batch is doing in four numbers, and
 * three short lists under them, the teams to be glad about and the ones to go and
 * see. Everything is worked out from the same data as the rest of the app, so it
 * agrees with the Teams list. */
export function CoordinatorOverview() {
  const { db } = useProjectsStore()
  const o = batchOverview(db)
  const total = o.teams.length
  const share = total ? o.onTrack / total : 1

  // Teams with nothing overdue, furthest along first, then the most recently active.
  const onTrack = o.teams
    .filter((t) => t.overdue === 0)
    .sort(
      (a, b) =>
        b.accepted - a.accepted ||
        (b.lastActivity ?? "").localeCompare(a.lastActivity ?? "")
    )

  // Behind first, the most overdue at the top; then those longest waiting on a
  // mentor.
  const attention = o.teams
    .filter((t) => t.status !== "on_track")
    .sort(
      (a, b) =>
        Number(b.status === "behind") - Number(a.status === "behind") ||
        b.overdue - a.overdue ||
        (b.oldestWaitingDays ?? 0) - (a.oldestWaitingDays ?? 0)
    )

  // Ranked on work the mentor has accepted, and on how much of it came in on
  // time. A team with nothing accepted has not performed yet, so it is not listed
  // however the zeros happen to sort.
  const performing = o.teams
    .filter((t) => t.accepted > 0)
    .sort(
      (a, b) =>
        b.accepted - a.accepted ||
        b.acceptedOnTime - a.acceptedOnTime ||
        a.overdue - b.overdue
    )

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Week ${o.week} of ${o.totalWeeks} · ${plural(total, "team")}`}
        divider={false}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          dashboard
          label="Teams on track"
          value={`${o.onTrack} of ${total}`}
          hint="No checkpoint overdue"
          tone={share >= 0.8 ? "good" : share < 0.6 ? "warn" : "default"}
        />
        <MetricTile
          dashboard
          label="Overdue checkpoints"
          value={String(o.overdueTotal)}
          hint={
            o.overdueTotal === 0
              ? "Nothing overdue"
              : `Across ${plural(o.teamsBehind, "team")}`
          }
          tone={o.overdueTotal > 0 ? "warn" : "good"}
        />
        <MetricTile
          dashboard
          label="Waiting on a mentor"
          value={String(o.waitingTotal)}
          hint={
            o.oldestWaitingDays === null
              ? "Nothing waiting"
              : `Oldest has waited ${plural(o.oldestWaitingDays, "day")}`
          }
        />
        <MetricTile
          dashboard
          label="Accepted so far"
          value={`${o.acceptedOfDue} of ${o.due}`}
          hint={
            o.onTimeRate === null
              ? "Checkpoints already due"
              : `Checkpoints already due · ${Math.round(o.onTimeRate * 100)}% handed in on time`
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TeamList
          title="Top teams on track"
          note="No checkpoint overdue, furthest along first"
          teams={onTrack}
          empty="No team is fully on track yet."
          detail={(t) => `${t.accepted}/${t.total} accepted`}
        />
        <TeamList
          title="Top teams needing attention"
          note="Behind or waiting on a mentor, most urgent first"
          teams={attention}
          empty="Every team is on track."
          detail={(t) =>
            t.status === "behind"
              ? `${t.overdue} overdue`
              : `Waiting${t.oldestWaitingDays !== null ? ` ${t.oldestWaitingDays}d` : ""}`
          }
          tone={(t) => (t.status === "behind" ? "bad" : "warn")}
        />
        <TeamList
          title="Top performing teams"
          note="Most work accepted, and handed in on time"
          teams={performing}
          empty="No checkpoint has been accepted yet."
          ranked
          detail={(t) => `${t.accepted} accepted · ${t.acceptedOnTime} on time`}
        />
      </div>

      <p className="text-meta text-muted-foreground">
        <Link
          href="/teams"
          className="font-medium text-brand-secondary hover:underline"
        >
          See every team
        </Link>{" "}
        with its progress, status and last activity.
      </p>
    </>
  )
}

/** One ranked list: a title and what it ranks by, then up to five teams, each a
 * way into that team with the number that put it there on the right. It has the
 * same outline as the input fields, with thin dividers and no gaps. */
function TeamList({
  title,
  note,
  teams,
  empty,
  detail,
  tone,
  ranked,
}: {
  title: string
  note: string
  teams: TeamHealth[]
  empty: string
  detail: (team: TeamHealth) => string
  tone?: (team: TeamHealth) => "bad" | "warn"
  /** Numbers the rows 1, 2, 3. */
  ranked?: boolean
}) {
  const shown = teams.slice(0, SHOWN)
  return (
    <section className="flex flex-col rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset">
      <div className="space-y-0.5 border-b border-secondary px-4 py-3">
        <h2 className="text-subhead text-foreground">{title}</h2>
        <p className="text-caption text-muted-foreground">{note}</p>
      </div>
      {shown.length === 0 ? (
        <p className="px-4 py-6 text-meta text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y divide-secondary">
          {shown.map((team, i) => (
            <li key={team.project.id}>
              <Link
                href={`/projects/${team.project.id}`}
                className="flex items-center gap-3 px-4 py-2.5 outline-brand hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2"
              >
                {ranked && (
                  <span className="w-4 shrink-0 text-caption font-semibold text-muted-foreground tabular-nums">
                    {i + 1}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-meta font-medium text-foreground">
                    {teamName(team)}
                  </span>
                  <span className="block truncate text-caption text-muted-foreground">
                    {team.mentors.map((m) => m.name).join(", ") ||
                      "No mentor yet"}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 text-caption font-medium tabular-nums",
                    tone?.(team) === "bad"
                      ? "text-status-overdue-fg"
                      : tone?.(team) === "warn"
                        ? "text-status-returned-fg"
                        : "text-muted-foreground"
                  )}
                >
                  {detail(team)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {teams.length > SHOWN && (
        <p className="border-t border-secondary px-4 py-2 text-caption text-muted-foreground">
          and {teams.length - SHOWN} more
        </p>
      )}
    </section>
  )
}
