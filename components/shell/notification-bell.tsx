"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlarmClockIcon,
  CalendarClockIcon,
  CheckListIcon,
  DeliverySent02Icon,
  LegalHammerIcon,
  Megaphone01Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons"

import { EmptyState } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { timeAgo } from "@/lib/dates"
import { notificationsFor, unreadCount } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import type { NotificationKind } from "@/lib/types"
import { cn } from "@/lib/utils"

const KIND_ICON: Record<NotificationKind, typeof Notification01Icon> = {
  deadline: AlarmClockIcon,
  submission: DeliverySent02Icon,
  review: LegalHammerIcon,
  action_item: CheckListIcon,
  announcement: Megaphone01Icon,
  meeting: CalendarClockIcon,
}

/** One place for everything addressed to you.
 *
 * This app is arriving into an inbox that already has email, WhatsApp and
 * Moodle in it. Being a fourth stream of alerts is how it gets muted, so
 * everything collects here and nothing pushes. */
export function NotificationBell() {
  const { db, currentUser, markNotificationRead, markAllNotificationsRead } = useProjectsStore()
  const [open, setOpen] = React.useState(false)

  if (!currentUser) return null

  const items = notificationsFor(db, currentUser.id)
  const unread = unreadCount(db, currentUser.id)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Notifications, ${unread} unread`} />}
      >
        <span className="relative inline-flex">
          <HugeiconsIcon icon={Notification01Icon} className="size-4" strokeWidth={2} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-subhead">Notifications</span>
          {unread > 0 && (
            <Button variant="ghost" size="xs" onClick={() => markAllNotificationsRead()}>
              Mark all read
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={Notification01Icon}
            title="Nothing yet"
            body="Deadlines, reviews and announcements will collect here."
            className="m-3 border-0 py-8"
          />
        ) : (
          <ScrollArea className="max-h-[420px]">
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={() => {
                      markNotificationRead(n.id)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex gap-2.5 px-3 py-2.5 transition-colors hover:bg-muted/60",
                      !n.readAt && "bg-primary/[0.04]"
                    )}
                  >
                    <HugeiconsIcon
                      icon={KIND_ICON[n.kind]}
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      strokeWidth={2}
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
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
