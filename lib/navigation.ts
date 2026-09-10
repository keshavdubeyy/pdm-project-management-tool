/** Links to a project's details page, carrying the current page's full
 * href (path + query) as `back` so "back to batch" can restore it. */
export function projectHref(id: string, backHref?: string) {
  if (!backHref) return `/projects/${id}`
  return `/projects/${id}?back=${encodeURIComponent(backHref)}`
}

/** Resolves the "back" href carried on a details/edit page's own search
 * params, falling back when none was carried over. */
export function backHrefOrDefault(back: string | null, fallback: string) {
  return back || fallback
}

/** Links to a batch's project list. */
export function batchHref(batchId: string) {
  return `/batches/${batchId}`
}
