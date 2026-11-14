// @vitest-environment jsdom
import { effectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useHashPage } from '@/composables/useHashPage'

const HASH = '#/impressum'

function setup() {
  const scope = effectScope()
  const page = scope.run(() => useHashPage(HASH))!
  return { page, scope }
}

describe('useHashPage', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('is closed without the hash', () => {
    expect(setup().page.active.value).toBe(false)
  })

  it('is open when the page is loaded with the hash', () => {
    window.history.replaceState(null, '', `/${HASH}`)

    expect(setup().page.active.value).toBe(true)
  })

  it('sets the hash when opened', () => {
    const { page } = setup()

    page.open()

    expect(page.active.value).toBe(true)
    expect(window.location.hash).toBe(HASH)
  })

  it('goes back in the history when it was opened in the app', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const { page } = setup()

    page.open()
    page.close()

    expect(back).toHaveBeenCalledOnce()
    expect(page.active.value).toBe(false)
  })

  it('removes the hash when it was opened from a link', () => {
    window.history.replaceState(null, '', `/${HASH}`)
    const back = vi.spyOn(window.history, 'back')
    const { page } = setup()

    page.close()

    expect(back).not.toHaveBeenCalled()
    expect(window.location.hash).toBe('')
    expect(page.active.value).toBe(false)
  })

  it('follows hash changes, e.g. from the back button', () => {
    const { page } = setup()

    window.location.hash = HASH
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    expect(page.active.value).toBe(true)

    window.history.replaceState(null, '', '/')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    expect(page.active.value).toBe(false)
  })

  it('stops listening when its scope is disposed', () => {
    const { page, scope } = setup()
    scope.stop()

    window.location.hash = HASH
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    expect(page.active.value).toBe(false)
  })
})
