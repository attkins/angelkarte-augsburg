import { describe, expect, it } from 'vitest'
import { formatDate, formatPrice, phoneHref } from '@/utils/format'

describe('formatPrice', () => {
  it('formats whole euros without decimals', () => {
    expect(formatPrice(15)).toBe('15 €')
  })

  it('uses a German decimal comma', () => {
    expect(formatPrice(2.5)).toBe('2,5 €')
  })

  it('rounds to at most two decimals', () => {
    expect(formatPrice(12.345)).toBe('12,35 €')
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('0 €')
  })
})

describe('formatDate', () => {
  it('formats an ISO date in German order', () => {
    expect(formatDate('2026-11-13')).toBe('13.11.2026')
  })

  it('returns null for missing values', () => {
    expect(formatDate(null)).toBeNull()
    expect(formatDate(undefined)).toBeNull()
    expect(formatDate('')).toBeNull()
  })
})

describe('phoneHref', () => {
  it('removes spaces for the tel link', () => {
    expect(phoneHref('0821 58960504')).toBe('tel:082158960504')
  })

  it('removes every space, not just the first one', () => {
    expect(phoneHref('0821 589 605 04')).toBe('tel:082158960504')
  })

  it('keeps numbers without spaces unchanged', () => {
    expect(phoneHref('0160123')).toBe('tel:0160123')
  })
})
