import type { SupabaseClient } from "@supabase/supabase-js"

import {
  adminClient,
  toCsv,
  type RepoProject,
  type RepoStatus,
} from "@/lib/repository"

/** The coordinator's side of the repository: see every submission, publish or
 * reject one, and download the lot as a CSV.
 *
 * The caller sends their sign-in token; the server looks them up in the roster
 * and lets only a coordinator through. */

export const dynamic = "force-dynamic"

const fail = (error: string, status: number) =>
  Response.json({ error }, { status })

async function coordinator(
  request: Request
): Promise<{ admin: SupabaseClient } | { error: Response }> {
  const admin = adminClient()
  if (!admin) return { error: fail("The repository is not set up yet.", 500) }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) return { error: fail("Sign in first.", 401) }

  const { data: caller } = await admin.auth.getUser(token)
  const email = caller.user?.email?.toLowerCase()
  if (!email) return { error: fail("Sign in first.", 401) }

  const { data: person } = await admin
    .from("people")
    .select("data")
    .eq("data->>email", email)
    .maybeSingle()
  const roles = (person?.data as { roles?: string[] } | undefined)?.roles
  if (!roles?.includes("coordinator")) return { error: fail("Not allowed.", 403) }

  return { admin }
}

async function allRows(admin: SupabaseClient) {
  const { data, error } = await admin
    .from("repository_projects")
    .select("*")
    .order("created_at", { ascending: false })
  return { rows: (data ?? []) as RepoProject[], error }
}

export async function GET(request: Request) {
  const auth = await coordinator(request)
  if ("error" in auth) return auth.error

  const { rows, error } = await allRows(auth.admin)
  if (error)
    return fail(
      "Could not read the repository. Has supabase/schema.sql been run?",
      500
    )

  if (new URL(request.url).searchParams.get("format") === "csv") {
    return new Response(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="project-repository-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }
  return Response.json({ projects: rows })
}

const STATUSES: RepoStatus[] = ["pending", "published", "rejected"]

export async function PATCH(request: Request) {
  const auth = await coordinator(request)
  if ("error" in auth) return auth.error

  let body: { id?: unknown; status?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return fail("Bad request.", 400)
  }
  const id = String(body.id ?? "")
  const status = body.status as RepoStatus
  if (!/^[0-9a-f-]{36}$/i.test(id) || !STATUSES.includes(status))
    return fail("Bad request.", 400)

  const { error } = await auth.admin
    .from("repository_projects")
    .update({
      status,
      reviewed_at: status === "pending" ? null : new Date().toISOString(),
    })
    .eq("id", id)
  if (error) return fail("Could not save that.", 500)
  return Response.json({ ok: true })
}

export async function DELETE(request: Request) {
  const auth = await coordinator(request)
  if ("error" in auth) return auth.error

  const id = new URL(request.url).searchParams.get("id") ?? ""
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail("Bad request.", 400)

  const { error } = await auth.admin
    .from("repository_projects")
    .delete()
    .eq("id", id)
  if (error) return fail("Could not delete that.", 500)
  return Response.json({ ok: true })
}
