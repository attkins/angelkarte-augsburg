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

/** URL hash for a route, e.g. `#/verein/fva-augsburg`. Empty for the list. */
export function routeHash(route: Route | null): string {
  if (!route) return ''
  if (route.kind === 'imprint') return `#/${IMPRINT_SEGMENT}`
  return `#/${SEGMENTS[route.kind]}/${encodeURIComponent(route.id)}`
}

/** Route for a URL hash. Unknown hashes lead to the list. */
export function parseHash(hash: string): Route | null {
  const parts = hash.replace(/^#\/?/, '').split('/')
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
