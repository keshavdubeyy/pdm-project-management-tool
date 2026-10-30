import type { Mail, MailItem } from "@/lib/mail/types"

/** Turns a mail into HTML and plain text. Inline styles only: mail apps strip
 * everything else. Light colours on purpose; many clients ignore dark mode. */

export const SITE = "https://pdm-project-manager.vercel.app"

const TONE = {
  alert: "#b42318",
  warn: "#b54708",
  good: "#067647",
} as const

const esc = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")

const link = (href?: string) => (href ? `${SITE}${href}` : undefined)

function itemHtml(item: MailItem) {
  const color = item.tone ? TONE[item.tone] : "#101828"
  const title = item.href
    ? `<a href="${esc(link(item.href)!)}" style="color:${color};text-decoration:none;font-weight:600">${esc(item.title)}</a>`
    : `<span style="color:${color};font-weight:600">${esc(item.title)}</span>`
  return `<tr><td style="padding:10px 0;border-top:1px solid #eaecf0">
    <div style="font-size:15px;line-height:22px">${title}</div>
    ${item.body ? `<div style="font-size:14px;line-height:20px;color:#475467;margin-top:2px">${esc(item.body)}</div>` : ""}
    ${item.meta ? `<div style="font-size:12px;line-height:18px;color:#667085;margin-top:2px">${esc(item.meta)}</div>` : ""}
  </td></tr>`
}

export function renderHtml(mail: Mail, banner?: string): string {
  const first = mail.to.name.split(" ")[0]
  const sections = mail.sections
    .map(
      (s) => `<tr><td style="padding-top:24px">
      <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#667085;font-weight:600">${esc(s.heading)}</div>
      ${s.note ? `<div style="font-size:14px;color:#475467;margin-top:4px">${esc(s.note)}</div>` : ""}
      ${s.items.length ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">${s.items.map(itemHtml).join("")}</table>` : ""}
    </td></tr>`
    )
    .join("")
  return `<!doctype html><html><body style="margin:0;background:#f9fafb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid #eaecf0;border-radius:12px">
<tr><td style="padding:28px">
${banner ? `<div style="background:#fffaeb;border:1px solid #fedf89;color:#93370d;font-size:13px;line-height:19px;padding:10px 12px;border-radius:8px;margin-bottom:20px">${esc(banner)}</div>` : ""}
<div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#667085;font-weight:600">ProjectGarage · IIIT Hyderabad</div>
<div style="font-size:20px;line-height:28px;color:#101828;font-weight:600;margin-top:8px">${esc(mail.subject)}</div>
<div style="font-size:15px;line-height:22px;color:#475467;margin-top:8px">Hi ${esc(first)}, ${esc(mail.intro.charAt(0).toLowerCase() + mail.intro.slice(1))}</div>
<table width="100%" cellpadding="0" cellspacing="0">${sections}</table>
<div style="margin-top:28px"><a href="${SITE}" style="display:inline-block;background:#101828;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 16px;border-radius:8px">Open ProjectGarage</a></div>
<div style="margin-top:24px;padding-top:16px;border-top:1px solid #eaecf0;font-size:12px;line-height:18px;color:#667085">${esc(mail.reason)}</div>
</td></tr></table></td></tr></table></body></html>`
}

export function renderText(mail: Mail, banner?: string): string {
  const first = mail.to.name.split(" ")[0]
  const out: string[] = []
  if (banner) out.push(`[${banner}]`, "")
  out.push(
    `Hi ${first}, ${mail.intro.charAt(0).toLowerCase() + mail.intro.slice(1)}`,
    ""
  )
  mail.sections.forEach((s) => {
    out.push(s.heading.toUpperCase())
    if (s.note) out.push(s.note)
    s.items.forEach((i) => {
      out.push(`- ${i.title}`)
      if (i.body) out.push(`  ${i.body}`)
      if (i.meta) out.push(`  ${i.meta}`)
      if (i.href) out.push(`  ${link(i.href)}`)
    })
    out.push("")
  })
  out.push(`Open ProjectGarage: ${SITE}`, "", mail.reason)
  return out.join("\n")
}
