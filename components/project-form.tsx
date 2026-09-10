"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MaterialsEditor } from "@/components/materials-editor"
import { PeoplePicker } from "@/components/people-picker"
import { findLikelyDuplicates } from "@/lib/duplicates"
import { canManageRecords } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"
import type { Project, ProjectDraft, ProjectStatus } from "@/lib/types"

const NEW_BATCH = "__new_batch__"
const NEW_DOMAIN = "__new_domain__"

type ProjectFormProps = {
  mode: "create" | "edit"
  project?: Project
  initialBatchId?: string
}

type Errors = Partial<Record<"title" | "description" | "teamMemberIds" | "batchId", string>>

export function ProjectForm({ mode, project, initialBatchId }: ProjectFormProps) {
  const router = useRouter()
  const {
    people,
    batches,
    domains,
    projects,
    currentUser,
    addProject,
    updateProject,
    addPerson,
    addBatch,
    addDomain,
  } = useProjectsStore()

  const [title, setTitle] = React.useState(project?.title ?? "")
  const [description, setDescription] = React.useState(project?.description ?? "")
  const [coverImage, setCoverImage] = React.useState(project?.coverImage ?? "")
  const [teamMemberIds, setTeamMemberIds] = React.useState<string[]>(
    project?.teamMemberIds ?? (currentUser.role === "student" ? [currentUser.id] : [])
  )
  const [batchId, setBatchId] = React.useState(project?.batchId ?? initialBatchId ?? "")
  const [mentorIds, setMentorIds] = React.useState<string[]>(project?.mentorIds ?? [])
  const [domainId, setDomainId] = React.useState<string | null>(project?.domainId ?? null)
  const [status, setStatus] = React.useState<ProjectStatus>(project?.status ?? "ongoing")
  const [problem, setProblem] = React.useState(project?.problem ?? "")
  const [workOrOutcome, setWorkOrOutcome] = React.useState(project?.workOrOutcome ?? "")
  const [materials, setMaterials] = React.useState(project?.materials ?? [])

  const [errors, setErrors] = React.useState<Errors>({})
  const [addingBatch, setAddingBatch] = React.useState(false)
  const [newBatchLabel, setNewBatchLabel] = React.useState("")
  const [addingDomain, setAddingDomain] = React.useState(false)
  const [newDomainLabel, setNewDomainLabel] = React.useState("")

  const duplicates = React.useMemo(
    () => findLikelyDuplicates(projects, title, project?.id),
    [projects, title, project?.id]
  )

  const batchItems = React.useMemo(
    () => Object.fromEntries(batches.map((b) => [b.id, b.label])),
    [batches]
  )
  const domainItems = React.useMemo(
    () => Object.fromEntries(domains.map((d) => [d.id, d.label])),
    [domains]
  )
  const statusItems = React.useMemo(() => ({ ongoing: "Ongoing", completed: "Completed" }), [])

  function handleBatchChange(value: string) {
    if (value === NEW_BATCH) {
      setAddingBatch(true)
      return
    }
    setBatchId(value)
  }

  function confirmNewBatch() {
    if (!newBatchLabel.trim()) return
    const batch = addBatch(newBatchLabel.trim())
    setBatchId(batch.id)
    setNewBatchLabel("")
    setAddingBatch(false)
  }

  function handleDomainChange(value: string) {
    if (value === NEW_DOMAIN) {
      setAddingDomain(true)
      return
    }
    setDomainId(value)
  }

  function confirmNewDomain() {
    if (!newDomainLabel.trim()) return
    const domain = addDomain(newDomainLabel.trim())
    setDomainId(domain.id)
    setNewDomainLabel("")
    setAddingDomain(false)
  }

  function validate(): Errors {
    const next: Errors = {}
    if (!title.trim()) next.title = "Add a project title."
    if (!description.trim()) next.description = "Add a short description."
    if (teamMemberIds.length === 0) next.teamMemberIds = "Add at least one team member."
    if (!batchId) next.batchId = "Select a batch."
    return next
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const draft: ProjectDraft = {
      title: title.trim(),
      description: description.trim(),
      coverImage: coverImage.trim() || undefined,
      teamMemberIds,
      batchId,
      mentorIds,
      domainId,
      status,
      problem: problem.trim(),
      workOrOutcome: workOrOutcome.trim(),
      materials,
    }

    if (mode === "create") {
      const created = addProject(draft)
      router.push(`/projects/${created.id}`)
    } else if (project) {
      updateProject(project.id, draft)
      router.push(`/projects/${project.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {duplicates.length > 0 && (
        <Alert>
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
          <AlertTitle>This title looks similar to existing projects</AlertTitle>
          <AlertDescription>
            Check before saving: {duplicates.map((d) => d.title).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      <FieldSet>
        <FieldLegend>Basics</FieldLegend>
        <FieldGroup>
          <Field data-invalid={Boolean(errors.title)}>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-invalid={Boolean(errors.title)}
            />
            <FieldError>{errors.title}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.description)}>
            <FieldLabel htmlFor="description">Short description</FieldLabel>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              aria-invalid={Boolean(errors.description)}
              rows={2}
            />
            <FieldError>{errors.description}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="coverImage">Cover image URL</FieldLabel>
            <Input
              id="coverImage"
              type="url"
              value={coverImage}
              onChange={(event) => setCoverImage(event.target.value)}
              placeholder="https://example.com/cover.jpg"
            />
            <FieldDescription>
              Optional — shown as the thumbnail on the project card. Paste a link to an image.
            </FieldDescription>
          </Field>

          <Field data-invalid={Boolean(errors.teamMemberIds)}>
            <FieldLabel>Team members</FieldLabel>
            <PeoplePicker
              people={people}
              value={teamMemberIds}
              onChange={setTeamMemberIds}
              onCreatePerson={(name) => addPerson(name, "student")}
              placeholder="Search or add a team member"
            />
            <FieldError>{errors.teamMemberIds}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.batchId)}>
            <FieldLabel>Batch</FieldLabel>
            {addingBatch ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={newBatchLabel}
                  onChange={(event) => setNewBatchLabel(event.target.value)}
                  placeholder="e.g. Batch 2027"
                />
                <Button type="button" onClick={confirmNewBatch}>
                  Add
                </Button>
                <Button type="button" variant="ghost" onClick={() => setAddingBatch(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Select
                items={batchItems}
                value={batchId}
                onValueChange={(value) => handleBatchChange(value as string)}
              >
                <SelectTrigger aria-invalid={Boolean(errors.batchId)} className="w-full sm:w-64">
                  <SelectValue placeholder="Select a batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.label}
                    </SelectItem>
                  ))}
                  {canManageRecords(currentUser) && (
                    <>
                      <SelectSeparator />
                      <SelectItem value={NEW_BATCH}>+ Add new batch</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
            <FieldError>{errors.batchId}</FieldError>
          </Field>

          <Field>
            <FieldLabel>Mentor</FieldLabel>
            <PeoplePicker
              people={people}
              value={mentorIds}
              onChange={setMentorIds}
              onCreatePerson={(name) => addPerson(name, "mentor")}
              roleFilter="mentor"
              placeholder="Search or add a mentor (optional)"
            />
            <FieldDescription>
              Leave blank if the project doesn&apos;t have a mentor yet.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Domain</FieldLabel>
            {addingDomain ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={newDomainLabel}
                  onChange={(event) => setNewDomainLabel(event.target.value)}
                  placeholder="Request a new domain label"
                />
                <Button type="button" onClick={confirmNewDomain}>
                  Add
                </Button>
                <Button type="button" variant="ghost" onClick={() => setAddingDomain(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Select
                items={domainItems}
                value={domainId ?? ""}
                onValueChange={(value) => handleDomainChange(value as string)}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select a domain (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value={NEW_DOMAIN}>+ Request a new label</SelectItem>
                </SelectContent>
              </Select>
            )}
          </Field>

          <Field>
            <FieldLabel>Status</FieldLabel>
            <Select
              items={statusItems}
              value={status}
              onValueChange={(value) => setStatus(value as ProjectStatus)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <FieldDescription>
              Marking a project completed is a directory label, not academic approval.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Problem and outcome</FieldLegend>
        <FieldDescription>Optional — add now or update later as work develops.</FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="problem">Problem</FieldLabel>
            <Textarea
              id="problem"
              value={problem}
              onChange={(event) => setProblem(event.target.value)}
              rows={3}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="outcome">Work so far or outcome</FieldLabel>
            <Textarea
              id="outcome"
              value={workOrOutcome}
              onChange={(event) => setWorkOrOutcome(event.target.value)}
              rows={3}
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Project materials</FieldLegend>
        <FieldDescription>
          Optional — add named links such as a report, prototype or repository.
        </FieldDescription>
        <MaterialsEditor value={materials} onChange={setMaterials} />
      </FieldSet>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit">{mode === "create" ? "Save project" : "Save changes"}</Button>
      </div>
    </form>
  )
}
