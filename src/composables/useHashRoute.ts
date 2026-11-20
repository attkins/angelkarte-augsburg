import { onScopeDispose, readonly, shallowRef } from 'vue'
import type { Selection } from '@/types'

/** Everything the panel can show besides the list. */
export type Route = Selection | { kind: 'imprint' }

const SEGMENTS: Record<Selection['kind'], string> = {
  water: 'gewaesser',
  salesPoint: 'verkaufsstelle',
  club: 'verein',
}

const IMPRINT_SEGMENT = 'impressum'

/** Query parameter in the hash of a shared link that carries the planned day. */
const DAY_PARAM = 'tag'

/**
 * URL hash for a route, e.g. `#/verein/fva-augsburg`. Empty for the list.
 * With a planned day (ISO date) it is added for shared links, e.g. `#/gewaesser/fva-kuhsee?tag=2026-12-20`.
 */
export function routeHash(route: Route | null, day?: string | null): string {
  if (!route) return ''
  if (route.kind === 'imprint') return `#/${IMPRINT_SEGMENT}`
  const hash = `#/${SEGMENTS[route.kind]}/${encodeURIComponent(route.id)}`
  return day ? `${hash}?${DAY_PARAM}=${day}` : hash
}

/** Route for a URL hash. Unknown hashes lead to the list, a query like `?tag=` is ignored. */
export function parseHash(hash: string): Route | null {
  const parts = hash.replace(/^#\/?/, '').split('?')[0]!.split('/')
  if (parts.length === 1 && parts[0] === IMPRINT_SEGMENT) return { kind: 'imprint' }
  if (parts.length !== 2 || !parts[1]) return null
  const kind = (Object.keys(SEGMENTS) as Selection['kind'][]).find((k) => SEGMENTS[k] === parts[0])
  if (!kind) return null
  try {
    return { kind, id: decodeURIComponent(parts[1]) }
  } catch {
    // Malformed percent encoding.
    return null
  }
}

/**
 * Planned day from the hash of a shared link, as ISO date.
 * Null without a day, for a day that does not exist and for today or a day in the past,
 * so an old link simply opens for today.
 */
export function parseHashDay(hash: string, today: string): string | null {
  const query = hash.split('?')[1]
  if (!query) return null
  const day = new URLSearchParams(query).get(DAY_PARAM)
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null
  const [year, month, date] = day.split('-').map(Number)
  const parsed = new Date(year!, month! - 1, date!)
  // Rejects days like 2026-02-30, which Date would silently move into March.
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month! - 1 || parsed.getDate() !== date) return null
  return day > today ? day : null
}

export function sameRoute(a: Route | null, b: Route | null): boolean {
  return routeHash(a) === routeHash(b)
}

/** How many entries the app has pushed on top of the page it was opened with. */
function depthOf(state: unknown): number {
  const depth = (state as { angelkarteDepth?: unknown } | null)?.angelkarteDepth
  return typeof depth === 'number' ? depth : 0
}

/**
 * Keeps the open detail page in the URL hash.
 *
 * Links can be shared and the back button walks back through the opened pages,
 * which matters most on phones. Every page opened in the app adds a history entry.
 * Closing returns to the entry the app was opened with, so a closed page does not
 * come back with the back button.
 */
export function useHashRoute() {
  const route = shallowRef<Route | null>(parseHash(window.location.hash))
  /** Set while close() walks back, the entry it lands on may still carry a hash from a shared link. */
  let clearOnArrival = false

  function sync() {
    if (clearOnArrival && depthOf(window.history.state) === 0) {
      clearOnArrival = false
      if (window.location.hash) window.history.replaceState(window.history.state, '', url(null))
    }
    const next = parseHash(window.location.hash)
    if (!sameRoute(next, route.value)) route.value = next
  }

  window.addEventListener('popstate', sync)
  window.addEventListener('hashchange', sync)
  onScopeDispose(() => {
    window.removeEventListener('popstate', sync)
    window.removeEventListener('hashchange', sync)
  })

  function url(next: Route | null): string {
    return routeHash(next) || window.location.pathname + window.location.search
  }

  /** Opens a page, or the list for null. */
  function navigate(next: Route | null) {
    if (sameRoute(next, route.value)) return
    if (!next) {
      close()
      return
    }
    const depth = depthOf(window.history.state) + 1
    window.history.pushState({ ...window.history.state, angelkarteDepth: depth }, '', url(next))
    route.value = next
  }

  /** Back to the list. */
  function close() {
    const depth = depthOf(window.history.state)
    if (depth > 0) {
      clearOnArrival = true
      window.history.go(-depth)
    } else {
      // Opened from a link: there is nothing of ours to go back to.
      window.history.replaceState(window.history.state, '', url(null))
    }
    route.value = null
  }

  /** Swaps the current page without a new history entry, e.g. for an id that does not exist. */
  function replace(next: Route | null) {
    window.history.replaceState(window.history.state, '', url(next))
    route.value = next
  }

  return { route: readonly(route), navigate, close, replace }
}
