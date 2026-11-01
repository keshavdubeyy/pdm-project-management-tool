"use client"

import { CoordinatorOverview } from "@/components/coordinator/overview"
import { StudentDashboard } from "@/components/student/student-dashboard"
import { projectsFor } from "@/lib/permissions"
import { useProjectsStore } from "@/lib/store"

export default function TodayPage() {
  const { db, actor } = useProjectsStore()
  if (!actor) return null
  if (actor.role === "student") return <StudentDashboard />
  if (actor.role === "mentor")
    return (
      <CoordinatorOverview
        mentor
        projectIds={projectsFor(db, actor).map((p) => p.id)}
      />
    )
  return <CoordinatorOverview />
}
