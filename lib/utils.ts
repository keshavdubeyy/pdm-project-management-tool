export { cn } from "cn"

/** First letter of the first two words of a name, e.g. "Keshav Dubey" -> "KD" —
 * used as an avatar fallback wherever a person has no photo. */
export function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}
