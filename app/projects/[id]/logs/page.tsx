"use client"

import * as React from "react"
import Link from "next/link"
import { notFound, useParams } from "next/navigation"
import { EmptyState, PageHeader } from "@/components/common"
import { Table, TableCard } from "@/components/untitled/application/table/table"
import { Button } from "@/components/untitled/base/buttons/button"
import { Input } from "@/components/untitled/base/input/input"
import { Select } from "@/components/untitled/base/select/select"
import { PROJECT_TIMEZONE } from "@/lib/dates"
import {
  isCoordinator,
  isMemberOf,
  isMentorOf,
  ROLE_LABEL,
} from "@/lib/permissions"
import { fetchActivity } from "@/lib/remote"
import { useProjectsStore } from "@/lib/store"
import type { ActivityEvent } from "@/lib/types"

import { ChevronLeft, Download01, SearchLg } from "@untitledui/icons"

const PAGE = 50

/** What each recorded action is called when read by a person. Anything not
 * listed here falls back to the action's own name, so a new kind of event still
 * shows up. */
const ACTION_LABEL: Record<string, string> = {
  "progress.submitted": "Submitted progress",
  "progress.resubmitted": "Submitted progress again",
  "progress.edited": "Edited progress",
  "progress.deleted": "Deleted progress",
  "checkpoint.accepted": "Accepted a checkpoint",
  "checkpoint.returned": "Returned a checkpoint",
  "checkpoint.status_changed": "Changed a status",
  "checkpoint.item_ticked": "Ticked an item",
  "checkpoint.item_unticked": "Unticked an item",
  "checkpoint.due_week_changed": "Changed a due week",
  "comment.created": "Commented",
  "comment.replied": "Replied",
  "comment.edited": "Edited a comment",
  "comment.deleted": "Deleted a comment",
  "comment.resolved": "Resolved a thread",
  "comment.reopened": "Reopened a thread",
  "document.added": "Added a document",
  "document.edited": "Edited a document",
  "document.deleted": "Deleted a document",
  "document.linked": "Linked documents",
  "note.created": "Created a note",
  "note.edited": "Edited a note",
  "note.renamed": "Renamed a note",
  "note.deleted": "Deleted a note",
  "note.commented": "Commented on a note",
  "note.comment_replied": "Replied on a note",
  "meeting.created": "Scheduled a meeting",
  "minutes.recorded": "Recorded minutes",
  "minutes.edited": "Edited minutes",
  "minutes.confirmed": "Confirmed minutes",
}

/** The filter: a name, and which actions it covers. */
const KINDS = [
  { id: "all", label: "All activity", prefixes: [] as string[] },
  { id: "progress", label: "Progress", prefixes: ["progress."] },
  { id: "comment", label: "Comments", prefixes: ["comment."] },
  { id: "checkpoint", label: "Checkpoints", prefixes: ["checkpoint."] },
  { id: "document", label: "Documents", prefixes: ["document."] },
  { id: "note", label: "Notes", prefixes: ["note."] },
  { id: "meeting", label: "Meetings", prefixes: ["meeting.", "minutes."] },
]

function label(action: string) {
  return ACTION_LABEL[action] ?? action.replace(/[._]/g, " ")
}

/** Down to the second, in the programme's calendar: a log is read for exactly
 * when something happened. */
function stamp(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: PROJECT_TIMEZONE,
  })
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

/** One team's activity log: who did what, to what, and when.
 *
 * It is read-only. Entries are written once as things happen and cannot be
 * changed or removed, here or anywhere else. Nothing in the app links to this
 * page; it is opened by its address. */
export default function ProjectLogPage() {
  const params = useParams<{ id: string }>()
  const { db, actor } = useProjectsStore()
  const project = db.projects.find((p) => p.id === params.id)

  const [events, setEvents] = React.useState<ActivityEvent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [failed, setFailed] = React.useState(false)
  const [finished, setFinished] = React.useState(false)
  const [person, setPerson] = React.useState("all")
  const [kind, setKind] = React.useState("all")
  const [query, setQuery] = React.useState("")

  const projectId = project?.id
  React.useEffect(() => {
    if (!projectId) return
    let cancelled = false
    fetchActivity(projectId, { limit: PAGE }).then((result) => {
      if (cancelled) return
      setEvents(result.events)
      setFailed(result.failed)
      setFinished(result.events.length < PAGE)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (!actor) return null
  if (!project) return notFound()

  const allowed =
    isMemberOf(actor, project) ||
    isMentorOf(actor, project) ||
    isCoordinator(actor)
  if (!allowed) {
    return (
      <EmptyState
        title="This log is not visible to you"
        body="Only a team's members, its mentors and the programme coordinator can read its log."
      />
    )
  }

  const loadMore = async () => {
    const last = events[events.length - 1]
    if (!last) return
    setLoading(true)
    const result = await fetchActivity(project.id, {
      before: last.at,
      limit: PAGE,
    })
    setEvents((current) => [...current, ...result.events])
    setFailed(result.failed)
    setFinished(result.events.length < PAGE)
    setLoading(false)
  }

  const people = Array.from(
    new Map(events.map((e) => [e.actorId, e.actorName])).entries()
  )
  const q = query.trim().toLowerCase()
  const shown = events
    .filter((e) => person === "all" || e.actorId === person)
    .filter((e) => {
      const wanted = KINDS.find((k) => k.id === kind)?.prefixes ?? []
      return wanted.length === 0 || wanted.some((p) => e.action.startsWith(p))
    })
    .filter(
      (e) =>
        !q ||
        `${e.actorName} ${label(e.action)} ${e.target.label} ${e.summary}`
          .toLowerCase()
          .includes(q)
    )

  const exportCsv = () => {
    const rows = [
      [
        "Time (UTC)",
        "Person",
        "Role",
        "Action",
        "Target",
        "Summary",
        "Changes",
      ],
      ...shown.map((e) => [
        e.at,
        e.actorName,
        ROLE_LABEL[e.actorRole],
        e.action,
        e.target.label,
        e.summary,
        (e.changes ?? [])
          .map(
            (c) =>
              `${c.field}: ${c.from ?? ""}${c.from !== undefined && c.to !== undefined ? " → " : ""}${c.to ?? ""}`
          )
          .join("; "),
      ]),
    ]
    const blob = new Blob(
      [rows.map((r) => r.map(csvCell).join(",")).join("\n")],
      { type: "text/csv;charset=utf-8" }
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `activity-log-${project.id}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Link
        href={`/projects/${project.id}`}
        className="inline-flex w-fit items-center gap-1.5 text-meta font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" />
        Back to the project
      </Link>

      <PageHeader
        title="Activity log"
        description="Everything that has happened on this project, newest first. Entries are written once and cannot be changed or deleted."
        actions={
          <Button
            color="secondary"
            iconLeading={Download01}
            isDisabled={shown.length === 0}
            onPress={exportCsv}
          >
            Export CSV
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          icon={SearchLg}
          value={query}
          onChange={setQuery}
          placeholder="Search the log…"
          className="w-64"
        />
        <Select
          selectedKey={kind}
          onSelectionChange={(value) => setKind(String(value))}
          size="md"
          className="w-44"
          placeholder="Activity"
        >
          {KINDS.map((k) => (
            <Select.Item key={k.id} id={k.id} label={k.label} />
          ))}
        </Select>
        <Select
          selectedKey={person}
          onSelectionChange={(value) => setPerson(String(value))}
          size="md"
          className="w-48"
          placeholder="Person"
        >
          <Select.Item id="all" label="Everyone" />
          {people.map(([id, name]) => (
            <Select.Item key={id} id={id} label={name} />
          ))}
        </Select>
      </div>

      {failed && (
        <p role="alert" className="text-meta text-error-primary">
          The log could not be loaded. Check your connection and sign in again.
        </p>
      )}

      {!loading && shown.length === 0 ? (
        <EmptyState
          title={events.length === 0 ? "Nothing logged yet" : "No matches"}
          body={
            events.length === 0
              ? "Activity on this project shows up here as it happens."
              : "Try a different filter, or clear the search."
          }
        />
      ) : (
        <TableCard.Root size="sm">
          <Table aria-label="Activity log">
            <Table.Header>
              <Table.Head id="time" isRowHeader label="Time" />
              <Table.Head id="who" label="Person" />
              <Table.Head id="action" label="Action" />
              <Table.Head id="target" label="On" />
              <Table.Head id="details" label="Details" />
            </Table.Header>
            <Table.Body items={shown}>
              {(e) => (
                <Table.Row id={e.id}>
                  <Table.Cell className="whitespace-nowrap text-tertiary tabular-nums">
                    {stamp(e.at)}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap">
                    <span className="block text-primary">{e.actorName}</span>
                    <span className="block text-caption text-tertiary">
                      {ROLE_LABEL[e.actorRole]}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="font-medium whitespace-nowrap text-primary">
                    {label(e.action)}
                  </Table.Cell>
                  <Table.Cell className="max-w-56">
                    <span className="block truncate" title={e.target.label}>
                      {e.target.label}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="max-w-md">
                    <span className="block">{e.summary}</span>
                    {(e.changes ?? []).map((c) => (
                      <span
                        key={c.field}
                        className="block truncate text-caption text-tertiary"
                        title={`${c.field}: ${c.from ?? ""} → ${c.to ?? ""}`}
                      >
                        {c.field}:{" "}
                        {c.from !== undefined && c.to !== undefined
                          ? `${c.from || "—"} → ${c.to || "—"}`
                          : (c.to ?? c.from ?? "")}
                      </span>
                    ))}
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </TableCard.Root>
      )}

      {!finished && events.length > 0 && (
        <div className="flex justify-center">
          <Button color="secondary" isLoading={loading} onPress={loadMore}>
            Load older entries
          </Button>
        </div>
      )}
    </>
  )
}
