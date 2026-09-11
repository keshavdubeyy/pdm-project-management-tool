import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { BatchFormErrors } from "@/hooks/use-batch-form"

type BatchFormFieldsProps = {
  admissionYear: string
  onAdmissionYearChange: (value: string) => void
  graduationYear: string
  onGraduationYearChange: (value: string) => void
  name: string
  onNameChange: (value: string) => void
  description: string
  onDescriptionChange: (value: string) => void
  errors: BatchFormErrors
  idPrefix?: string
}

export function BatchFormFields({
  admissionYear,
  onAdmissionYearChange,
  graduationYear,
  onGraduationYearChange,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  errors,
  idPrefix = "batch",
}: BatchFormFieldsProps) {
  return (
    <>
      <Field data-invalid={Boolean(errors.admissionYear)}>
        <FieldLabel htmlFor={`${idPrefix}-admission-year`}>Admission year</FieldLabel>
        <Input
          id={`${idPrefix}-admission-year`}
          inputMode="numeric"
          autoFocus
          value={admissionYear}
          onChange={(event) => onAdmissionYearChange(event.target.value)}
          placeholder="e.g. 2026"
          aria-invalid={Boolean(errors.admissionYear)}
        />
        <FieldError>{errors.admissionYear}</FieldError>
      </Field>

      <Field data-invalid={Boolean(errors.graduationYear)}>
        <FieldLabel htmlFor={`${idPrefix}-graduation-year`}>Expected graduation year</FieldLabel>
        <Input
          id={`${idPrefix}-graduation-year`}
          inputMode="numeric"
          value={graduationYear}
          onChange={(event) => onGraduationYearChange(event.target.value)}
          placeholder="e.g. 2028"
          aria-invalid={Boolean(errors.graduationYear)}
        />
        <FieldError>{errors.graduationYear}</FieldError>
      </Field>

      <Field data-invalid={Boolean(errors.name)}>
        <FieldLabel htmlFor={`${idPrefix}-name`}>Batch name</FieldLabel>
        <Input
          id={`${idPrefix}-name`}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Generated from the years below"
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name ? (
          <FieldError>{errors.name}</FieldError>
        ) : (
          <FieldDescription>Generated automatically — edit it for a different name.</FieldDescription>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-description`}>Description</FieldLabel>
        <Textarea
          id={`${idPrefix}-description`}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="A short note about the batch (optional)"
          rows={2}
        />
      </Field>
    </>
  )
}
