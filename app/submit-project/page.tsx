"use client"

import * as React from "react"

import { Confetti } from "@/components/confetti"
import { Button } from "@/components/untitled/base/buttons/button"
import { Input } from "@/components/untitled/base/input/input"
import { NativeSelect } from "@/components/untitled/base/select/select-native"
import { TextArea } from "@/components/untitled/base/textarea/textarea"
import {
  BATCHES,
  DOMAINS,
  MAX_LINKS,
  MAX_TEAM,
  isHttpUrl,
  parseSubmission,
  type RepoLink,
  type RepoPerson,
} from "@/lib/repository"

type Errors = Record<string, string>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Everything wrong with the form right now, keyed by the field it belongs to,
 * so each one can be marked where it is. Keys: title, summary, batch,
 * member-N-name, member-N-email, link-N-url, submitterName, submitterEmail. */
function validate(v: {
  title: string
  summary: string
  batch: string
  team: RepoPerson[]
  links: RepoLink[]
  submitterName: string
  submitterEmail: string
}): Errors {
  const e: Errors = {}
  if (!v.title.trim()) e.title = "Give the project a title."
  if (v.summary.trim().length < 30)
    e.summary = "Describe the project in at least a couple of sentences."
  if (!v.batch) e.batch = "Choose your batch."

  v.team.forEach((m, i) => {
    const started = m.name.trim() || m.email?.trim() || m.rollNumber?.trim()
    if (!m.name.trim() && (i === 0 || started))
      e[`member-${i}-name`] = "Enter this member's name."
    if (m.email?.trim() && !EMAIL.test(m.email.trim()))
      e[`member-${i}-email`] = "That email is not valid."
  })

  let linkCount = 0
  v.links.forEach((l, i) => {
    if (!l.label.trim() && !l.url.trim()) return
    if (!isHttpUrl(l.url.trim()))
      e[`link-${i}-url`] = "Enter a full address, starting with https://"
    else linkCount++
  })
  if (linkCount === 0 && !Object.keys(e).some((k) => k.startsWith("link-")))
    e["link-0-url"] = "Add at least one link to your project."

  if (!v.submitterName.trim()) e.submitterName = "Tell us your name."
  if (!EMAIL.test(v.submitterEmail.trim()))
    e.submitterEmail = "Enter a valid email so we can reach you."
  return e
}

/** Marks its contents so the page can scroll to the first one that is wrong. */
function Field({
  invalid,
  className,
  children,
}: {
  invalid?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      data-invalid={invalid ? "true" : undefined}
      className={className ?? "min-w-0"}
    >
      {children}
    </div>
  )
}

/** The public form, on a link of its own: circulate this address to every
 * graduate. It is a bare, centred page with no navigation. What people fill in
 * lands in the repository as pending until the coordinator publishes it.
 * Graduation projects only for now. */
export default function SubmitProjectPage() {
  const [title, setTitle] = React.useState("")
  const [summary, setSummary] = React.useState("")
  const [problem, setProblem] = React.useState("")
  const [outcome, setOutcome] = React.useState("")
  const [batch, setBatch] = React.useState("")
  const [domain, setDomain] = React.useState("")
  const [mentor, setMentor] = React.useState("")
  const [team, setTeam] = React.useState<RepoPerson[]>([{ name: "" }])
  const [links, setLinks] = React.useState<RepoLink[]>([{ label: "", url: "" }])
  const [tags, setTags] = React.useState("")
  const [submitterName, setSubmitterName] = React.useState("")
  const [submitterEmail, setSubmitterEmail] = React.useState("")
  const [website, setWebsite] = React.useState("") // honeypot
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [done, setDone] = React.useState(false)
  // Nothing is marked until they first try to send; after that the marks
  // follow what they type, so each one clears as it is fixed.
  const [attempts, setAttempts] = React.useState(0)
  const formRef = React.useRef<HTMLFormElement>(null)

  const errors: Errors =
    attempts > 0
      ? validate({ title, summary, batch, team, links, submitterName, submitterEmail })
      : {}

  // Take them to the first thing still missing.
  React.useEffect(() => {
    if (attempts === 0) return
    const first = formRef.current?.querySelector<HTMLElement>(
      '[data-invalid="true"]'
    )
    if (!first) return
    first.scrollIntoView({ behavior: "smooth", block: "center" })
    first
      .querySelector<HTMLElement>("input, textarea, select")
      ?.focus({ preventScroll: true })
  }, [attempts])

  const setMember = (i: number, patch: Partial<RepoPerson>) =>
    setTeam((t) => t.map((m, j) => (j === i ? { ...m, ...patch } : m)))
  const setLink = (i: number, patch: Partial<RepoLink>) =>
    setLinks((l) => l.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    setError(null)
    setAttempts((n) => n + 1)
    if (
      Object.keys(
        validate({ title, summary, batch, team, links, submitterName, submitterEmail })
      ).length > 0
    )
      return

    const body = {
      title,
      summary,
      problem,
      outcome,
      batch,
      domain,
      mentor,
      team,
      links,
      tags: tags.split(","),
      submitterName,
      submitterEmail,
      website,
    }
    const checked = parseSubmission(body)
    if (!checked.ok) {
      setError(checked.error)
      return
    }
    setBusy(true)
    try {
      const response = await fetch("/api/repository/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const result = await response.json()
      if (!response.ok) setError(result.error ?? "Something went wrong.")
      else setDone(true)
    } catch {
      setError("Could not reach the server. Try again.")
    }
    setBusy(false)
  }

  if (done) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 px-4 text-center">
        <Confetti />
        <h1 className="text-page text-foreground">Thank you</h1>
        <p className="max-w-sm text-body text-muted-foreground">
          Your graduation project has been submitted. Thanks for adding your
          work to the PDM project repository.
        </p>
      </div>
    )
  }

  const problems = Object.keys(errors).length

  // Testing aid, development only: fills every field with sample data.
  const fillSample = () => {
    setTitle("Sample project: a smart pill organiser")
    setSummary(
      "A connected pill organiser that reminds older adults to take their medicines and tells a family member when a dose is missed."
    )
    setProblem("Older adults living alone often miss or double doses.")
    setOutcome("A working prototype tested with ten households.")
    setBatch(BATCHES[BATCHES.length - 1].label)
    setDomain("Healthcare")
    setMentor("Sample Mentor")
    setTeam([
      { name: "Test Student One", email: "one@example.com", rollNumber: "2025000001" },
      { name: "Test Student Two" },
    ])
    setLinks([
      { label: "Report", url: "https://example.com/report.pdf" },
      { label: "Demo video", url: "https://example.com/demo" },
    ])
    setTags("healthcare, iot, ageing")
    setSubmitterName("Test Submitter")
    setSubmitterEmail("test@example.com")
    setError(null)
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={submit}
      className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 md:py-16"
    >
      <div className="flex flex-col items-start">
        <p className="text-th text-muted-foreground uppercase">
          IIIT Hyderabad
        </p>
        <p className="mt-2 flex items-center gap-3 text-page text-foreground">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-color.svg" alt="PDM" className="h-8 w-auto" />
          ProjectGarage
        </p>
      </div>

      {process.env.NODE_ENV !== "production" && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3">
          <span className="text-caption text-muted-foreground">
            Testing only, hidden on the live site:
          </span>
          <Button color="secondary" size="sm" onPress={fillSample}>
            Fill sample data
          </Button>
          <Button color="secondary" size="sm" onPress={() => setDone(true)}>
            Preview thank-you page
          </Button>
        </div>
      )}

      <div className="space-y-1">
        <h1 className="text-page text-foreground">Add your graduation project</h1>
        <p className="text-meta text-muted-foreground">
          One entry per project, filled in by any one member of the team.
        </p>
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-subhead text-foreground">The project</legend>
        <Field invalid={!!errors.title}>
          <Input
            label="Title"
            isRequired
            value={title}
            onChange={setTitle}
            maxLength={140}
            isInvalid={!!errors.title}
            hint={errors.title}
          />
        </Field>
        <Field invalid={!!errors.summary}>
          <TextArea
            label="Summary"
            isRequired
            hint={
              errors.summary ??
              "Two or three sentences a stranger could understand. Shown on the project card."
            }
            rows={3}
            value={summary}
            onChange={setSummary}
            maxLength={600}
            isInvalid={!!errors.summary}
          />
        </Field>
        <TextArea
          label="The problem"
          hint="Who had it, and why it mattered."
          rows={4}
          value={problem}
          onChange={setProblem}
          maxLength={3000}
        />
        <TextArea
          label="What you built or found"
          hint="The outcome: what exists now that did not before."
          rows={4}
          value={outcome}
          onChange={setOutcome}
          maxLength={3000}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field invalid={!!errors.batch}>
            <NativeSelect
              label="Batch *"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              hint={errors.batch}
              aria-invalid={!!errors.batch}
              options={[
                { label: "Choose your batch", value: "", disabled: true },
                ...BATCHES.map((x) => ({ label: x.label, value: x.label })),
              ]}
            />
          </Field>
          <NativeSelect
            label="Domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            options={[
              { label: "Choose a domain", value: "" },
              ...DOMAINS.map((d) => ({ label: d, value: d })),
            ]}
          />
          <Input label="Mentor" value={mentor} onChange={setMentor} maxLength={100} />
        </div>
        <Input
          label="Tags"
          hint="Comma separated, e.g. IoT, accessibility, B2B"
          value={tags}
          onChange={setTags}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-subhead text-foreground">Team *</legend>
        <p className="text-meta text-muted-foreground">
          Names are shown publicly. Emails and roll numbers are kept private,
          for the programme&apos;s records only.
        </p>
        {team.map((m, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_8rem_auto]">
            <Field invalid={!!errors[`member-${i}-name`]}>
              <Input
                aria-label={`Member ${i + 1} name`}
                placeholder="Name"
                value={m.name}
                onChange={(name) => setMember(i, { name })}
                maxLength={100}
                isInvalid={!!errors[`member-${i}-name`]}
                hint={errors[`member-${i}-name`]}
              />
            </Field>
            <Field invalid={!!errors[`member-${i}-email`]}>
              <Input
                aria-label={`Member ${i + 1} email`}
                type="email"
                placeholder="Email (optional)"
                value={m.email ?? ""}
                onChange={(email) => setMember(i, { email })}
                isInvalid={!!errors[`member-${i}-email`]}
                hint={errors[`member-${i}-email`]}
              />
            </Field>
            <Input
              aria-label={`Member ${i + 1} roll number`}
              placeholder="Roll no."
              value={m.rollNumber ?? ""}
              onChange={(rollNumber) => setMember(i, { rollNumber })}
              maxLength={30}
            />
            {team.length > 1 && (
              <Button
                color="link-destructive"
                size="md"
                className="justify-self-start sm:h-10 sm:self-start"
                onPress={() => setTeam((t) => t.filter((_, j) => j !== i))}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
        {team.length < MAX_TEAM && (
          <div>
            <Button
              color="secondary"
              size="sm"
              onPress={() => setTeam((t) => [...t, { name: "" }])}
            >
              Add a member
            </Button>
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-subhead text-foreground">Links *</legend>
        <p className="text-meta text-muted-foreground">
          At least one: report, demo video, prototype, code, poster, anything
          worth opening.
        </p>
        {links.map((l, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
            <Input
              aria-label={`Link ${i + 1} label`}
              placeholder="Label"
              value={l.label}
              onChange={(label) => setLink(i, { label })}
              maxLength={60}
            />
            <Field invalid={!!errors[`link-${i}-url`]}>
              <Input
                aria-label={`Link ${i + 1} address`}
                type="url"
                placeholder="https://"
                value={l.url}
                onChange={(url) => setLink(i, { url })}
                isInvalid={!!errors[`link-${i}-url`]}
                hint={errors[`link-${i}-url`]}
              />
            </Field>
            {links.length > 1 && (
              <Button
                color="link-destructive"
                size="md"
                className="justify-self-start sm:h-10 sm:self-start"
                onPress={() => setLinks((x) => x.filter((_, j) => j !== i))}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
        {links.length < MAX_LINKS && (
          <div>
            <Button
              color="secondary"
              size="sm"
              onPress={() => setLinks((x) => [...x, { label: "", url: "" }])}
            >
              Add a link
            </Button>
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-subhead text-foreground">Your details</legend>
        <p className="-mt-2 text-meta text-muted-foreground">
          So the coordinator can reach you with questions. Never shown publicly.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field invalid={!!errors.submitterName}>
            <Input
              label="Your name"
              isRequired
              value={submitterName}
              onChange={setSubmitterName}
              maxLength={100}
              isInvalid={!!errors.submitterName}
              hint={errors.submitterName}
            />
          </Field>
          <Field invalid={!!errors.submitterEmail}>
            <Input
              label="Your email"
              type="email"
              isRequired
              value={submitterEmail}
              onChange={setSubmitterEmail}
              isInvalid={!!errors.submitterEmail}
              hint={errors.submitterEmail}
            />
          </Field>
        </div>
      </fieldset>

      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {attempts > 0 && problems > 0 && (
        <p role="alert" className="text-meta text-destructive">
          {problems === 1
            ? "One thing still needs your attention, marked above."
            : `${problems} things still need your attention, marked above.`}
        </p>
      )}
      {error && (
        <p role="alert" className="text-meta text-destructive">
          {error}
        </p>
      )}

      <div>
        <Button type="submit" size="lg" isLoading={busy}>
          Submit project
        </Button>
      </div>
    </form>
  )
}
