import {
  Attachment01Icon,
  Book02Icon,
  File01Icon,
  Folder01Icon,
  GitBranchIcon,
  Grid02Icon,
  PlayIcon,
  Presentation01Icon,
  SparklesIcon,
  WorkflowSquare01Icon,
} from "@hugeicons/core-free-icons"

import type { ArtefactService } from "@/lib/types"

/** Recognising where a pasted link lives.
 *
 * The system holds links to work that lives elsewhere rather than trying to
 * replace Drive, Figma or GitHub. Knowing which service a URL belongs to is
 * enough to label it properly, give it the right icon, and decide whether it
 * can be shown inline — and it needs no accounts, keys or approvals to do it.
 */

export type ServiceMeta = {
  service: ArtefactService
  label: string
  icon: typeof File01Icon
  /** Tailwind text colour for the icon. */
  tint: string
  /** Whether the service publishes an embeddable view we can show inline. */
  embeddable: boolean
}

export const SERVICE_META: Record<ArtefactService, ServiceMeta> = {
  google_doc: {
    service: "google_doc",
    label: "Google Docs",
    icon: File01Icon,
    tint: "text-blue-600 dark:text-blue-400",
    embeddable: true,
  },
  google_sheet: {
    service: "google_sheet",
    label: "Google Sheets",
    icon: Grid02Icon,
    tint: "text-emerald-600 dark:text-emerald-400",
    embeddable: true,
  },
  google_slide: {
    service: "google_slide",
    label: "Google Slides",
    icon: Presentation01Icon,
    tint: "text-amber-600 dark:text-amber-400",
    embeddable: true,
  },
  google_drive: {
    service: "google_drive",
    label: "Google Drive",
    icon: Folder01Icon,
    tint: "text-sky-600 dark:text-sky-400",
    embeddable: false,
  },
  figma: {
    service: "figma",
    label: "Figma",
    icon: SparklesIcon,
    tint: "text-fuchsia-600 dark:text-fuchsia-400",
    embeddable: true,
  },
  figjam: {
    service: "figjam",
    label: "FigJam",
    icon: WorkflowSquare01Icon,
    tint: "text-violet-600 dark:text-violet-400",
    embeddable: true,
  },
  miro: {
    service: "miro",
    label: "Miro",
    icon: WorkflowSquare01Icon,
    tint: "text-yellow-600 dark:text-yellow-400",
    embeddable: true,
  },
  github: {
    service: "github",
    label: "GitHub",
    icon: GitBranchIcon,
    tint: "text-foreground",
    embeddable: false,
  },
  notion: {
    service: "notion",
    label: "Notion",
    icon: Book02Icon,
    tint: "text-foreground",
    embeddable: false,
  },
  loom: {
    service: "loom",
    label: "Loom",
    icon: PlayIcon,
    tint: "text-purple-600 dark:text-purple-400",
    embeddable: true,
  },
  youtube: {
    service: "youtube",
    label: "YouTube",
    icon: PlayIcon,
    tint: "text-red-600 dark:text-red-400",
    embeddable: true,
  },
  canva: {
    service: "canva",
    label: "Canva",
    icon: Presentation01Icon,
    tint: "text-cyan-600 dark:text-cyan-400",
    embeddable: false,
  },
  link: {
    service: "link",
    label: "Link",
    icon: Attachment01Icon,
    tint: "text-muted-foreground",
    embeddable: false,
  },
}

export function detectService(rawUrl: string): ArtefactService {
  let host = ""
  let path = ""
  try {
    const u = new URL(rawUrl.trim())
    host = u.hostname.toLowerCase()
    path = u.pathname.toLowerCase()
  } catch {
    return "link"
  }

  if (host.endsWith("docs.google.com")) {
    if (path.startsWith("/document")) return "google_doc"
    if (path.startsWith("/spreadsheets")) return "google_sheet"
    if (path.startsWith("/presentation")) return "google_slide"
    if (path.startsWith("/forms")) return "google_drive"
    return "google_drive"
  }
  if (host.endsWith("drive.google.com")) return "google_drive"
  if (host.endsWith("figma.com")) {
    return path.includes("/board") || path.includes("/file/figjam") ? "figjam" : "figma"
  }
  if (host.endsWith("miro.com")) return "miro"
  if (host.endsWith("github.com") || host.endsWith("github.io")) return "github"
  if (host.endsWith("notion.so") || host.endsWith("notion.site")) return "notion"
  if (host.endsWith("loom.com")) return "loom"
  if (host.endsWith("youtube.com") || host.endsWith("youtu.be")) return "youtube"
  if (host.endsWith("canva.com")) return "canva"
  return "link"
}

/** A readable name for a pasted URL when the person has not given one.
 * Nothing is fetched — the title is inferred from the URL itself, because a
 * cross-origin request for a private Drive document would fail anyway. */
export function guessLabel(rawUrl: string): string {
  const service = detectService(rawUrl)
  try {
    const u = new URL(rawUrl.trim())
    const segments = u.pathname.split("/").filter(Boolean)

    if (service === "github" && segments.length >= 2) {
      return `${segments[0]}/${segments[1]}`
    }
    if (service === "notion" || service === "figma" || service === "figjam") {
      const slug = segments[segments.length - 1] ?? ""
      const words = slug.split("-").filter((w) => w && !/^[0-9a-f]{8,}$/i.test(w))
      if (words.length) return titleCase(words.join(" "))
    }
    const last = segments[segments.length - 1] ?? u.hostname
    if (last && last.length > 2 && !/^[0-9a-f-]{12,}$/i.test(last) && last !== "edit") {
      return titleCase(last.replace(/[-_]+/g, " ").replace(/\.[a-z0-9]{2,4}$/i, ""))
    }
    return SERVICE_META[service].label
  } catch {
    return "Link"
  }
}

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** An embeddable URL for services that publish one, or null. */
export function embedUrl(rawUrl: string): string | null {
  const service = detectService(rawUrl)
  try {
    const u = new URL(rawUrl.trim())
    switch (service) {
      case "figma":
      case "figjam":
        return `https://www.figma.com/embed?embed_host=pdm&url=${encodeURIComponent(rawUrl)}`
      case "miro": {
        const id = u.pathname.split("/").filter(Boolean)[1]
        return id ? `https://miro.com/app/live-embed/${id}/` : null
      }
      case "google_doc":
      case "google_sheet":
      case "google_slide": {
        const clean = rawUrl.replace(/\/(edit|view|preview)(\?.*)?$/, "")
        return `${clean}/preview`
      }
      case "loom":
        return rawUrl.replace("/share/", "/embed/")
      case "youtube": {
        const id = u.hostname.endsWith("youtu.be")
          ? u.pathname.slice(1)
          : u.searchParams.get("v")
        return id ? `https://www.youtube.com/embed/${id}` : null
      }
      default:
        return null
    }
  } catch {
    return null
  }
}

export function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim())
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

export function hostOf(raw: string): string {
  try {
    return new URL(raw.trim()).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}
