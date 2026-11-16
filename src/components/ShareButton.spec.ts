// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ShareButton from '@/components/ShareButton.vue'

const props = { route: { kind: 'water' as const, id: 'fva-kuhsee' }, title: 'Kuhsee' }
const expectedUrl = `${window.location.origin}${window.location.pathname}#/gewaesser/fva-kuhsee`

function stubNavigator(values: Partial<Navigator>) {
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(navigator, key, { value, configurable: true, writable: true })
  }
}

afterEach(() => {
  stubNavigator({ share: undefined, clipboard: undefined } as unknown as Partial<Navigator>)
  vi.useRealTimers()
})

describe('ShareButton', () => {
  it('opens the share sheet with title and link when the browser has one', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn()
    stubNavigator({ share, clipboard: { writeText } as unknown as Clipboard })

    const wrapper = mount(ShareButton, { props })
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(share).toHaveBeenCalledWith({ title: 'Kuhsee · Angelkarte', url: expectedUrl })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('stays quiet when the share sheet is closed', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('closed', 'AbortError'))
    const writeText = vi.fn()
    stubNavigator({ share, clipboard: { writeText } as unknown as Clipboard })

    const wrapper = mount(ShareButton, { props })
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(writeText).not.toHaveBeenCalled()
    expect(wrapper.find('[role="status"]').text()).toBe('')
  })

  it('copies the link and says so without a share sheet', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ share: undefined, clipboard: { writeText } as unknown as Clipboard } as unknown as Partial<Navigator>)

    const wrapper = mount(ShareButton, { props })
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith(expectedUrl)
    expect(wrapper.find('[role="status"]').text()).toBe('Link kopiert')

    vi.advanceTimersByTime(3000)
    await flushPromises()
    expect(wrapper.find('[role="status"]').text()).toBe('')
  })

  it('tells when copying fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    stubNavigator({ share: undefined, clipboard: { writeText } as unknown as Clipboard } as unknown as Partial<Navigator>)

    const wrapper = mount(ShareButton, { props })
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toBe('Kopieren nicht möglich')
  })
})
