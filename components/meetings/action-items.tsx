"use client"

import * as React from "react"
import { EmptyState, PersonAvatar } from "@/components/common"
import { useConfirm } from "@/components/confirm-dialog"
import { Button } from "@/components/untitled/base/buttons/button"
import { Checkbox } from "@/components/untitled/base/checkbox/checkbox"
import { Input } from "@/components/untitled/base/input/input"
import { Select } from "@/components/untitled/base/select/select"
import {
  Tooltip,
  TooltipTrigger,
} from "@/components/untitled/base/tooltip/tooltip"
import { addDays, describeDue, todayIso } from "@/lib/dates"
import { canVerifyAction, isCoordinator, isMemberOf } from "@/lib/permissions"
import { personById } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { ActionItem, Project } from "@/lib/types"
import { cn } from "@/lib/utils"

import {
  Check,
  CheckVerified01,
  ClipboardCheck,
  Plus,
  Trash01,
  XClose,
} from "@untitledui/icons"

/** An action is a verb, one named owner, and a date.
 *
 * Owners are individuals rather than teams on purpose: "the team will do it"
 * is how a thing ends up nobody's. */
export function ActionItemList({
  project,
  items,
  meetingId,
  noteId,
  allowAdd = true,
  emptyMessage,
  simple = false,
}: {
  project: Project
  items: ActionItem[]
  meetingId?: string
  noteId?: string
  allowAdd?: boolean
  emptyMessage?: string
  /** A plain to-do list: one input to add, no owner or date to pick or show. */
  simple?: boolean
}) {
  const {
    db,
    actor,
    addActionItem,
    toggleActionItem,
    verifyActionItem,
    deleteActionItem,
  } = useProjectsStore()
  const { confirm, dialog: confirmDialog } = useConfirm()
  const [adding, setAdding] = React.useState(false)
  const [text, setText] = React.useState("")
  const [ownerId, setOwnerId] = React.useState(project.teamMemberIds[0] ?? "")
  const [dueDate, setDueDate] = React.useState(addDays(todayIso(), 7))

  if (!actor) return null
  // With nothing yet, the editor is simply there; no empty state to click past.
  const empty = items.length === 0
  // The programme coordinator reads a team's action items; the team and its
  // mentors write them. So for the coordinator there is no way to add.
  const canAdd = allowAdd && !isCoordinator(actor)
  const showForm = canAdd && (adding || (empty && !simple))
  const canVerify = canVerifyAction(actor, project)
  const people = [...project.teamMemberIds, ...project.mentorIds]
  // Newest on top; anything ticked off sinks to the bottom.
  const ordered = [...items].sort(
    (a, b) =>
      Number(a.status === "done") - Number(b.status === "done") ||
      b.createdAt.localeCompare(a.createdAt)
  )

  const submit = () => {
    const result = addActionItem(project.id, {
      text,
      ownerId: simple ? actor.person.id : ownerId,
      dueDate,
      meetingId,
      noteId,
    })
    if (report(result, "Action added")) {
      setText("")
      setAdding(false)
    }
  }

  return (
    <div className="space-y-2">
      {empty ? (
        !canAdd && (
          <EmptyState
            icon={ClipboardCheck}
            title="No open actions"
            body={
              emptyMessage ??
              "Actions agreed in a meeting appear here with an owner and a date."
            }
            className="py-6"
          />
        )
      ) : (
        <ul className="space-y-1">
          {ordered.map((item) => {
            const owner = personById(db, item.ownerId)
            const due = describeDue(item.dueDate)
            const overdue = item.status === "open" && due.overdue

            return (
              <li
                key={item.id}
                className={cn(
                  "group flex gap-2.5 rounded-xl border px-3 py-2",
                  simple ? "items-center" : "items-start",
                  overdue
                    ? "border-status-overdue-br bg-status-overdue-bg"
                    : "border-border bg-card"
                )}
              >
                <Checkbox
                  isSelected={item.status === "done"}
                  onChange={() => report(toggleActionItem(item.id))}
                  className={simple ? undefined : "mt-0.5"}
                  aria-label={`Mark "${item.text}" ${item.status === "done" ? "not done" : "done"}`}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-meta",
                      item.status === "done" &&
                        "text-muted-foreground line-through"
                    )}
                  >
                    {item.text}
                  </p>
                  {!simple && (
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <PersonAvatar person={owner} size="xs" />
                        {owner?.name.split(" ")[0] ?? "Unassigned"}
                      </span>
                      <span
                        className={cn(
                          overdue && "font-medium text-status-overdue-fg"
                        )}
                      >
                        {item.status === "done" ? "Done" : due.label}
                      </span>
                      {item.source === "review" && <span>from a review</span>}
                      {item.verifiedAt && (
                        <Tooltip
                          title={
                            <>
                              Confirmed by{" "}
                              {personById(db, item.verifiedBy ?? "")?.name ??
                                "the mentor"}
                            </>
                          }
                        >
                          <TooltipTrigger className="inline-flex items-center gap-0.5">
                            <CheckVerified01 className="size-3 text-status-accepted-solid" />
                            confirmed
                          </TooltipTrigger>
                        </Tooltip>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  {canVerify && item.status === "done" && !item.verifiedAt && (
                    <Button
                      color="tertiary"
                      size="xs"
                      onPress={() =>
                        report(verifyActionItem(item.id), "Confirmed")
                      }
                    >
                      Confirm
                    </Button>
                  )}
                  {(item.createdBy === actor.person.id || canVerify) && (
                    <Button
                      color="tertiary-destructive"
                      size="xs"
                      aria-label="Remove action"
                      onPress={() =>
                        confirm({
                          title: "Remove this action?",
                          description: item.text,
                          confirmLabel: "Remove",
                          destructive: true,
                          onConfirm: () => report(deleteActionItem(item.id)),
                        })
                      }
                      iconLeading={Trash01}
                    />
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {canAdd &&
        (showForm && !simple ? (
          <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
            <Input
              value={text}
              onChange={setText}
              placeholder={
                simple
                  ? "Write an item"
                  : "Run five more customer interviews and write them up"
              }
              autoFocus={adding}
              onKeyDown={(event) => {
                if (event.key === "Enter" && text.trim()) submit()
                if (event.key === "Escape") setAdding(false)
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              {!simple && (
                <>
                  <Select
                    selectedKey={ownerId}
                    onSelectionChange={(value) =>
                      setOwnerId(String(value ?? ""))
                    }
                    size="sm"
                    className="w-44"
                    placeholder="Owner"
                  >
                    {people.map((personId) => {
                      const person = personById(db, personId)
                      if (!person) return null
                      return (
                        <Select.Item
                          key={personId}
                          id={personId}
                          label={person.name}
                        />
                      )
                    })}
                  </Select>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={setDueDate}
                    className="w-40"
                  />
                </>
              )}
              <div className="ml-auto flex gap-1.5">
                {(!empty || simple) && (
                  <Button
                    color="tertiary"
                    size="xs"
                    onPress={() => setAdding(false)}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  size="xs"
                  isDisabled={!text.trim() || !ownerId}
                  onPress={submit}
                >
                  {simple ? "Add" : "Add action"}
                </Button>
              </div>
            </div>
          </div>
        ) : simple && adding ? (
          <div className="relative">
            <Input
              value={text}
              onChange={setText}
              placeholder="Write an item"
              aria-label="New action item"
              inputClassName="pr-16"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter" && text.trim()) submit()
                if (event.key === "Escape") setAdding(false)
              }}
            />
            <div className="absolute inset-y-0 right-2 flex items-center gap-0.5">
              <Button
                color="tertiary"
                size="xs"
                aria-label="Add item"
                isDisabled={!text.trim()}
                onPress={submit}
                iconLeading={Check}
              />
              <Button
                color="tertiary"
                size="xs"
                aria-label="Cancel"
                onPress={() => {
                  setText("")
                  setAdding(false)
                }}
                iconLeading={XClose}
              />
            </div>
          </div>
        ) : (
          <Button
            color="secondary"
            size="xs"
            onPress={() => setAdding(true)}
            iconLeading={Plus}
          >
            {simple
              ? empty
                ? "Add your first item"
                : "Add one more item"
              : "Add an action"}
          </Button>
        ))}
      {confirmDialog}
    </div>
  )
}
