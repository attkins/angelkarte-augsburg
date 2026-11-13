// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { resetThemeForTests, useTheme } from '@/composables/useTheme'

type Listener = (event: { matches: boolean }) => void

function mockSystemTheme(dark: boolean) {
  const listeners: Listener[] = []
  window.matchMedia = vi.fn().mockReturnValue({
    matches: dark,
    addEventListener: (_type: string, listener: Listener) => listeners.push(listener),
  }) as unknown as typeof window.matchMedia
  return {
    change(nowDark: boolean) {
      listeners.forEach((listener) => listener({ matches: nowDark }))
    },
  }
}

describe('useTheme', () => {
  beforeEach(() => {
    resetThemeForTests()
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('follows the system setting when nothing is stored', () => {
    mockSystemTheme(true)

    const { theme } = useTheme()

    expect(theme.value).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('prefers the stored choice over the system setting', () => {
    mockSystemTheme(true)
    localStorage.setItem('angelkarte-theme', 'light')

    expect(useTheme().theme.value).toBe('light')
  })

  it('ignores invalid stored values', () => {
    mockSystemTheme(false)
    localStorage.setItem('angelkarte-theme', 'purple')

    expect(useTheme().theme.value).toBe('light')
  })

  it('toggles, applies and remembers the theme', async () => {
    mockSystemTheme(false)
    const { theme, toggle } = useTheme()

    toggle()
    await nextTick()

    expect(theme.value).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('angelkarte-theme')).toBe('dark')
  })

  it('shares one state between callers', () => {
    mockSystemTheme(false)
    const first = useTheme()
    const second = useTheme()

    first.toggle()

    expect(second.theme.value).toBe('dark')
  })

  it('follows later system changes until the user picks a theme', async () => {
    const system = mockSystemTheme(false)
    const { theme, toggle } = useTheme()

    system.change(true)
    expect(theme.value).toBe('dark')

    toggle() // user picks light
    system.change(true)
    await nextTick()
    expect(theme.value).toBe('light')
  })

  it('still works when storage is blocked', () => {
    mockSystemTheme(false)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    const { theme, toggle } = useTheme()
    toggle()

    expect(theme.value).toBe('dark')
  })
})
