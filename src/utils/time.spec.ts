import { describe, expect, it } from 'vitest'
import type { OpeningRule } from '@/types'
import {
  availability,
  describeOpeningStatus,
  formatOpeningHours,
  formatRange,
  formatTime,
  isInRange,
  nextStart,
  openingStatus,
} from '@/utils/time'

// Local dates. Month is zero based in the Date constructor.
const at = (month: number, day: number, hour = 12, minute = 0, year = 2026) =>
  new Date(year, month - 1, day, hour, minute)

describe('isInRange', () => {
  const season = { from: '03-16', to: '12-14' }

  it('includes both ends', () => {
    expect(isInRange(season, at(3, 16))).toBe(true)
    expect(isInRange(season, at(12, 14))).toBe(true)
  })

  it('excludes the days just outside', () => {
    expect(isInRange(season, at(3, 15))).toBe(false)
    expect(isInRange(season, at(12, 15))).toBe(false)
  })

  it('handles ranges over New Year', () => {
    const winter = { from: '11-01', to: '02-28' }
    expect(isInRange(winter, at(12, 31))).toBe(true)
    expect(isInRange(winter, at(1, 15))).toBe(true)
    expect(isInRange(winter, at(6, 1))).toBe(false)
  })
})

describe('nextStart', () => {
  const range = { from: '07-15', to: '10-31' }

  it('returns this year when the start is still ahead', () => {
    expect(nextStart(range, at(3, 1))).toEqual(new Date(2026, 6, 15))
  })

  it('returns next year when the start has passed', () => {
    expect(nextStart(range, at(11, 13))).toEqual(new Date(2027, 6, 15))
  })

  it('returns today when the range starts today', () => {
    expect(nextStart(range, at(7, 15, 18))).toEqual(new Date(2026, 6, 15))
  })
})

describe('formatRange and formatTime', () => {
  it('formats ranges like the club pages', () => {
    expect(formatRange({ from: '03-16', to: '12-14' })).toBe('16.3. bis 14.12.')
  })

  it('drops zero minutes', () => {
    expect(formatTime('18:00')).toBe('18')
    expect(formatTime('08:00')).toBe('8')
    expect(formatTime('14:30')).toBe('14:30')
  })
})

describe('availability', () => {
  const season = { from: '03-16', to: '12-14' }
  const guestPeriod = { from: '07-15', to: '10-31' }

  it('is open when nothing restricts today', () => {
    expect(availability(null, null, at(1, 1))).toEqual({ openForGuestsToday: true, reason: null })
    expect(availability(season, guestPeriod, at(8, 1))).toEqual({ openForGuestsToday: true, reason: null })
  })

  it('reports the closed season with the next start', () => {
    expect(availability(season, null, at(12, 20))).toEqual({
      openForGuestsToday: false,
      reason: 'Gerade Schonzeit, wieder ab 16. März.',
    })
  })

  it('reports the guest period with the next start', () => {
    expect(availability(null, guestPeriod, at(11, 13))).toEqual({
      openForGuestsToday: false,
      reason: 'Für Gäste gerade nicht freigegeben, wieder ab 15. Juli.',
    })
  })

  it('names the season first when both are closed', () => {
    expect(availability(season, guestPeriod, at(1, 10)).reason).toContain('Schonzeit')
  })
})

describe('openingStatus', () => {
  // 13 Nov 2026 is a Friday.
  const rules: OpeningRule[] = [
    { days: ['mo'], open: '16:00', close: '19:00' },
    { days: ['fr'], open: '08:00', close: '10:00' },
    { days: ['fr'], open: '14:00', close: '18:00' },
  ]

  it('is open inside an interval and tells when it closes', () => {
    expect(openingStatus(rules, at(11, 13, 15, 30))).toEqual({ open: true, closesAt: '18:00' })
  })

  it('treats the closing time as closed', () => {
    expect(openingStatus(rules, at(11, 13, 18, 0)).open).toBe(false)
  })

  it('finds the next interval later the same day', () => {
    expect(openingStatus(rules, at(11, 13, 11, 0))).toEqual({ open: false, opensAt: '14:00', opensOn: 'today' })
  })

  it('looks ahead to the next day with hours', () => {
    expect(openingStatus(rules, at(11, 13, 20, 0))).toEqual({ open: false, opensAt: '16:00', opensOn: 'mo' })
  })

  it('says tomorrow for the next day', () => {
    expect(openingStatus(rules, at(11, 15, 20, 0))).toEqual({ open: false, opensAt: '16:00', opensOn: 'tomorrow' })
  })

  it('respects month limits', () => {
    const seasonal: OpeningRule[] = [
      { days: ['fr'], open: '08:00', close: '10:00', months: [3, 4, 5, 6, 7, 8, 9, 10] },
      { days: ['fr'], open: '14:00', close: '18:00' },
    ]
    expect(openingStatus(seasonal, at(11, 13, 9, 0))).toEqual({ open: false, opensAt: '14:00', opensOn: 'today' })
    expect(openingStatus(seasonal, at(10, 16, 9, 0))).toEqual({ open: true, closesAt: '10:00' })
  })

  it('handles rules that never apply', () => {
    expect(openingStatus([], at(11, 13))).toEqual({ open: false, opensAt: null, opensOn: null })
  })

  describe('public holidays', () => {
    // 1 Nov 2026 (Allerheiligen) is a Sunday, 25 Dec 2026 a Friday.
    const shop: OpeningRule[] = [{ days: ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'], open: '09:00', close: '18:00' }]
    const station: OpeningRule[] = [
      { days: ['mo', 'tu', 'we', 'th', 'fr', 'sa'], open: '06:00', close: '22:00' },
      { days: ['su', 'ph'], open: '07:00', close: '20:00' },
    ]

    it('is unknown on a holiday when the shop has no holiday hours', () => {
      expect(openingStatus(shop, at(12, 25, 12))).toEqual({ open: null, holiday: '1. Weihnachtstag' })
    })

    it('uses the holiday hours instead of the weekday on a holiday', () => {
      expect(openingStatus(station, at(12, 25, 6, 30))).toEqual({ open: false, opensAt: '07:00', opensOn: 'today' })
      expect(openingStatus(station, at(12, 25, 21))).toEqual({ open: false, opensAt: '07:00', opensOn: 'tomorrow' })
    })

    it('skips holidays without holiday hours when looking for the next opening', () => {
      // Thursday 24 Dec 20:00, then two holidays, then Sunday 27 Dec.
      expect(openingStatus(shop, at(12, 24, 20))).toEqual({ open: false, opensAt: '09:00', opensOn: 'su' })
    })

    it('knows the Friedensfest only inside Augsburg', () => {
      // 8 Aug 2026 is a Saturday.
      expect(openingStatus(shop, at(8, 8, 12)).open).toBe(true)
      expect(openingStatus(shop, at(8, 8, 12), { augsburgCity: true })).toEqual({ open: null, holiday: 'Friedensfest' })
    })

    it('uses the Austrian holidays for a shop in Tyrol', () => {
      // 26 Oct 2026 is a Monday, 3 Oct 2026 a Saturday.
      expect(openingStatus(shop, at(10, 26, 12), { austria: true })).toEqual({ open: null, holiday: 'Nationalfeiertag' })
      expect(openingStatus(shop, at(10, 26, 12)).open).toBe(true)
      expect(openingStatus(shop, at(10, 3, 12), { austria: true }).open).toBe(true)
    })
  })
})

describe('describeOpeningStatus', () => {
  it('writes short German sentences', () => {
    expect(describeOpeningStatus({ open: true, closesAt: '18:00' })).toBe('heute bis 18 Uhr')
    expect(describeOpeningStatus({ open: false, opensAt: '14:30', opensOn: 'today' })).toBe('öffnet heute um 14:30 Uhr')
    expect(describeOpeningStatus({ open: false, opensAt: '09:00', opensOn: 'tomorrow' })).toBe('öffnet morgen um 9 Uhr')
    expect(describeOpeningStatus({ open: false, opensAt: '16:00', opensOn: 'mo' })).toBe('öffnet Montag um 16 Uhr')
    expect(describeOpeningStatus({ open: false, opensAt: null, opensOn: null })).toBe('keine Öffnungszeiten bekannt')
    expect(describeOpeningStatus({ open: null, holiday: 'Allerheiligen' })).toBe('heute Allerheiligen, Zeiten können abweichen')
  })
})

describe('formatOpeningHours', () => {
  it('groups weekdays with the same hours and joins split days', () => {
    const rules: OpeningRule[] = [
      { days: ['mo', 'tu', 'we', 'th', 'fr'], open: '09:00', close: '12:00' },
      { days: ['mo', 'tu', 'we', 'th', 'fr'], open: '13:00', close: '17:00' },
      { days: ['sa'], open: '09:00', close: '12:30' },
    ]
    expect(formatOpeningHours(rules, 6)).toEqual([
      { days: 'Mo bis Fr', hours: '9 bis 12 und 13 bis 17 Uhr' },
      { days: 'Sa', hours: '9 bis 12:30 Uhr' },
    ])
  })

  it('lists non-adjacent days separately within one line', () => {
    const rules: OpeningRule[] = [{ days: ['mo', 'we', 'fr'], open: '09:00', close: '11:00' }]
    expect(formatOpeningHours(rules, 6)).toEqual([{ days: 'Mo, Mi, Fr', hours: '9 bis 11 Uhr' }])
  })

  it('only shows rules valid in the given month', () => {
    const rules: OpeningRule[] = [
      { days: ['sa'], open: '08:00', close: '13:00', months: [3, 4, 5, 6, 7, 8, 9, 10] },
      { days: ['sa'], open: '10:00', close: '13:00', months: [11, 12, 1, 2] },
    ]
    expect(formatOpeningHours(rules, 11)).toEqual([{ days: 'Sa', hours: '10 bis 13 Uhr' }])
    expect(formatOpeningHours(rules, 5)).toEqual([{ days: 'Sa', hours: '8 bis 13 Uhr' }])
  })

  it('puts holiday hours on their own line at the end', () => {
    const rules: OpeningRule[] = [
      { days: ['mo', 'tu', 'we', 'th', 'fr', 'sa'], open: '06:00', close: '22:00' },
      { days: ['su', 'ph'], open: '07:00', close: '22:00' },
    ]
    expect(formatOpeningHours(rules, 6)).toEqual([
      { days: 'Mo bis Sa', hours: '6 bis 22 Uhr' },
      { days: 'So', hours: '7 bis 22 Uhr' },
      { days: 'Feiertage', hours: '7 bis 22 Uhr' },
    ])
  })
})
