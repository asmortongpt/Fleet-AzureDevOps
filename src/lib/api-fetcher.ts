/**
 * API Fetcher — unwraps the standard { success, data, meta } response envelope.
 *
 * Backend returns:
 *   { success: true, data: [...], meta: { total, page, ... } }
 * or for single-record lookups:
 *   { data: { ... } }
 * and occasionally double-nested paginated responses:
 *   { data: { data: [...], total: N } }
 *
 * This fetcher normalises all three shapes so SWR consumers always
 * receive the inner payload directly (array or object).
 */

export const apiFetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  }).then((json) => {
    // Unwrap standard API response envelope: { success, data, meta }
    if (json && typeof json === 'object' && 'data' in json) {
      const inner = json.data
      if (inner && typeof inner === 'object' && !Array.isArray(inner) && 'data' in inner) {
        // Handle double-nested array: { data: { data: [...], total } }
        if (Array.isArray(inner.data)) {
          return inner.data
        }
        // Handle double-nested single object: { data: { data: { id, ... } } }
        // Only unwrap if 'data' is the ONLY meaningful key (besides pagination/meta)
        const keys = Object.keys(inner)
        if (keys.length === 1 && keys[0] === 'data') {
          return inner.data
        }
      }
      return inner
    }
    return json
  })
