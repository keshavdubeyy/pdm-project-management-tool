"use client"

import * as React from "react"
import { Avatar } from "@/components/untitled/base/avatar/avatar"
import { initialsOf } from "@/lib/selectors"
import type { Person } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Tagging people with @, the way it works everywhere else.
 *
 * Type @ and a few letters of a name and a list of the people on the thread
 * opens under the box. Up and Down move through it, Enter or Tab picks one, a
 * click does too, and Escape closes it. A picked name goes into the text as
 * plain "@Full Name", so the comment reads the same in the log and anywhere
 * else; which person each tag stands for is kept alongside it, and those
 * people are notified when the comment is sent. */

/** Someone who can be tagged, with the word shown beside their name. */
export type Mentionable = { person: Person; tag?: string }

const MAX_SHOWN = 6

/** The "@word" the caret is at the end of, if it is in the middle of one. It
 * must start the text or follow a space, so an email address is left alone. */
function triggerAt(text: string, caret: number) {
  const match = /(^|\s)@([^\s@]*)$/.exec(text.slice(0, caret))
  if (!match) return null
  return { start: caret - match[2].length - 1, query: match[2] }
}

function matches(person: Person, query: string) {
  const q = query.toLowerCase()
  if (!q) return true
  const name = person.name.toLowerCase()
  return (
    name.includes(q) ||
    name
      .split(/[\s.]+/)
      .filter(Boolean)
      .some((part) => part.startsWith(q))
  )
}

/** The text of one box and the people picked into it. */
export function useMentionDraft(
  initialText = "",
  initialPicked: Person[] = []
) {
  const [text, setText] = React.useState(initialText)
  const [picked, setPicked] = React.useState<Person[]>(initialPicked)
  return {
    text,
    setText,
    pick: (person: Person) =>
      setPicked((current) =>
        current.some((p) => p.id === person.id) ? current : [...current, person]
      ),
    reset: () => {
      setText("")
      setPicked([])
    },
    /** Who is still tagged: a name that was typed over or deleted is not. */
    ids: () =>
      picked.filter((p) => text.includes(`@${p.name}`)).map((p) => p.id),
  }
}

/** Wraps a text box and gives it the picker. The box stays the caller's own,
 * so it keeps its size and look. */
export function MentionField({
  people,
  onChange,
  onPick,
  className,
  children,
}: {
  people: Mentionable[]
  /** Gets the new text when a name is picked. */
  onChange: (text: string) => void
  onPick: (person: Person) => void
  className?: string
  children: React.ReactNode
}) {
  const root = React.useRef<HTMLDivElement>(null)
  const [trigger, setTrigger] = React.useState<{
    start: number
    query: string
  } | null>(null)
  const [active, setActive] = React.useState(0)

  const shown = trigger
    ? people
        .filter(({ person }) => matches(person, trigger.query))
        .slice(0, MAX_SHOWN)
    : []
  const open = trigger !== null && shown.length > 0

  const field = () =>
    root.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      "textarea, input"
    ) ?? null

  /** Checks the caret against the text. Always read from the box itself: a
   * click or key press can come from the list or the box's outline, which have
   * no text of their own. */
  const look = () => {
    const el = field()
    if (!el) return
    const found = triggerAt(el.value, el.selectionStart ?? el.value.length)
    setTrigger(found)
    setActive(0)
  }

  const choose = (person: Person) => {
    const el = field()
    if (!el || !trigger) return
    const caret = el.selectionStart ?? el.value.length
    const before = el.value.slice(0, trigger.start)
    const inserted = `@${person.name} `
    onChange(before + inserted + el.value.slice(caret))
    onPick(person)
    setTrigger(null)
    // The text has not re-rendered yet; put the caret after the name once it has.
    requestAnimationFrame(() => {
      const next = field()
      if (!next) return
      next.focus()
      const at = (before + inserted).length
      next.setSelectionRange(at, at)
    })
  }

  return (
    <div
      ref={root}
      className={cn("relative", className)}
      onKeyUp={(e) => {
        // Moving through the list is not a change to what is being typed.
        if (["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(e.key))
          return
        look()
      }}
      onClick={look}
      onBlur={() => setTrigger(null)}
      onKeyDown={(e) => {
        if (!open) return
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault()
          setActive(
            (i) =>
              (i + (e.key === "ArrowDown" ? 1 : -1) + shown.length) %
              shown.length
          )
        } else if (e.key === "Enter" || e.key === "Tab") {
          // Picking a name must not also send the comment.
          e.preventDefault()
          e.stopPropagation()
          choose(shown[active].person)
        } else if (e.key === "Escape") {
          e.stopPropagation()
          setTrigger(null)
        }
      }}
    >
      {children}
      {open && (
        <ul
          role="listbox"
          aria-label="People you can tag"
          className="absolute top-full left-0 z-30 mt-1 w-72 max-w-full rounded-lg bg-primary p-1 shadow-lg ring-1 ring-primary"
        >
          {shown.map(({ person, tag }, i) => (
            <li
              key={person.id}
              role="option"
              aria-selected={i === active}
              // mousedown, not click: the box must not lose focus first, which
              // would close the list before the pick lands.
              onMouseDown={(e) => {
                e.preventDefault()
                choose(person)
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5",
                i === active && "bg-muted"
              )}
            >
              <Avatar
                size="xs"
                src={person.avatarUrl}
                initials={initialsOf(person.name)}
                alt={person.name}
              />
              <span className="min-w-0 flex-1 truncate text-meta text-foreground">
                {person.name}
              </span>
              {tag && (
                <span className="shrink-0 text-caption text-muted-foreground">
                  {tag}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** A comment's words, with each tagged name picked out. Only the names of the
 * people the comment actually tags are marked, so a stray "@" is left alone. */
export function MentionText({
  text,
  names,
}: {
  text: string
  names: string[]
}) {
  if (names.length === 0) return <>{text}</>
  const pattern = new RegExp(
    `(@(?:${[...names]
      .sort((a, b) => b.length - a.length)
      .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")}))`,
    "g"
  )
  return (
    <>
      {text.split(pattern).map((part, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            className="rounded bg-brand-solid/10 px-0.5 font-semibold text-brand-secondary"
          >
            {part}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  )
}
