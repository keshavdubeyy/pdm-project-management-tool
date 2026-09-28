"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Flag02Icon,
  InboxIcon,
  MilestoneIcon,
  Search01Icon,
  SparklesIcon,
  UserSwitchIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { navFor } from "@/lib/nav"
import { ROLE_LABEL, projectsFor } from "@/lib/permissions"
import { reviewQueue } from "@/lib/selectors"
import { useProjectsStore } from "@/lib/store"

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
        : [{ label: "Waiting on you", href: "/projects?filter=waiting", icon: InboxIcon }]
    return [
      ...fromNav,
      ...extras,
      { label: "Design system", href: "/design-system", icon: SparklesIcon },
      { label: "Project progress", href: "/updates", icon: Flag02Icon },
    ]
  }, [actor, db])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-2 text-muted-foreground"
      >
        <HugeiconsIcon icon={Search01Icon} className="size-3.5" strokeWidth={2} />
        <span className="hidden sm:inline">Search</span>
        <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search and commands"
        description="Jump to a project, a page, or switch role"
      >
        <Command>
            <CommandInput placeholder="Search teams, projects and pages…" />
            <CommandList>
            <CommandEmpty>
              No matches. Try a team name, a project title, or a page like “Checkpoints”.
            </CommandEmpty>

            <CommandGroup heading="Go to">
              {pages.map((page) => (
                <CommandItem key={page.href} value={`page ${page.label}`} onSelect={() => go(page.href)}>
                  <HugeiconsIcon icon={page.icon} className="size-4" strokeWidth={2} />
                  {page.label}
                </CommandItem>
              ))}
            </CommandGroup>

            {myProjects.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={actor?.role === "student" ? "Your project" : "Projects"}>
                  {myProjects.slice(0, 30).map((project) => {
                    const team = db.teams.find((t) => t.id === project.teamId)
                    return (
                      <CommandItem
                        key={project.id}
                        value={`project ${project.title} ${team?.name ?? ""}`}
                        onSelect={() => go(`/projects/${project.id}`)}
                      >
                        <HugeiconsIcon icon={MilestoneIcon} className="size-4" strokeWidth={2} />
                        <span className="min-w-0 flex-1 truncate">{project.title}</span>
                        {team && <CommandShortcut>{team.name}</CommandShortcut>}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            )}

            {currentUser && currentUser.roles.length > 1 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Switch role">
                  {currentUser.roles
                    .filter((role) => role !== actor?.role)
                    .map((role) => (
                      <CommandItem
                        key={role}
                        value={`switch role ${ROLE_LABEL[role]}`}
                        onSelect={() => {
                          setActiveRole(role)
                          setOpen(false)
                          router.push("/")
                        }}
                      >
                        <HugeiconsIcon icon={UserSwitchIcon} className="size-4" strokeWidth={2} />
                        Act as {ROLE_LABEL[role].toLowerCase()}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </>
            )}
            </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
