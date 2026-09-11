import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, Link02Icon } from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import {
  PROJECT_START_DATE,
  dateRangeLabel,
  formatDate,
  getPublishedUpdates,
  weekLabel,
  type ProgressUpdate,
} from "@/lib/progress"

function List({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </h4>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function UpdateEntry({ update }: { update: ProgressUpdate }) {
  const hasUnfinished =
    (update.unfinished && update.unfinished.length > 0) ||
    (update.blockers && update.blockers.length > 0)

  return (
    <li>
      <details className="group rounded-2xl border border-foreground/15 bg-card">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="w-24 shrink-0">{weekLabel(update)}</Badge>
              <span className="text-xs text-muted-foreground">
                Reporting period: {dateRangeLabel(update)}
              </span>
            </div>
            <h3 className="font-heading text-base font-medium">{update.title}</h3>
            <p className="text-sm text-muted-foreground">{update.summary}</p>
          </div>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          />
        </summary>

        <div className="flex flex-col gap-4 border-t border-foreground/15 px-5 py-4">
          {update.approachChange && (
            <div className="rounded-xl border border-foreground/15 bg-primary/5 p-3">
              <h4 className="text-xs font-medium tracking-wide text-primary uppercase">
                Change in approach
              </h4>
              <p className="mt-1.5 text-sm">{update.approachChange}</p>
            </div>
          )}

          <List label="Work completed" items={update.completed} />
          <List label="Added" items={update.added} />
          <List label="Improved" items={update.improved} />
          <List label="Fixed" items={update.fixed} />
          <List label="Removed" items={update.removed} />
          <List label="Shown or tested with" items={update.testing} />
          <List label="Learned from feedback" items={update.feedback} />

          {hasUnfinished && (
            <div className="rounded-xl border border-foreground/15 bg-muted p-3">
              <List label="Unfinished work" items={update.unfinished} />
              <List label="Blockers" items={update.blockers} />
            </div>
          )}

          <List label="Next steps" items={update.nextSteps} />

          {update.evidence && update.evidence.length > 0 && (
            <div>
              <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Evidence
              </h4>
              <div className="mt-1.5 flex flex-col gap-1">
                {update.evidence.map((doc) => (
                  <a
                    key={doc.url}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <HugeiconsIcon icon={Link02Icon} strokeWidth={2} className="size-4" />
                    {doc.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>
    </li>
  )
}

export default function UpdatesPage() {
  const updates = getPublishedUpdates()
  const latestDate = updates[0]?.periodEnd

  return (
    <div className="px-8 py-6">
      <h1 className="font-heading text-2xl font-medium">Project progress</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        What actually changed, week by week — in plain language, backed by the real work behind
        it.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>Project started {formatDate(PROJECT_START_DATE)}</span>
        {latestDate && <span>Last updated {formatDate(latestDate)}</span>}
      </div>

      {updates.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          No updates have been published yet.
        </p>
      ) : (
        <ol className="mt-8 flex flex-col gap-4">
          {updates.map((update) => (
            <UpdateEntry key={update.id} update={update} />
          ))}
        </ol>
      )}
    </div>
  )
}
