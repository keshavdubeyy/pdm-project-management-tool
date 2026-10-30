"use client"

import type { Health } from "@/app/api/developer/health/route"
import { timeAgo } from "@/lib/dates"

/** Comment use per team. */
export function HealthPanel({ health }: { health: Health }) {
  const { teams } = health

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Comments per team</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-muted text-caption text-muted-foreground uppercase">
              <tr>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2 text-right">Comments 7d</th>
                <th className="px-3 py-2 text-right">30d</th>
                <th className="px-3 py-2 text-right">Mentor / team</th>
                <th className="px-3 py-2 text-right">Unanswered</th>
                <th className="px-3 py-2 text-right">Links</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.projectId} className="border-t border-border">
                  <td className="px-3 py-2">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-caption text-muted-foreground">
                      {t.lastCommentAt
                        ? `Last comment ${timeAgo(t.lastCommentAt)}`
                        : "No comments"}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.comments7}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.comments30}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {t.fromMentors} / {t.fromTeam}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.unanswered}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.links}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
