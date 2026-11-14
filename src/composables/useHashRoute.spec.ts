// @vitest-environment jsdom
import { effectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseHash, routeHash, sameRoute, useHashRoute } from '@/composables/useHashRoute'

function setup() {
  const scope = effectScope()
  const router = scope.run(() => useHashRoute())!
  return { router, scope }
}

function popTo(url: string, state: unknown = null) {
  window.history.replaceState(state, '', url)
  window.dispatchEvent(new PopStateEvent('popstate', { state }))
}

describe('routeHash and parseHash', () => {
  it.each([
    [{ kind: 'water', id: 'fva-see' }, '#/gewaesser/fva-see'],
    [{ kind: 'salesPoint', id: 'jafispo' }, '#/verkaufsstelle/jafispo'],
    [{ kind: 'club', id: 'fva-augsburg' }, '#/verein/fva-augsburg'],
    [{ kind: 'imprint' }, '#/impressum'],
  ] as const)('maps %o to %s and back', (route, hash) => {
    expect(routeHash(route)).toBe(hash)
    expect(parseHash(hash)).toEqual(route)
  })

  it('encodes ids', () => {
    const route = { kind: 'water', id: 'see ä/1' } as const
    expect(parseHash(routeHash(route))).toEqual(route)
  })

  it('has no hash for the list', () => {
    expect(routeHash(null)).toBe('')
  })

  it.each(['', '#', '#/', '#/unbekannt/x', '#/verein', '#/verein/', '#/verein/a/b', '#/gewaesser/%E0%A4%A'])(
    'treats %s as the list',
    (hash) => {
      expect(parseHash(hash)).toBeNull()
    },
  )

  it('compares routes by kind and id', () => {
    expect(sameRoute({ kind: 'club', id: 'a' }, { kind: 'club', id: 'a' })).toBe(true)
    expect(sameRoute({ kind: 'club', id: 'a' }, { kind: 'water', id: 'a' })).toBe(false)
    expect(sameRoute(null, null)).toBe(true)
  })
})

describe('useHashRoute', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with the route from the URL', () => {
    window.history.replaceState(null, '', '/#/verein/fva')

    expect(setup().router.route.value).toEqual({ kind: 'club', id: 'fva' })
  })

  it('adds a history entry for every page opened in the app', () => {
    const { router } = setup()

    router.navigate({ kind: 'water', id: 'w1' })
    router.navigate({ kind: 'club', id: 'c1' })

    expect(window.location.hash).toBe('#/verein/c1')
    expect(window.history.state).toEqual({ angelkarteDepth: 2 })
    expect(router.route.value).toEqual({ kind: 'club', id: 'c1' })
  })

  it('does nothing when the page is already open', () => {
    const push = vi.spyOn(window.history, 'pushState')
    const { router } = setup()

    router.navigate({ kind: 'water', id: 'w1' })
    router.navigate({ kind: 'water', id: 'w1' })

    expect(push).toHaveBeenCalledOnce()
  })

  it('closes by going back to the entry the app was opened with', () => {
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => {})
    const { router } = setup()

    router.navigate({ kind: 'water', id: 'w1' })
    router.navigate({ kind: 'salesPoint', id: 's1' })
    router.close()

    expect(go).toHaveBeenCalledWith(-2)
    expect(router.route.value).toBeNull()
  })

  it('treats navigating to null as closing', () => {
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => {})
    const { router } = setup()

    router.navigate({ kind: 'water', id: 'w1' })
    router.navigate(null)

    expect(go).toHaveBeenCalledWith(-1)
  })

  it('removes the hash of a shared link when closing goes back to it', () => {
    window.history.replaceState(null, '', '/#/gewaesser/w1')
    vi.spyOn(window.history, 'go').mockImplementation(() => {})
    const { router } = setup()

    router.navigate({ kind: 'club', id: 'c1' })
    router.close()
    // The browser lands on the shared link again.
    popTo('/#/gewaesser/w1')

    expect(window.location.hash).toBe('')
    expect(router.route.value).toBeNull()
  })

  it('removes the hash when the page was opened from a link', () => {
    window.history.replaceState(null, '', '/#/impressum')
    const go = vi.spyOn(window.history, 'go')
    const { router } = setup()

    router.close()

    expect(go).not.toHaveBeenCalled()
    expect(window.location.hash).toBe('')
    expect(router.route.value).toBeNull()
  })

  it('follows the back button', () => {
    const { router } = setup()
    router.navigate({ kind: 'water', id: 'w1' })
    router.navigate({ kind: 'club', id: 'c1' })

    popTo('/#/gewaesser/w1', { angelkarteDepth: 1 })

    expect(router.route.value).toEqual({ kind: 'water', id: 'w1' })
  })

  it('follows hashes typed into the address bar', () => {
    const { router } = setup()

    window.history.replaceState(null, '', '/#/impressum')
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    expect(router.route.value).toEqual({ kind: 'imprint' })
  })

  it('replaces the current page without a new entry', () => {
    window.history.replaceState(null, '', '/#/gewaesser/gibt-es-nicht')
    const push = vi.spyOn(window.history, 'pushState')
    const { router } = setup()

    router.replace(null)

    expect(push).not.toHaveBeenCalled()
    expect(window.location.hash).toBe('')
    expect(router.route.value).toBeNull()
  })

  it('stops listening when its scope is disposed', () => {
    const { router, scope } = setup()
    scope.stop()

    popTo('/#/impressum')

    expect(router.route.value).toBeNull()
  })
})
