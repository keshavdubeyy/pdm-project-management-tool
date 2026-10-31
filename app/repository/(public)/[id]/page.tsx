import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/untitled/base/badges/badges"
import { batchName, getPublished } from "@/lib/repository"

import { ChevronLeft, Link01 } from "@untitledui/icons"

export const dynamic = "force-dynamic"

function Section({ label, body }: { label: string; body: string | null }) {
  if (!body) return null
  return (
    <section className="space-y-1.5">
      <h2 className="text-th text-muted-foreground uppercase">{label}</h2>
      <p className="max-w-3xl whitespace-pre-line text-body text-foreground">
        {body}
      </p>
    </section>
  )
}

export default async function RepositoryProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getPublished(id)
  if (!project) notFound()

  return (
    <article className="flex flex-col gap-6">
      <Link
        href={`/repository/batch/${project.graduation_year}`}
        className="inline-flex items-center gap-1 text-meta text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {batchName(project)}
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm" color="brand">
            {batchName(project)}
          </Badge>
          {project.domain && (
            <Badge size="sm" color="gray">
              {project.domain}
            </Badge>
          )}
        </div>
        <h1 className="text-page text-foreground">{project.title}</h1>
        <p className="max-w-3xl text-body text-muted-foreground">
          {project.summary}
        </p>
      </header>

      <Section label="Problem" body={project.problem} />
      <Section label="Outcome" body={project.outcome} />

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <h2 className="text-th text-muted-foreground uppercase">Team</h2>
          <ul className="text-body text-foreground">
            {project.team.map((m) => (
              <li key={m.name}>{m.name}</li>
            ))}
          </ul>
        </div>
        {project.mentor && (
          <div className="space-y-1.5">
            <h2 className="text-th text-muted-foreground uppercase">Mentor</h2>
            <p className="text-body text-foreground">{project.mentor}</p>
          </div>
        )}
      </section>

      {project.links.length > 0 && (
        <section className="space-y-1.5">
          <h2 className="text-th text-muted-foreground uppercase">Links</h2>
          <ul className="space-y-1">
            {project.links.map((l) => (
              <li key={l.url}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1.5 text-body font-medium text-brand-secondary underline-offset-2 hover:underline"
                >
                  <Link01 className="size-4" />
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((t) => (
            <Badge key={t} size="sm" color="gray">
              {t}
            </Badge>
          ))}
        </div>
      )}
    </article>
  )
}
