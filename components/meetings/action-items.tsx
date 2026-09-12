"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkBadge01Icon,
  CheckListIcon,
  Delete02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"

import { EmptyState, PersonAvatar } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { addDays, describeDue, todayIso } from "@/lib/dates"
import { canVerifyAction, isMemberOf } from "@/lib/permissions"
import { personById } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { ActionItem, Project } from "@/lib/types"
import { cn } from "@/lib/utils"

/** An action is a verb, one named owner, and a date.
 *
 * Owners are individuals rather than teams on purpose: "the team will do it"
 * is how a thing ends up nobody's. */
export function ActionItemList({
  project,
  items,
  meetingId,
  allowAdd = true,
  emptyMessage,
}: {
  project: Project
  items: ActionItem[]
  meetingId?: string
  allowAdd?: boolean
  emptyMessage?: string
}) {
  const { db, actor, addActionItem, toggleActionItem, verifyActionItem, deleteActionItem } =
    useProjectsStore()
  const [adding, setAdding] = React.useState(false)
  const [text, setText] = React.useState("")
  const [ownerId, setOwnerId] = React.useState(project.teamMemberIds[0] ?? "")
  const [dueDate, setDueDate] = React.useState(addDays(todayIso(), 7))

  if (!actor) return null
  const canVerify = canVerifyAction(actor, project)
  const people = [...project.teamMemberIds, ...project.mentorIds]

  const submit = () => {
    const result = addActionItem(project.id, { text, ownerId, dueDate, meetingId })
    if (report(result, "Action added")) {
      setText("")
      setAdding(false)
    }
  }

  return (
    <div className="space-y-2">
      {items.length === 0 && !adding ? (
        <EmptyState
          icon={CheckListIcon}
          title="Nothing outstanding"
          body={emptyMessage ?? "Actions agreed in a meeting will appear here with an owner and a date."}
          className="py-6"
        />
      ) : (
        <ul className="space-y-1">
          {items.map((item) => {
            const owner = personById(db, item.ownerId)
            const due = describeDue(item.dueDate)
            const overdue = item.status === "open" && due.overdue

            return (
              <li
                key={item.id}
                className={cn(
                  "group flex items-start gap-2.5 rounded-sm border px-3 py-2",
                  overdue
                    ? "border-status-overdue-br bg-status-overdue-bg"
                    : "border-border bg-card"
                )}
              >
                <Checkbox
                  checked={item.status === "done"}
                  onCheckedChange={() => report(toggleActionItem(item.id))}
                  className="mt-0.5"
                  aria-label={`Mark "${item.text}" ${item.status === "done" ? "not done" : "done"}`}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-meta",
                      item.status === "done" && "text-muted-foreground line-through"
                    )}
                  >
                    {item.text}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <PersonAvatar person={owner} size="xs" />
                      {owner?.name.split(" ")[0] ?? "Unassigned"}
                    </span>
                    <span className={cn(overdue && "font-medium text-status-overdue-fg")}>
                      {item.status === "done" ? "Done" : due.label}
                    </span>
                    {item.source === "review" && <span>from a review</span>}
                    {item.verifiedAt && (
                      <Tooltip>
                        <TooltipTrigger
                          render={<span className="inline-flex items-center gap-0.5" />}
                        >
                          <HugeiconsIcon
                            icon={CheckmarkBadge01Icon}
                            className="size-3 text-status-accepted-solid"
                            strokeWidth={2}
                          />
                          confirmed
                        </TooltipTrigger>
                        <TooltipContent>
                          Confirmed by {personById(db, item.verifiedBy ?? "")?.name ?? "the mentor"}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  {canVerify && item.status === "done" && !item.verifiedAt && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => report(verifyActionItem(item.id), "Confirmed")}
                    >
                      Confirm
                    </Button>
                  )}
                  {item.createdBy === actor.person.id && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Remove action"
                      onClick={() => report(deleteActionItem(item.id))}
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-3" strokeWidth={2} />
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {allowAdd &&
        (adding ? (
          <div className="space-y-2 rounded-sm border border-dashed border-border p-3">
            <Input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Run five more customer interviews and write them up"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter" && text.trim()) submit()
                if (event.key === "Escape") setAdding(false)
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Select value={ownerId} onValueChange={(value) => setOwnerId(value ?? "")}>
                <SelectTrigger size="sm" className="w-44">
                  <SelectValue placeholder="Owner">
                  {(value) => personById(db, String(value))?.name ?? "Owner"}
                </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {people.map((personId) => {
                    const person = personById(db, personId)
                    if (!person) return null
                    return (
                      <SelectItem key={personId} value={personId}>
                        {person.name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="h-8 w-40"
              />
              <div className="ml-auto flex gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button size="sm" disabled={!text.trim() || !ownerId} onClick={submit}>
                  Add action
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <HugeiconsIcon icon={PlusSignIcon} className="size-4" strokeWidth={2} />
            Add an action
          </Button>
        ))}
    </div>
  )
}
