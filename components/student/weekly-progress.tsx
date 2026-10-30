"use client"

import * as React from "react"
import { SlideoutMenu } from "@/components/untitled/application/slideout-menus/slideout-menu"
import { Button } from "@/components/untitled/base/buttons/button"
import { FileTrigger } from "@/components/untitled/base/file-upload-trigger/file-upload-trigger"
import { TextArea } from "@/components/untitled/base/textarea/textarea"
import { formatDate, formatTimestamp, todayIso } from "@/lib/dates"
import {
  MAX_PROGRESS_FILE_BYTES,
  progressFileUrl,
  uploadProgressFile,
} from "@/lib/remote"
import { personById } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"
import { report } from "@/lib/toast"
import type { WeeklyFile } from "@/lib/types"
import { pendingWeeks, weekViews, type WeekView } from "@/lib/weekly"

import {
  AlertCircle,
  Download01,
  File06,
  Paperclip,
  UploadCloud01,
  XClose,
} from "@untitledui/icons"

/** Weekly progress, for the student's own team.
 *
 * Every week is listed in order. Red is a week that has started with nothing
 * handed in, green is a week that has been, and grey is a week still to come.
 * Each state is also named in words, so colour is never the only signal. */

const FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "image/png",
  "image/jpeg",
  "image/webp",
]

function useWeeks(projectId: string) {
  const { db } = useProjectsStore()
  return React.useMemo(() => weekViews(db, projectId), [db, projectId])
}

function span(view: WeekView) {
  return `${formatDate(view.startIso)} – ${formatDate(view.endIso)}`
}

function sizeLabel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* -------------------------------------------------------------- status */

/* -------------------------------------------------------------- banner */

/** Sits above the tabs so a student sees it whichever one they are on. */
export function WeeklyBanner({
  projectId,
  onSubmit,
}: {
  projectId: string
  onSubmit: (week: number) => void
}) {
  const views = useWeeks(projectId)
  const pending = pendingWeeks(views)
  if (pending.length === 0) return null

  const oldest = pending[0]
  const current = pending.find((v) => v.isCurrent)
  const older = pending.filter((v) => !v.isCurrent)

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-utility-red-200 bg-utility-red-50 px-4 py-3"
    >
      <AlertCircle
        className="size-5 shrink-0 text-utility-red-600"
        aria-hidden
      />
      <div className="min-w-0 flex-1 basis-64">
        <p className="text-meta font-semibold text-utility-red-700">
          {current
            ? `Week ${current.week} progress is pending`
            : `${older.length} ${older.length === 1 ? "week is" : "weeks are"} pending`}
        </p>
        <p className="text-caption text-utility-red-700">
          {current ? `Due ${formatDate(current.endIso)}. ` : ""}
          {older.length > 0 &&
            `${current ? "Also missing" : "Missing"}: ${older
              .map((v) => `Week ${v.week}`)
              .join(", ")}.`}
        </p>
      </div>
      <Button size="sm" onPress={() => onSubmit(oldest.week)}>
        Submit Week {oldest.week}
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------- submit */

type Picked = { key: string; file: File }

export function WeeklySubmitSheet({
  projectId,
  week,
  onOpenChange,
}: {
  projectId: string
  /** The week being submitted, or null while the sheet is closed. */
  week: number | null
  onOpenChange: (open: boolean) => void
}) {
  // Keep the last week while the sheet slides out, so the title doesn't blank.
  const [last, setLast] = React.useState<number | null>(null)
  if (week !== null && week !== last) setLast(week)
  const shown = week ?? last

  return (
    <SlideoutMenu
      isDismissable
      isOpen={week !== null}
      onOpenChange={onOpenChange}
      className="sm:max-w-xl"
    >
      {shown !== null && (
        // Keyed by week so the form starts empty each time it opens.
        <SubmitForm
          key={shown}
          projectId={projectId}
          week={shown}
          onDone={() => onOpenChange(false)}
        />
      )}
    </SlideoutMenu>
  )
}

function SubmitForm({
  projectId,
  week,
  onDone,
}: {
  projectId: string
  week: number
  onDone: () => void
}) {
  const { submitWeeklyProgress } = useProjectsStore()
  const view = useWeeks(projectId).find((v) => v.week === week)
  const [summary, setSummary] = React.useState("")
  const [picked, setPicked] = React.useState<Picked[]>([])
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const add = (list: FileList | null) => {
    if (!list) return
    setError(null)
    const next: Picked[] = []
    for (const file of Array.from(list)) {
      if (file.size > MAX_PROGRESS_FILE_BYTES) {
        setError(`${file.name} is over 25 MB.`)
        continue
      }
      if (file.type && !FILE_TYPES.includes(file.type)) {
        setError(`${file.name} is not a type we accept.`)
        continue
      }
      next.push({ key: `${file.name}-${file.size}-${file.lastModified}`, file })
    }
    setPicked((current) => {
      const seen = new Set(current.map((p) => p.key))
      return [...current, ...next.filter((p) => !seen.has(p.key))]
    })
  }

  const canSend = (summary.trim().length > 0 || picked.length > 0) && !sending

  const send = async () => {
    setSending(true)
    setError(null)
    const files: WeeklyFile[] = []
    for (const { file } of picked) {
      const result = await uploadProgressFile(projectId, week, file)
      if (!result.ok) {
        setError(`${file.name} could not be uploaded. ${result.reason}`)
        setSending(false)
        return
      }
      files.push({ name: file.name, size: file.size, path: result.path })
    }
    const outcome = submitWeeklyProgress(projectId, week, { summary, files })
    setSending(false)
    if (report(outcome, `Week ${week} submitted`)) onDone()
  }

  return (
    <>
      <SlideoutMenu.Header className="border-b border-secondary pb-4">
        <h2 className="text-lg font-semibold text-primary">
          Submit Week {week} progress
        </h2>
        <p className="text-sm text-tertiary">
          {view ? span(view) : ""}
          {view && view.endIso < todayIso()
            ? " · This week has ended, so it will show as late."
            : ""}
        </p>
      </SlideoutMenu.Header>

      <SlideoutMenu.Content>
        <TextArea
          label="What did the team do this week?"
          value={summary}
          onChange={setSummary}
          placeholder="What you finished, what is blocking you, what is next"
          className="flex-1"
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-secondary">Files</p>
          <FileTrigger
            acceptedFileTypes={FILE_TYPES}
            allowsMultiple
            onSelect={add}
          >
            <Button
              color="secondary"
              size="sm"
              iconLeading={UploadCloud01}
              isDisabled={sending}
            >
              Choose files
            </Button>
          </FileTrigger>
          <p className="text-caption text-tertiary">
            PDF, Word, PowerPoint, Excel, images or a zip, up to 25 MB each.
          </p>

          {picked.length > 0 && (
            <ul className="space-y-1.5">
              {picked.map(({ key, file }) => (
                <li
                  key={key}
                  className="flex items-center gap-2 rounded-lg border border-secondary px-3 py-2 text-sm"
                >
                  <Paperclip
                    className="size-4 shrink-0 text-tertiary"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate" title={file.name}>
                    {file.name}
                  </span>
                  <span className="shrink-0 text-caption text-tertiary tabular-nums">
                    {sizeLabel(file.size)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    disabled={sending}
                    onClick={() =>
                      setPicked((c) => c.filter((p) => p.key !== key))
                    }
                    className="shrink-0 text-tertiary hover:text-primary"
                  >
                    <XClose className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p role="alert" className="text-sm text-error-primary">
              {error}
            </p>
          )}
        </div>
      </SlideoutMenu.Content>

      <SlideoutMenu.Footer className="flex justify-end gap-3">
        <Button color="secondary" isDisabled={sending} onPress={onDone}>
          Cancel
        </Button>
        <Button isDisabled={!canSend} isLoading={sending} onPress={send}>
          Submit progress
        </Button>
      </SlideoutMenu.Footer>
    </>
  )
}

/* -------------------------------------------------------------- detail */

export function WeeklyDetailSheet({
  projectId,
  week,
  onOpenChange,
}: {
  projectId: string
  week: number | null
  onOpenChange: (open: boolean) => void
}) {
  const { db } = useProjectsStore()
  const views = useWeeks(projectId)
  const current = views.find((v) => v.week === week && v.report) ?? null
  // Keep the last report while the sheet slides out, so it doesn't blank.
  const [last, setLast] = React.useState<WeekView | null>(null)
  if (current && current !== last) setLast(current)
  const view = current ?? last
  const r = view?.report

  const open = async (file: WeeklyFile) => {
    const url = await progressFileUrl(file.path)
    if (!url) {
      report({ ok: false, reason: "That file could not be opened right now." })
      return
    }
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <SlideoutMenu
      isDismissable
      isOpen={week !== null}
      onOpenChange={onOpenChange}
      className="sm:max-w-xl"
    >
      {view && r && (
        <>
          <SlideoutMenu.Header className="border-b border-secondary pb-4">
            <h2 className="text-lg font-semibold text-primary">
              Week {view.week} progress
            </h2>
            <p className="text-sm text-tertiary">{span(view)}</p>
          </SlideoutMenu.Header>

          <SlideoutMenu.Content>
            <div className="space-y-1">
              <p className="text-sm font-medium text-tertiary">Submitted</p>
              <p className="text-md text-primary">
                {formatTimestamp(r.submittedAt)} by{" "}
                {personById(db, r.submittedBy)?.name ?? "Unknown"}
                {view.late && (
                  <span className="font-medium text-utility-yellow-700">
                    {" · Late"}
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-tertiary">Summary</p>
              {r.summary ? (
                <p className="text-md whitespace-pre-wrap text-primary">
                  {r.summary}
                </p>
              ) : (
                <p className="text-md text-tertiary">No summary was added.</p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-tertiary">Files</p>
              {r.files.length === 0 ? (
                <p className="text-md text-tertiary">No files were attached.</p>
              ) : (
                <ul className="space-y-1.5">
                  {r.files.map((file) => (
                    <li
                      key={file.path}
                      className="flex items-center gap-2 rounded-lg border border-secondary px-3 py-2 text-sm"
                    >
                      <File06
                        className="size-4 shrink-0 text-tertiary"
                        aria-hidden
                      />
                      <span
                        className="min-w-0 flex-1 truncate"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                      <span className="shrink-0 text-caption text-tertiary tabular-nums">
                        {sizeLabel(file.size)}
                      </span>
                      <Button
                        size="sm"
                        color="tertiary"
                        iconLeading={Download01}
                        aria-label={`Open ${file.name}`}
                        onPress={() => open(file)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </SlideoutMenu.Content>

          <SlideoutMenu.Footer className="flex justify-end gap-3">
            <Button color="secondary" onPress={() => onOpenChange(false)}>
              Close
            </Button>
          </SlideoutMenu.Footer>
        </>
      )}
    </SlideoutMenu>
  )
}
