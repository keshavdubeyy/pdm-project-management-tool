"use client"

import Link from "next/link"

import { ActionItemList } from "@/components/meetings/action-items"
import { EmptyState, PageHeader, SectionHeading } from "@/components/common"
import { projectsFor } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"

/** Everything with your name on it, across every project you are on. */
export default function ActionsPage() {
  const { db, actor, currentUser } = useProjectsStore()
  if (!actor || !currentUser) return null

  const projects = projectsFor(db, actor)
  const groups = projects
    .map((project) => ({
      project,
      items: db.actionItems
        .filter((a) => a.projectId === project.id)
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === "open" ? -1 : 1
          return a.dueDate < b.dueDate ? -1 : 1
        }),
    }))
    .filter((group) => group.items.length > 0)

  const openCount = groups.reduce(
    (total, group) => total + group.items.filter((i) => i.status === "open").length,
    0
  )

  return (
    <>
      <PageHeader
        title="Actions"
        description={`${openCount} open across your ${projects.length === 1 ? "project" : "projects"}. Each one has an owner and a date so nothing sits with everybody.`}
      />

      {groups.length === 0 ? (
        <EmptyState
          title="Nothing outstanding"
          body="Actions agreed in meetings and raised in reviews will collect here."
        />
      ) : (
        groups.map(({ project, items }) => (
          <section key={project.id}>
            <SectionHeading
              count={items.filter((i) => i.status === "open").length}
              action={
                <Link
                  href={`/projects/${project.id}?tab=meetings`}
                  className="text-caption text-muted-foreground hover:text-foreground hover:underline"
                >
                  Open project
                </Link>
              }
            >
              {db.teams.find((t) => t.id === project.teamId)?.name ?? project.title}
            </SectionHeading>
            <ActionItemList project={project} items={items} />
          </section>
        ))
      )}
    </>
  )
}
