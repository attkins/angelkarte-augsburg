// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { effectScope } from 'vue'
import { useOnline } from '@/composables/useOnline'

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true })
}

afterEach(() => setOnline(true))

describe('useOnline', () => {
  it('follows the online and offline events', () => {
    setOnline(true)
    const scope = effectScope()
    const online = scope.run(() => useOnline())!
    expect(online.value).toBe(true)

    setOnline(false)
    window.dispatchEvent(new Event('offline'))
    expect(online.value).toBe(false)

    setOnline(true)
    window.dispatchEvent(new Event('online'))
    expect(online.value).toBe(true)
    scope.stop()
  })
})
