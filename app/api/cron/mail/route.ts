import { runMail, type MailMode } from "@/lib/mail/run"

/** The mail job's front door. A scheduler calls it every few minutes with the
 * secret in an `Authorization: Bearer` header (Vercel cron adds it itself).
 *
 * MAIL_MODE: off (the default, does nothing) | dry-run | live
 * MAIL_START_DATE: YYYY-MM-DD, the day mails went live; older things are not
 * mentioned. Live mode refuses to run without it. */

export const dynamic = "force-dynamic"
export const maxDuration = 60

async function handle(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return Response.json({ error: "Not allowed." }, { status: 401 })

  const mode = (process.env.MAIL_MODE ?? "off").toLowerCase()
  if (mode !== "dry-run" && mode !== "live")
    return Response.json({ mode: "off", note: "MAIL_MODE is off: nothing done." })

  const startDate = process.env.MAIL_START_DATE ?? ""
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate))
    return Response.json(
      { error: "Set MAIL_START_DATE (YYYY-MM-DD) first." },
      { status: 500 }
    )
  if (
    mode === "live" &&
    !(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
  )
    return Response.json({ error: "Gmail is not configured." }, { status: 500 })

  try {
    return Response.json(await runMail({ mode: mode as MailMode, startDate }))
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Mail run failed." },
      { status: 500 }
    )
  }
}

export const GET = handle
export const POST = handle
