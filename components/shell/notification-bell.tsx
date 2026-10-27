"use client"

import * as React from "react"
import Link from "next/link"
import { EmptyState } from "@/components/common"
import { Button } from "@/components/untitled/base/buttons/button"
import { Dropdown } from "@/components/untitled/base/dropdown/dropdown"
import { Dialog } from "@/components/untitled/application/modals/modal"
import { DialogTrigger } from "react-aria-components"
import { timeAgo } from "@/lib/dates"
import { notificationsFor, unreadCount } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import type { NotificationKind } from "@/lib/types"
import { cn } from "@/lib/utils"

import {
  AlarmClock,
  Announcement01,
  Bell01,
  ClipboardCheck,
  Clock,
  Scales01,
  Send01,
} from "@untitledui/icons"

const KIND_ICON: Record<NotificationKind, typeof Bell01> = {
  deadline: AlarmClock,
  submission: Send01,
  review: Scales01,
  action_item: ClipboardCheck,
  announcement: Announcement01,
  meeting: Clock,
}

function NotificationIcon({
  kind,
  className,
}: {
  kind: NotificationKind
  className?: string
}) {
  const Icon = KIND_ICON[kind]
  return <Icon className={className} />
}

/** One place for everything addressed to you.
 *
 * This app is arriving into an inbox that already has email, WhatsApp and
 * Moodle in it. Being a fourth stream of alerts is how it gets muted, so
 * everything collects here and nothing pushes. */
export function NotificationBell() {
  const { db, currentUser, markNotificationRead, markAllNotificationsRead } =
    useProjectsStore()
  const [open, setOpen] = React.useState(false)

  if (!currentUser) return null

  const items = notificationsFor(db, currentUser.id)
  const unread = unreadCount(db, currentUser.id)

  return (
    <DialogTrigger isOpen={open} onOpenChange={setOpen}>
      <Button
        color="tertiary"
        size="xs"
        aria-label={`Notifications, ${unread} unread`}
      >
        <span className="relative inline-flex">
          <Bell01 className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-solid px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
      </Button>

      <Dropdown.Popover placement="top start" className="w-[380px]">
        <Dialog className="outline-hidden">
          <div className="flex items-center justify-between border-b border-secondary px-3 py-2">
            <span className="text-subhead">Notifications</span>
            {unread > 0 && (
              <Button
                color="tertiary"
                size="xs"
                onPress={() => markAllNotificationsRead()}
              >
                Mark all read
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon={Bell01}
              title="No notifications yet"
              body="Deadlines, reviews and announcements appear here."
              className="m-3 border-0 py-8"
            />
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              <ul className="divide-y divide-secondary">
                {items.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => {
                        markNotificationRead(n.id)
                        setOpen(false)
                      }}
                      className={cn(
                        "flex gap-2.5 px-3 py-2.5 transition-colors hover:bg-primary_hover",
                        !n.readAt && "bg-brand-solid/[0.04]"
                      )}
                    >
                      <NotificationIcon
                        kind={n.kind}
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span
                            className={cn(
                              "text-meta text-foreground",
                              !n.readAt && "font-semibold"
                            )}
                          >
                            {n.title}
                          </span>
                          <span className="shrink-0 text-caption text-muted-foreground">
                            {timeAgo(n.createdAt)}
                          </span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-caption text-muted-foreground">
                          {n.body}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Dialog>
      </Dropdown.Popover>
    </DialogTrigger>
  )
}
