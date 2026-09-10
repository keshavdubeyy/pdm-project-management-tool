"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useProjectsStore } from "@/lib/store"
import type { Role } from "@/lib/types"

const roles: { value: Role; label: string; description: string }[] = [
  { value: "student", label: "Student", description: "Browse, add and edit your own projects" },
  { value: "mentor", label: "Mentor", description: "Browse projects and see which you mentor" },
  { value: "coordinator", label: "Coordinator", description: "Manage all records and batches" },
]

export function RoleSwitcher() {
  const { currentUser, setRole } = useProjectsStore()
  const current = roles.find((r) => r.value === currentUser.role) ?? roles[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <span className="hidden text-muted-foreground sm:inline">Viewing as</span>
        <span className="font-medium">{current.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Simulate a role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {roles.map((r) => (
            <DropdownMenuItem key={r.value} onClick={() => setRole(r.value)}>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{r.label}</span>
                <span className="text-xs text-muted-foreground">{r.description}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
