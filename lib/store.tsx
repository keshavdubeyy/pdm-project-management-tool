"use client"

import * as React from "react"

import {
  DEMO_USER_IDS,
  seedBatches,
  seedDomains,
  seedPeople,
  seedProjects,
} from "@/lib/mock-data"
import type {
  Batch,
  BatchDraft,
  Domain,
  Person,
  Project,
  ProjectDraft,
  Role,
} from "@/lib/types"

type ProjectsState = {
  people: Person[]
  batches: Batch[]
  domains: Domain[]
  projects: Project[]
  currentUser: Person
}

type ProjectsContextValue = ProjectsState & {
  setRole: (role: Role) => void
  addProject: (draft: ProjectDraft) => Project
  updateProject: (id: string, draft: ProjectDraft) => void
  archiveProject: (id: string) => void
  restoreProject: (id: string) => void
  addPerson: (name: string, role: Role, rollNumber?: string) => Person
  addBatch: (draft: BatchDraft) => Batch
  updateBatch: (id: string, draft: BatchDraft) => void
  archiveBatch: (id: string) => void
  restoreBatch: (id: string) => void
  addDomain: (label: string) => Domain
}

const ProjectsContext = React.createContext<ProjectsContextValue | null>(null)

/** Remembers the "viewing as" role across reloads — set by the first-visit
 * onboarding prompt or the header role switcher, whichever comes first. */
export const ROLE_STORAGE_KEY = "pdm.viewingAsRole"

function noopSubscribe() {
  return () => {}
}

function getStoredRoleSnapshot(): Role | null {
  const stored = window.localStorage.getItem(ROLE_STORAGE_KEY)
  return stored === "student" || stored === "mentor" || stored === "coordinator"
    ? stored
    : null
}

function getStoredRoleServerSnapshot(): Role | null {
  return null
}

let idCounter = 0
function nextId(prefix: string) {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = React.useState<Person[]>(() => [...seedPeople])
  const [batches, setBatches] = React.useState<Batch[]>(() => [...seedBatches])
  const [domains, setDomains] = React.useState<Domain[]>(() => [...seedDomains])
  const [projects, setProjects] = React.useState<Project[]>(() => [
    ...seedProjects,
  ])

  // useSyncExternalStore reads localStorage safely — the server snapshot
  // (null) keeps SSR/hydration consistent, then React reconciles to the
  // real stored value right after mount without a manual effect.
  const storedRole = React.useSyncExternalStore(
    noopSubscribe,
    getStoredRoleSnapshot,
    getStoredRoleServerSnapshot
  )
  const [roleOverride, setRoleOverride] = React.useState<Role | null>(null)
  const currentUserId = DEMO_USER_IDS[roleOverride ?? storedRole ?? "student"]

  const currentUser = React.useMemo(
    () => people.find((p) => p.id === currentUserId) ?? people[0],
    [people, currentUserId]
  )

  const setRole = React.useCallback((role: Role) => {
    setRoleOverride(role)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ROLE_STORAGE_KEY, role)
    }
  }, [])

  const addProject = React.useCallback(
    (draft: ProjectDraft) => {
      const now = new Date().toISOString()
      const project: Project = {
        ...draft,
        id: nextId("proj"),
        archived: false,
        createdBy: currentUser.id,
        createdAt: now,
        updatedBy: currentUser.id,
        updatedAt: now,
      }
      setProjects((prev) => [project, ...prev])
      return project
    },
    [currentUser]
  )

  const updateProject = React.useCallback(
    (id: string, draft: ProjectDraft) => {
      const now = new Date().toISOString()
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, ...draft, updatedBy: currentUser.id, updatedAt: now }
            : p
        )
      )
    },
    [currentUser]
  )

  const archiveProject = React.useCallback((id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, archived: true } : p))
    )
  }, [])

  const restoreProject = React.useCallback((id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, archived: false } : p))
    )
  }, [])

  const addPerson = React.useCallback(
    (name: string, role: Role, rollNumber?: string) => {
      const person: Person = {
        id: nextId("p"),
        name,
        email: "",
        role,
        rollNumber,
      }
      setPeople((prev) => [...prev, person])
      return person
    },
    []
  )

  const addBatch = React.useCallback((draft: BatchDraft) => {
    const batch: Batch = {
      ...draft,
      id: nextId("b"),
      archived: false,
      createdAt: new Date().toISOString(),
    }
    setBatches((prev) => [...prev, batch])
    return batch
  }, [])

  const updateBatch = React.useCallback((id: string, draft: BatchDraft) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...draft } : b))
    )
  }, [])

  const archiveBatch = React.useCallback((id: string) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, archived: true } : b))
    )
  }, [])

  const restoreBatch = React.useCallback((id: string) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, archived: false } : b))
    )
  }, [])

  const addDomain = React.useCallback((label: string) => {
    const domain: Domain = { id: nextId("d"), label }
    setDomains((prev) => [...prev, domain])
    return domain
  }, [])

  const value = React.useMemo<ProjectsContextValue>(
    () => ({
      people,
      batches,
      domains,
      projects,
      currentUser,
      setRole,
      addProject,
      updateProject,
      archiveProject,
      restoreProject,
      addPerson,
      addBatch,
      updateBatch,
      archiveBatch,
      restoreBatch,
      addDomain,
    }),
    [
      people,
      batches,
      domains,
      projects,
      currentUser,
      setRole,
      addProject,
      updateProject,
      archiveProject,
      restoreProject,
      addPerson,
      addBatch,
      updateBatch,
      archiveBatch,
      restoreBatch,
      addDomain,
    ]
  )

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjectsStore() {
  const ctx = React.useContext(ProjectsContext)
  if (!ctx) {
    throw new Error("useProjectsStore must be used within a ProjectsProvider")
  }
  return ctx
}

export function usePeopleById(ids: string[], people: Person[]) {
  return ids
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => Boolean(p))
}
