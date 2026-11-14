import { describe, expect, it } from 'vitest'
import { describeUpcoming, guestPriceOn, isoDay, pricesOn } from '@/utils/prices'

const NEW = { guest: 25, member: 20, validFrom: '2027-01-01' }
const OLD = { guest: 20, member: 15 }

// Local dates. Month is zero based in the Date constructor.
const DEC_31 = new Date(2026, 11, 31, 23, 59)
const JAN_1 = new Date(2027, 0, 1, 0, 1)

describe('isoDay', () => {
  it('uses the local calendar day', () => {
    expect(isoDay(DEC_31)).toBe('2026-12-31')
    expect(isoDay(JAN_1)).toBe('2027-01-01')
  })
})

describe('pricesOn', () => {
  it('keeps the old prices until the day before and announces the new ones', () => {
    expect(pricesOn({ prices: NEW, previousPrices: OLD }, DEC_31)).toEqual({ current: OLD, upcoming: NEW })
  })

  it('switches to the new prices on the day they start', () => {
    expect(pricesOn({ prices: NEW, previousPrices: OLD }, JAN_1)).toEqual({ current: NEW, upcoming: null })
  })

  it('shows a future list right away when the old one is unknown', () => {
    expect(pricesOn({ prices: NEW }, DEC_31)).toEqual({ current: NEW, upcoming: null })
  })

  it('ignores old prices when the newest list has no date', () => {
    expect(pricesOn({ prices: OLD, previousPrices: { guest: 1 } }, DEC_31)).toEqual({ current: OLD, upcoming: null })
  })

  it('handles waters without prices', () => {
    expect(pricesOn({ prices: null }, DEC_31)).toEqual({ current: null, upcoming: null })
  })
})

describe('guestPriceOn', () => {
  it('gives the guest price of the list that applies', () => {
    expect(guestPriceOn({ prices: NEW, previousPrices: OLD }, DEC_31)).toBe(20)
    expect(guestPriceOn({ prices: NEW, previousPrices: OLD }, JAN_1)).toBe(25)
    expect(guestPriceOn({ prices: { member: 15 } }, JAN_1)).toBeNull()
  })
})

describe('describeUpcoming', () => {
  it('lists the new prices in the tile order with the start date', () => {
    expect(describeUpcoming({ member: 20, guest: 25, youth: 12, deposit: 5, validFrom: '2027-01-01' })).toBe(
      'Ab 1.1.2027: Gast 25 €, Mitglied 20 €, Jugend 12 €.',
    )
  })
})
