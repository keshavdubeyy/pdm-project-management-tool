"use client"

import * as React from "react"
import { EmptyState } from "@/components/common"
import { useConfirm } from "@/components/confirm-dialog"
import { Dropdown } from "@/components/untitled/base/dropdown/dropdown"
import { Table, TableCard } from "@/components/untitled/application/table/table"
import { formatTimestamp } from "@/lib/dates"
import { hostOf, normalizeUrl } from "@/lib/links"
import { isMemberOf } from "@/lib/permissions"
import { buildPlan, checkpointNumbers } from "@/lib/plan"
import { progressEntries } from "@/lib/progress-log"
import { milestoneViews, personById } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"

import { LinkExternal01, Trash01 } from "@untitledui/icons"

/** For a link inside a clickable row: its press is its own, and does not also
 * count as a click on the row. */
const ownPress = {
  onPointerDown: (e: React.SyntheticEvent) => e.stopPropagation(),
  onMouseDown: (e: React.SyntheticEvent) => e.stopPropagation(),
  onClick: (e: React.SyntheticEvent) => e.stopPropagation(),
  onKeyDown: (e: React.SyntheticEvent) => e.stopPropagation(),
}

/** Everything the team has handed in, newest first, with its links. A click on
 * a row opens the checkpoint it was submitted on: the same sheet as in the
 * project plan, where the submission and its comments are. */
export function SubmissionsTab({
  projectId,
  onOpenCheckpoint,
}: {
  projectId: string
  /** Opens a checkpoint's sheet, by instance id. */
  onOpenCheckpoint: (milestoneInstanceId: string) => void
}) {
  const { db, actor, removeProgressEntry } = useProjectsStore()
  const { confirm, dialog } = useConfirm()
  const project = db.projects.find((p) => p.id === projectId)
  // Only the team can take its own work back.
  const canDelete = Boolean(actor && project && isMemberOf(actor, project))

  const entries = React.useMemo(
    () => progressEntries(db, projectId),
    [db, projectId]
  )
  const checkpoints = React.useMemo(() => {
    const plan = buildPlan(milestoneViews(db, [projectId]))
    const numbers = checkpointNumbers(plan)
    return new Map(
      plan.flatMap((s) =>
        s.phases.flatMap((p) =>
          p.checkpoints.map(
            (c) =>
              [
                c.instance.id,
                `${numbers.get(c.template.id) ?? ""} ${c.template.title}`.trim(),
              ] as const
          )
        )
      )
    )
  }, [db, projectId])

  if (entries.length === 0) {
    return (
      <EmptyState
        image="/empty-states/submissions.png"
        title="No submissions yet"
        className="min-h-[45vh]"
        body={
          actor?.role === "student"
            ? "Open a checkpoint in the project plan and submit your progress. It will show up here."
            : actor?.role === "mentor"
              ? "Your team has not submitted any progress yet. What they hand in will show up here for you to review."
              : "This team has not submitted any progress yet."
        }
      />
    )
  }

  const checkpointOf = (id: string) =>
    entries.find((e) => e.id === id)?.artefacts[0]?.milestoneInstanceId ?? null

  return (
    <TableCard.Root size="sm">
      <Table
        aria-label="Submissions"
        onRowAction={(key) => {
          const instanceId = checkpointOf(String(key))
          if (instanceId) onOpenCheckpoint(instanceId)
        }}
      >
        <Table.Header>
          <Table.Head id="title" isRowHeader label="Title" />
          <Table.Head id="checkpoint" label="Checkpoint" />
          <Table.Head id="links" label="Links" />
          <Table.Head id="by" label="Submitted by" />
          <Table.Head id="when" label="Date and time" />
          {canDelete && (
            <Table.Head id="actions" aria-label="Actions" className="w-0" />
          )}
        </Table.Header>
        <Table.Body items={entries}>
          {(entry) => {
            const instanceId = entry.artefacts[0]?.milestoneInstanceId
            return (
              <Table.Row id={entry.id}>
                <Table.Cell className="font-medium whitespace-nowrap text-primary">
                  {entry.label}
                </Table.Cell>
                <Table.Cell className="max-w-64">
                  <span className="block truncate">
                    {(instanceId && checkpoints.get(instanceId)) || "—"}
                  </span>
                </Table.Cell>
                <Table.Cell className="max-w-72">
                  <span className="flex flex-col gap-0.5">
                    {entry.artefacts.map((a) => (
                      <a
                        key={a.id}
                        href={normalizeUrl(a.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={a.url}
                        {...ownPress}
                        className="inline-flex max-w-full items-center gap-1.5 text-brand-secondary underline-offset-2 hover:underline"
                      >
                        <span className="truncate">
                          {hostOf(a.url) || a.url}
                        </span>
                        <LinkExternal01
                          className="size-3.5 shrink-0"
                          aria-hidden
                        />
                      </a>
                    ))}
                  </span>
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  {personById(db, entry.by)?.name ?? "Unknown"}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  {formatTimestamp(entry.at)}
                </Table.Cell>
                {canDelete && (
                  <Table.Cell className="w-0 pr-4 text-right">
                    <span {...ownPress}>
                      <Dropdown.Root>
                        <Dropdown.DotsButton />
                        <Dropdown.Popover className="w-44">
                          <Dropdown.Menu>
                            <Dropdown.Item
                              key="delete"
                              icon={Trash01}
                              className="[&_span]:text-error-primary [&_svg]:text-fg-error-secondary"
                              onAction={() =>
                                confirm({
                                  title: "Are you sure you want to delete?",
                                  description:
                                    "This submission will also be removed from your project plan.",
                                  confirmLabel: "Delete",
                                  destructive: true,
                                  onConfirm: () =>
                                    report(
                                      removeProgressEntry(
                                        entry.artefacts.map((a) => a.id)
                                      ),
                                      "Submission deleted"
                                    ),
                                })
                              }
                            >
                              Delete
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown.Popover>
                      </Dropdown.Root>
                    </span>
                  </Table.Cell>
                )}
              </Table.Row>
            )
          }}
        </Table.Body>
      </Table>
      {dialog}
    </TableCard.Root>
  )
}
