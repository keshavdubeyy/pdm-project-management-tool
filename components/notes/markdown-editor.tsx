"use client"

import * as React from "react"
import { Annotation, EditorSelection, EditorState } from "@codemirror/state"
import {
  EditorView,
  keymap,
  placeholder as placeholderText,
} from "@codemirror/view"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { tags as t } from "@lezer/highlight"

/** A markdown source editor, in the manner of Obsidian's: you type the
 * markdown, and it is styled where it stands. Headings get big, `**bold**`
 * goes bold, and the markup characters themselves dim. Nothing is hidden, so
 * what is saved is exactly what is on screen. */

/** Whether a change came from outside, so it is not echoed back as an edit. */
const fromOutside = Annotation.define<boolean>()

const markdownStyle = HighlightStyle.define([
  { tag: t.heading1, fontSize: "1.75em", fontWeight: "700", lineHeight: "1.3" },
  {
    tag: t.heading2,
    fontSize: "1.45em",
    fontWeight: "650",
    lineHeight: "1.35",
  },
  { tag: t.heading3, fontSize: "1.25em", fontWeight: "600" },
  {
    tag: [t.heading4, t.heading5, t.heading6],
    fontSize: "1.1em",
    fontWeight: "600",
  },
  { tag: t.strong, fontWeight: "700" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: "var(--link)", textDecoration: "underline" },
  { tag: t.url, color: "var(--muted-foreground)" },
  { tag: t.monospace, fontFamily: "var(--font-mono)", fontSize: "0.9em" },
  { tag: t.quote, color: "var(--muted-foreground)" },
  // The `#`, `**`, `>` and `-` themselves.
  { tag: t.processingInstruction, color: "var(--color-fg-quaternary)" },
  { tag: t.contentSeparator, color: "var(--color-fg-quaternary)" },
])

const theme = EditorView.theme({
  "&": {
    fontSize: "1rem",
    color: "var(--foreground)",
    backgroundColor: "transparent",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-body)", lineHeight: "1.8" },
  ".cm-content": { padding: "0", caretColor: "var(--foreground)" },
  ".cm-line": { padding: "0" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--foreground)" },
  ".cm-placeholder": { color: "var(--muted-foreground)" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground":
    { background: "color-mix(in oklab, var(--primary) 22%, transparent)" },
})

/** Cmd/Ctrl+B and +I: wrap the selection in the mark, or take it off again. */
const toggleMark = (mark: string) => (view: EditorView) => {
  const { state } = view
  const change = state.changeByRange((range) => {
    const before = state.sliceDoc(range.from - mark.length, range.from)
    const after = state.sliceDoc(range.to, range.to + mark.length)
    if (before === mark && after === mark) {
      return {
        changes: [
          { from: range.from - mark.length, to: range.from },
          { from: range.to, to: range.to + mark.length },
        ],
        range: EditorSelection.range(
          range.from - mark.length,
          range.to - mark.length
        ),
      }
    }
    return {
      changes: [
        { from: range.from, insert: mark },
        { from: range.to, insert: mark },
      ],
      range: EditorSelection.range(
        range.from + mark.length,
        range.to + mark.length
      ),
    }
  })
  view.dispatch(
    state.update(change, { scrollIntoView: true, userEvent: "input" })
  )
  return true
}

export type MarkdownEditorHandle = {
  /** Replaces the document without counting it as an edit. */
  setValue: (value: string) => void
}

export function MarkdownEditor({
  initialValue,
  onChange,
  placeholder,
  autoFocus,
  ref,
}: {
  initialValue: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  ref?: React.Ref<MarkdownEditorHandle>
}) {
  const host = React.useRef<HTMLDivElement>(null)
  const view = React.useRef<EditorView | null>(null)
  const onChangeRef = React.useRef(onChange)
  const initial = React.useRef(initialValue)
  React.useEffect(() => {
    onChangeRef.current = onChange
  })

  React.useImperativeHandle(ref, () => ({
    setValue(value: string) {
      const v = view.current
      if (!v) return
      const current = v.state.doc.toString()
      if (current === value) return
      v.dispatch({
        changes: { from: 0, to: current.length, insert: value },
        annotations: fromOutside.of(true),
      })
    },
  }))

  React.useEffect(() => {
    if (!host.current) return
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initial.current,
        extensions: [
          history(),
          keymap.of([
            { key: "Mod-b", run: toggleMark("**") },
            { key: "Mod-i", run: toggleMark("*") },
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          // GFM, so `- [ ]` task lists and `~~strike~~` are understood. Enter
          // continues a list, as in Obsidian.
          markdown({ base: markdownLanguage }),
          syntaxHighlighting(markdownStyle),
          EditorView.lineWrapping,
          theme,
          placeholderText(placeholder ?? ""),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return
            if (update.transactions.some((tr) => tr.annotation(fromOutside)))
              return
            onChangeRef.current(update.state.doc.toString())
          }),
        ],
      }),
    })
    view.current = editor
    if (autoFocus) editor.focus()
    return () => {
      editor.destroy()
      view.current = null
    }
  }, [placeholder, autoFocus])

  return <div ref={host} className="markdown-editor" />
}
