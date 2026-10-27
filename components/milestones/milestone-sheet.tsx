"use client"

import * as React from "react"
import { AddArtefact } from "@/components/artefacts/add-artefact"
import { ArtefactRow } from "@/components/artefacts/artefact-row"
import {
  DueBadge,
  EmptyState,
  PersonAvatar,
  SectionHeading,
} from "@/components/common"
import { StatusPill } from "@/components/status/status-pill"
import { Button } from "@/components/untitled/base/buttons/button"
import { Checkbox } from "@/components/untitled/base/checkbox/checkbox"
import { ModalDialog } from "@/components/untitled/application/modals/modal-dialog"
import { Label } from "@/components/untitled/base/input/label"
import {
  RadioButton,
  RadioGroup,
} from "@/components/untitled/base/radio-buttons/radio-buttons"
import { SlideoutMenu } from "@/components/untitled/application/slideout-menus/slideout-menu"
import { TextArea } from "@/components/untitled/base/textarea/textarea"
import { formatTimestamp, timeAgo } from "@/lib/dates"
import { canReview, canSubmitMilestone, isMemberOf } from "@/lib/permissions"
import { personById } from "@/lib/selectors"
import type { MilestoneView } from "@/lib/selectors"
import { RETURN_CATEGORY_LABEL } from "@/lib/status"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { ReturnCategory } from "@/lib/types"
import { cn } from "@/lib/utils"

import { CheckCircle, FlipBackward, Paperclip, Send01 } from "@untitledui/icons"

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
}: {
  view: MilestoneView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { db, actor, toggleDeliverable, openForReview } = useProjectsStore()

  React.useEffect(() => {
    // Opening a submission is itself a signal to the team that somebody is
    // reading it, so it moves out of the queue the moment a mentor looks.
    if (open && view && actor && view.status === "submitted") {
      const allowed = canReview(actor, view.project)
      if (allowed.allowed) openForReview(view.instance.id)
    }
  }, [actor, open, openForReview, view])

  if (!view || !actor) return null

  const { instance, template, project, status } = view
  const isTeam = isMemberOf(actor, project)
  const canSubmit = canSubmitMilestone(actor, project).allowed
  const canDecide = canReview(actor, project).allowed
  const artefacts = db.artefacts.filter(
    (a) => a.milestoneInstanceId === instance.id
  )
  const submissions = db.submissions
    .filter((s) => s.milestoneInstanceId === instance.id)
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
  const reviews = db.reviews
    .filter((r) => r.milestoneInstanceId === instance.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const done = instance.completedDeliverables

  return (
    <SlideoutMenu
      isDismissable
      isOpen={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[560px]"
    >
      <SlideoutMenu.Header className="border-b border-secondary pb-4">
        <p className="text-xs font-semibold text-tertiary uppercase">
          Week {view.dueWeek} · {template.phase}
        </p>
        <h2 className="text-lg font-semibold text-primary">{template.title}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusPill status={status} />
          <DueBadge dueDate={view.dueDate} />
        </div>
        <p className="mt-1 truncate text-xs text-tertiary">{project.title}</p>
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

          {/* ------------------------------------------------ deliverables */}
          <section>
            <SectionHeading
              count={done.length}
              hint={`of ${template.deliverables.length}`}
            >
              What this checkpoint asks for
            </SectionHeading>
            <ul className="space-y-0.5">
              {template.deliverables.map((deliverable) => {
                const checked = done.includes(deliverable)
                return (
                  <li key={deliverable}>
                    <Checkbox
                      isSelected={checked}
                      isDisabled={!isTeam}
                      onChange={() =>
                        report(toggleDeliverable(instance.id, deliverable))
                      }
                      className="px-2 py-1.5"
                      label={
                        <span
                          className={cn(
                            checked && "text-tertiary line-through"
                          )}
                        >
                          {deliverable}
                        </span>
                      }
                    />
                  </li>
                )
              })}
            </ul>
          </section>

          <hr className="h-px w-full border-none bg-border-secondary" />

          {/* ---------------------------------------------------- artefacts */}
          <section>
            <SectionHeading count={artefacts.length}>
              Work attached
            </SectionHeading>
            {artefacts.length === 0 ? (
              <EmptyState
                icon={Paperclip}
                title="No links yet"
                body="Add a link to the document, board or repository this checkpoint produced."
                className="py-6"
              />
            ) : (
              <div className="space-y-1.5">
                {artefacts.map((artefact) => (
                  <ArtefactRow
                    key={artefact.id}
                    artefact={artefact}
                    onRemove={isTeam}
                    compact
                  />
                ))}
              </div>
            )}
            {isTeam && (
              <div className="mt-3 rounded-xl border border-dashed border-border p-3">
                <AddArtefact
                  projectId={project.id}
                  milestoneInstanceId={instance.id}
                />
              </div>
            )}
          </section>

          {/* ------------------------------------------------------ actions */}
          {(canSubmit || canDecide) && (
            <>
              <hr className="h-px w-full border-none bg-border-secondary" />
              <section className="space-y-2">
                {canSubmit && status !== "accepted" && (
                  <SubmitDialog
                    view={view}
                    artefactIds={artefacts.map((a) => a.id)}
                  />
                )}
                {canDecide &&
                  (status === "submitted" || status === "under_review") && (
                    <div className="flex flex-wrap gap-2">
                      <ReviewDialog view={view} verdict="accept" />
                      <ReviewDialog view={view} verdict="return" />
                    </div>
                  )}
                {canDecide && status === "accepted" && (
                  <p className="text-caption text-muted-foreground">
                    Accepted by{" "}
                    {personById(db, instance.acceptedBy ?? "")?.name ??
                      "a mentor"}{" "}
                    on{" "}
                    {instance.acceptedAt
                      ? formatTimestamp(instance.acceptedAt)
                      : "—"}
                    .
                  </p>
                )}
              </section>
            </>
          )}

          {/* ------------------------------------------------------ history */}
          <hr className="h-px w-full border-none bg-border-secondary" />
          <section>
            <SectionHeading>History</SectionHeading>
            {reviews.length === 0 && submissions.length === 0 ? (
              <p className="py-4 text-meta text-muted-foreground">
                Nothing has happened on this checkpoint yet.
              </p>
            ) : (
              <ol className="space-y-3">
                {reviews.map((review) => {
                  const reviewer = personById(db, review.reviewerId)
                  return (
                    <li
                      key={review.id}
                      className={cn(
                        "rounded-xl border p-3",
                        review.verdict === "accept"
                          ? "border-status-accepted-br bg-status-accepted-bg"
                          : "border-status-returned-br bg-status-returned-bg"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <PersonAvatar person={reviewer} size="xs" />
                        <span className="text-meta font-medium">
                          {reviewer?.name ?? "A mentor"}{" "}
                          {review.verdict === "accept"
                            ? "accepted this"
                            : "asked for changes"}
                        </span>
                        <span className="ml-auto text-caption opacity-70">
                          {timeAgo(review.createdAt)}
                        </span>
                      </div>
                      {review.category && (
                        <p className="mt-1.5 text-caption font-medium opacity-80">
                          {RETURN_CATEGORY_LABEL[review.category]}
                        </p>
                      )}
                      <p className="mt-1 text-meta whitespace-pre-line">
                        {review.body}
                      </p>
                      <FeedbackFollowUp review={review} />
                    </li>
                  )
                })}
                {submissions.map((submission) => {
                  const by = personById(db, submission.submittedBy)
                  return (
                    <li
                      key={submission.id}
                      className="flex items-start gap-2 px-1 text-caption text-muted-foreground"
                    >
                      <Send01 className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        Turned in by {by?.name ?? "the team"}
                        {submission.attempt > 1 &&
                          ` (attempt ${submission.attempt})`}{" "}
                        · {formatTimestamp(submission.submittedAt)}
                        {submission.note && (
                          <span className="mt-0.5 block text-meta text-foreground">
                            “{submission.note}”
                          </span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </div>
      </SlideoutMenu.Content>
    </SlideoutMenu>
  )
}

/* ----------------------------------------------------------- follow-up */

function FeedbackFollowUp({
  review,
}: {
  review: import("@/lib/types").Review
}) {
  const { db, actor, markFeedbackAddressed, confirmFeedbackAddressed } =
    useProjectsStore()
  const [note, setNote] = React.useState("")
  const project = db.projects.find((p) => p.id === review.projectId)
  if (!actor || !project || review.verdict !== "return") return null

  const isTeam = isMemberOf(actor, project)
  const canConfirm = canReview(actor, project).allowed

  if (review.confirmedAt) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-caption opacity-80">
        <CheckCircle className="size-3.5" />
        {personById(db, review.confirmedBy ?? "")?.name ?? "The mentor"}{" "}
        confirmed this was addressed.
      </p>
    )
  }

  if (review.addressedAt) {
    return (
      <div className="mt-2 rounded-lg bg-background/60 p-2">
        <p className="text-caption font-medium">The team says:</p>
        <p className="text-meta">{review.addressedNote}</p>
        {canConfirm && (
          <Button
            size="xs"
            color="secondary"
            className="mt-2"
            onPress={() =>
              report(confirmFeedbackAddressed(review.id), "Confirmed")
            }
          >
            Confirm this is addressed
          </Button>
        )}
      </div>
    )
  }

  if (!isTeam) return null

  return (
    <div className="mt-2 space-y-2">
      <TextArea
        value={note}
        onChange={setNote}
        placeholder="How did you address this?"
        rows={2}
      />
      <Button
        size="xs"
        color="secondary"
        isDisabled={note.trim().length < 5}
        onPress={() => {
          if (report(markFeedbackAddressed(review.id, note), "Recorded"))
            setNote("")
        }}
      >
        Record how you addressed it
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------- submit */

function SubmitDialog({
  view,
  artefactIds,
}: {
  view: MilestoneView
  artefactIds: string[]
}) {
  const { submitMilestone } = useProjectsStore()
  const [open, setOpen] = React.useState(false)
  const [note, setNote] = React.useState("")
  const nothingAttached = artefactIds.length === 0
  const resubmitting = view.status === "returned"

  return (
    <>
      <Button
        onPress={() => setOpen(true)}
        isDisabled={nothingAttached}
        className="w-full"
        iconLeading={Send01}
      >
        {resubmitting ? "Turn in again" : "Turn in this checkpoint"}
      </Button>
      {nothingAttached && (
        <p className="text-caption text-muted-foreground">
          Attach at least one link before turning this in.
        </p>
      )}
      <ModalDialog
        isOpen={open}
        onOpenChange={setOpen}
        title={
          <>
            {resubmitting ? "Turn in" : "Turn in"} {view.template.title}
          </>
        }
        description={
          <>
            {view.project.mentorIds.length === 1
              ? "Your mentor will be told straight away."
              : "Your mentors will be told straight away."}{" "}
            You can turn it in again later if it comes back.
          </>
        }
        footer={
          <>
            <Button color="tertiary" slot="close">
              Cancel
            </Button>
            <Button
              onPress={() => {
                if (
                  report(
                    submitMilestone(view.instance.id, note, artefactIds),
                    "Turned in"
                  )
                ) {
                  setNote("")
                  setOpen(false)
                }
              }}
            >
              Turn in
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-caption text-muted-foreground">
              {artefactIds.length} {artefactIds.length === 1 ? "link" : "links"}{" "}
              attached
            </p>
          </div>
          <div className="space-y-1.5">
            <TextArea
              label="Anything your mentor should read first?"
              value={note}
              onChange={setNote}
              rows={3}
              placeholder="Optional. Where you got stuck, what you would like them to look at."
            />
          </div>
        </div>
      </ModalDialog>
    </>
  )
}

/* ------------------------------------------------------------- review */

function ReviewDialog({
  view,
  verdict,
}: {
  view: MilestoneView
  verdict: "accept" | "return"
}) {
  const { reviewSubmission } = useProjectsStore()
  const [open, setOpen] = React.useState(false)
  const [body, setBody] = React.useState("")
  const [category, setCategory] = React.useState<ReturnCategory>("evidence")

  const accepting = verdict === "accept"

  return (
    <>
      <Button
        color={accepting ? "primary" : "secondary"}
        onPress={() => setOpen(true)}
        className="flex-1"
        iconLeading={accepting ? CheckCircle : FlipBackward}
      >
        {accepting ? "Accept" : "Return for revisions"}
      </Button>
      <ModalDialog
        isOpen={open}
        onOpenChange={setOpen}
        title={
          <>
            {accepting ? "Accept" : "Return"} {view.template.title}
          </>
        }
        description={
          <>
            {accepting
              ? "The team will see this and the checkpoint closes. You can reopen it later if you need to."
              : "The team will see your reason and can turn it in again. This is a normal step, not a mark against them."}
          </>
        }
        footer={
          <>
            <Button color="tertiary" slot="close">
              Cancel
            </Button>
            <Button
              onPress={() => {
                const result = reviewSubmission(
                  view.instance.id,
                  verdict,
                  body,
                  accepting ? undefined : category
                )
                if (
                  report(
                    result,
                    accepting ? "Accepted" : "Returned to the team"
                  )
                ) {
                  setBody("")
                  setOpen(false)
                }
              }}
            >
              {accepting ? "Accept checkpoint" : "Return to the team"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {!accepting && (
            <div className="space-y-2">
              <RadioGroup
                value={category}
                onChange={(value) => setCategory(value as ReturnCategory)}
                className="gap-3"
              >
                <Label>What kind of change is needed?</Label>
                {(Object.keys(RETURN_CATEGORY_LABEL) as ReturnCategory[]).map(
                  (key) => (
                    <RadioButton
                      key={key}
                      value={key}
                      label={RETURN_CATEGORY_LABEL[key]}
                    />
                  )
                )}
              </RadioGroup>
            </div>
          )}

          <div className="space-y-1.5">
            <TextArea
              label={
                accepting ? "Anything worth saying?" : "What has to change?"
              }
              value={body}
              onChange={setBody}
              rows={4}
              placeholder={
                accepting
                  ? "Optional. What was good, and what to keep doing."
                  : "Be specific enough that they can act on it without asking you."
              }
            />
            {!accepting && (
              <p className="text-caption text-muted-foreground">
                At least a sentence. This becomes an action on their board.
              </p>
            )}
          </div>
        </div>
      </ModalDialog>
    </>
  )
}
