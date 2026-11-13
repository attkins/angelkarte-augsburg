// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { resetThemeForTests } from '@/composables/useTheme'

describe('ThemeToggle', () => {
  beforeEach(() => {
    resetThemeForTests()
    localStorage.clear()
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: () => {} }) as never
  })

  it('switches between light and dark and labels the next action', async () => {
    const wrapper = mount(ThemeToggle)
    expect(wrapper.attributes('aria-label')).toBe('Dunkles Design einschalten')

    await wrapper.trigger('click')

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(wrapper.attributes('aria-label')).toBe('Helles Design einschalten')
  })

  it('uses the glass look when floating over the map', () => {
    expect(mount(ThemeToggle, { props: { floating: true } }).classes()).toContain('glass')
    expect(mount(ThemeToggle).classes()).not.toContain('glass')
  })
})
