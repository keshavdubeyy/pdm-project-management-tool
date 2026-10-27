"use client"

import * as React from "react"

import { PageHeader } from "@/components/common"
import { Avatar } from "@/components/untitled/base/avatar/avatar"
import { Button } from "@/components/untitled/base/buttons/button"
import { FileTrigger } from "@/components/untitled/base/file-upload-trigger/file-upload-trigger"
import { Input } from "@/components/untitled/base/input/input"
import { projectsFor } from "@/lib/permissions"
import { changePassword } from "@/lib/auth"
import { uploadAvatar } from "@/lib/remote"
import { initialsOf, personById } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"

import { Trash01, UploadCloud01 } from "@untitledui/icons"

const MAX_BYTES = 2 * 1024 * 1024
const TYPES = ["image/png", "image/jpeg", "image/webp"]

/** Your own details: a photo, and a project title if you are a student.
 *
 * Name, email, roll number and mentor are not here to edit. The coordinator sets them, and
 * a student changing their own mentor would undo the allocation. */
export default function ProfilePage() {
  const { db, actor, currentUser, updateProfile, setProjectTitle } =
    useProjectsStore()
  const [titleDraft, setTitleDraft] = React.useState<string | null>(null)
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [savingPassword, setSavingPassword] = React.useState(false)
  const [passwordError, setPasswordError] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [photoError, setPhotoError] = React.useState<string | null>(null)

  if (!actor || !currentUser) return null

  const isStudent = actor.role === "student"
  const project = isStudent ? projectsFor(db, actor)[0] : undefined
  const title = titleDraft ?? project?.title ?? ""
  const titleDirty = Boolean(project) && title.trim() !== project!.title.trim()

  const saveTitle = () => {
    if (!project || !report(setProjectTitle(project.id, title))) return
    setTitleDraft(null)
    report({ ok: true }, "Title saved")
  }
  const mentors = isStudent
    ? (projectsFor(db, actor)[0]?.mentorIds ?? [])
        .map((id) => personById(db, id)?.name)
        .filter(Boolean)
    : []

  const savePassword = async () => {
    setPasswordError(null)
    if (newPassword.length < 8) {
      setPasswordError("Use at least 8 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("The two passwords do not match.")
      return
    }
    setSavingPassword(true)
    const message = await changePassword(newPassword)
    setSavingPassword(false)
    if (message) {
      setPasswordError(message)
      return
    }
    setNewPassword("")
    setConfirmPassword("")
    report({ ok: true }, "Password changed")
  }

  const pick = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setPhotoError(null)
    if (!TYPES.includes(file.type)) {
      setPhotoError("Use a PNG, JPG or WebP image.")
      return
    }
    if (file.size > MAX_BYTES) {
      setPhotoError(
        `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. Keep it under 2 MB.`
      )
      return
    }
    setUploading(true)
    try {
      const url = await uploadAvatar(currentUser.id, file)
      report(updateProfile({ avatarUrl: url }), "Photo updated")
    } catch (error) {
      setPhotoError(
        error instanceof Error
          ? error.message
          : "The upload did not go through."
      )
    } finally {
      setUploading(false)
    }
  }

  const passwordSection = (
    <section className="space-y-4">
      <h2 className="text-title text-foreground">Password</h2>
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(value) => {
          setNewPassword(value)
          setPasswordError(null)
        }}
        hint="At least 8 characters."
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(value) => {
          setConfirmPassword(value)
          setPasswordError(null)
        }}
        hint={passwordError ?? undefined}
        isInvalid={Boolean(passwordError)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && newPassword && confirmPassword)
            savePassword()
        }}
      />
      <div className="flex justify-end">
        <Button
          isDisabled={!newPassword || !confirmPassword}
          isLoading={savingPassword}
          onPress={savePassword}
        >
          Change password
        </Button>
      </div>
    </section>
  )

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <PageHeader
        title="Profile"
        description="Your photo and details, as others in the programme see them."
      />

      <section className="flex flex-wrap items-center gap-5">
        <Avatar
          size="2xl"
          src={currentUser.avatarUrl}
          initials={initialsOf(currentUser.name)}
          alt={currentUser.name}
        />
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <FileTrigger acceptedFileTypes={TYPES} onSelect={pick}>
              <Button
                color="secondary"
                size="sm"
                iconLeading={UploadCloud01}
                isLoading={uploading}
              >
                {currentUser.avatarUrl ? "Change photo" : "Upload photo"}
              </Button>
            </FileTrigger>
            {currentUser.avatarUrl && (
              <Button
                color="tertiary-destructive"
                size="sm"
                iconLeading={Trash01}
                isDisabled={uploading}
                onPress={() =>
                  report(updateProfile({ avatarUrl: null }), "Photo removed")
                }
              >
                Remove
              </Button>
            )}
          </div>
          <p
            className={
              photoError
                ? "text-caption text-error-primary"
                : "text-caption text-muted-foreground"
            }
          >
            {photoError ?? "PNG, JPG or WebP, up to 2 MB."}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <Input label="Name" value={currentUser.name} isDisabled />
        <Input label="Email" value={currentUser.email} isDisabled />

        {isStudent && (
          <>
            <Input
              label="Roll number"
              value={currentUser.rollNumber ?? ""}
              placeholder="Not recorded"
              hint="Set by the coordinator. You cannot change this."
              isDisabled
            />
            {project && (
              <Input
                label="Project title"
                value={title}
                onChange={setTitleDraft}
                placeholder="Project title"
                maxLength={120}
                hint="Your mentor and the programme coordinator see this."
                onKeyDown={(event) => {
                  if (event.key === "Enter" && titleDirty) saveTitle()
                }}
              />
            )}
            <Input
              label="Mentor"
              value={mentors.join(", ") || "Not allocated yet"}
              hint="Allocated by the coordinator. You cannot change this."
              isDisabled
            />
            <div className="flex justify-end">
              <Button isDisabled={!titleDirty} onPress={saveTitle}>
                Save
              </Button>
            </div>
          </>
        )}
      </section>

      {passwordSection}
    </div>
  )
}
