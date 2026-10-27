/** Notes are markdown. Earlier notes were saved as HTML by the rich-text
 * editor this replaced, so anything that reads a note's content goes through
 * `toMarkdown`, which converts those once and leaves markdown alone. */

export function looksLikeHtml(content: string) {
  return /^\s*<(p|h[1-6]|ul|ol|div|blockquote|pre)[\s>]/i.test(content)
}

export function toMarkdown(content: string) {
  return looksLikeHtml(content) ? htmlToMarkdown(content) : content
}

export function htmlToMarkdown(html: string): string {
  if (typeof DOMParser === "undefined") return html.replace(/<[^>]+>/g, "")
  const doc = new DOMParser().parseFromString(html, "text/html")
  return blocks(doc.body, 0)
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function inline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ""
  if (!(node instanceof HTMLElement)) return ""
  const inner = Array.from(node.childNodes).map(inline).join("")
  switch (node.tagName) {
    case "STRONG":
    case "B":
      return inner.trim() ? `**${inner}**` : inner
    case "EM":
    case "I":
      return inner.trim() ? `*${inner}*` : inner
    case "S":
    case "DEL":
      return inner.trim() ? `~~${inner}~~` : inner
    case "CODE":
      return `\`${inner}\``
    case "BR":
      return "\n"
    case "A":
      return `[${inner}](${node.getAttribute("href") ?? ""})`
    default:
      return inner
  }
}

function list(el: HTMLElement, depth: number): string {
  const ordered = el.tagName === "OL"
  const lines: string[] = []
  Array.from(el.children).forEach((li, index) => {
    if (li.tagName !== "LI") return
    const prefix = ordered ? `${index + 1}. ` : "- "
    const text: string[] = []
    const nested: string[] = []
    Array.from(li.childNodes).forEach((child) => {
      if (
        child instanceof HTMLElement &&
        (child.tagName === "UL" || child.tagName === "OL")
      ) {
        nested.push(list(child, depth + 1))
      } else {
        text.push(inline(child))
      }
    })
    lines.push("  ".repeat(depth) + prefix + text.join("").trim())
    nested.forEach((n) => lines.push(n))
  })
  return lines.join("\n")
}

function blocks(parent: Node, depth: number): string {
  let out = ""
  parent.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += (child.textContent ?? "").trim() ? child.textContent : ""
      return
    }
    if (!(child instanceof HTMLElement)) return
    const tag = child.tagName
    if (/^H[1-6]$/.test(tag)) {
      out += `${"#".repeat(Number(tag[1]))} ${inline(child).trim()}\n\n`
    } else if (tag === "UL" || tag === "OL") {
      out += `${list(child, depth)}\n\n`
    } else if (tag === "BLOCKQUOTE") {
      out += `${blocks(child, depth)
        .trim()
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n")}\n\n`
    } else if (tag === "PRE") {
      out += `\`\`\`\n${child.textContent ?? ""}\n\`\`\`\n\n`
    } else if (tag === "HR") {
      out += "---\n\n"
    } else {
      out += `${inline(child).trim()}\n\n`
    }
  })
  return out
}

/** A plain-text line or two for a note card. */
export function previewText(content: string) {
  const md = toMarkdown(content)
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[ \t]*(#{1,6}|>|[-*+]|\d+\.)[ \t]+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}
