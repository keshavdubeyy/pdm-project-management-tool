"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  EmptyState,
  PersonAvatar,
  PersonChips,
  ProjectTitle,
} from "@/components/common"
import { useConfirm } from "@/components/confirm-dialog"
import { Tab, TabList, Tabs } from "@/components/untitled/application/tabs/tabs"
import { Table, TableCard } from "@/components/untitled/application/table/table"
import { Button } from "@/components/untitled/base/buttons/button"
import { Dropdown } from "@/components/untitled/base/dropdown/dropdown"
import { Input } from "@/components/untitled/base/input/input"
import { SlideoutMenu } from "@/components/untitled/application/slideout-menus/slideout-menu"
import { TextArea } from "@/components/untitled/base/textarea/textarea"
import { formatTimestamp } from "@/lib/dates"
import { hostOf, SERVICE_META } from "@/lib/links"
import { projectsFor } from "@/lib/permissions"
import { personById } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { Artefact, Project } from "@/lib/types"

import {
  ChevronLeft,
  Edit05,
  LinkExternal01,
  Plus,
  Trash01,
  UploadCloud01,
  Users01,
} from "@untitledui/icons"

/** The student's home, version 2: two tabs and nothing else.
 *
 *   1. Meeting notes — a table of the team's notes, stamped with date and time.
 *   2. Progress      — a running log of what the team has made, as links.
 *
 * (To-dos are switched off for now; the store keeps the action-item functions.)
 *
 * Checkpoints, reviews and the rest live on the project page, one click away.
 */
export function StudentDashboard() {
  const { db, actor, currentUser } = useProjectsStore()
  if (!actor || !currentUser) return null

  const project = projectsFor(db, actor)[0]
  if (!project) {
    return (
      <EmptyState
        icon={Users01}
        title="You are not on a project yet"
        body="Your project appears here once the coordinator adds you to a team."
      />
    )
  }

  return <ProjectHome project={project} />
}

/** One team's home: its header and the two tabs. A student sees their own
 * team's; a mentor opens the same page from the list of their teams, so both
 * sides read the same thing. */
export function ProjectHome({
  project,
  backHref,
  backLabel = "Your teams",
  initialTab,
}: {
  project: Project
  backHref?: string
  backLabel?: string
  initialTab?: string
}) {
  const { db } = useProjectsStore()
  const mentors = project.mentorIds
    .map((id) => personById(db, id)?.name)
    .filter(Boolean)
  const firstNames = project.teamMemberIds
    .map((id) => personById(db, id)?.name.split(" ")[0])
    .filter(Boolean)

  return (
    <>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 text-meta font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          {backLabel}
        </Link>
      )}

      <header className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
        <div className="min-w-0 space-y-1.5">
          <h1
            className="truncate text-page text-foreground"
            title={project.title || undefined}
          >
            <ProjectTitle project={project} />
          </h1>
          <p className="text-meta text-muted-foreground">
            {backHref && firstNames.length > 0
              ? `${firstNames.join(" & ")} · `
              : ""}
            Mentor: {mentors.join(", ") || "not assigned yet"} ·{" "}
            {project.teamMemberIds.length} team{" "}
            {project.teamMemberIds.length === 1 ? "member" : "members"}
          </p>
        </div>
      </header>

      <HomeTabs projectId={project.id} initialTab={initialTab} />
    </>
  )
}

/* ---------------------------------------------------------------- tabs */

function HomeTabs({
  projectId,
  initialTab,
}: {
  projectId: string
  initialTab?: string
}) {
  const router = useRouter()
  const { createNote, actor } = useProjectsStore()
  // Faculty write notes too, but progress is the team's own record.
  const isStudent = actor?.role === "student"
  // The coordinator reads a team's notes and progress; they do not add to them.
  const canWrite = actor?.role !== "coordinator"
  const [tab, setTab] = React.useState(
    initialTab === "progress" ? "progress" : "notes"
  )
  const [progressOpen, setProgressOpen] = React.useState(false)
  const [detailId, setDetailId] = React.useState<string | null>(null)
  const newNote = () => {
    const noteId = createNote(projectId)
    if (noteId) router.push(`/notes/${noteId}`)
  }

  return (
    <>
      <Tabs
        className="w-full gap-4"
        selectedKey={tab}
        onSelectionChange={(key) => setTab(String(key))}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabList type="button-border" className="w-fit">
            <Tab id="notes">Meeting notes</Tab>
            <Tab id="progress">Progress</Tab>
          </TabList>

          {/* One action per tab, on the right, for what that tab holds. */}
          {canWrite && tab === "notes" && (
            <Button onPress={newNote} iconLeading={Plus}>
              Create note
            </Button>
          )}
          {isStudent && tab === "progress" && (
            <Button
              onPress={() => setProgressOpen(true)}
              iconLeading={UploadCloud01}
            >
              Upload progress
            </Button>
          )}
        </div>

        <Tabs.Panel id="notes">
          <Notes projectId={projectId} />
        </Tabs.Panel>
        <Tabs.Panel id="progress">
          <Progress projectId={projectId} onOpen={setDetailId} />
        </Tabs.Panel>
      </Tabs>

      {/* Outside <Tabs>: it renders its children twice, once off-screen to build
        its collection, and the hidden copy of an open dialog treats every click
        in the real one as an outside click and closes it. */}
      <ProgressSheet
        projectId={projectId}
        open={progressOpen}
        onOpenChange={setProgressOpen}
      />
      <ProgressDetail
        artefactId={detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
      />
    </>
  )
}

/* ------------------------------------------------------- meeting notes */

/** The team's notes as a table, newest first. A row opens the note; the three
 * dots at its end edit or delete it. */
function Notes({ projectId }: { projectId: string }) {
  const router = useRouter()
  const { db, actor, deleteNote } = useProjectsStore()
  const canWrite = actor?.role !== "coordinator"
  const { confirm, dialog: confirmDialog } = useConfirm()
  const notes = db.notes
    .filter((n) => n.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (notes.length === 0) {
    return (
      <EmptyState
        image="/empty-states/notes.png"
        title="No notes yet"
        className="min-h-[55vh]"
        body={
          canWrite
            ? "Create a note to record what was discussed in a meeting."
            : "The team has not written any notes yet."
        }
      />
    )
  }

  return (
    <>
      <TableCard.Root size="sm">
        <Table aria-label="Meeting notes">
          <Table.Header>
            <Table.Head id="sno" label="S.No" className="w-0" />
            <Table.Head id="title" isRowHeader label="Title" />
            <Table.Head id="author" label="Written by" />
            <Table.Head id="when" label="Date and time" />
            {canWrite && (
              <Table.Head id="actions" aria-label="Actions" className="w-0" />
            )}
          </Table.Header>
          <Table.Body items={notes.map((n, i) => ({ ...n, no: i + 1 }))}>
            {(note) => (
              <Table.Row id={note.id} href={`/notes/${note.id}`}>
                <Table.Cell className="w-0 text-tertiary tabular-nums">
                  {note.no}
                </Table.Cell>
                <Table.Cell className="font-medium whitespace-nowrap text-primary">
                  {note.title || "Untitled"}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  <PersonChips
                    people={[personById(db, note.authorId)]}
                    empty="Unknown"
                  />
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  {formatTimestamp(note.createdAt)}
                </Table.Cell>
                {canWrite && (
                  <Table.Cell className="w-0 pr-4 text-right">
                    <Dropdown.Root>
                      <Dropdown.DotsButton />
                      <Dropdown.Popover className="w-40">
                        <Dropdown.Menu>
                          <Dropdown.Item
                            icon={Edit05}
                            onAction={() => router.push(`/notes/${note.id}`)}
                          >
                            Edit
                          </Dropdown.Item>
                          <Dropdown.Item
                            icon={Trash01}
                            className="[&_span]:text-error-primary [&_svg]:text-fg-error-secondary"
                            onAction={() =>
                              confirm({
                                title: "Delete this note?",
                                description: note.title || "Untitled",
                                confirmLabel: "Delete",
                                destructive: true,
                                onConfirm: () =>
                                  report(deleteNote(note.id), "Note deleted"),
                              })
                            }
                          >
                            Delete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown.Root>
                  </Table.Cell>
                )}
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </TableCard.Root>
      {confirmDialog}
    </>
  )
}

/* ------------------------------------------------------------ progress */

function ProgressSheet({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <SlideoutMenu
      isDismissable
      isOpen={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-xl"
    >
      <ProgressForm projectId={projectId} onDone={() => onOpenChange(false)} />
    </SlideoutMenu>
  )
}

function ProgressForm({
  projectId,
  onDone,
}: {
  projectId: string
  onDone: () => void
}) {
  const { addArtefact } = useProjectsStore()
  const [label, setLabel] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [note, setNote] = React.useState("")

  const upload = () => {
    if (!url.trim()) return
    if (report(addArtefact(projectId, { url, label, note }), "Progress added"))
      onDone()
  }

  return (
    <>
      <SlideoutMenu.Header className="border-b border-secondary pb-4">
        <h2 className="text-lg font-semibold text-primary">Upload progress</h2>
        <p className="text-sm text-tertiary">
          Link to what your team made: a Drive folder, a Figma file, a repo.
        </p>
      </SlideoutMenu.Header>

      <SlideoutMenu.Content>
        <Input
          label="Title"
          value={label}
          onChange={setLabel}
          placeholder="e.g. Wireframes v2"
          autoFocus
        />

        <Input
          label="Link"
          value={url}
          onChange={setUrl}
          placeholder="https://…"
        />

        <TextArea
          label="What changed (optional)"
          value={note}
          onChange={setNote}
          placeholder="A line or two on what is new since last time"
          className="flex-1"
        />
      </SlideoutMenu.Content>

      <SlideoutMenu.Footer className="flex justify-end gap-3">
        <Button color="secondary" onPress={onDone}>
          Cancel
        </Button>
        <Button isDisabled={!url.trim()} onPress={upload}>
          Add progress
        </Button>
      </SlideoutMenu.Footer>
    </>
  )
}

/** The running log of what the team has handed over, as a table. The link opens
 * the work in a new tab; the rest of the row opens the details. */
function Progress({
  projectId,
  onOpen,
}: {
  projectId: string
  onOpen: (artefactId: string) => void
}) {
  const { db, actor } = useProjectsStore()

  const items = db.artefacts
    .filter((a) => a.projectId === projectId)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))

  if (items.length === 0) {
    return (
      <EmptyState
        image="/empty-states/progress.png"
        title="No uploads yet"
        className="min-h-[55vh]"
        body={
          actor?.role === "student"
            ? "Upload a link to your team's latest work to start the log."
            : "The team has not uploaded any progress yet."
        }
      />
    )
  }

  return (
    <TableCard.Root size="sm">
      <Table aria-label="Progress" onRowAction={(key) => onOpen(String(key))}>
        <Table.Header>
          <Table.Head id="sno" label="S.No" className="w-0" />
          <Table.Head id="title" isRowHeader label="Title" />
          <Table.Head id="link" label="Link" />
          <Table.Head id="by" label="Uploaded by" />
          <Table.Head id="when" label="Date and time" />
          <Table.Head id="notes" label="Notes" />
        </Table.Header>
        <Table.Body items={items.map((a, i) => ({ ...a, no: i + 1 }))}>
          {(a) => (
            <Table.Row id={a.id}>
              <Table.Cell className="w-0 text-tertiary tabular-nums">
                {a.no}
              </Table.Cell>
              <Table.Cell className="font-medium whitespace-nowrap text-primary">
                {a.label}
              </Table.Cell>
              <Table.Cell className="max-w-64">
                <ArtefactLink url={a.url} />
              </Table.Cell>
              <Table.Cell className="whitespace-nowrap">
                {personById(db, a.addedBy)?.name ?? "Unknown"}
              </Table.Cell>
              <Table.Cell className="whitespace-nowrap">
                {formatTimestamp(a.addedAt)}
              </Table.Cell>
              <Table.Cell className="max-w-64">
                <span className="block truncate text-tertiary">
                  {a.note || "—"}
                </span>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </TableCard.Root>
  )
}

/** A link that opens the work in a new tab without also opening the row. */
function ArtefactLink({ url }: { url: string }) {
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={url}
      onPointerDown={stop}
      onMouseDown={stop}
      onClick={stop}
      onKeyDown={stop}
      className="inline-flex max-w-full items-center gap-1.5 text-brand-secondary underline-offset-2 hover:underline"
    >
      <span className="truncate">{hostOf(url) || url}</span>
      <LinkExternal01 className="size-3.5 shrink-0" aria-hidden />
    </a>
  )
}

/** Every detail of one upload, in the sheet that opens from its row. */
function ProgressDetail({
  artefactId,
  onOpenChange,
}: {
  artefactId: string | null
  onOpenChange: (open: boolean) => void
}) {
  const { db } = useProjectsStore()
  // Keep the last upload while the sheet slides out, so it doesn't blank.
  const [last, setLast] = React.useState<Artefact | null>(null)
  const current = db.artefacts.find((a) => a.id === artefactId) ?? null
  if (current && current !== last) setLast(current)
  const a = current ?? last
  const by = a ? personById(db, a.addedBy) : null

  return (
    <SlideoutMenu
      isDismissable
      isOpen={artefactId !== null}
      onOpenChange={onOpenChange}
      className="sm:max-w-xl"
    >
      {a && (
        <>
          <SlideoutMenu.Header className="border-b border-secondary pb-4">
            <h2 className="text-lg font-semibold text-primary">{a.label}</h2>
            <p className="text-sm text-tertiary">
              Uploaded {formatTimestamp(a.addedAt)}
            </p>
          </SlideoutMenu.Header>

          <SlideoutMenu.Content>
            <DetailRow label="Link">
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="break-all text-brand-secondary underline-offset-2 hover:underline"
              >
                {a.url}
              </a>
            </DetailRow>
            <DetailRow label="Type">{SERVICE_META[a.service].label}</DetailRow>
            <DetailRow label="Uploaded by">
              <span className="inline-flex items-center gap-2">
                <PersonAvatar person={by} size="xs" />
                {by?.name ?? "Unknown"}
              </span>
            </DetailRow>
            <DetailRow label="Date and time">
              {formatTimestamp(a.addedAt)}
            </DetailRow>
            <DetailRow label="Notes">
              {a.note ? (
                <span className="whitespace-pre-wrap">{a.note}</span>
              ) : (
                <span className="text-tertiary">No notes were added.</span>
              )}
            </DetailRow>
          </SlideoutMenu.Content>

          <SlideoutMenu.Footer className="flex justify-end gap-3">
            <Button color="secondary" onPress={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              href={a.url}
              target="_blank"
              rel="noreferrer"
              iconTrailing={LinkExternal01}
            >
              Open link
            </Button>
          </SlideoutMenu.Footer>
        </>
      )}
    </SlideoutMenu>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-tertiary">{label}</p>
      <div className="text-md text-primary">{children}</div>
    </div>
  )
}
