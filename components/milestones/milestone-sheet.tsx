"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Attachment01Icon,
  CheckmarkCircle02Icon,
  DeliverySent02Icon,
  LegalHammerIcon,
  Undo02Icon,
} from "@hugeicons/core-free-icons"

import { AddArtefact } from "@/components/artefacts/add-artefact"
import { ArtefactRow } from "@/components/artefacts/artefact-row"
import { DueBadge, EmptyState, PersonAvatar, SectionHeading } from "@/components/common"
import { StatusPill } from "@/components/status/status-pill"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { formatTimestamp, timeAgo } from "@/lib/dates"
import { canReview, canSubmitMilestone, isMemberOf } from "@/lib/permissions"
import { personById } from "@/lib/selectors"
import type { MilestoneView } from "@/lib/selectors"
import { RETURN_CATEGORY_LABEL } from "@/lib/status"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { ReturnCategory } from "@/lib/types"
import { cn } from "@/lib/utils"

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
  const artefacts = db.artefacts.filter((a) => a.milestoneInstanceId === instance.id)
  const submissions = db.submissions
    .filter((s) => s.milestoneInstanceId === instance.id)
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
  const reviews = db.reviews
    .filter((r) => r.milestoneInstanceId === instance.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const done = instance.completedDeliverables

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b border-border">
          <p className="text-th text-muted-foreground uppercase">
            Week {view.dueWeek} · {template.phase}
          </p>
          <SheetTitle className="text-title">{template.title}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusPill status={status} />
            <DueBadge dueDate={view.dueDate} />
          </SheetDescription>
          <p className="mt-1 truncate text-caption text-muted-foreground">{project.title}</p>
        </SheetHeader>

        <div className="space-y-6 p-4">
          {template.description && (
            <p className="text-meta text-muted-foreground">{template.description}</p>
          )}

          {instance.dueWeekOverride && (
            <p className="rounded-lg border border-status-under_review-br bg-status-under_review-bg px-3 py-2 text-caption text-status-under_review-fg">
              <span className="font-semibold">Date moved. </span>
              Originally week {template.dueWeek}, now week {instance.dueWeekOverride}.{" "}
              {instance.dueWeekOverrideReason}
            </p>
          )}

          {/* ------------------------------------------------ deliverables */}
          <section>
            <SectionHeading count={done.length} hint={`of ${template.deliverables.length}`}>
              What this checkpoint asks for
            </SectionHeading>
            <ul className="space-y-0.5">
              {template.deliverables.map((deliverable) => {
                const checked = done.includes(deliverable)
                return (
                  <li key={deliverable}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-meta transition-colors",
                        isTeam && "hover:bg-muted/60",
                        !isTeam && "cursor-default"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={!isTeam}
                        onCheckedChange={() =>
                          report(toggleDeliverable(instance.id, deliverable))
                        }
                        className="mt-0.5"
                      />
                      <span className={cn(checked && "text-muted-foreground line-through")}>
                        {deliverable}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </section>

          <Separator />

          {/* ---------------------------------------------------- artefacts */}
          <section>
            <SectionHeading count={artefacts.length}>Work attached</SectionHeading>
            {artefacts.length === 0 ? (
              <EmptyState
                icon={Attachment01Icon}
                title="Nothing attached yet"
                body="Paste a link to the document, board or repository this checkpoint produced."
                className="py-6"
              />
            ) : (
              <div className="space-y-1.5">
                {artefacts.map((artefact) => (
                  <ArtefactRow key={artefact.id} artefact={artefact} onRemove={isTeam} compact />
                ))}
              </div>
            )}
            {isTeam && (
              <div className="mt-3 rounded-lg border border-dashed border-border p-3">
                <AddArtefact projectId={project.id} milestoneInstanceId={instance.id} />
              </div>
            )}
          </section>

          {/* ------------------------------------------------------ actions */}
          {(canSubmit || canDecide) && (
            <>
              <Separator />
              <section className="space-y-2">
                {canSubmit && status !== "accepted" && (
                  <SubmitDialog view={view} artefactIds={artefacts.map((a) => a.id)} />
                )}
                {canDecide && (status === "submitted" || status === "under_review") && (
                  <div className="flex flex-wrap gap-2">
                    <ReviewDialog view={view} verdict="accept" />
                    <ReviewDialog view={view} verdict="return" />
                  </div>
                )}
                {canDecide && status === "accepted" && (
                  <p className="text-caption text-muted-foreground">
                    Accepted by {personById(db, instance.acceptedBy ?? "")?.name ?? "a mentor"} on{" "}
                    {instance.acceptedAt ? formatTimestamp(instance.acceptedAt) : "—"}.
                  </p>
                )}
              </section>
            </>
          )}

          {/* ------------------------------------------------------ history */}
          <Separator />
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
                        "rounded-lg border p-3",
                        review.verdict === "accept"
                          ? "border-status-accepted-br bg-status-accepted-bg"
                          : "border-status-returned-br bg-status-returned-bg"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <PersonAvatar person={reviewer} size="xs" />
                        <span className="text-meta font-medium">
                          {reviewer?.name ?? "A mentor"}{" "}
                          {review.verdict === "accept" ? "accepted this" : "asked for changes"}
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
                      <p className="mt-1 text-meta whitespace-pre-line">{review.body}</p>
                      <FeedbackFollowUp review={review} />
                    </li>
                  )
                })}
                {submissions.map((submission) => {
                  const by = personById(db, submission.submittedBy)
                  return (
                    <li key={submission.id} className="flex items-start gap-2 px-1 text-caption text-muted-foreground">
                      <HugeiconsIcon
                        icon={DeliverySent02Icon}
                        className="mt-0.5 size-3.5 shrink-0"
                        strokeWidth={2}
                      />
                      <span>
                        Turned in by {by?.name ?? "the team"}
                        {submission.attempt > 1 && ` (attempt ${submission.attempt})`} ·{" "}
                        {formatTimestamp(submission.submittedAt)}
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
      </SheetContent>
    </Sheet>
  )
}

/* ----------------------------------------------------------- follow-up */

function FeedbackFollowUp({ review }: { review: import("@/lib/types").Review }) {
  const { db, actor, markFeedbackAddressed, confirmFeedbackAddressed } = useProjectsStore()
  const [note, setNote] = React.useState("")
  const project = db.projects.find((p) => p.id === review.projectId)
  if (!actor || !project || review.verdict !== "return") return null

  const isTeam = isMemberOf(actor, project)
  const canConfirm = canReview(actor, project).allowed

  if (review.confirmedAt) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-caption opacity-80">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" strokeWidth={2} />
        {personById(db, review.confirmedBy ?? "")?.name ?? "The mentor"} confirmed this was
        addressed.
      </p>
    )
  }

  if (review.addressedAt) {
    return (
      <div className="mt-2 rounded-md bg-background/60 p-2">
        <p className="text-caption font-medium">The team says:</p>
        <p className="text-meta">{review.addressedNote}</p>
        {canConfirm && (
          <Button
            size="xs"
            variant="outline"
            className="mt-2"
            onClick={() => report(confirmFeedbackAddressed(review.id), "Confirmed")}
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
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="How did you address this?"
        rows={2}
        className="bg-background/60 text-meta"
      />
      <Button
        size="xs"
        variant="outline"
        disabled={note.trim().length < 5}
        onClick={() => {
          if (report(markFeedbackAddressed(review.id, note), "Recorded")) setNote("")
        }}
      >
        Record how you addressed it
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------- submit */

function SubmitDialog({ view, artefactIds }: { view: MilestoneView; artefactIds: string[] }) {
  const { submitMilestone } = useProjectsStore()
  const [open, setOpen] = React.useState(false)
  const [note, setNote] = React.useState("")
  const nothingAttached = artefactIds.length === 0
  const resubmitting = view.status === "returned"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant={resubmitting ? "default" : "default"}
        onClick={() => setOpen(true)}
        disabled={nothingAttached}
        className="w-full"
      >
        <HugeiconsIcon icon={DeliverySent02Icon} className="size-4" strokeWidth={2} />
        {resubmitting ? "Turn in again" : "Turn in this checkpoint"}
      </Button>
      {nothingAttached && (
        <p className="text-caption text-muted-foreground">
          Attach at least one link before turning this in.
        </p>
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {resubmitting ? "Turn in" : "Turn in"} {view.template.title}
          </DialogTitle>
          <DialogDescription>
            {view.project.mentorIds.length === 1
              ? "Your mentor will be told straight away."
              : "Your mentors will be told straight away."}{" "}
            You can turn it in again later if it comes back.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-caption text-muted-foreground">
              {artefactIds.length} {artefactIds.length === 1 ? "link" : "links"} attached
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="submit-note">Anything your mentor should read first?</Label>
            <Textarea
              id="submit-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Optional. Where you got stuck, what you would like them to look at."
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            onClick={() => {
              if (report(submitMilestone(view.instance.id, note, artefactIds), "Turned in")) {
                setNote("")
                setOpen(false)
              }
            }}
          >
            Turn in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------- review */

function ReviewDialog({ view, verdict }: { view: MilestoneView; verdict: "accept" | "return" }) {
  const { reviewSubmission } = useProjectsStore()
  const [open, setOpen] = React.useState(false)
  const [body, setBody] = React.useState("")
  const [category, setCategory] = React.useState<ReturnCategory>("evidence")

  const accepting = verdict === "accept"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant={accepting ? "default" : "outline"}
        onClick={() => setOpen(true)}
        className="flex-1"
      >
        <HugeiconsIcon
          icon={accepting ? CheckmarkCircle02Icon : Undo02Icon}
          className="size-4"
          strokeWidth={2}
        />
        {accepting ? "Accept" : "Return for revisions"}
      </Button>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {accepting ? "Accept" : "Return"} {view.template.title}
          </DialogTitle>
          <DialogDescription>
            {accepting
              ? "The team will see this and the checkpoint closes. You can reopen it later if you need to."
              : "The team will see your reason and can turn it in again. This is a normal step, not a mark against them."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!accepting && (
            <div className="space-y-2">
              <Label>What kind of change is needed?</Label>
              <RadioGroup
                value={category}
                onValueChange={(value) => setCategory(value as ReturnCategory)}
                className="gap-1.5"
              >
                {(Object.keys(RETURN_CATEGORY_LABEL) as ReturnCategory[]).map((key) => (
                  <Label
                    key={key}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-meta font-normal hover:bg-muted/60"
                  >
                    <RadioGroupItem value={key} />
                    {RETURN_CATEGORY_LABEL[key]}
                  </Label>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="review-body">
              {accepting ? "Anything worth saying?" : "What has to change?"}
            </Label>
            <Textarea
              id="review-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
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

        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            onClick={() => {
              const result = reviewSubmission(
                view.instance.id,
                verdict,
                body,
                accepting ? undefined : category
              )
              if (report(result, accepting ? "Accepted" : "Returned to the team")) {
                setBody("")
                setOpen(false)
              }
            }}
          >
            {accepting ? "Accept checkpoint" : "Return to the team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
