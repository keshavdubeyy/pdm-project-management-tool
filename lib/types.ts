export type Role = "student" | "mentor" | "coordinator"

export type Person = {
  id: string
  name: string
  email: string
  role: Role
  /** Student roll number. Not applicable to mentors or coordinators. */
  rollNumber?: string
}

export type Batch = {
  id: string
  label: string
  admissionYear: number
  graduationYear: number
  description?: string
  createdAt: string
}

export type BatchDraft = {
  label: string
  admissionYear: number
  graduationYear: number
  description?: string
}

export type Domain = {
  id: string
  label: string
}

export type ProjectStatus = "ongoing" | "completed"

export type MaterialLink = {
  id: string
  label: string
  url: string
}

export type Project = {
  id: string
  title: string
  description: string
  coverImage?: string
  teamMemberIds: string[]
  batchId: string
  mentorIds: string[]
  domainId: string | null
  status: ProjectStatus
  problem: string
  workOrOutcome: string
  materials: MaterialLink[]
  archived: boolean
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export type ProjectDraft = {
  title: string
  description: string
  coverImage?: string
  teamMemberIds: string[]
  batchId: string
  mentorIds: string[]
  domainId: string | null
  status: ProjectStatus
  problem: string
  workOrOutcome: string
  materials: MaterialLink[]
}
