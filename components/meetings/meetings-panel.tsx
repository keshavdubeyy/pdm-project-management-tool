"use client"

import * as React from "react"
import { ActionItemList } from "@/components/meetings/action-items"
import { AvatarStack, EmptyState, SectionHeading } from "@/components/common"
import { Button } from "@/components/untitled/base/buttons/button"
import { Checkbox } from "@/components/untitled/base/checkbox/checkbox"
import { ModalDialog } from "@/components/untitled/application/modals/modal-dialog"
import { Input } from "@/components/untitled/base/input/input"
import { Label } from "@/components/untitled/base/input/label"
import { TextArea } from "@/components/untitled/base/textarea/textarea"
import { formatDateLong, timeAgo, todayIso } from "@/lib/dates"
import { isMemberOf } from "@/lib/permissions"
import { openSinceLastMeeting, personById } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { Meeting, Project } from "@/lib/types"
import { cn } from "@/lib/utils"

import {
  CheckCircle,
  Clock,
  Edit05,
  LinkExternal01,
  Plus,
} from "@untitledui/icons"

/** Meetings, minutes and what came out of them.
 *
 * The block at the top is the whole point of this screen: the actions still
 * open since the last meeting, sitting above the next one before anybody has
 * to ask for them. */
export function MeetingsPanel({ project }: { project: Project }) {
  const { db, actor } = useProjectsStore()
  const meetings = db.meetings
    .filter((m) => m.projectId === project.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  const { lastMeeting, open, closedSince } = openSinceLastMeeting(
    db,
    project.id
  )
  const allActions = db.actionItems
    .filter((a) => a.projectId === project.id)
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))

  if (!actor) return null

  return (
    <div className="space-y-8">
      {/* ------------------------------------------ carry-forward */}
      <section>
        <SectionHeading
          count={open.length}
          hint={
            lastMeeting
              ? `since ${formatDateLong(lastMeeting.date)}`
              : undefined
          }
        >
          Open since the last meeting
        </SectionHeading>
        {open.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-status-accepted-br bg-status-accepted-bg px-3 py-2.5 text-meta text-status-accepted-fg">
            <CheckCircle className="size-4" />
            Nothing carried over. Everything agreed last time is done.
          </div>
        ) : (
          <ActionItemList project={project} items={open} allowAdd={false} />
        )}
        {closedSince.length > 0 && (
          <p className="mt-2 text-caption text-muted-foreground">
            {closedSince.length} closed since then.
          </p>
        )}
      </section>

      <hr className="h-px w-full border-none bg-border-secondary" />

      {/* ------------------------------------------------- actions */}
      <section>
        <SectionHeading count={allActions.length}>All actions</SectionHeading>
        <ActionItemList project={project} items={allActions} />
      </section>

      <hr className="h-px w-full border-none bg-border-secondary" />

      {/* ------------------------------------------------ meetings */}
      <section>
        <SectionHeading
          count={meetings.length}
          action={<NewMeetingDialog project={project} />}
        >
          Meetings
        </SectionHeading>

        {meetings.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No meetings yet"
            body="Record a meeting so its decisions and actions have somewhere to live."
          />
        ) : (
          <ol className="space-y-3">
            {meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                project={project}
              />
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function MeetingCard({
  meeting,
  project,
}: {
  meeting: Meeting
  project: Project
}) {
  const { db, actor, confirmMinutes } = useProjectsStore()
  const minutes = db.minutes.find((m) => m.meetingId === meeting.id)
  const actions = db.actionItems.filter((a) => a.meetingId === meeting.id)
  const attendees = meeting.attendeeIds.map((personId) =>
    personById(db, personId)
  )
  const [editing, setEditing] = React.useState(false)

  if (!actor) return null
  const isTeam = isMemberOf(actor, project)
  const needsMyConfirmation = minutes
    ? isTeam
      ? !minutes.confirmedByTeamAt
      : !minutes.confirmedByMentorAt
    : false

  return (
    <li className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <Clock className="size-4 text-muted-foreground" />
        <span className="text-subhead">{meeting.title}</span>
        <span className="text-caption text-muted-foreground">
          {formatDateLong(meeting.date)}
          {meeting.time && ` · ${meeting.time}`}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <AvatarStack people={attendees} />
          {meeting.callUrl && (
            <Button
              color="tertiary"
              size="xs"
              href={meeting.callUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open the call link"
              iconLeading={LinkExternal01}
            />
          )}
        </div>
      </div>

      <div className="space-y-4 p-4">
        {minutes && !editing ? (
          <div className="space-y-3">
            <MinuteBlock label="Discussed" body={minutes.discussed} />
            <MinuteBlock label="Decided" body={minutes.decided} />
            <MinuteBlock label="Next" body={minutes.next} />
            <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
              <span>
                Recorded by{" "}
                {personById(db, minutes.recordedBy)?.name ?? "someone"} ·{" "}
                {timeAgo(minutes.recordedAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                {minutes.confirmedByTeamAt && (
                  <span className="inline-flex items-center gap-0.5">
                    <CheckCircle className="size-3 text-status-accepted-solid" />
                    team
                  </span>
                )}
                {minutes.confirmedByMentorAt && (
                  <span className="inline-flex items-center gap-0.5">
                    <CheckCircle className="size-3 text-status-accepted-solid" />
                    mentor
                  </span>
                )}
              </span>
              <div className="ml-auto flex gap-1.5">
                {needsMyConfirmation && (
                  <Button
                    size="xs"
                    color="secondary"
                    onPress={() =>
                      report(confirmMinutes(minutes.id), "Confirmed")
                    }
                  >
                    These are right
                  </Button>
                )}
                <Button
                  size="xs"
                  color="tertiary"
                  onPress={() => setEditing(true)}
                >
                  Edit
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <MinutesEditor
            meeting={meeting}
            initial={minutes}
            onDone={() => setEditing(false)}
            onCancel={minutes ? () => setEditing(false) : undefined}
          />
        )}

        <hr className="h-px w-full border-none bg-border-secondary" />
        <div>
          <p className="mb-2 text-th text-muted-foreground uppercase">
            Actions from this meeting
          </p>
          <ActionItemList
            project={project}
            items={actions}
            meetingId={meeting.id}
          />
        </div>
      </div>
    </li>
  )
}

function MinuteBlock({ label, body }: { label: string; body: string }) {
  if (!body?.trim()) return null
  return (
    <div>
      <p className="text-th text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5 text-meta whitespace-pre-line text-foreground">
        {body}
      </p>
    </div>
  )
}

function MinutesEditor({
  meeting,
  initial,
  onDone,
  onCancel,
}: {
  meeting: Meeting
  initial?: { discussed: string; decided: string; next: string }
  onDone: () => void
  onCancel?: () => void
}) {
  const { saveMinutes } = useProjectsStore()
  const [discussed, setDiscussed] = React.useState(initial?.discussed ?? "")
  const [decided, setDecided] = React.useState(initial?.decided ?? "")
  const [next, setNext] = React.useState(initial?.next ?? "")

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border p-3">
      <p className="flex items-center gap-1.5 text-th text-muted-foreground uppercase">
        <Edit05 className="size-3.5" />
        Minutes
      </p>
      <Field
        label="What was discussed"
        value={discussed}
        onChange={setDiscussed}
      />
      <Field label="What was decided" value={decided} onChange={setDecided} />
      <Field
        label="What happens next"
        value={next}
        onChange={setNext}
        rows={2}
      />
      <div className="flex justify-end gap-1.5">
        {onCancel && (
          <Button size="xs" color="tertiary" onPress={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          size="xs"
          isDisabled={!discussed.trim() && !decided.trim()}
          onPress={() => {
            if (
              report(
                saveMinutes(meeting.id, { discussed, decided, next }),
                "Minutes saved"
              )
            ) {
              onDone()
            }
          }}
        >
          Save minutes
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
}) {
  const id = React.useId()
  return (
    <div className="space-y-1">
      <TextArea
        id={id}
        label={label}
        rows={rows}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

function NewMeetingDialog({ project }: { project: Project }) {
  const { db, addMeeting } = useProjectsStore()
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState("Weekly mentor review")
  const [date, setDate] = React.useState(todayIso())
  const [time, setTime] = React.useState("15:00")
  const [callUrl, setCallUrl] = React.useState("")
  const everyone = [...project.teamMemberIds, ...project.mentorIds]
  const [attendees, setAttendees] = React.useState<string[]>(everyone)

  return (
    <>
      <Button
        color="secondary"
        size="xs"
        onPress={() => setOpen(true)}
        iconLeading={Plus}
      >
        Record a meeting
      </Button>
      <ModalDialog
        isOpen={open}
        onOpenChange={setOpen}
        title={<>Record a meeting</>}
        description={
          <>
            Minutes and actions hang off this, so record it even if it already
            happened.
          </>
        }
        footer={
          <>
            <Button color="tertiary" slot="close">
              Cancel
            </Button>
            <Button
              onPress={() => {
                const result = addMeeting(project.id, {
                  title,
                  date,
                  time,
                  attendeeIds: attendees,
                  callUrl,
                })
                if (report(result, "Meeting recorded")) setOpen(false)
              }}
            >
              Record meeting
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Input label="Title" value={title} onChange={setTitle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Input label="Date" type="date" value={date} onChange={setDate} />
            </div>
            <div className="space-y-1.5">
              <Input label="Time" type="time" value={time} onChange={setTime} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Input
              label="Call link"
              value={callUrl}
              onChange={setCallUrl}
              placeholder="https://meet.google.com/…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Who was there</Label>
            <div className="space-y-0.5">
              {everyone.map((personId) => {
                const person = personById(db, personId)
                if (!person) return null
                return (
                  <Checkbox
                    key={personId}
                    isSelected={attendees.includes(personId)}
                    onChange={() =>
                      setAttendees((prev) =>
                        prev.includes(personId)
                          ? prev.filter((x) => x !== personId)
                          : [...prev, personId]
                      )
                    }
                    label={person.name}
                    hint={
                      project.mentorIds.includes(personId) ? "mentor" : "team"
                    }
                    className="px-2 py-1"
                  />
                )
              })}
            </div>
          </div>
        </div>
      </ModalDialog>
    </>
  )
}
