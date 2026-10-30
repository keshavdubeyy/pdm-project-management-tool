"use client"

import * as React from "react"
import { MultiProgressForm } from "@/components/artefacts/progress-form"
import { useConfirm } from "@/components/confirm-dialog"
import { CheckpointComments } from "@/components/milestones/checkpoint-comments"
import { DueBadge, SectionHeading, StatusText } from "@/components/common"
import { Button } from "@/components/untitled/base/buttons/button"
import { Checkbox } from "@/components/untitled/base/checkbox/checkbox"
import { ModalDialog } from "@/components/untitled/application/modals/modal-dialog"
import { SlideoutMenu } from "@/components/untitled/application/slideout-menus/slideout-menu"
import { TextArea } from "@/components/untitled/base/textarea/textarea"
import { formatTimestamp } from "@/lib/dates"
import { hostOf, normalizeUrl } from "@/lib/links"
import { canReview, canSubmitMilestone, isMemberOf } from "@/lib/permissions"
import { personById } from "@/lib/selectors"
import type { MilestoneView } from "@/lib/selectors"
import { RETURN_CATEGORY_LABEL } from "@/lib/status"
import { AWAITING_TEAM } from "@/lib/status"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { Artefact } from "@/lib/types"
import { cn } from "@/lib/utils"

import {
  CheckCircle,
  Edit05,
  LinkExternal01,
  Loading02,
  Trash01,
} from "@untitledui/icons"

/** One checkpoint, opened beside whatever you were looking at.
 *
 * A slide-over rather than a modal because a mentor working through the grid
 * needs the grid to stay behind it — the next row is the context for the
 * decision they are making about this one. The decision itself is a modal,
 * because accepting or returning work deserves a deliberate stop. */
export function MilestoneSheet({
  view,
  open,
  onOpenChange,
  onSubmitted,
  focusCommentId,
}: {
  view: MilestoneView | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called once progress has been uploaded from this sheet, so the page can
   * take the person to where it now shows. */
  onSubmitted?: () => void
  /** A comment to scroll to and mark when the sheet opens, from a notification. */
  focusCommentId?: string | null
}) {
  const { db, actor, toggleDeliverable } = useProjectsStore()

  if (!view || !actor) return null

  const { instance, template, project, status } = view
  const isTeam = isMemberOf(actor, project)
  const canSubmit = canSubmitMilestone(actor, project).allowed
  const canDecide = canReview(actor, project).allowed
  const showSubmit = canSubmit && status !== "accepted"
  const showDecide =
    canDecide && (status === "submitted" || status === "under_review")
  const done = instance.completedDeliverables
  // Only the latest of each: what was handed in last, and what the mentor said
  // when it came back. Earlier rounds are not shown.
  const latest = db.submissions
    .filter((x) => x.milestoneInstanceId === instance.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0]
  const latestWork = latest
    ? latest.artefactIds
        .map((artefactId) => db.artefacts.find((a) => a.id === artefactId))
        .filter((a): a is NonNullable<typeof a> => Boolean(a))
    : []
  // The links added in the latest submission itself. Anything attached earlier
  // came with an earlier submission and is not shown. A submission made before
  // links were added together has none that match, so all of its work shows.
  const fresh = latest
    ? latestWork.filter((a) => a.addedAt === latest.submittedAt)
    : []
  const submitted = fresh.length > 0 ? fresh : latestWork
  // Once it is in and waiting on the mentor, the team can edit what it sent but
  // not send it again. Submit comes back if the mentor returns it. A
  // submission too old to be edited as a group keeps the Submit button.
  const waiting = status === "submitted" || status === "under_review"
  const showEdit = showSubmit && isTeam && waiting && fresh.length > 0
  const feedback =
    status === "returned"
      ? db.reviews
          .filter(
            (r) =>
              r.milestoneInstanceId === instance.id && r.verdict === "return"
          )
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      : undefined

  return (
    <SlideoutMenu
      isDismissable
      isOpen={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[560px]"
    >
      {/* The close button sits in the top-right corner, 12px in. The row is
        the button's height and keeps 40px clear on the right, so the due text
        ends beside the cross rather than under it. */}
      <SlideoutMenu.Header className="border-b border-secondary pt-3 pb-4">
        <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-1 pr-10">
          <h2 className="min-w-0 text-lg font-semibold text-primary">
            {template.title}
          </h2>
          {AWAITING_TEAM.includes(status) ? (
            <DueBadge dueDate={view.dueDate} hideIcon />
          ) : (
            <StatusText status={status} submittedAt={instance.submittedAt} />
          )}
        </div>
      </SlideoutMenu.Header>

      <SlideoutMenu.Content className="pb-6">
        <div className="space-y-6">
          {template.description && (
            <p className="text-meta text-muted-foreground">
              {template.description}
            </p>
          )}

          {instance.dueWeekOverride && (
            <p className="rounded-lg border border-status-under_review-br bg-status-under_review-bg px-3 py-2 text-caption text-status-under_review-fg">
              <span className="font-semibold">Date moved. </span>
              Originally week {template.dueWeek}, now week{" "}
              {instance.dueWeekOverride}. {instance.dueWeekOverrideReason}
            </p>
          )}

          {/* ------------------------------------------------ feedback */}
          {feedback && (
            <section className="space-y-1.5 rounded-lg border border-status-returned-br bg-status-returned-bg p-4 text-status-returned-fg">
              <p className="text-meta font-semibold">
                {personById(db, feedback.reviewerId)?.name ?? "Your mentor"}{" "}
                asked for changes
                {feedback.category
                  ? ` · ${RETURN_CATEGORY_LABEL[feedback.category]}`
                  : ""}
              </p>
              <p className="text-meta whitespace-pre-line">{feedback.body}</p>
            </section>
          )}

          {/* -------------------------------------------- latest submission */}
          {submitted.length > 0 && latest && (
            <section className="space-y-3">
              <SectionHeading>Submission</SectionHeading>
              {/* One box for the submission: its title once, every link in it,
                and who sent it and when. */}
              <dl className="divide-y divide-secondary overflow-hidden rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset">
                <SubmissionField label="Title">
                  <span className="font-medium">{submitted[0].label}</span>
                </SubmissionField>
                <SubmissionField
                  label={submitted.length > 1 ? "Links" : "Link"}
                >
                  <div className="flex flex-wrap items-center gap-x-1">
                    {submitted.map((artefact, i) => (
                      <React.Fragment key={artefact.id}>
                        <a
                          href={normalizeUrl(artefact.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={artefact.url}
                          className="inline-flex max-w-full items-center gap-1.5 text-brand-secondary underline-offset-2 hover:underline"
                        >
                          <span className="truncate">
                            {hostOf(artefact.url) || artefact.url}
                          </span>
                          <LinkExternal01
                            className="size-3.5 shrink-0"
                            aria-hidden
                          />
                        </a>
                        {i < submitted.length - 1 && (
                          <span className="text-tertiary">,</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </SubmissionField>
                <SubmissionField label="Uploaded by">
                  {personById(db, latest.submittedBy)?.name ?? "Unknown"}
                </SubmissionField>
                <SubmissionField label="Date and time">
                  {formatTimestamp(latest.submittedAt)}
                </SubmissionField>
                {submitted[0].editedAt && (
                  <SubmissionField label="Edited on">
                    {formatTimestamp(submitted[0].editedAt)}
                  </SubmissionField>
                )}
                <SubmissionField label="Notes">
                  {submitted[0].note || latest.note || (
                    <span className="text-tertiary">—</span>
                  )}
                </SubmissionField>
              </dl>
            </section>
          )}

          {/* -------------------------------------------------- documents */}

          {/* ---------------------------------------------------- comments */}
          <CheckpointComments
            view={view}
            hasSubmission={Boolean(latest)}
            focusCommentId={focusCommentId}
          />

          {/* ------------------------------------------------ deliverables */}
          <section className="space-y-4">
            <SectionHeading
              count={
                done.filter((d) => template.deliverables.includes(d)).length
              }
              hint={`of ${template.deliverables.length}`}
            >
              Checkpoints
            </SectionHeading>
            <ul className="space-y-1">
              {template.deliverables.map((item) => {
                const checked = done.includes(item)
                return (
                  <li key={item}>
                    <Checkbox
                      isSelected={checked}
                      isDisabled={!isTeam}
                      onChange={() =>
                        report(toggleDeliverable(instance.id, item))
                      }
                      className="px-2 py-1.5"
                      label={
                        <span
                          className={cn(
                            checked && "text-tertiary line-through"
                          )}
                        >
                          {item}
                        </span>
                      }
                    />
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </SlideoutMenu.Content>

      {/* The one action for this person, pinned to the bottom of the sheet:
        the team submits, a mentor decides. Nothing is shown when there is
        nothing for them to do. */}
      {(showSubmit || showDecide || (canDecide && status === "accepted")) && (
        <SlideoutMenu.Footer className="flex flex-wrap items-center justify-end gap-3">
          {showEdit && <DeleteProgress artefacts={fresh} />}
          {showEdit && (
            <EditProgress artefacts={fresh} fallbackNote={latest?.note ?? ""} />
          )}
          {showSubmit && !showEdit && (
            <SubmitDialog view={view} onSubmitted={onSubmitted} />
          )}
          {showDecide && (
            <>
              <AcceptDialog view={view} />
            </>
          )}
          {canDecide && status === "accepted" && (
            <p className="mr-auto text-caption text-muted-foreground">
              Accepted by{" "}
              {personById(db, instance.acceptedBy ?? "")?.name ?? "a mentor"} on{" "}
              {instance.acceptedAt ? formatTimestamp(instance.acceptedAt) : "—"}
              .
            </p>
          )}
        </SlideoutMenu.Footer>
      )}
    </SlideoutMenu>
  )
}

/** One label and value in the submission card, the way a table row reads
 * across, turned on its side. */
function SubmissionField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 px-4 py-3 text-meta">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 whitespace-pre-line text-foreground">
        {children}
      </dd>
    </div>
  )
}

/* ------------------------------------------------------------- delete */

/** Take back what the team handed in. It asks first, says what happens, and
 * removes the whole submission together. If that was the last thing on the
 * checkpoint it goes back to not submitted. */
function DeleteProgress({ artefacts }: { artefacts: Artefact[] }) {
  const { removeProgressEntry } = useProjectsStore()
  const { confirm, dialog } = useConfirm()
  const count = artefacts.length

  return (
    <>
      <Button
        color="tertiary-destructive"
        iconLeading={Trash01}
        onPress={() =>
          confirm({
            title: "Delete this progress?",
            description: `${count === 1 ? "The link" : `All ${count} links`} will be removed and your mentor will no longer see ${count === 1 ? "it" : "them"}. You can submit again afterwards.`,
            confirmLabel: "Delete",
            destructive: true,
            onConfirm: () =>
              report(
                removeProgressEntry(artefacts.map((a) => a.id)),
                "Progress deleted"
              ),
          })
        }
      >
        Delete progress
      </Button>
      {dialog}
    </>
  )
}

/* --------------------------------------------------------------- edit */

/** Change what the team handed in, from the sheet it handed it in on. It is the
 * same form as submitting, starting from what was sent, and it changes the
 * submission in place rather than adding another. */
function EditProgress({
  artefacts,
  fallbackNote,
}: {
  artefacts: Artefact[]
  fallbackNote: string
}) {
  const { updateProgressEntry } = useProjectsStore()
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        color="secondary"
        iconLeading={Edit05}
        onPress={() => setOpen(true)}
      >
        Edit progress
      </Button>
      <SlideoutMenu
        isDismissable
        isOpen={open}
        onOpenChange={setOpen}
        className="sm:max-w-xl"
      >
        <MultiProgressForm
          heading="Edit progress"
          hint="Change the title, the links or the note. Your mentor will see when it was edited."
          confirmLabel="Save changes"
          initial={{
            title: artefacts[0].label,
            urls: artefacts.map((a) => a.url),
            note: artefacts[0].note ?? fallbackNote,
          }}
          onSubmit={({ title, urls, note }) =>
            report(
              updateProgressEntry(
                artefacts.map((a) => a.id),
                { title, urls, note }
              ),
              "Progress updated"
            )
          }
          onDone={() => setOpen(false)}
        />
      </SlideoutMenu>
    </>
  )
}

/* ------------------------------------------------------------- submit */

function SubmitDialog({
  view,
  onSubmitted,
}: {
  view: MilestoneView
  onSubmitted?: () => void
}) {
  const { db, submitMilestone } = useProjectsStore()
  const [open, setOpen] = React.useState(false)
  // Links already on this checkpoint go in with the submission, so ones added
  // in an earlier attempt are not lost.
  const existing = db.artefacts
    .filter((a) => a.milestoneInstanceId === view.instance.id)
    .map((a) => a.id)
  const resubmitting = view.status === "returned"

  return (
    <>
      <Button onPress={() => setOpen(true)} iconLeading={Loading02}>
        {resubmitting ? "Submit again" : "Submit progress"}
      </Button>
      <SlideoutMenu
        isDismissable
        isOpen={open}
        onOpenChange={setOpen}
        className="sm:max-w-xl"
      >
        <MultiProgressForm
          heading="Submit progress"
          confirmLabel="Submit progress"
          firstLabel={view.template.title}
          onSubmit={({ title, urls, note }) =>
            report(
              submitMilestone(
                view.instance.id,
                note,
                existing,
                // One title for the whole submission, shared by its links.
                urls.map((url) => ({ url, label: title }))
              ),
              "Progress uploaded"
            )
          }
          onDone={() => {
            setOpen(false)
            onSubmitted?.()
          }}
        />
      </SlideoutMenu>
    </>
  )
}

/* ------------------------------------------------------------- review */

function AcceptDialog({ view }: { view: MilestoneView }) {
  const { reviewSubmission } = useProjectsStore()
  const [open, setOpen] = React.useState(false)
  const [body, setBody] = React.useState("")
  return (
    <>
      <Button onPress={() => setOpen(true)} iconLeading={CheckCircle}>
        Accept
      </Button>
      <ModalDialog
        isOpen={open}
        onOpenChange={setOpen}
        title={<>Accept {view.template.title}</>}
        description="The team will see this and the checkpoint closes."
        footer={
          <>
            <Button color="tertiary" slot="close">
              Cancel
            </Button>
            <Button
              onPress={() => {
                if (
                  report(
                    reviewSubmission(view.instance.id, "accept", body),
                    "Accepted"
                  )
                ) {
                  setBody("")
                  setOpen(false)
                }
              }}
            >
              Accept checkpoint
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextArea
            label="Anything worth saying?"
            value={body}
            onChange={setBody}
            rows={4}
            placeholder="Optional. What was good, and what to keep doing."
          />
        </div>
      </ModalDialog>
    </>
  )
}
