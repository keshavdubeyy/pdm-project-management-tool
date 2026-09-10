import type { Project } from "@/lib/types"

function normalize(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
}

function wordSet(title: string) {
  return new Set(normalize(title).split(/\s+/).filter(Boolean))
}

/**
 * Flags likely duplicate titles so a coordinator or author can check before
 * saving. Not a hard block — the PRD only asks to flag, not prevent saves.
 */
export function findLikelyDuplicates(
  projects: Project[],
  title: string,
  excludeId?: string
) {
  const target = wordSet(title)
  if (target.size === 0) return []

  return projects.filter((project) => {
    if (project.id === excludeId || project.archived) return false
    const words = wordSet(project.title)
    if (words.size === 0) return false
    const intersection = [...target].filter((w) => words.has(w)).length
    const union = new Set([...target, ...words]).size
    const similarity = intersection / union
    return similarity >= 0.3
  })
}
