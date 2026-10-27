"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { ModalDialog } from "@/components/untitled/application/modals/modal-dialog"
import { Button } from "@/components/untitled/base/buttons/button"
import { Input } from "@/components/untitled/base/input/input"
import {
  changePassword,
  passwordLaterFor,
  rememberPasswordLater,
  usePasswordSetup,
} from "@/lib/auth"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"

/** The first thing someone sees after signing in with an issued password: a
 * small box asking them to choose their own. It is a nudge, not a gate: "I will
 * do it later" lets them carry on, and it comes back the next time they sign
 * in. */
export function PasswordSetupPrompt() {
  const router = useRouter()
  const { session } = useProjectsStore()
  const setup = usePasswordSetup()
  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [laterFor, setLaterFor] = React.useState(passwordLaterFor)

  if (!session || setup.loading || !setup.needed) return null
  if (laterFor === session.personId) return null

  const later = () => {
    rememberPasswordLater(session.personId)
    setLaterFor(session.personId)
  }

  const save = async () => {
    if (saving) return
    if (password.length < 8) {
      setError("Use at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("The two passwords do not match.")
      return
    }
    setSaving(true)
    const message = await changePassword(password)
    setSaving(false)
    if (message) {
      setError(message)
      return
    }
    report({ ok: true }, "Password saved")
    router.push("/")
  }

  return (
    <ModalDialog
      isOpen
      onOpenChange={(open) => {
        if (!open) later()
      }}
      size="md"
      title="Choose your password"
      description="Pick one of your own. You can also do this later from your profile."
      footer={
        <>
          <Button color="tertiary" onPress={later}>
            I will do it later
          </Button>
          <Button
            isDisabled={!password || !confirm}
            isLoading={saving}
            onPress={save}
          >
            Save and continue
          </Button>
        </>
      }
    >
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(value) => {
          setPassword(value)
          setError(null)
        }}
        placeholder="At least 8 characters"
        autoFocus
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(value) => {
          setConfirm(value)
          setError(null)
        }}
        hint={error ?? undefined}
        isInvalid={Boolean(error)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && password && confirm) save()
        }}
      />
    </ModalDialog>
  )
}
