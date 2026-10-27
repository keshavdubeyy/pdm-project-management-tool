"use client"

import Link from "next/link"

import { EmptyState } from "@/components/common"
import { formatTimestamp } from "@/lib/dates"
import { previewText } from "@/lib/notes-markdown"
import { useProjectsStore } from "@/lib/store"

/** A project's notes, newest first. Each opens as its own page. */
export function NoteList({ projectId }: { projectId: string }) {
  const { db } = useProjectsStore()
  const notes = db.notes
    .filter((n) => n.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (notes.length === 0) {
    return (
      <EmptyState
        title="No notes yet"
        body="Notes your team writes appear here."
      />
    )
  }

  return (
    <ul className="space-y-2">
      {notes.map((note) => {
        const text = previewText(note.content)
        return (
          <li key={note.id}>
            <Link
              href={`/notes/${note.id}`}
              className="block rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/60"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-subhead text-foreground">
                  {note.title || "Untitled"}
                </p>
                <span className="shrink-0 text-caption text-muted-foreground">
                  {formatTimestamp(note.createdAt)}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-meta text-muted-foreground">
                {text || "Empty note"}
              </p>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
