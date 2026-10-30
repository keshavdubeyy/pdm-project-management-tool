"use client"

import * as React from "react"
import { DialogTrigger } from "react-aria-components"
import { EmptyState, SectionHeading } from "@/components/common"
import { ProgressForm } from "@/components/artefacts/progress-form"
import { useConfirm } from "@/components/confirm-dialog"
import { Table, TableCard } from "@/components/untitled/application/table/table"
import { Dialog } from "@/components/untitled/application/modals/modal"
import { ModalDialog } from "@/components/untitled/application/modals/modal-dialog"
import { SlideoutMenu } from "@/components/untitled/application/slideout-menus/slideout-menu"
import { Button } from "@/components/untitled/base/buttons/button"
import { Checkbox } from "@/components/untitled/base/checkbox/checkbox"
import { Dropdown } from "@/components/untitled/base/dropdown/dropdown"
import { formatTimestamp } from "@/lib/dates"
import {
  documentsOf,
  documentsOfCheckpoint,
  linkedCheckpoints,
} from "@/lib/documents"
import { hostOf, normalizeUrl } from "@/lib/links"
import { isMemberOf } from "@/lib/permissions"
import { buildPlan, checkpointNumbers } from "@/lib/plan"
import { milestoneViews, personById, type MilestoneView } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { Artefact } from "@/lib/types"
import { cn } from "@/lib/utils"

import {
  ChevronDown,
  Edit05,
  File06,
  LinkExternal01,
  Trash01,
} from "@untitledui/icons"

/** The project's documentation: every link the team has gathered, in one place,
 * with the checkpoints each one supports.
 *
 * A document is a title, a link and an optional note. It is tied to checkpoints
 * from either side: from the library, by ticking checkpoints when adding or
 * editing it, or from a checkpoint, by linking documents to it. */

/* ------------------------------------------------------------- helpers */

/** For a link or button inside a clickable row: its press is its own, and does not
 * also count as a click on the row. */
const ownPress = {
  onPointerDown: (e: React.SyntheticEvent) => e.stopPropagation(),
  onMouseDown: (e: React.SyntheticEvent) => e.stopPropagation(),
  onClick: (e: React.SyntheticEvent) => e.stopPropagation(),
  onKeyDown: (e: React.SyntheticEvent) => e.stopPropagation(),
}

/** The project's checkpoints as the plan numbers them, grouped by phase, for the
 * pickers: instance id, number, title. */
function useCheckpointOptions(projectId: string) {
  const { db } = useProjectsStore()
  return React.useMemo(() => {
    const plan = buildPlan(milestoneViews(db, [projectId]))
    const numbers = checkpointNumbers(plan)
    const phases = plan.flatMap((s) => s.phases)
    return {
      phases: phases.map((phase) => ({
        name: phase.name,
        items: phase.checkpoints.map((c) => ({
          id: c.instance.id,
          number: numbers.get(c.template.id) ?? "",
          title: c.template.title,
          status: c.status,
        })),
      })),
      byInstance: new Map(
        phases.flatMap((p) =>
          p.checkpoints.map((c) => [
            c.instance.id,
            {
              number: numbers.get(c.template.id) ?? "",
              title: c.template.title,
              status: c.status,
            },
          ])
        )
      ),
    }
  }, [db, projectId])
}

/** The project plan items to tick, numbered and grouped by phase. `fixed` is a
 * checkpoint that is always ticked and cannot be changed: the one a document was
 * handed in on. */
function PlanItemList({
  options,
  selected,
  fixed,
  onToggle,
}: {
  options: ReturnType<typeof useCheckpointOptions>
  selected: string[]
  fixed?: string | null
  onToggle: (id: string) => void
}) {
  return (
    <div className="scrollbar-subtle max-h-[28rem] space-y-2 overflow-y-auto px-2 py-2">
      {options.phases.map((phase) => (
        <div key={phase.name}>
          <p className="px-1.5 pb-0.5 text-caption font-semibold text-tertiary">
            {phase.name}
          </p>
          <ul>
            {phase.items.map((item) => {
              const locked = fixed === item.id
              return (
                <li key={item.id}>
                  <Checkbox
                    isSelected={locked || selected.includes(item.id)}
                    isDisabled={locked}
                    onChange={() => onToggle(item.id)}
                    className="px-1.5 py-1.5"
                    label={
                      <span>
                        <span className="mr-2 text-tertiary tabular-nums">
                          {item.number}
                        </span>
                        {item.title}
                        {locked && (
                          <span className="ml-2 text-caption text-tertiary">
                            handed in here
                          </span>
                        )}
                      </span>
                    }
                  />
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

/** The dropdown in the sheet: which project plan items this document is for. It
 * looks like the other fields, says what is chosen, and opens the list. What is
 * chosen is kept by the form and saved with it. */
function LinkField({
  options,
  value,
  fixed,
  onChange,
}: {
  options: ReturnType<typeof useCheckpointOptions>
  value: string[]
  fixed?: string | null
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = React.useState(false)
  const all = Array.from(new Set([...(fixed ? [fixed] : []), ...value]))
  const names = all
    .map((id) => options.byInstance.get(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => `${c.number} ${c.title}`)

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-secondary">
        Link to project plan (optional)
      </p>
      <DialogTrigger isOpen={open} onOpenChange={setOpen}>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-lg bg-primary px-3 py-2 text-left text-md shadow-xs ring-1 ring-primary outline-brand ring-inset focus-visible:outline-2"
        >
          <span
            className={cn(
              "min-w-0 truncate",
              names.length === 0 ? "text-placeholder" : "text-primary"
            )}
          >
            {names.length === 0 ? (
              "Choose project plan items"
            ) : (
              <>
                {names[0]}
                {names.length > 1 && (
                  <span className="text-tertiary">
                    {" "}
                    +{names.length - 1} more
                  </span>
                )}
              </>
            )}
          </span>
          <ChevronDown
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </button>
        <Dropdown.Popover
          placement="bottom start"
          className="w-[26rem] max-w-[90vw]"
        >
          <Dialog className="outline-hidden">
            <PlanItemList
              options={options}
              selected={value}
              fixed={fixed}
              onToggle={(id) =>
                onChange(
                  value.includes(id)
                    ? value.filter((x) => x !== id)
                    : [...value, id]
                )
              }
            />
          </Dialog>
        </Dropdown.Popover>
      </DialogTrigger>
    </div>
  )
}

/* ---------------------------------------------------------------- tab */

export function DocumentsTab({
  projectId,
  onOpenCheckpoint,
  onEdit,
}: {
  projectId: string
  /** Opens a checkpoint's sheet, by instance id. */
  onOpenCheckpoint: (milestoneInstanceId: string) => void
  /** Opens the edit sheet for a document. It is mounted by the page, outside the
   * tabs, which do not hold sheets well; adding is its button, up on the tab
   * row. */
  onEdit: (document: Artefact) => void
}) {
  const { db, actor, removeArtefact } = useProjectsStore()
  const { confirm, dialog } = useConfirm()
  const options = useCheckpointOptions(projectId)

  const project = db.projects.find((p) => p.id === projectId)
  // Only the team keeps its documentation; everyone else reads it.
  const canChange = Boolean(actor && project && isMemberOf(actor, project))
  const docs = documentsOf(db, projectId)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-meta text-muted-foreground">
          Everything your team has gathered, in one place. Link a document to
          the checkpoints it supports.
        </p>
      </div>

      {docs.length === 0 ? (
        <EmptyState
          icon={File06}
          title="No documents yet"
          className="min-h-[45vh]"
          body={
            canChange
              ? "Add a link to a document and choose the project plan items it is for."
              : "The team has not added any documents yet."
          }
        />
      ) : (
        <TableCard.Root size="sm">
          <Table
            aria-label="Documents"
            // A click on the row opens the sheet to update the document: its
            // title, link, notes and which project plan items it is for. Only
            // the team can change a document, so for anyone else the row does
            // nothing.
            onRowAction={(key) => {
              const doc = docs.find((d) => d.id === String(key))
              if (doc && canChange) onEdit(doc)
            }}
          >
            <Table.Header>
              <Table.Head id="title" isRowHeader label="Title" />
              <Table.Head id="link" label="Link" />
              <Table.Head id="linked" label="Linked to" />
              <Table.Head id="by" label="Added by" />
              <Table.Head id="when" label="Date and time" />
              <Table.Head id="notes" label="Notes" />
              {canChange && (
                <Table.Head id="actions" aria-label="Actions" className="w-0" />
              )}
            </Table.Header>
            <Table.Body items={docs}>
              {(doc) => {
                return (
                  <Table.Row id={doc.id}>
                    <Table.Cell className="font-medium whitespace-nowrap text-primary">
                      {doc.label}
                    </Table.Cell>
                    <Table.Cell className="max-w-56">
                      <a
                        href={normalizeUrl(doc.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={doc.url}
                        {...ownPress}
                        className="inline-flex max-w-full items-center gap-1.5 text-brand-secondary underline-offset-2 hover:underline"
                      >
                        <span className="truncate">
                          {hostOf(doc.url) || doc.url}
                        </span>
                        <LinkExternal01
                          className="size-3.5 shrink-0"
                          aria-hidden
                        />
                      </a>
                    </Table.Cell>
                    <Table.Cell className="max-w-72">
                      {linkedCheckpoints(doc).length === 0 ? (
                        <span className="text-tertiary">Not linked yet</span>
                      ) : (
                        // Each one opens that checkpoint's sheet.
                        <span className="flex flex-wrap items-center gap-x-1">
                          {linkedCheckpoints(doc).map((id, i, all) => {
                            const c = options.byInstance.get(id)
                            if (!c) return null
                            return (
                              <React.Fragment key={id}>
                                <button
                                  type="button"
                                  {...ownPress}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onOpenCheckpoint(id)
                                  }}
                                  className="rounded text-left text-brand-secondary underline-offset-2 outline-brand hover:underline focus-visible:outline-2"
                                >
                                  {c.number} {c.title}
                                </button>
                                {i < all.length - 1 && (
                                  <span className="text-tertiary">,</span>
                                )}
                              </React.Fragment>
                            )
                          })}
                        </span>
                      )}
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap">
                      {personById(db, doc.addedBy)?.name ?? "Unknown"}
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap">
                      {formatTimestamp(doc.addedAt)}
                    </Table.Cell>
                    <Table.Cell className="max-w-64">
                      <span className="block truncate text-tertiary">
                        {doc.note || "—"}
                      </span>
                    </Table.Cell>
                    {canChange && (
                      <Table.Cell className="w-0 pr-4 text-right">
                        <Dropdown.Root>
                          <Dropdown.DotsButton />
                          <Dropdown.Popover className="w-48">
                            <Dropdown.Menu>
                              <Dropdown.Item
                                key="edit"
                                icon={Edit05}
                                onAction={() => onEdit(doc)}
                              >
                                Edit
                              </Dropdown.Item>
                              {linkedCheckpoints(doc).map((id, _, all) => {
                                const c = options.byInstance.get(id)
                                if (!c) return null
                                return (
                                  <Dropdown.Item
                                    key={`open-${id}`}
                                    icon={LinkExternal01}
                                    onAction={() => onOpenCheckpoint(id)}
                                  >
                                    {all.length === 1
                                      ? "Open checkpoint"
                                      : `Open ${c.number} ${c.title}`}
                                  </Dropdown.Item>
                                )
                              })}
                              {/* One handed in on a checkpoint is deleted from
                                there, with the rest of its progress. */}
                              {!doc.milestoneInstanceId && (
                                <Dropdown.Item
                                  key="delete"
                                  icon={Trash01}
                                  className="[&_span]:text-error-primary [&_svg]:text-fg-error-secondary"
                                  onAction={() =>
                                    confirm({
                                      title: "Delete this document?",
                                      description: doc.label,
                                      confirmLabel: "Delete",
                                      destructive: true,
                                      onConfirm: () =>
                                        report(
                                          removeArtefact(doc.id),
                                          "Document deleted"
                                        ),
                                    })
                                  }
                                >
                                  Delete
                                </Dropdown.Item>
                              )}
                            </Dropdown.Menu>
                          </Dropdown.Popover>
                        </Dropdown.Root>
                      </Table.Cell>
                    )}
                  </Table.Row>
                )
              }}
            </Table.Body>
          </Table>
        </TableCard.Root>
      )}

      {dialog}
    </div>
  )
}

/* --------------------------------------------------------------- sheet */

/** Add a document, or change one: a title, a link and a note, the same plain form
 * as everywhere else, with one dropdown for the project plan items it is for.
 * `document` is "new", an existing one, or null while closed. */
export function DocumentSheet({
  projectId,
  document,
  onOpenChange,
}: {
  projectId: string
  document: Artefact | "new" | null
  onOpenChange: (open: boolean) => void
}) {
  const { submitDocument } = useProjectsStore()
  const options = useCheckpointOptions(projectId)
  // Keep the last one while the sheet slides out, so it doesn't blank.
  const [last, setLast] = React.useState<Artefact | "new" | null>(null)
  if (document && document !== last) setLast(document)
  const shown = document ?? last
  // Set when a save has just linked a document to checkpoints that are not in
  // yet: it is asked about once the sheet has closed.
  const [ask, setAsk] = React.useState<{
    docId: string
    label: string
    ids: string[]
  } | null>(null)
  const [kept, setKept] = React.useState(ask)
  if (ask && ask !== kept) setKept(ask)

  return (
    <>
      <SlideoutMenu
        isDismissable
        isOpen={document !== null}
        onOpenChange={onOpenChange}
        className="sm:max-w-xl"
      >
        {shown && (
          // Keyed so it starts fresh each time it opens.
          <DocumentEditor
            key={shown === "new" ? "new" : shown.id}
            projectId={projectId}
            document={shown === "new" ? null : shown}
            onLinked={setAsk}
            onDone={() => onOpenChange(false)}
          />
        )}
      </SlideoutMenu>

      <ModalDialog
        isOpen={ask !== null}
        onOpenChange={(open) => {
          if (!open) setAsk(null)
        }}
        title="Submit this as progress?"
        description="You can submit it now, or keep it as a supporting document and submit when you are ready. Your mentor is told when you submit."
        footer={
          <>
            <Button color="tertiary" slot="close">
              Not now
            </Button>
            <Button
              onPress={() => {
                if (!kept) return
                if (
                  report(
                    submitDocument(kept.docId, kept.ids),
                    "Submitted as progress"
                  )
                )
                  setAsk(null)
              }}
            >
              Submit progress
            </Button>
          </>
        }
      >
        {kept && (
          <div className="space-y-2">
            <p className="text-meta text-muted-foreground">
              “{kept.label}” is now linked to:
            </p>
            <ul className="space-y-1">
              {kept.ids.map((id) => {
                const c = options.byInstance.get(id)
                return (
                  <li key={id} className="text-meta text-foreground">
                    <span className="mr-2 text-tertiary tabular-nums">
                      {c?.number}
                    </span>
                    {c?.title}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </ModalDialog>
    </>
  )
}

function DocumentEditor({
  projectId,
  document,
  onLinked,
  onDone,
}: {
  projectId: string
  document: Artefact | null
  /** Told which checkpoints a save has newly linked and that are not in yet. */
  onLinked: (ask: { docId: string; label: string; ids: string[] }) => void
  onDone: () => void
}) {
  const { addArtefact, updateArtefact } = useProjectsStore()
  const options = useCheckpointOptions(projectId)
  const [linked, setLinked] = React.useState<string[]>(document?.linkedTo ?? [])

  return (
    <ProgressForm
      heading={document ? "Edit document" : "Add document"}
      hint="A link to a document your team has gathered."
      confirmLabel={document ? "Save changes" : "Add document"}
      noteLabel="Notes (optional)"
      notePlaceholder="What this is, in a line"
      defaults={{
        label: document?.label ?? "",
        url: document?.url ?? "",
        note: document?.note ?? "",
      }}
      extra={
        <LinkField
          options={options}
          value={linked}
          fixed={document?.milestoneInstanceId}
          onChange={setLinked}
        />
      }
      onSubmit={({ label, url, note }) => {
        const result = document
          ? updateArtefact(document.id, { url, label, note, linkedTo: linked })
          : addArtefact(projectId, { url, label, note, linkedTo: linked })
        if (!report(result, document ? "Document updated" : "Document added"))
          return false

        // Linking is the start of handing it in: for any checkpoint it has just
        // been linked to that is still waiting on the team, ask whether to
        // submit it now.
        const docId = document ? document.id : result.ok ? result.id : undefined
        const before = new Set(document?.linkedTo ?? [])
        const waiting = linked.filter(
          (id) =>
            !before.has(id) &&
            id !== document?.milestoneInstanceId &&
            !["submitted", "under_review", "accepted"].includes(
              options.byInstance.get(id)?.status ?? "accepted"
            )
        )
        if (docId && waiting.length > 0)
          onLinked({ docId, label, ids: waiting })
        return true
      }}
      onDone={onDone}
    />
  )
}

/* ------------------------------------------------- in a checkpoint sheet */

/** The documents linked to one checkpoint, to read and open. Nothing to do here:
 * a document is linked, or added, from the Documents tab. With none linked, there
 * is no section at all. */
export function CheckpointDocuments({ view }: { view: MilestoneView }) {
  const { db } = useProjectsStore()
  const docs = documentsOfCheckpoint(db, view.project.id, view.instance.id)
  if (docs.length === 0) return null

  return (
    <section className="space-y-3">
      <SectionHeading>Documents</SectionHeading>
      <ul className="divide-y divide-secondary rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset">
        {docs.map((doc) => (
          <li key={doc.id}>
            <a
              href={normalizeUrl(doc.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-meta outline-brand hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground">
                  {doc.label}
                </span>
                <span className="block truncate text-caption text-muted-foreground">
                  {hostOf(doc.url) || doc.url}
                </span>
              </span>
              <LinkExternal01
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
