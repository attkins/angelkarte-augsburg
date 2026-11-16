import { describe, expect, it } from 'vitest'
import {
  austrianHolidays,
  bavarianHolidays,
  easterSunday,
  holidayOptions,
  isAugsburgCity,
  isAustria,
  publicHoliday,
} from '@/utils/holidays'

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

describe('austrianHolidays', () => {
  it('has the 13 Austrian holidays, with the movable ones in 2026', () => {
    const holidays = austrianHolidays(2026)

    expect(holidays.size).toBe(13)
    expect(holidays.get('4-6')).toBe('Ostermontag')
    expect(holidays.get('5-1')).toBe('Staatsfeiertag')
    expect(holidays.get('5-14')).toBe('Christi Himmelfahrt')
    expect(holidays.get('5-25')).toBe('Pfingstmontag')
    expect(holidays.get('6-4')).toBe('Fronleichnam')
    expect(holidays.get('10-26')).toBe('Nationalfeiertag')
    expect(holidays.get('12-8')).toBe('Mariä Empfängnis')
    expect(holidays.get('12-26')).toBe('Stefanitag')
  })

  it('has no Karfreitag, no Tag der Deutschen Einheit and no Josefitag', () => {
    const holidays = austrianHolidays(2026)
    expect(holidays.has('4-3')).toBe(false)
    expect(holidays.has('10-3')).toBe(false)
    expect(holidays.has('3-19')).toBe(false)
  })
})

describe('publicHoliday in Austria', () => {
  it('uses the Austrian holidays', () => {
    expect(publicHoliday(new Date(2026, 9, 26), { austria: true })).toBe('Nationalfeiertag')
    expect(publicHoliday(new Date(2026, 9, 26))).toBeNull()
    expect(publicHoliday(new Date(2026, 9, 3), { austria: true })).toBeNull()
    expect(publicHoliday(new Date(2026, 3, 3), { austria: true })).toBeNull()
  })
})

describe('holidayOptions', () => {
  it.each([
    ['Geist 45, 6675 Tannheim, Österreich', { augsburgCity: false, austria: true }],
    ['Kurzes Geländ 8a, 86156 Augsburg', { augsburgCity: true, austria: false }],
    ['Augsburger Str. 72, 86316 Friedberg', { augsburgCity: false, austria: false }],
  ])('%s', (address, expected) => {
    expect(holidayOptions(address)).toEqual(expected)
    expect(isAustria(address)).toBe(expected.austria)
  })
})
