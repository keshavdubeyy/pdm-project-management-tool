"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { EmptyState } from "@/components/common"
import { useConfirm } from "@/components/confirm-dialog"
import {
  MarkdownEditor,
  type MarkdownEditorHandle,
} from "@/components/notes/markdown-editor"
import { ActionItemList } from "@/components/meetings/action-items"
import { MarkdownView } from "@/components/notes/markdown-view"
import { Button } from "@/components/untitled/base/buttons/button"
import { Tab, TabList, Tabs } from "@/components/untitled/application/tabs/tabs"
import { formatTimestamp, timeAgo } from "@/lib/dates"
import { toMarkdown } from "@/lib/notes-markdown"
import { canViewProject, isMemberOf, isMentorOf } from "@/lib/permissions"
import { personById } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { Note } from "@/lib/types"
import { cn } from "@/lib/utils"

import { ChevronLeft, Trash01 } from "@untitledui/icons"

/** One note, as a page, written in markdown.
 *
 * The team writes; mentors and the coordinator read. Writing saves itself a
 * moment after you stop typing. Edit shows the markdown source, styled as you
 * type; Reading view shows it rendered. (Comments are switched off for now.)
 */
export default function NotePage() {
  const params = useParams<{ id: string }>()
  const { db, actor } = useProjectsStore()

  const note = db.notes.find((n) => n.id === params.id)
  if (!actor) return null
  if (!note) {
    return (
      <EmptyState
        title="This note no longer exists"
        body="It may have been deleted."
      />
    )
  }

  const project = db.projects.find((p) => p.id === note.projectId)
  if (!project || !canViewProject(actor, project, db)) {
    return (
      <EmptyState
        title="This note is not visible to you"
        body="Only the team, its mentors and the programme coordinator can open it."
      />
    )
  }

  return <NoteView key={note.id} note={note} />
}

type Mode = "edit" | "read"

function NoteView({ note }: { note: Note }) {
  const router = useRouter()
  const { confirm, dialog: confirmDialog } = useConfirm()
  const { db, actor, updateNote, deleteNote } = useProjectsStore()
  const project = db.projects.find((p) => p.id === note.projectId)!
  const author = personById(db, note.authorId)

  // The team and its mentors edit the text. The coordinator reads.
  const canEdit =
    !!actor &&
    (isMemberOf(actor, project) ||
      isMentorOf(actor, project) ||
      note.authorId === actor.person.id)
  const [title, setTitle] = React.useState(note.title)
  const [saving, setSaving] = React.useState(false)
  const [mode, setMode] = React.useState<Mode>(canEdit ? "edit" : "read")
  const editor = React.useRef<MarkdownEditorHandle>(null)

  // Notes saved before markdown arrived are HTML; they read as markdown from
  // here on, and are written back as markdown below.
  const markdown = toMarkdown(note.content)

  /* ----------------------------------------------------------- autosave */

  const pending = React.useRef<{ title?: string; content?: string }>({})
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  // Latest save function for the timer, which outlives a render.
  const save = React.useRef(updateNote)
  React.useEffect(() => {
    save.current = updateNote
  })

  const flush = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    const patch = pending.current
    if (patch.title === undefined && patch.content === undefined) return
    pending.current = {}
    save.current(note.id, patch)
    setSaving(false)
  }, [note.id])

  const schedule = React.useCallback(
    (patch: { title?: string; content?: string }) => {
      pending.current = { ...pending.current, ...patch }
      setSaving(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(flush, 700)
    },
    [flush]
  )

  // Leaving the page must not lose the last few keystrokes.
  React.useEffect(() => () => flush(), [flush])

  // Write an old HTML note back as markdown, once.
  React.useEffect(() => {
    if (canEdit && markdown !== note.content) {
      save.current(note.id, { content: markdown })
    }
  }, [canEdit, markdown, note.content, note.id])

  // Pick up changes saved from another tab, unless this one has unsaved typing.
  React.useEffect(() => {
    if (pending.current.content !== undefined) return
    editor.current?.setValue(markdown)
  }, [markdown])

  const switchMode = React.useCallback(
    (next: Mode) => {
      // Reading view renders what is saved, so save before showing it.
      flush()
      setMode(next)
    },
    [flush]
  )

  // Cmd/Ctrl+E flips between the two views, as in Obsidian.
  React.useEffect(() => {
    if (!canEdit) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
        e.preventDefault()
        switchMode(mode === "edit" ? "read" : "edit")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [canEdit, mode, switchMode])

  const backHref =
    actor?.role === "student" ? "/" : `/projects/${project.id}?tab=notes`

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex min-w-0 items-center gap-2 text-meta text-muted-foreground">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Notes
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate font-medium text-foreground">
            {title || "Untitled"}
          </span>
        </nav>
        {canEdit && (
          <Button
            color="link-gray"
            size="xs"
            iconLeading={Trash01}
            onPress={() => {
              confirm({
                title: "Delete this note?",
                description:
                  "This removes the note for the whole team and cannot be undone.",
                confirmLabel: "Delete",
                destructive: true,
                onConfirm: () => {
                  if (report(deleteNote(note.id))) router.push("/")
                },
              })
            }}
          >
            Delete note
          </Button>
        )}
      </div>
      {confirmDialog}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <article className="min-w-0">
          <p className="text-caption text-muted-foreground">
            {saving ? "Saving…" : `Last saved ${timeAgo(note.updatedAt)}`}
          </p>
          <input
            value={title}
            readOnly={!canEdit}
            onChange={(e) => {
              setTitle(e.target.value)
              schedule({ title: e.target.value })
            }}
            placeholder="Untitled note"
            aria-label="Note title"
            title={canEdit ? "Click to rename" : undefined}
            className={cn(
              "-mx-2 mt-1 w-[calc(100%+1rem)] rounded-lg bg-transparent px-2 py-1 text-page text-foreground outline-none placeholder:text-muted-foreground",
              canEdit &&
                "transition-colors hover:bg-bg-primary_hover focus:bg-bg-primary focus:ring-2 focus:ring-focus-ring"
            )}
          />
          <p className="mt-2 text-caption text-muted-foreground">
            {author?.name} · {formatTimestamp(note.createdAt)}
          </p>

          {canEdit && (
            <div className="mt-5 flex items-center gap-3">
              {/* `w-fit` so the toggle hugs its two tabs. `outline-none` on the
                tabs: the active tab is already marked by its raised chip, and
                a click should not leave a ring around it. */}
              <Tabs
                className="w-fit"
                selectedKey={mode}
                onSelectionChange={(v) => switchMode(v as Mode)}
              >
                <TabList type="button-border">
                  <Tab id="edit" className="outline-none">
                    Edit
                  </Tab>
                  <Tab id="read" className="outline-none">
                    Reading view
                  </Tab>
                </TabList>
              </Tabs>
            </div>
          )}

          <div className="mt-6">
            {mode === "edit" && canEdit ? (
              <MarkdownEditor
                ref={editor}
                initialValue={markdown}
                onChange={(value) => schedule({ content: value })}
                placeholder="Write the points from the meeting…"
                autoFocus={!markdown}
              />
            ) : (
              <MarkdownView source={markdown} />
            )}
          </div>
        </article>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <h2 className="mb-2 text-title text-foreground">Action items</h2>
          <ActionItemList
            project={project}
            noteId={note.id}
            simple
            items={db.actionItems
              .filter((a) => a.noteId === note.id)
              .sort((a, b) => a.createdAt.localeCompare(b.createdAt))}
          />
        </aside>
      </div>
    </div>
  )
}
