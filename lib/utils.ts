import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/** Joins class names and resolves Tailwind conflicts.
 *
 * tailwind-merge has to be told the app's own font-size steps (`text-page`,
 * `text-meta` …). Without that it reads them as colours, and `text-meta
 * text-foreground` collapses to just the colour: the size silently vanishes. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "label",
        "caption",
        "micro",
        "th",
        "meta",
        "body",
        "body-lg",
        "subhead",
        "section",
        "title",
        "page",
        "stat",
        "md",
        "display-xs",
        "display-sm",
        "display-md",
        "display-lg",
        "display-xl",
        "display-2xl",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** First letter of the first two words of a name, e.g. "Keshav Dubey" -> "KD" —
 * used as an avatar fallback wherever a person has no photo. */
export function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}
