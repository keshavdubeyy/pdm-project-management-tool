"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ROLE_STORAGE_KEY, useProjectsStore } from "@/lib/store"
import type { Role } from "@/lib/types"

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  {
    value: "coordinator",
    label: "Program coordinator",
    description: "Manage all records and batches",
  },
  { value: "mentor", label: "Mentor", description: "Browse projects and see which you mentor" },
  { value: "student", label: "Student", description: "Browse, add and edit your own projects" },
]

function noopSubscribe() {
  return () => {}
}

function getHasChosenRoleSnapshot() {
  return window.localStorage.getItem(ROLE_STORAGE_KEY) !== null
}

function getHasChosenRoleServerSnapshot() {
  return true
}

/** Shown once per browser on first visit so a fresh session starts from a
 * chosen role instead of silently defaulting to Student. */
export function RoleOnboardingDialog() {
  const { setRole } = useProjectsStore()
  const hasChosenRole = React.useSyncExternalStore(
    noopSubscribe,
    getHasChosenRoleSnapshot,
    getHasChosenRoleServerSnapshot
  )

  return (
    <Dialog open={!hasChosenRole} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Who&apos;s viewing?</DialogTitle>
          <DialogDescription>
            Are you the programme coordinator, a mentor, or a student?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {ROLE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="outline"
              className="h-auto flex-col items-start gap-0.5 py-3 text-left"
              onClick={() => setRole(option.value)}
            >
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {option.description}
              </span>
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          This is just for prototype purposes — you can change it anytime from the &ldquo;Viewing
          as&rdquo; switcher in the header.
        </p>
      </DialogContent>
    </Dialog>
  )
}
