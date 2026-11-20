// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { resetWelcomeForTests, useWelcome } from '@/composables/useWelcome'

describe('useWelcome', () => {
  beforeEach(() => {
    window.localStorage.clear()
    resetWelcomeForTests()
  })

  it('opens on the first visit', () => {
    expect(useWelcome().open.value).toBe(true)
  })

  it('remembers that it was closed', () => {
    useWelcome().close()
    expect(window.localStorage.getItem('angelkarte-welcome-seen')).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    resetWelcomeForTests()
    expect(useWelcome().open.value).toBe(false)
  })

  it('can be opened again through the help link', () => {
    window.localStorage.setItem('angelkarte-welcome-seen', '2026-11-20')
    const { open, show } = useWelcome()
    expect(open.value).toBe(false)
    show()
    expect(open.value).toBe(true)
  })
})
