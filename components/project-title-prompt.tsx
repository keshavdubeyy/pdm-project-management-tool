"use client"

import * as React from "react"

import { ModalDialog } from "@/components/untitled/application/modals/modal-dialog"
import { Button } from "@/components/untitled/base/buttons/button"
import { Input } from "@/components/untitled/base/input/input"
import { usePasswordSetup } from "@/lib/auth"
import { projectsFor } from "@/lib/permissions"
import { hasProjectTitle } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"

/** Asks a student to name their project before anything else.
 *
 * It waits for the server's copy to load first: a title the team already wrote
 * on another device has not "gone missing", and asking again would overwrite
 * it. Mentors and the coordinator are never asked; they see a grey placeholder
 * until the team has written one. */
export function ProjectTitlePrompt() {
  const { db, actor, sharedReady, setProjectTitle } = useProjectsStore()
  const setup = usePasswordSetup()
  const [title, setTitle] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  if (!actor || actor.role !== "student" || !sharedReady) return null
  // The password comes first; the title is asked once that is done.
  if (setup.loading || setup.needed) return null
  const project = projectsFor(db, actor)[0]
  if (!project || hasProjectTitle(project)) return null

  const save = () => {
    if (saving) return
    if (!title.trim()) {
      setError("Write a title to continue.")
      return
    }
    setSaving(true)
    const result = setProjectTitle(project.id, title)
    setSaving(false)
    if (!report(result)) return
  }

  return (
    <ModalDialog
      isOpen
      required
      size="md"
      title="Name your project"
      description="Give your project a title. Your mentor and the programme coordinator will see it. You can carry on once it has one."
      footer={
        <Button isDisabled={!title.trim()} isLoading={saving} onPress={save}>
          Save and continue
        </Button>
      }
    >
      <Input
        label="Project title"
        placeholder="e.g. Everything-for-rent platform"
        value={title}
        onChange={(value) => {
          setTitle(value)
          setError(null)
        }}
        maxLength={120}
        autoFocus
        hint={error ?? undefined}
        isInvalid={Boolean(error)}
        onKeyDown={(event) => {
          if (event.key === "Enter") save()
        }}
      />
    </ModalDialog>
  )
}
