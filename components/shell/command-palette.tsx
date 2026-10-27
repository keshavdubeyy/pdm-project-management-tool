"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Autocomplete,
  Input as AriaInput,
  SearchField,
  useFilter,
} from "react-aria-components"
import {
  Dialog,
  Modal,
  ModalOverlay,
} from "@/components/untitled/application/modals/modal"
import { Dropdown } from "@/components/untitled/base/dropdown/dropdown"
import { navFor } from "@/lib/nav"
import { ROLE_LABEL, projectsFor } from "@/lib/permissions"
import { reviewQueue } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"

import {
  Flag03,
  Inbox01,
  SearchLg,
  Stars01,
  SwitchHorizontal01,
} from "@untitledui/icons"

/** Everything reachable from one keystroke.
 *
 * Grouped rather than flat, because a result is useless if you cannot tell
 * whether it is a page, a project or an action before you press enter. */
export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const { db, actor, currentUser, setActiveRole } = useProjectsStore()

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const { contains } = useFilter({ sensitivity: "base" })

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  const myProjects = actor ? projectsFor(db, actor) : []

  // Read straight from lib/nav.ts, so the palette can never offer a different
  // set of words from the rail beside it. The two extras below are shortcuts
  // rather than places: a pre-filtered view, and the style guide.
  const pages = React.useMemo(() => {
    if (!actor) return []
    const counts = {
      projects: projectsFor(db, actor).length,
      waiting: reviewQueue(db, actor).length,
    }
    const fromNav = navFor(actor.role, counts).flatMap((group) => group.items)
    const extras =
      actor.role === "student"
        ? []
        : [
            {
              label: "Waiting on you",
              href: "/projects?filter=waiting",
              icon: Inbox01,
            },
          ]
    return [
      ...fromNav,
      ...extras,
      { label: "Design system", href: "/design-system", icon: Stars01 },
    ]
  }, [actor, db])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center gap-2 rounded-lg bg-primary px-3 text-sm text-placeholder shadow-xs ring-1 ring-primary outline-hidden ring-inset hover:bg-primary_hover focus-visible:ring-2 focus-visible:ring-brand"
      >
        <SearchLg className="size-4 shrink-0 text-fg-quaternary" />
        <span className="min-w-0 flex-1 truncate text-left">Search</span>
        <kbd className="rounded px-1 py-px text-xs font-medium text-quaternary ring-1 ring-primary ring-inset">
          ⌘K
        </kbd>
      </button>

      <ModalOverlay isDismissable isOpen={open} onOpenChange={setOpen}>
        <Modal className="sm:max-w-xl">
          <Dialog aria-label="Search and commands" className="flex flex-col">
            <Autocomplete filter={contains}>
              <SearchField
                autoFocus
                aria-label="Search teams, projects and pages"
                className="flex items-center gap-2 border-b border-secondary px-4 py-3"
              >
                <SearchLg className="size-5 shrink-0 text-fg-quaternary" />
                <AriaInput
                  placeholder="Search teams, projects and pages…"
                  className="w-full bg-transparent text-md text-primary outline-hidden placeholder:text-placeholder"
                />
              </SearchField>
              <Dropdown.Menu
                aria-label="Results"
                className="max-h-96 px-0 py-1"
                renderEmptyState={() => (
                  <p className="px-4 py-6 text-center text-sm text-tertiary">
                    No matches. Try a team name, a project title, or a page like
                    “Checkpoints”.
                  </p>
                )}
              >
                <Dropdown.Section>
                  <Dropdown.SectionHeader className="px-4 pt-2 pb-1 text-xs font-medium text-tertiary">
                    Go to
                  </Dropdown.SectionHeader>
                  {pages.map((page) => (
                    <Dropdown.Item
                      key={page.href}
                      id={`page-${page.href}`}
                      textValue={page.label}
                      icon={page.icon}
                      label={page.label}
                      onAction={() => go(page.href)}
                    />
                  ))}
                </Dropdown.Section>

                {myProjects.length > 0 && (
                  <Dropdown.Section>
                    <Dropdown.SectionHeader className="px-4 pt-3 pb-1 text-xs font-medium text-tertiary">
                      {actor?.role === "student" ? "Your project" : "Projects"}
                    </Dropdown.SectionHeader>
                    {myProjects.slice(0, 30).map((project) => {
                      const team = db.teams.find((t) => t.id === project.teamId)
                      return (
                        <Dropdown.Item
                          key={project.id}
                          id={`project-${project.id}`}
                          textValue={`${project.title} ${team?.name ?? ""}`}
                          icon={Flag03}
                          label={project.title}
                          addon={team?.name}
                          onAction={() => go(`/projects/${project.id}`)}
                        />
                      )
                    })}
                  </Dropdown.Section>
                )}

                {currentUser && currentUser.roles.length > 1 && (
                  <Dropdown.Section>
                    <Dropdown.SectionHeader className="px-4 pt-3 pb-1 text-xs font-medium text-tertiary">
                      Switch role
                    </Dropdown.SectionHeader>
                    {currentUser.roles
                      .filter((role) => role !== actor?.role)
                      .map((role) => (
                        <Dropdown.Item
                          key={role}
                          id={`role-${role}`}
                          textValue={`switch role ${ROLE_LABEL[role]}`}
                          icon={SwitchHorizontal01}
                          label={`Act as ${ROLE_LABEL[role].toLowerCase()}`}
                          onAction={() => {
                            setActiveRole(role)
                            setOpen(false)
                            router.push("/")
                          }}
                        />
                      ))}
                  </Dropdown.Section>
                )}
              </Dropdown.Menu>
            </Autocomplete>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  )
}
