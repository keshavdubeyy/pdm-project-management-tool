"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Grid02Icon,
  InboxIcon,
  Megaphone01Icon,
  MilestoneIcon,
  Search01Icon,
  Settings02Icon,
  SparklesIcon,
  UserGroupIcon,
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
import { ROLE_LABEL, projectsFor } from "@/lib/permissions"
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

  const pages = React.useMemo(() => {
    if (!actor) return []
    const common = [
      { label: "Milestone grid", href: "/grid", icon: Grid02Icon },
      { label: "Announcements", href: "/announcements", icon: Megaphone01Icon },
      { label: "Project directory", href: "/directory", icon: MilestoneIcon },
      { label: "Design system", href: "/design-system", icon: SparklesIcon },
    ]
    if (actor.role === "student") {
      return [{ label: "My work", href: "/", icon: UserGroupIcon }, ...common]
    }
    if (actor.role === "mentor") {
      return [
        { label: "My teams", href: "/", icon: UserGroupIcon },
        { label: "Review queue", href: "/review", icon: InboxIcon },
        ...common,
      ]
    }
    return [
      { label: "Programme overview", href: "/", icon: UserGroupIcon },
      { label: "Review queue", href: "/review", icon: InboxIcon },
      { label: "Measures", href: "/measures", icon: Grid02Icon },
      { label: "Programme settings", href: "/admin", icon: Settings02Icon },
      ...common,
    ]
  }, [actor])

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
              No matches. Try a team name, a project title, or a page like “grid”.
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
