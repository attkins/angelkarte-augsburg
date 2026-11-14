import { describe, expect, it } from 'vitest'
import { bavarianHolidays, easterSunday, isAugsburgCity, publicHoliday } from '@/utils/holidays'

describe('easterSunday', () => {
  it.each([
    [2024, 3, 31],
    [2025, 4, 20],
    [2026, 4, 5],
    [2027, 3, 28],
    [2038, 4, 25],
  ])('is right for %i', (year, month, day) => {
    expect(easterSunday(year)).toEqual(new Date(year, month - 1, day))
  })
})

describe('bavarianHolidays', () => {
  it('has the 13 Bavarian holidays, with the movable ones in 2026', () => {
    const holidays = bavarianHolidays(2026)

    expect(holidays.size).toBe(13)
    expect(holidays.get('4-3')).toBe('Karfreitag')
    expect(holidays.get('4-6')).toBe('Ostermontag')
    expect(holidays.get('5-14')).toBe('Christi Himmelfahrt')
    expect(holidays.get('5-25')).toBe('Pfingstmontag')
    expect(holidays.get('6-4')).toBe('Fronleichnam')
    expect(holidays.get('8-15')).toBe('Mariä Himmelfahrt')
    expect(holidays.get('11-1')).toBe('Allerheiligen')
  })

  it('adds the Friedensfest in the city of Augsburg only', () => {
    expect(bavarianHolidays(2026).has('8-8')).toBe(false)
    expect(bavarianHolidays(2026, { augsburgCity: true }).get('8-8')).toBe('Friedensfest')
  })
})

describe('publicHoliday', () => {
  it('names the holiday or returns null', () => {
    expect(publicHoliday(new Date(2026, 11, 25))).toBe('1. Weihnachtstag')
    expect(publicHoliday(new Date(2026, 10, 18))).toBeNull() // Buß- und Bettag is no public holiday
    expect(publicHoliday(new Date(2026, 7, 8))).toBeNull()
    expect(publicHoliday(new Date(2026, 7, 8), { augsburgCity: true })).toBe('Friedensfest')
  })
})

describe('isAugsburgCity', () => {
  it.each([
    ['Kurzes Geländ 8a, 86156 Augsburg', true],
    ['Arberstr. 1, 86179 Augsburg', true],
    ['Augsburger Str. 72, 86316 Friedberg', false],
    ['Haunstetter Str. 91, 86343 Königsbrunn', false],
    ['Königsbrunner Straße, Augsburg-Haunstetten Süd', true],
    ['Augsburger Straße, Friedberg', false],
  ])('%s -> %s', (address, expected) => {
    expect(isAugsburgCity(address)).toBe(expected)
  })
})
