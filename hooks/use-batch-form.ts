"use client"

import * as React from "react"

import { isDuplicateBatchLabel } from "@/lib/duplicates"
import type { Batch, BatchDraft } from "@/lib/types"

// The platform currently serves a single programme. If it grows to support
// more, this becomes a programme selector and the prefix comes from it.
export const PROGRAMME = "PDM"

export type BatchFormErrors = Partial<Record<"admissionYear" | "graduationYear" | "name", string>>

function isYear(value: string) {
  return /^\d{4}$/.test(value.trim())
}

/** Drives the "Add batch" fields (admission/graduation year, an
 * auto-generated but editable name, and an optional description) so the
 * same validation and name-generation logic can back both the directory's
 * dialog and the project form's inline "add a batch" flow. */
export function useBatchForm(existingBatches: Batch[]) {
  const [admissionYear, setAdmissionYearRaw] = React.useState("")
  const [graduationYear, setGraduationYearRaw] = React.useState("")
  const [nameValue, setNameValue] = React.useState("")
  const [nameTouched, setNameTouched] = React.useState(false)
  const [description, setDescription] = React.useState("")
  const [errors, setErrors] = React.useState<BatchFormErrors>({})

  const generatedName =
    isYear(admissionYear) && isYear(graduationYear)
      ? `${PROGRAMME} ${admissionYear.trim()}–${graduationYear.trim()}`
      : ""

  const name = nameTouched ? nameValue : generatedName

  function clearError(field: keyof BatchFormErrors) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  function setAdmissionYear(value: string) {
    setAdmissionYearRaw(value)
    clearError("admissionYear")
  }

  function setGraduationYear(value: string) {
    setGraduationYearRaw(value)
    clearError("graduationYear")
  }

  function setName(value: string) {
    setNameTouched(true)
    setNameValue(value)
    clearError("name")
  }

  function reset() {
    setAdmissionYearRaw("")
    setGraduationYearRaw("")
    setNameValue("")
    setNameTouched(false)
    setDescription("")
    setErrors({})
  }

  /** Validates and, if valid, returns the batch to create. On failure it
   * sets field errors and returns null, leaving every entered value in
   * place so the user doesn't lose their input. */
  function buildDraft(): BatchDraft | null {
    const nextErrors: BatchFormErrors = {}

    if (!admissionYear.trim()) {
      nextErrors.admissionYear = "Enter the admission year."
    } else if (!isYear(admissionYear)) {
      nextErrors.admissionYear = "Use a 4-digit year, e.g. 2026."
    }

    if (!graduationYear.trim()) {
      nextErrors.graduationYear = "Enter the expected graduation year."
    } else if (!isYear(graduationYear)) {
      nextErrors.graduationYear = "Use a 4-digit year, e.g. 2028."
    } else if (isYear(admissionYear) && Number(graduationYear) <= Number(admissionYear)) {
      nextErrors.graduationYear = "Must be after the admission year."
    }

    const finalName = name.trim()
    if (!nextErrors.admissionYear && !nextErrors.graduationYear) {
      if (!finalName) {
        nextErrors.name = "Give the batch a name."
      } else if (isDuplicateBatchLabel(existingBatches, finalName)) {
        nextErrors.name = `"${finalName}" already exists. Choose different years or edit the name.`
      }
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return null

    return {
      label: finalName,
      admissionYear: Number(admissionYear),
      graduationYear: Number(graduationYear),
      description: description.trim() || undefined,
    }
  }

  return {
    admissionYear,
    setAdmissionYear,
    graduationYear,
    setGraduationYear,
    name,
    setName,
    description,
    setDescription,
    errors,
    reset,
    buildDraft,
  }
}
