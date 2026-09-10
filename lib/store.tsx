"use client"

import * as React from "react"

import { DEMO_USER_IDS, seedBatches, seedDomains, seedPeople, seedProjects } from "@/lib/mock-data"
import type { Batch, Domain, Person, Project, ProjectDraft, Role } from "@/lib/types"

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
  addPerson: (name: string, role: Role) => Person
  addBatch: (label: string) => Batch
  addDomain: (label: string) => Domain
}

const ProjectsContext = React.createContext<ProjectsContextValue | null>(null)

let idCounter = 0
function nextId(prefix: string) {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = React.useState<Person[]>(() => [...seedPeople])
  const [batches, setBatches] = React.useState<Batch[]>(() => [...seedBatches])
  const [domains, setDomains] = React.useState<Domain[]>(() => [...seedDomains])
  const [projects, setProjects] = React.useState<Project[]>(() => [...seedProjects])
  const [currentUserId, setCurrentUserId] = React.useState<string>(DEMO_USER_IDS.student)

  const currentUser = React.useMemo(
    () => people.find((p) => p.id === currentUserId) ?? people[0],
    [people, currentUserId]
  )

  const setRole = React.useCallback((role: Role) => {
    setCurrentUserId(DEMO_USER_IDS[role])
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
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, archived: true } : p)))
  }, [])

  const restoreProject = React.useCallback((id: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, archived: false } : p)))
  }, [])

  const addPerson = React.useCallback((name: string, role: Role) => {
    const person: Person = { id: nextId("p"), name, email: "", role }
    setPeople((prev) => [...prev, person])
    return person
  }, [])

  const addBatch = React.useCallback((label: string) => {
    const batch: Batch = { id: nextId("b"), label }
    setBatches((prev) => [...prev, batch])
    return batch
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
      addDomain,
    ]
  )

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
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
