"use client"

import * as React from "react"
import { SectionHeading } from "@/components/common"
import { useConfirm } from "@/components/confirm-dialog"
import {
  MentionField,
  MentionText,
  useMentionDraft,
  type Mentionable,
} from "@/components/milestones/mention-field"
import { Avatar } from "@/components/untitled/base/avatar/avatar"
import { Badge } from "@/components/untitled/base/badges/badges"
import { Button } from "@/components/untitled/base/buttons/button"
import { Dropdown } from "@/components/untitled/base/dropdown/dropdown"
import { Input } from "@/components/untitled/base/input/input"
import { TextArea } from "@/components/untitled/base/textarea/textarea"
import { formatTimestamp, timeAgo } from "@/lib/dates"
import { canComment } from "@/lib/permissions"
import {
  initialsOf,
  mentionablePeople,
  personById,
  type MilestoneView,
} from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { Person, ProgressComment } from "@/lib/types"
import { cn } from "@/lib/utils"

import { Edit05, Trash01 } from "@untitledui/icons"

/** Who can be tagged with @ in this section's boxes. */
const MentionPeople = React.createContext<Mentionable[]>([])

/** The comment a notification pointed at. */
const FocusedComment = React.createContext<string | null>(null)

/** How long the pointed-at comment stays marked. */
const MARK_MS = 2800

/** What to tell the person after they post, with how many people were tagged. */
const posted = (what: string, tagged: number) =>
  tagged > 0 ? `${what} · ${tagged} notified` : what

/** The conversation about one checkpoint's progress.
 *
 * The team and its mentors write here. A thread is a comment and its replies,
 * which hang off a line beside the comment they answer. Typing @ tags someone,
 * who is then notified. A comment can be edited or deleted by whoever wrote it,
 * but nothing is erased: a deleted one stays as a placeholder so the thread
 * still reads in order, and every change is in the team's activity log.
 *
 * It is laid out to be read quickly: one line for who and when, the words right
 * under it, and the actions in a single row, so a long thread stays short. */
export function CheckpointComments({
  view,
  hasSubmission,
  focusCommentId = null,
}: {
  view: MilestoneView
  /** Comments are about what was handed in, so a checkpoint with nothing in yet
   * has no place to start one. */
  hasSubmission: boolean
  /** Scrolls to this comment and marks it for a moment, for a notification. */
  focusCommentId?: string | null
}) {
  const { db, actor, currentUser, addComment } = useProjectsStore()
  const draft = useMentionDraft()
  const [replyTo, setReplyTo] = React.useState<string | null>(null)

  if (!actor || !canComment(actor, view.project)) return null

  const all = db.comments
    .filter((c) => c.milestoneInstanceId === view.instance.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  if (!hasSubmission && all.length === 0) return null

  const roots = all.filter((c) => !c.parentId)
  // Everyone who can read the thread except the person writing.
  const people: Mentionable[] = mentionablePeople(db, view.project)
    .filter((p) => p.id !== actor.person.id)
    .map((person) => ({
      person,
      tag: view.project.mentorIds.includes(person.id)
        ? "Mentor"
        : view.project.teamMemberIds.includes(person.id)
          ? "Team"
          : "Coordinator",
    }))

  const send = () => {
    const tagged = draft.ids()
    if (
      draft.text.trim() &&
      report(
        addComment(view.instance.id, draft.text, undefined, tagged),
        posted("Comment posted", tagged.length)
      )
    )
      draft.reset()
  }

  return (
    <FocusedComment.Provider value={focusCommentId}>
      <MentionPeople.Provider value={people}>
        <section className="space-y-4">
          <SectionHeading>Comments</SectionHeading>

          {/* One outlined box, no gaps: each thread is a row, divided from the
          next by a thin line, and the box for a new comment is the last row. It
          has the same outline as the input fields and the links list. */}
          <div className="divide-y divide-secondary rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset">
            {roots.map((root) => (
              <div key={root.id} className="p-4">
                <Thread
                  root={root}
                  replies={all.filter((c) => c.parentId === root.id)}
                  view={view}
                  replying={replyTo === root.id}
                  onReply={(on) => setReplyTo(on ? root.id : null)}
                />
              </div>
            ))}

            {/* A new comment goes last: who is writing, a one-line box and the
            button beside it, both the same height (36px) and the same 14px
            text as the comments. Enter sends it. The outline
            does not clip, so the @ list can open below the box. */}
            <div
              className="flex items-center gap-2.5 p-4"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
            >
              <PersonImage person={currentUser} size="sm" />
              <MentionField
                people={people}
                onChange={draft.setText}
                onPick={draft.pick}
                className="min-w-0 flex-1"
              >
                <Input
                  aria-label="Add a comment"
                  value={draft.text}
                  onChange={draft.setText}
                  placeholder="Add a comment, or type @ to tag someone"
                  size="sm"
                  className="w-full"
                />
              </MentionField>
              <Button size="sm" isDisabled={!draft.text.trim()} onPress={send}>
                Comment
              </Button>
            </div>
          </div>
        </section>
      </MentionPeople.Provider>
    </FocusedComment.Provider>
  )
}

/* -------------------------------------------------------------- thread */

/** How many replies show before the rest fold behind "See previous replies". */
const VISIBLE_REPLIES = 2

function Thread({
  root,
  replies,
  view,
  replying,
  onReply,
}: {
  root: ProgressComment
  replies: ProgressComment[]
  view: MilestoneView
  replying: boolean
  onReply: (on: boolean) => void
}) {
  const { db, currentUser, addComment } = useProjectsStore()
  const people = React.useContext(MentionPeople)
  const [allReplies, setAllReplies] = React.useState(false)
  const reply = useMentionDraft()

  const hidden =
    !allReplies && replies.length > VISIBLE_REPLIES
      ? replies.length - VISIBLE_REPLIES
      : 0
  const visible = hidden > 0 ? replies.slice(hidden) : replies
  const hasReplies = replies.length > 0 || replying
  const canReply = !root.deletedAt
  // Where "Reply" goes: under the last reply, which is where the next one would
  // be written. A thread with no replies yet has it under the comment itself.
  const replyAtEnd = canReply && !replying && replies.length > 0
  const replyUnderRoot = canReply && !replying && replies.length === 0

  const sendReply = () => {
    const tagged = reply.ids()
    if (
      reply.text.trim() &&
      report(
        addComment(view.instance.id, reply.text, root.id, tagged),
        posted("Reply posted", tagged.length)
      )
    ) {
      reply.reset()
      onReply(false)
    }
  }

  return (
    <div>
      {/* The comment, with the thread's line running down from its avatar. */}
      <div className="flex gap-2.5">
        <div className="relative w-8 shrink-0">
          <PersonImage person={personById(db, root.authorId)} size="sm" />
          {hasReplies && (
            <span
              className="absolute top-9 bottom-0 left-4 w-px bg-border"
              aria-hidden
            />
          )}
        </div>
        <div className={cn("min-w-0 flex-1", hasReplies && "pb-3")}>
          <CommentBody
            comment={root}
            view={view}
            actions={
              <>
                {replyUnderRoot && (
                  <TextAction onPress={() => onReply(true)}>Reply</TextAction>
                )}
                {replies.length > 0 && (
                  <span className="text-caption text-muted-foreground">
                    {replies.length === 1
                      ? "1 reply"
                      : `${replies.length} replies`}
                  </span>
                )}
              </>
            }
          />
        </div>
      </div>

      {hidden > 0 && (
        <ReplyRow last={visible.length === 0 && !replying}>
          <TextAction onPress={() => setAllReplies(true)}>
            See previous replies ({hidden})
          </TextAction>
        </ReplyRow>
      )}

      {visible.map((r, i) => (
        <ReplyRow
          key={r.id}
          avatar={<PersonImage person={personById(db, r.authorId)} size="xs" />}
          last={i === visible.length - 1 && !replying && !replyAtEnd}
        >
          <CommentBody comment={r} view={view} />
        </ReplyRow>
      ))}

      {replyAtEnd && (
        <ReplyRow last>
          <TextAction onPress={() => onReply(true)}>Reply</TextAction>
        </ReplyRow>
      )}

      {replying && (
        <ReplyRow avatar={<PersonImage person={currentUser} size="xs" />} last>
          <div className="space-y-1.5">
            <MentionField
              people={people}
              onChange={reply.setText}
              onPick={reply.pick}
            >
              <TextArea
                aria-label="Reply"
                value={reply.text}
                onChange={reply.setText}
                rows={1}
                size="sm"
                placeholder="Write a reply, or type @ to tag someone"
                autoFocus
              />
            </MentionField>
            <div className="flex justify-end gap-1.5">
              <Button size="sm" color="tertiary" onPress={() => onReply(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                isDisabled={!reply.text.trim()}
                onPress={sendReply}
              >
                Reply
              </Button>
            </div>
          </div>
        </ReplyRow>
      )}
    </div>
  )
}

/** A reply sits one step in, joined to the thread's line by a curved elbow. The
 * line carries on down past it unless it is the last. The elbow ends level with
 * the middle of the small avatar. */
function ReplyRow({
  avatar,
  last,
  children,
}: {
  avatar?: React.ReactNode
  last?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn("relative pl-10", !last && "pb-3")}>
      {/* The thread's line goes straight down past every reply but the last.
        The elbow is drawn over it, so the two never part. */}
      {!last && (
        <span
          className="absolute inset-y-0 left-4 w-px bg-border"
          aria-hidden
        />
      )}
      <span
        className="absolute top-0 left-4 h-3 w-5 rounded-bl-lg border-b border-l border-border"
        aria-hidden
      />
      <div className="flex gap-2">
        {avatar && <div className="shrink-0">{avatar}</div>}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- comment */

/** One comment: who and when on a single line with the menu, the words right
 * under it, then the actions. */
function CommentBody({
  comment,
  view,
  actions,
}: {
  comment: ProgressComment
  view: MilestoneView
  actions?: React.ReactNode
}) {
  const { db, actor, editComment, deleteComment } = useProjectsStore()
  const people = React.useContext(MentionPeople)
  const pointedAt = React.useContext(FocusedComment) === comment.id
  const box = React.useRef<HTMLDivElement>(null)
  // Marked from the first frame, then let go after a moment.
  const [marked, setMarked] = React.useState(pointedAt)
  const { confirm, dialog: confirmDialog } = useConfirm()
  const [editing, setEditing] = React.useState(false)
  const tagged = (comment.mentions ?? [])
    .map((id) => personById(db, id))
    .filter((p): p is Person => Boolean(p))
  const edit = useMentionDraft(comment.body, tagged)
  const author = personById(db, comment.authorId)
  const mine = actor?.person.id === comment.authorId
  const isMentor = view.project.mentorIds.includes(comment.authorId)

  // A notification points here: bring it into view once the sheet has slid in
  // and settled, then stop marking it.
  React.useEffect(() => {
    if (!pointedAt) return
    const scroll = window.setTimeout(
      () =>
        box.current?.scrollIntoView({ block: "center", behavior: "smooth" }),
      350
    )
    const release = window.setTimeout(() => setMarked(false), MARK_MS)
    return () => {
      window.clearTimeout(scroll)
      window.clearTimeout(release)
    }
  }, [pointedAt])

  const save = () => {
    const ids = edit.ids()
    if (report(editComment(comment.id, edit.text, ids), "Comment updated"))
      setEditing(false)
  }

  return (
    <div
      ref={box}
      id={`comment-${comment.id}`}
      className={cn(
        "min-w-0 transition-colors duration-700",
        // Marked with a soft wash that reaches a little past the text.
        marked && pointedAt && "-m-2 rounded-lg bg-brand-solid/10 p-2"
      )}
    >
      <div className="flex min-h-6 items-center justify-between gap-2">
        <p
          className="flex min-w-0 items-center gap-1.5"
          title={author?.affiliation}
        >
          <span className="truncate text-meta font-semibold text-foreground">
            {author?.name ?? "Unknown"}
          </span>
          {isMentor && (
            <Badge size="sm" color="gray">
              Mentor
            </Badge>
          )}
        </p>
        <div className="flex shrink-0 items-center">
          <span
            className="text-caption text-muted-foreground"
            title={formatTimestamp(comment.createdAt)}
          >
            {timeAgo(comment.createdAt)}
            {comment.editedAt && !comment.deletedAt && " · edited"}
          </span>
          {mine && !comment.deletedAt && !editing && (
            <Dropdown.Root>
              <Dropdown.DotsButton />
              <Dropdown.Popover className="w-40">
                <Dropdown.Menu>
                  <Dropdown.Item
                    icon={Edit05}
                    onAction={() => {
                      edit.setText(comment.body)
                      setEditing(true)
                    }}
                  >
                    Edit
                  </Dropdown.Item>
                  <Dropdown.Item
                    icon={Trash01}
                    className="[&_span]:text-error-primary [&_svg]:text-fg-error-secondary"
                    onAction={() =>
                      confirm({
                        title: "Delete this comment?",
                        description:
                          "It stays in the thread as deleted, and in the activity log.",
                        confirmLabel: "Delete",
                        destructive: true,
                        onConfirm: () =>
                          report(deleteComment(comment.id), "Comment deleted"),
                      })
                    }
                  >
                    Delete
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown.Root>
          )}
        </div>
      </div>

      {comment.deletedAt ? (
        <p className="text-meta text-muted-foreground italic">
          This comment was deleted.
        </p>
      ) : editing ? (
        <div className="mt-1 space-y-1.5">
          <MentionField
            people={people}
            onChange={edit.setText}
            onPick={edit.pick}
          >
            <TextArea
              aria-label="Edit comment"
              value={edit.text}
              onChange={edit.setText}
              rows={2}
              size="sm"
              autoFocus
            />
          </MentionField>
          <div className="flex justify-end gap-1.5">
            <Button
              size="sm"
              color="tertiary"
              onPress={() => {
                edit.setText(comment.body)
                setEditing(false)
              }}
            >
              Cancel
            </Button>
            <Button size="sm" isDisabled={!edit.text.trim()} onPress={save}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-meta whitespace-pre-wrap text-foreground">
            <MentionText
              text={comment.body}
              names={tagged.map((p) => p.name)}
            />
          </p>
          {actions && (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3">
              {actions}
            </div>
          )}
        </>
      )}
      {confirmDialog}
    </div>
  )
}

/* ------------------------------------------------------------- pieces */

function PersonImage({
  person,
  size,
}: {
  person?: Person | null
  size: "xs" | "sm"
}) {
  const name = person?.name ?? "Unknown"
  return (
    <Avatar
      size={size}
      src={person?.avatarUrl}
      initials={initialsOf(name)}
      alt={name}
    />
  )
}

/** A small text action, like the ones under a comment on a feed. The padding
 * gives it a target big enough to hit without the row looking loose. */
function TextAction({
  onPress,
  children,
}: {
  onPress: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="-my-1 rounded py-1 text-caption font-semibold text-muted-foreground outline-brand hover:text-foreground focus-visible:outline-2"
    >
      {children}
    </button>
  )
}
