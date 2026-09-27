/**
 * Checks the design tokens in app/globals.css against the contrast rules the
 * design system commits to.
 *
 *   npm run contrast
 *
 * It reads the real token values rather than a copy, so it cannot drift from
 * what the app actually paints. Every rule here exists because getting it wrong
 * is invisible on a good monitor and obvious on a projector.
 */

import { readFileSync } from "node:fs"

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8")

/* ------------------------------------------------------------------ colour */

function parseBlock(selector) {
  const start = css.indexOf(selector)
  if (start === -1) return {}
  const open = css.indexOf("{", start)
  const close = css.indexOf("\n}", open)
  const body = css.slice(open + 1, close)
  const out = {}
  for (const line of body.split("\n")) {
    const match = line.match(/^\s*(--[\w-]+)\s*:\s*(.+?);/)
    if (match) out[match[1]] = match[2].trim()
  }
  return out
}

const light = parseBlock(":root {")
const dark = parseBlock(".dark {")

function toRgb(value) {
  const v = value.trim()
  if (v.startsWith("#")) {
    const hex = v.slice(1)
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
  }
  const oklch = v.match(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/)
  if (oklch) {
    let [, l, c, h] = oklch
    const L = l.endsWith("%") ? parseFloat(l) / 100 : parseFloat(l)
    return oklchToRgb(L, parseFloat(c), parseFloat(h))
  }
  return null
}

function oklchToRgb(L, C, H) {
  const h = (H * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return lin.map((u) => {
    const clamped = Math.max(0, Math.min(1, u))
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055
  })
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((u) => (u <= 0.04045 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/* ------------------------------------------------------------------- rules */

const STATUSES = [
  "not_started",
  "in_progress",
  "submitted",
  "under_review",
  "returned",
  "accepted",
  "overdue",
]

const failures = []
const checks = []

function check(label, got, need, note) {
  const pass = got >= need
  checks.push({ label, got, need, pass, note })
  if (!pass) failures.push(`${label} — ${got.toFixed(2)}:1, needs ${need}:1${note ? ` (${note})` : ""}`)
}

for (const [themeName, tokens] of [
  ["light", light],
  ["dark", dark],
]) {
  const get = (name) => {
    const raw = tokens[name] ?? light[name]
    return raw ? toRgb(raw) : null
  }

  const bg = get("--background")
  const fg = get("--foreground")
  const card = get("--card")
  const muted = get("--muted-foreground")
  const primary = get("--primary")
  const primaryFg = get("--primary-foreground")
  const input = get("--input")
  const ring = get("--ring")

  if (bg && fg) check(`${themeName}: body text on background`, ratio(fg, bg), 4.5)
  if (muted && bg) check(`${themeName}: muted text on background`, ratio(muted, bg), 4.5)
  if (muted && card) check(`${themeName}: muted text on a card`, ratio(muted, card), 4.5)
  if (primary && primaryFg)
    check(`${themeName}: text on a primary button`, ratio(primaryFg, primary), 4.5)
  if (input && bg)
    check(`${themeName}: input boundary`, ratio(input, bg), 3, "interactive, SC 1.4.11")
  if (ring && bg) check(`${themeName}: focus ring on background`, ratio(ring, bg), 3)
  if (ring && card) check(`${themeName}: focus ring on a card`, ratio(ring, card), 3)

  // A status pill is a fill, a border and a label. The label must be readable
  // on its own fill — this is the one that silently fails.
  for (const status of STATUSES) {
    const pillBg = get(`--status-${status}-bg`)
    const pillFg = get(`--status-${status}-fg`)
    const solid = get(`--status-${status}-solid`)
    if (pillBg && pillFg) {
      check(`${themeName}: "${status}" label on its own fill`, ratio(pillFg, pillBg), 4.5)
    }
    // The solid draws the glyph — a graphical object, so 3:1 rather than
    // 4.5:1. "Not started" is included: an invisible glyph is not a glyph.
    // The pale fill the progress strip uses is --progress-track, which is
    // decorative because the row states the status in words as well.
    if (solid && bg) {
      check(`${themeName}: "${status}" glyph on background`, ratio(solid, bg), 3, "graphical")
    }
  }
}

/* ------------------------------------------------------------------ report */

const width = Math.max(...checks.map((c) => c.label.length)) + 2
for (const c of checks) {
  const mark = c.pass ? "ok  " : "FAIL"
  console.log(
    `${mark} ${c.label.padEnd(width)} ${c.got.toFixed(2).padStart(6)}:1  (needs ${c.need})`
  )
}

console.log()
if (failures.length) {
  console.error(`${failures.length} contrast failure${failures.length === 1 ? "" : "s"}:\n`)
  failures.forEach((f) => console.error(`  ${f}`))
  process.exit(1)
}
console.log(`All ${checks.length} contrast rules pass.`)
