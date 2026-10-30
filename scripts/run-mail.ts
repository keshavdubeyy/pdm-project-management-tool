// Runs one pass of the mail job from your machine, in dry-run unless told
// otherwise. It prints what is due right now; in dry-run nothing is sent.
//
//   npx tsx --env-file=.env.local scripts/run-mail.ts                  # dry run
//   npx tsx --env-file=.env.local scripts/run-mail.ts --start 2026-11-02
//   npx tsx --env-file=.env.local scripts/run-mail.ts --at 2026-11-03T08:30:00+05:30
//
// --at pretends it is that moment, to see what a Monday or Tuesday would send.
// Live sending from here is deliberately not offered: that happens only on the
// server, with MAIL_MODE=live.

import { runMail } from "@/lib/mail/run"

const args = process.argv.slice(2)
const flag = (name: string) => {
  const at = args.indexOf(name)
  return at >= 0 ? args[at + 1]?.trim() : undefined
}
const startDate = flag("--start") ?? process.env.MAIL_START_DATE ?? "2026-11-02"
const at = flag("--at")
const summary = await runMail({
  mode: "dry-run",
  startDate,
  now: at ? new Date(at) : undefined,
})
console.log(JSON.stringify(summary, null, 2))
