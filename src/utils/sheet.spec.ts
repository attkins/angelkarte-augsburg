import { describe, expect, it } from 'vitest'
import { sheetStateAfterDrag, sheetStateAfterTap } from '@/utils/sheet'

const VIEWPORT = 800

describe('sheetStateAfterTap', () => {
  it('toggles between peek and half', () => {
    expect(sheetStateAfterTap('peek')).toBe('half')
    expect(sheetStateAfterTap('half')).toBe('peek')
  })

  it('goes back to half from full', () => {
    expect(sheetStateAfterTap('full')).toBe('half')
  })
})

describe('sheetStateAfterDrag', () => {
  it('treats a tiny movement as a tap', () => {
    expect(sheetStateAfterDrag('half', 3, VIEWPORT)).toBe('peek')
  })

  it('stays in place for a short drag', () => {
    expect(sheetStateAfterDrag('half', -20, VIEWPORT)).toBe('half')
  })

  it('moves one state per normal drag', () => {
    expect(sheetStateAfterDrag('peek', -60, VIEWPORT)).toBe('half')
    expect(sheetStateAfterDrag('half', -60, VIEWPORT)).toBe('full')
    expect(sheetStateAfterDrag('full', 60, VIEWPORT)).toBe('half')
    expect(sheetStateAfterDrag('half', 60, VIEWPORT)).toBe('peek')
  })

  it('moves two states for a long drag', () => {
    expect(sheetStateAfterDrag('peek', -400, VIEWPORT)).toBe('full')
    expect(sheetStateAfterDrag('full', 400, VIEWPORT)).toBe('peek')
  })

  it('stops at the lowest and highest state', () => {
    expect(sheetStateAfterDrag('peek', 300, VIEWPORT)).toBe('peek')
    expect(sheetStateAfterDrag('full', -300, VIEWPORT)).toBe('full')
  })
})
