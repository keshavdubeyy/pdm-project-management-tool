"use client"

import * as React from "react"
import { PersonAvatar } from "@/components/common"
import { Button } from "@/components/untitled/base/buttons/button"
import { Input } from "@/components/untitled/base/input/input"
import { TextArea } from "@/components/untitled/base/textarea/textarea"
import { timeAgo } from "@/lib/dates"
import { personById } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import type { NoteComment } from "@/lib/types"
import { cn } from "@/lib/utils"

import { MessageSquare01, SearchLg, XClose } from "@untitledui/icons"

/** The right-hand column of a note: every comment, newest thread last, with
 * replies nested one level under the comment they answer. */
export function CommentsPanel({
  comments,
  composer,
  activeId,
  onSelect,
  onSubmitNew,
  onCancelNew,
  onReply,
  onClose,
}: {
  comments: NoteComment[]
  /** Set while a passage is selected and waiting for its comment text. */
  composer: { quote: string } | null
  activeId: string | null
  onSelect: (comment: NoteComment) => void
  onSubmitNew: (body: string) => void
  onCancelNew: () => void
  onReply: (parentId: string, body: string) => void
  onClose: () => void
}) {
  const { db } = useProjectsStore()
  const [query, setQuery] = React.useState("")

  const threads = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const roots = comments.filter((c) => !c.parentId)
    return roots
      .map((root) => ({
        root,
        replies: comments.filter((c) => c.parentId === root.id),
      }))
      .filter(({ root, replies }) => {
        if (!q) return true
        return [root, ...replies].some((c) =>
          `${c.body} ${c.quote ?? ""} ${personById(db, c.authorId)?.name ?? ""}`
            .toLowerCase()
            .includes(q)
        )
      })
  }, [comments, db, query])

  return (
    <aside className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 lg:sticky lg:top-20 lg:max-h-[calc(100svh-6rem)] lg:self-start lg:overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-section text-foreground">
          <MessageSquare01 className="size-4" />
          Comments
        </h2>
        <Button
          color="tertiary"
          size="xs"
          onPress={onClose}
          aria-label="Close comments"
        >
          <XClose />
        </Button>
      </div>

      <Input
        icon={SearchLg}
        value={query}
        onChange={setQuery}
        placeholder="Search comments"
        aria-label="Search comments"
      />

      {composer && (
        <Composer
          quote={composer.quote}
          submitLabel="Comment"
          onSubmit={onSubmitNew}
          onCancel={onCancelNew}
        />
      )}

      {threads.length === 0 && !composer ? (
        <p className="text-caption text-muted-foreground">
          {comments.length === 0
            ? "No comments yet. Select some text in the note and press Comment."
            : "No comments match."}
        </p>
      ) : (
        <ul className="space-y-5">
          {threads.map(({ root, replies }) => (
            <Thread
              key={root.id}
              root={root}
              replies={replies}
              active={activeId === root.anchorId && !!root.anchorId}
              onSelect={() => onSelect(root)}
              onReply={(body) => onReply(root.id, body)}
            />
          ))}
        </ul>
      )}
    </aside>
  )
}

function Thread({
  root,
  replies,
  active,
  onSelect,
  onReply,
}: {
  root: NoteComment
  replies: NoteComment[]
  active: boolean
  onSelect: () => void
  onReply: (body: string) => void
}) {
  const [replying, setReplying] = React.useState(false)

  return (
    <li
      className={cn(
        "rounded-lg",
        active && "bg-brand-primary/60 ring-1 ring-brand/25"
      )}
    >
      <div className="space-y-1.5 p-1">
        <Entry comment={root} onClick={onSelect} />
        {replies.map((reply) => (
          <div key={reply.id} className="ml-3 border-l border-border pl-3">
            <Entry comment={reply} />
          </div>
        ))}
        {replying ? (
          <div className="ml-3 pl-3">
            <Composer
              submitLabel="Reply"
              onSubmit={(body) => {
                onReply(body)
                setReplying(false)
              }}
              onCancel={() => setReplying(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setReplying(true)}
            className="ml-3 pl-3 text-meta font-medium text-muted-foreground hover:text-foreground"
          >
            Reply
          </button>
        )}
      </div>
    </li>
  )
}

function Entry({
  comment,
  onClick,
}: {
  comment: NoteComment
  onClick?: () => void
}) {
  const { db } = useProjectsStore()
  const author = personById(db, comment.authorId)
  const Body = onClick ? "button" : "div"
  return (
    <Body
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className="block w-full space-y-1 text-left"
    >
      <span className="flex items-center gap-2">
        <PersonAvatar person={author} size="xs" />
        <span className="text-subhead text-foreground">
          {author?.name ?? "Unknown"}
        </span>
        <span className="text-caption text-muted-foreground">
          · {timeAgo(comment.createdAt)}
        </span>
      </span>
      {comment.quote && (
        <span className="line-clamp-1 block text-caption text-muted-foreground">
          ↳ {comment.quote}
        </span>
      )}
      <span className="block text-meta text-foreground">{comment.body}</span>
    </Body>
  )
}

function Composer({
  quote,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  quote?: string
  submitLabel: string
  onSubmit: (body: string) => void
  onCancel: () => void
}) {
  const [body, setBody] = React.useState("")
  return (
    <div className="space-y-2 rounded-lg border border-border bg-background p-2.5">
      {quote && (
        <p className="line-clamp-2 text-caption text-muted-foreground">
          ↳ {quote}
        </p>
      )}
      <TextArea
        value={body}
        onChange={setBody}
        placeholder="Write a comment…"

        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button color="tertiary" size="xs" onPress={onCancel}>
          Cancel
        </Button>
        <Button
          size="xs"
          isDisabled={!body.trim()}
          onPress={() => onSubmit(body)}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
