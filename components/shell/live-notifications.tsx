"use client"

import * as React from "react"
import Link from "next/link"
import { toast as sonner } from "sonner"
import { Avatar } from "@/components/untitled/base/avatar/avatar"
import { CloseButton } from "@/components/untitled/base/buttons/close-button"
import { initialsOf, personById } from "@/lib/selectors"
import { playNotificationSound, soundEnabled, unlockAudio } from "@/lib/sound"
import { useProjectsStore } from "@/lib/store"
import type { AppNotification } from "@/lib/types"

import { Bell01 } from "@untitledui/icons"

/** How old a notification can be and still be announced as it arrives. A
 * browser that was asleep and wakes up to a backlog should not throw a banner
 * for every one of them. */
const FRESH_MS = 2 * 60 * 1000

/** How long the banner stays up. Long enough to read and reach, short enough to
 * leave on its own. */
const STAY_MS = 7000

/** Shows a new notification from the top of the screen while the app is open.
 *
 * It is the bell's feed, said out loud once: who it was from, what they did,
 * and a click to go there. What was there when the app opened is never
 * announced, only what arrives after, so signing in does not bring a pile of
 * banners. Mounted once for the whole app. */
export function LiveNotifications() {
  const { db, currentUser, sharedReady, markNotificationRead } =
    useProjectsStore()
  // The ids already known for this person. Reset when someone else signs in.
  const known = React.useRef<{ person: string; ids: Set<string> } | null>(null)

  // Browsers keep audio asleep until the page has been touched. The first click
  // or key press wakes it, so a notification can chime later on its own.
  React.useEffect(() => {
    const wake = () => unlockAudio()
    window.addEventListener("pointerdown", wake, { once: true })
    window.addEventListener("keydown", wake, { once: true })
    return () => {
      window.removeEventListener("pointerdown", wake)
      window.removeEventListener("keydown", wake)
    }
  }, [])

  React.useEffect(() => {
    if (!currentUser || !sharedReady) {
      known.current = null
      return
    }
    const mine = db.notifications.filter((n) => n.personId === currentUser.id)

    // First look, once the server's copy is in: remember, announce nothing.
    if (known.current?.person !== currentUser.id) {
      known.current = {
        person: currentUser.id,
        ids: new Set(mine.map((n) => n.id)),
      }
      return
    }

    let announced = false
    for (const n of mine) {
      if (known.current.ids.has(n.id)) continue
      known.current.ids.add(n.id)
      if (n.readAt || Date.now() - new Date(n.createdAt).getTime() > FRESH_MS)
        continue
      const actor = n.actorId ? personById(db, n.actorId) : null
      sonner.custom(
        (id) => (
          <Banner
            n={n}
            name={actor?.name}
            avatarUrl={actor?.avatarUrl}
            onOpen={() => {
              markNotificationRead(n.id)
              sonner.dismiss(id)
            }}
            onClose={() => sonner.dismiss(id)}
          />
        ),
        { position: "top-center", duration: STAY_MS }
      )
      announced = true
    }
    // One chime however many arrived together.
    if (announced && soundEnabled()) playNotificationSound()
  }, [db, currentUser, sharedReady, markNotificationRead])

  return null
}

/** The banner. It is drawn by the toast container, which sits outside the
 * store, so everything it shows is handed to it. */
function Banner({
  n,
  name,
  avatarUrl,
  onOpen,
  onClose,
}: {
  n: AppNotification
  name?: string
  avatarUrl?: string
  onOpen: () => void
  onClose: () => void
}) {
  return (
    <div
      role="status"
      className="relative w-[min(26rem,calc(100vw-2rem))] rounded-xl bg-primary_alt shadow-xl ring-1 ring-secondary_alt"
    >
      <Link
        href={n.href}
        onClick={onOpen}
        className="flex items-center gap-3 rounded-xl p-3.5 pr-10 outline-brand hover:bg-muted/50 focus-visible:outline-2"
      >
        {name ? (
          <Avatar
            size="md"
            src={avatarUrl}
            initials={initialsOf(name)}
            alt={name}
          />
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
            <Bell01 className="size-5 text-muted-foreground" aria-hidden />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-primary">
            {n.title}
          </span>
          <span className="mt-0.5 block text-xs text-tertiary">Just now</span>
        </span>
      </Link>
      <CloseButton
        size="xs"
        slot={null}
        className="absolute top-1/2 right-2 -translate-y-1/2"
        onPress={onClose}
      />
    </div>
  )
}
