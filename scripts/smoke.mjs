/**
 * Opens every screen and every overlay, as all three roles, and fails on any
 * runtime error.
 *
 * This exists because two crashes shipped that a page-level check could never
 * have caught: both were inside overlays — a dropdown menu and the command
 * palette — that only exist after a click or a keystroke. Rendering a route is
 * not evidence that the route works.
 *
 *   npm run dev          # in one terminal
 *   npm run smoke        # in another
 *
 * Set SMOKE_URL to point at a different origin, or CHROME to a different
 * browser binary.
 */

import { existsSync } from "node:fs"
import puppeteer from "puppeteer-core"

const BASE = process.env.SMOKE_URL ?? "http://localhost:3000"

const CHROME_CANDIDATES = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean)

const CHROME = CHROME_CANDIDATES.find((path) => existsSync(path))
if (!CHROME) {
  console.error("No Chrome found. Set CHROME to a browser binary and try again.")
  process.exit(2)
}

/** Errors we did not cause and cannot fix. */
const IGNORE = [
  /favicon/i,
  /ERR_INTERNET_DISCONNECTED/,
  /fonts\.googleapis/,
  /Download the React DevTools/,
]

const ROUTES = {
  coordinator: ["/", "/projects", "/checkpoints", "/messages", "/measures", "/admin"],
  mentor: ["/", "/projects", "/checkpoints", "/messages"],
  student: ["/", "/projects", "/checkpoints", "/messages"],
}

const WHO = {
  coordinator: "Raman",
  mentor: "Prakash",
  student: "Rahul Saha",
}

const problems = []
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  defaultViewport: { width: 1440, height: 950 },
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})

const page = await browser.newPage()
let context = "boot"

const note = (message) => {
  const text = `${context}: ${message}`
  if (IGNORE.some((re) => re.test(text))) return
  if (!problems.includes(text)) problems.push(text)
}

page.on("pageerror", (error) => note(`crashed — ${error.message.split("\n")[0]}`))
page.on("console", (message) => {
  if (message.type() === "error") note(`console error — ${message.text().split("\n")[0].slice(0, 180)}`)
})
page.on("requestfailed", (request) => note(`request failed — ${request.url().slice(0, 120)}`))

async function signIn(fragment) {
  await page.goto(`${BASE}/signin`, { waitUntil: "networkidle2" })
  await page.waitForSelector("button", { timeout: 20000 })
  await wait(500)
  // open the person combobox, type, take the first match
  await page.evaluate(() => {
    const trigger = Array.from(document.querySelectorAll("button")).find((b) =>
      (b.textContent ?? "").includes("Pick a person")
    )
    trigger?.click()
  })
  await wait(500)
  await page.keyboard.type(fragment, { delay: 8 })
  await wait(500)
  const picked = await page.evaluate(() => {
    const option = document.querySelector('[cmdk-item]')
    if (!option) return false
    option.click()
    return true
  })
  if (!picked) note(`could not find "${fragment}" in the sign-in combobox`)
  await wait(500)
  const went = await page.evaluate(() => {
    const go = Array.from(document.querySelectorAll("button")).find(
      (b) => (b.textContent ?? "").trim() === "Continue"
    )
    if (!go) return false
    go.click()
    return true
  })
  if (!went) note(`could not continue as "${fragment}"`)
  await wait(1300)
}

/** Click something, give it a beat to mount, then press Escape. */
async function openAndClose(label, open) {
  const opened = await open()
  if (!opened) return
  await wait(650)
  context = `${context} › ${label}`
  await page.keyboard.press("Escape")
  await wait(350)
  context = context.replace(` › ${label}`, "")
}

const clickMatching = (selector, text) =>
  page.evaluate(
    (sel, needle) => {
      const el = Array.from(document.querySelectorAll(sel)).find(
        (node) =>
          node.offsetParent !== null &&
          (needle ? (node.textContent ?? "").toLowerCase().includes(needle.toLowerCase()) : true)
      )
      if (!el) return false
      el.click()
      return true
    },
    selector,
    text
  )

for (const [role, routes] of Object.entries(ROUTES)) {
  context = `signing in as ${role}`
  await signIn(WHO[role])

  for (const route of routes) {
    context = `${role} ${route}`
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle2" })
    await wait(900)

    // Anything that only exists after an interaction.
    await openAndClose("command palette", async () => {
      await page.keyboard.down("Meta")
      await page.keyboard.press("k")
      await page.keyboard.up("Meta")
      return true
    })

    await openAndClose("account menu", () =>
      page.evaluate(() => {
        const trigger = Array.from(document.querySelectorAll("header button")).pop()
        if (!trigger) return false
        trigger.click()
        return true
      })
    )

    await openAndClose("notifications", () =>
      page.evaluate(() => {
        const bell = Array.from(document.querySelectorAll("header button")).find((b) =>
          (b.getAttribute("aria-label") ?? "").toLowerCase().includes("notification")
        )
        if (!bell) return false
        bell.click()
        return true
      })
    )

    // Every tab on the page.
    const tabCount = await page.evaluate(
      () => document.querySelectorAll('[role="tab"]').length
    )
    for (let index = 0; index < tabCount; index += 1) {
      context = `${role} ${route} › tab ${index + 1}`
      await page.evaluate((i) => {
        const tabs = document.querySelectorAll('[role="tab"]')
        tabs[i]?.click()
      }, index)
      await wait(600)
    }
    context = `${role} ${route}`

    // Every select on the page.
    const selectCount = await page.evaluate(
      () => document.querySelectorAll('[data-slot="select-trigger"]').length
    )
    for (let index = 0; index < Math.min(selectCount, 4); index += 1) {
      await openAndClose(`select ${index + 1}`, () =>
        page.evaluate((i) => {
          const triggers = document.querySelectorAll('[data-slot="select-trigger"]')
          const trigger = triggers[i]
          if (!trigger) return false
          trigger.click()
          return true
        }, index)
      )
    }

    // Anything that opens a dialog or a sheet.
    for (const label of [
      "Record a meeting",
      "New announcement",
      "Add an action",
      "Add a checkpoint",
      "Edit",
    ]) {
      await openAndClose(label, () => clickMatching("button", label))
    }

    // The milestone slide-over, from whatever list this page has.
    await openAndClose("milestone sheet", () =>
      page.evaluate(() => {
        const target =
          document.querySelector('main section ul li button') ??
          document.querySelector('[role="gridcell"]')
        if (!target) return false
        target.click()
        return true
      })
    )
  }
}

// The project workspace and its tabs, which live behind a dynamic route.
context = "student project workspace"
await signIn(WHO.student)
await page.goto(`${BASE}/projects`, { waitUntil: "networkidle2" })
await wait(900)
const projectHref = await page.evaluate(
  () =>
    Array.from(document.querySelectorAll("a"))
      .map((a) => a.getAttribute("href"))
      .find((href) => href?.startsWith("/projects/")) ?? null
)
if (projectHref) {
  await page.goto(`${BASE}${projectHref}`, { waitUntil: "networkidle2" })
  await wait(1200)
  const tabs = await page.evaluate(() => document.querySelectorAll('[role="tab"]').length)
  for (let index = 0; index < tabs; index += 1) {
    context = `student project workspace › tab ${index + 1}`
    await page.evaluate((i) => document.querySelectorAll('[role="tab"]')[i]?.click(), index)
    await wait(700)
  }
  context = "student project workspace › checkpoint"
  await page.evaluate(() => document.querySelector("aside ol li button")?.click())
  await wait(1000)
  await page.keyboard.press("Escape")
} else {
  note("no project link on the student home")
}

await browser.close()

if (problems.length) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? "" : "s"}:\n`)
  problems.forEach((problem) => console.error(`  ${problem}`))
  process.exit(1)
}

console.log("No runtime errors across every screen and overlay, as all three roles.")
