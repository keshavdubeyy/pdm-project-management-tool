import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/** Who may use the developer routes. The service-role key is read only here, on
 * the server, and is never sent to the browser. */
const DEVELOPER_EMAILS = (
  process.env.DEVELOPER_EMAILS ?? "keshav.dubey@students.iiit.ac.in"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

/** The admin client when the caller is a signed-in developer, otherwise the
 * response to send back. */
export async function developerAdmin(
  request: Request
): Promise<{ admin: SupabaseClient } | { error: Response }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return {
      error: Response.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY is not set on the server." },
        { status: 500 }
      ),
    }
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token)
    return { error: Response.json({ error: "Sign in first." }, { status: 401 }) }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: caller } = await admin.auth.getUser(token)
  const email = caller.user?.email?.toLowerCase()
  if (!email || !DEVELOPER_EMAILS.includes(email))
    return { error: Response.json({ error: "Not allowed." }, { status: 403 }) }

  return { admin }
}
