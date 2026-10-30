"use client"

import * as React from "react"
import Link from "next/link"
import { DialogTrigger } from "react-aria-components"
import { Dialog } from "@/components/untitled/application/modals/modal"
import { Avatar } from "@/components/untitled/base/avatar/avatar"
import { Button } from "@/components/untitled/base/buttons/button"
import { Dropdown } from "@/components/untitled/base/dropdown/dropdown"
import { formatTimestamp, timeAgo } from "@/lib/dates"
import {
  initialsOf,
  notificationsFor,
  personById,
  unreadCount,
} from "@/lib/selectors"
import {
  playNotificationSound,
  setSoundEnabled,
  soundEnabled,
  subscribeSound,
} from "@/lib/sound"
import { useProjectsStore } from "@/lib/store"
import type { AppNotification, NotificationKind } from "@/lib/types"
import { cn } from "@/lib/utils"

import {
  AlarmClock,
  Announcement01,
  AtSign,
  Bell01,
  ClipboardCheck,
  Clock,
  MessageChatCircle,
  Scales01,
  Send01,
  VolumeMax,
  VolumeX,
} from "@untitledui/icons"

const KIND_ICON: Record<NotificationKind, typeof Bell01> = {
  deadline: AlarmClock,
  submission: Send01,
  review: Scales01,
  action_item: ClipboardCheck,
  announcement: Announcement01,
  meeting: Clock,
  mention: AtSign,
  comment: MessageChatCircle,
}

/** What a notification is about. Comment notices made before comments had a
 * type of their own were stored as "review", so those are told apart by what
 * they say, and read the same as new ones. */
function kindOf(n: AppNotification): NotificationKind {
  if (n.kind !== "review") return n.kind
  if (/ mentioned you on /.test(n.title)) return "mention"
  if (/ (commented|replied) on /.test(n.title)) return "comment"
  return n.kind
}

/** How many of a section show at first, and how many more each "Load more"
 * adds. */
const PAGE = 5

/** One place for everything addressed to you.
 *
 * This app is arriving into an inbox that already has email, WhatsApp and
 * Moodle in it. Being a fourth stream of alerts is how it gets muted, so
 * everything collects here and nothing pushes.
 *
 * It reads like a feed: who it was from, what they did, a line of what they said
 * and when. What is new sits above what has been seen, marked with a dot rather
 * than shouted in bold, so a long list stays calm. */
export function NotificationBell() {
  const { db, currentUser, markNotificationRead, markAllNotificationsRead } =
    useProjectsStore()
  const [open, setOpen] = React.useState(false)
  // Whether new notifications chime. Kept in the browser, and shared between
  // tabs.
  const sound = React.useSyncExternalStore(
    subscribeSound,
    soundEnabled,
    () => true
  )
  // How many of each section are showing. Each grows on its own.
  const [showNew, setShowNew] = React.useState(PAGE)
  const [showEarlier, setShowEarlier] = React.useState(PAGE)

  if (!currentUser) return null

  const items = notificationsFor(db, currentUser.id)
  const unread = unreadCount(db, currentUser.id)
  const fresh = items.filter((n) => !n.readAt)
  const seen = items.filter((n) => n.readAt)

  return (
    <DialogTrigger isOpen={open} onOpenChange={setOpen}>
      <Button
        color="tertiary"
        size="sm"
        aria-label={`Notifications, ${unread} unread`}
      >
        <span className="relative inline-flex">
          <Bell01 className="size-5" />
          {/* How many are unread. */}
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-solid px-1 text-[10px] font-semibold text-white ring-2 ring-primary">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
      </Button>

      <Dropdown.Popover
        placement="bottom end"
        className="w-[min(420px,calc(100vw-2rem))] rounded-xl shadow-xl"
      >
        <Dialog className="outline-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-subhead text-foreground">Notifications</h2>
              {unread > 0 && (
                <span className="rounded-full bg-brand-solid/10 px-2 py-0.5 text-caption font-semibold text-brand-secondary tabular-nums">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-pressed={sound}
                aria-label={
                  sound
                    ? "Turn the notification sound off"
                    : "Turn the notification sound on"
                }
                title={sound ? "Sound on" : "Sound off"}
                onClick={() => {
                  setSoundEnabled(!sound)
                  // Turning it on plays it once, so the person knows what to expect.
                  if (!sound) playNotificationSound()
                }}
                className="grid size-7 place-items-center rounded-md text-muted-foreground outline-brand hover:bg-muted hover:text-foreground focus-visible:outline-2"
              >
                {sound ? (
                  <VolumeMax className="size-4" aria-hidden />
                ) : (
                  <VolumeX className="size-4" aria-hidden />
                )}
              </button>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead()}
                  className="rounded text-caption font-semibold text-brand-secondary outline-brand hover:underline focus-visible:outline-2"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <Empty />
          ) : (
            <div className="scrollbar-subtle max-h-[460px] overflow-y-auto border-t border-secondary">
              {fresh.length === 0 && (
                <p className="px-4 py-4 text-meta text-muted-foreground">
                  You&apos;re all caught up.
                </p>
              )}
              <Section
                label="New"
                items={fresh}
                shown={showNew}
                onMore={() => setShowNew((n) => n + PAGE)}
                onOpen={(n) => {
                  markNotificationRead(n.id)
                  setOpen(false)
                }}
              />
              <Section
                label="Earlier"
                items={seen}
                shown={showEarlier}
                onMore={() => setShowEarlier((n) => n + PAGE)}
                onOpen={() => setOpen(false)}
              />
            </div>
          )}
        </Dialog>
      </Dropdown.Popover>
    </DialogTrigger>
  )
}

/* ------------------------------------------------------------- pieces */

function Section({
  label,
  items,
  shown,
  onMore,
  onOpen,
}: {
  label: string
  items: AppNotification[]
  /** How many of them to show. */
  shown: number
  onMore: () => void
  onOpen: (n: AppNotification) => void
}) {
  if (items.length === 0) return null
  const left = items.length - shown
  return (
    <section>
      <h3 className="px-4 pt-3 pb-1 text-caption font-semibold text-tertiary">
        {label}
      </h3>
      <ul>
        {items.slice(0, shown).map((n) => (
          <li key={n.id}>
            <Row n={n} onOpen={() => onOpen(n)} />
          </li>
        ))}
      </ul>
      {left > 0 && (
        <div className="px-4 pt-1 pb-3">
          <button
            type="button"
            onClick={onMore}
            className="rounded text-caption font-semibold text-brand-secondary outline-brand hover:underline focus-visible:outline-2"
          >
            Load more
          </button>
        </div>
      )}
    </section>
  )
}

/** One notification: the person's face, what happened, a line of what was said, and when. A dot marks it new. */
function Row({ n, onOpen }: { n: AppNotification; onOpen: () => void }) {
  const { db } = useProjectsStore()
  const actor = n.actorId ? personById(db, n.actorId) : null
  const kind = kindOf(n)
  const Icon = KIND_ICON[kind]
  const isNew = !n.readAt
  // What a comment or a mention says stays in the thread, not in the panel: the
  // title already says who and where, and the click goes to the words. Other
  // kinds keep their line, since it is the point of them ("Week 4, closing 30
  // Aug").
  const quotesThread = kind === "comment" || kind === "mention"

  return (
    <Link
      href={n.href}
      onClick={onOpen}
      className="group flex gap-3 px-4 py-3 outline-hidden transition-colors hover:bg-muted/60 focus-visible:bg-muted/60"
    >
      <span className="mt-0.5 shrink-0">
        {actor ? (
          <Avatar
            size="md"
            src={actor.avatarUrl}
            initials={initialsOf(actor.name)}
            alt={actor.name}
          />
        ) : (
          <span className="grid size-10 place-items-center rounded-full bg-muted">
            <Icon className="size-[18px] text-muted-foreground" aria-hidden />
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-meta",
            isNew ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {n.title}
        </span>
        {n.body && !quotesThread && (
          <span className="mt-0.5 line-clamp-2 block text-caption text-muted-foreground">
            {n.body}
          </span>
        )}
        <span
          className="mt-1 flex items-center gap-1.5 text-caption text-tertiary"
          title={formatTimestamp(n.createdAt)}
        >
          {/* What kind of notice it is, beside the time, where it cannot sit on
            top of anything. */}
          <Icon className="size-3.5 shrink-0" aria-hidden />
          {timeAgo(n.createdAt)}
        </span>
      </span>

      {isNew && (
        <span
          className="mt-2 size-2 shrink-0 rounded-full bg-brand-solid"
          role="img"
          aria-label="New"
        />
      )}
    </Link>
  )
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-2 border-t border-secondary px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted">
        <Bell01 className="size-6 text-muted-foreground" aria-hidden />
      </span>
      <p className="text-subhead text-foreground">No notifications yet</p>
      <p className="max-w-64 text-caption text-muted-foreground">
        Deadlines, comments, mentions and announcements will appear here.
      </p>
    </div>
  )
}
