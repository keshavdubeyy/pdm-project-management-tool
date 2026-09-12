"use client"

import { toast } from "@/components/ui/toast"

import type { ActionResult } from "@/lib/store"

/** Feedback, placed where the user is looking.
 *
 * A toast is for something that happened off-screen or that the view has moved
 * past. When the thing the user changed is visible and changes in front of
 * them, the change is the confirmation and a toast on top of it is noise — so
 * `report` only speaks up when an action was refused.
 */
export function report(result: ActionResult, success?: string) {
  if (result.ok) {
    if (success) toast.add({ title: success })
    return result.ok
  }
  toast.add({ title: "That did not go through", description: result.reason })
  return false
}

export function say(title: string, description?: string) {
  toast.add({ title, description })
}
