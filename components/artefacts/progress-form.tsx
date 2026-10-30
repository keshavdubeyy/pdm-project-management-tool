"use client"

import * as React from "react"
import { SlideoutMenu } from "@/components/untitled/application/slideout-menus/slideout-menu"
import { Button } from "@/components/untitled/base/buttons/button"
import { normalizeUrl } from "@/lib/links"
import { Input } from "@/components/untitled/base/input/input"
import { TextArea } from "@/components/untitled/base/textarea/textarea"

import {
  Edit05,
  LinkExternal01,
  Plus,
  Trash01,
  XClose,
} from "@untitledui/icons"

export type ProgressValues = { label: string; url: string; note: string }

/** The one form for handing in progress: a title, a link and what changed.
 *
 * The Progress tab's upload sheet and a checkpoint's Submit progress sheet are
 * the same question, so they are the same form. What happens to the answer is
 * the caller's: it returns true when it worked, and the sheet closes. */
export function ProgressForm({
  heading,
  hint = "Link to what your team made: a Drive folder, a Figma file, a repo.",
  confirmLabel,
  defaults,
  noteLabel = "What changed (optional)",
  notePlaceholder = "A line or two on what is new since last time",
  extra,
  onSubmit,
  onDone,
}: {
  heading: string
  hint?: string
  confirmLabel: string
  /** What the note box is called, for when it is not about what changed. */
  noteLabel?: string
  notePlaceholder?: string
  /** One more field under the note, for what only some forms ask. */
  extra?: React.ReactNode
  /** What the fields start with, which the person can still change. A
   * checkpoint fills the title with its own name, so the work is filed under
   * "Detailed Project Plan" and not "Untitled"; an edit starts from what was
   * saved. */
  defaults?: Partial<ProgressValues>
  onSubmit: (values: ProgressValues) => boolean
  onDone: () => void
}) {
  const [label, setLabel] = React.useState(defaults?.label ?? "")
  const [url, setUrl] = React.useState(defaults?.url ?? "")
  const [note, setNote] = React.useState(defaults?.note ?? "")

  const send = () => {
    if (!url.trim()) return
    if (onSubmit({ label, url, note })) onDone()
  }

  return (
    <>
      <SlideoutMenu.Header className="border-b border-secondary pb-4">
        <h2 className="text-lg font-semibold text-primary">{heading}</h2>
        <p className="text-sm text-tertiary">{hint}</p>
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
          label={noteLabel}
          value={note}
          onChange={setNote}
          placeholder={notePlaceholder}
          className="flex-1"
        />
        {extra}
      </SlideoutMenu.Content>

      <SlideoutMenu.Footer className="flex justify-end gap-3">
        <Button color="secondary" onPress={onDone}>
          Cancel
        </Button>
        <Button isDisabled={!url.trim()} onPress={send}>
          {confirmLabel}
        </Button>
      </SlideoutMenu.Footer>
    </>
  )
}

/** Most links one submission can carry. Enough for a report and what goes with
 * it, few enough that the sheet stays short. */
export const MAX_LINKS = 5

/** The same form, for handing a checkpoint in: one title, one or more links,
 * one note.
 *
 * One link is open for typing at a time. Moving on to another folds it into a
 * small card showing the address, which can be opened again to edit or
 * deleted. The title starts as the checkpoint's name and is shared by every
 * link. */
export function MultiProgressForm({
  heading,
  hint = "You can add more than one link, for example a report and its appendix.",
  confirmLabel,
  firstLabel = "",
  initial,
  onSubmit,
  onDone,
}: {
  heading: string
  hint?: string
  confirmLabel: string
  /** What the title starts as. */
  firstLabel?: string
  /** Start from what was saved, for an edit: its links show as cards. */
  initial?: { title: string; urls: string[]; note: string }
  /** Gets the title, the links that have an address in order, and the note.
   * Returns true when it worked, and the sheet closes. */
  onSubmit: (values: { title: string; urls: string[]; note: string }) => boolean
  onDone: () => void
}) {
  const [title, setTitle] = React.useState(initial?.title ?? firstLabel)
  const [urls, setUrls] = React.useState<string[]>(
    initial?.urls.length ? initial.urls : [""]
  )
  const [note, setNote] = React.useState(initial?.note ?? "")
  // Which link is open for typing. Every other one shows as a card; an edit
  // opens with all of them as cards.
  const [editing, setEditing] = React.useState<number | null>(
    initial?.urls.length ? null : 0
  )

  const change = (index: number, value: string) =>
    setUrls((current) => current.map((u, i) => (i === index ? value : u)))

  /** Closing the one being typed in: it stays as a card if it has an address
   * and is dropped if it was left empty. Gives back the list to carry on with
   * and where the other positions move to. */
  const settle = (list: string[], open: number | null) => {
    if (open === null || list[open]?.trim() || list.length === 1)
      return { list, shift: (i: number) => i }
    return {
      list: list.filter((_, i) => i !== open),
      shift: (i: number) => (i > open ? i - 1 : i),
    }
  }

  const addAnother = () => {
    const { list } = settle(urls, editing)
    setUrls([...list, ""])
    setEditing(list.length)
  }

  const edit = (index: number) => {
    const { list, shift } = settle(urls, editing)
    setUrls(list)
    setEditing(shift(index))
  }

  const remove = (index: number) => {
    const next = urls.filter((_, i) => i !== index)
    if (next.length === 0) {
      setUrls([""])
      setEditing(0)
      return
    }
    setUrls(next)
    // Deleting the one being typed in leaves nothing open; deleting another
    // keeps the open one open.
    setEditing(
      editing === null || editing === index
        ? null
        : editing > index
          ? editing - 1
          : editing
    )
  }

  // A title and at least one link are needed; the note is the only optional
  // part.
  const ready = title.trim() !== "" && urls.some((u) => u.trim())
  const typing = editing !== null ? urls[editing] : null
  // Another can only be added once the open one has an address.
  const canAdd =
    urls.length < MAX_LINKS && (typing === null || typing.trim() !== "")

  const send = () => {
    if (!ready) return
    if (
      onSubmit({
        title: title.trim(),
        urls: urls.filter((u) => u.trim()),
        note,
      })
    )
      onDone()
  }

  return (
    <>
      <SlideoutMenu.Header className="border-b border-secondary pb-4">
        <h2 className="text-lg font-semibold text-primary">{heading}</h2>
        <p className="text-sm text-tertiary">{hint}</p>
      </SlideoutMenu.Header>

      <SlideoutMenu.Content>
        <Input label="Title" value={title} onChange={setTitle} isRequired />

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-secondary">
            Links <span className="text-brand-tertiary">*</span>
          </p>
          {/* One outlined list, no gaps, with the same outline as the input fields: finished links are rows, the one being
            typed is a row, and adding another is the last row. */}
          <div className="divide-y divide-secondary overflow-hidden rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset">
            {urls.map((url, index) =>
              index === editing ? (
                <div
                  key={index}
                  className="flex items-center gap-1 py-1 pr-2 pl-4"
                >
                  <input
                    aria-label={`Link ${index + 1}`}
                    value={url}
                    onChange={(e) => change(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canAdd) {
                        e.preventDefault()
                        addAnother()
                      }
                    }}
                    placeholder="https://…"
                    autoFocus
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm text-primary outline-hidden placeholder:text-placeholder"
                  />
                  {urls.length > 1 && (
                    <Button
                      size="sm"
                      color="tertiary"
                      iconLeading={XClose}
                      aria-label="Discard this link"
                      onPress={() => remove(index)}
                    />
                  )}
                </div>
              ) : (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 py-1 pr-2 pl-4"
                >
                  <a
                    href={normalizeUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open ${url} in a new tab`}
                    className="flex min-w-0 items-center gap-2 py-2 text-sm text-primary underline-offset-2 hover:underline"
                  >
                    <LinkExternal01
                      className="size-4 shrink-0 text-tertiary"
                      aria-hidden
                    />
                    <span className="truncate">{url}</span>
                  </a>
                  <div className="flex shrink-0 items-center">
                    <Button
                      size="sm"
                      color="tertiary"
                      iconLeading={Edit05}
                      aria-label={`Edit link ${index + 1}`}
                      onPress={() => edit(index)}
                    />
                    <Button
                      size="sm"
                      color="tertiary-destructive"
                      iconLeading={Trash01}
                      aria-label={`Delete link ${index + 1}`}
                      onPress={() => remove(index)}
                    />
                  </div>
                </div>
              )
            )}

            {urls.length < MAX_LINKS && (
              <button
                type="button"
                disabled={!canAdd}
                onClick={addAnother}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-brand-secondary outline-brand hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <Plus className="size-4" aria-hidden />
                Add another link
              </button>
            )}
          </div>
        </div>

        <TextArea
          label="What changed (optional)"
          value={note}
          onChange={setNote}
          placeholder="A line or two on what is new since last time"
          rows={3}
        />
      </SlideoutMenu.Content>

      <SlideoutMenu.Footer className="flex justify-end gap-3">
        <Button color="secondary" onPress={onDone}>
          Cancel
        </Button>
        <Button isDisabled={!ready} onPress={send}>
          {confirmLabel}
        </Button>
      </SlideoutMenu.Footer>
    </>
  )
}
