// Public holidays in Bavaria, needed for the opening hours of the sales points.

export interface HolidayOptions {
  /** The Augsburger Hohes Friedensfest on 8 August is a holiday in the city of Augsburg only. */
  augsburgCity?: boolean
}

/** Easter Sunday of the given year (Gregorian calendar, anonymous algorithm). */
export function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function key(date: Date): string {
  return `${date.getMonth() + 1}-${date.getDate()}`
}

/**
 * Public holidays of a year in Bavaria, keyed by `M-D`.
 *
 * Mariä Himmelfahrt (15 August) only applies in municipalities with a Catholic majority.
 * That is the case for every place in the data, so it is always included.
 */
export function bavarianHolidays(year: number, options: HolidayOptions = {}): Map<string, string> {
  const easter = easterSunday(year)
  const fromEaster = (days: number) =>
    key(new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + days))

  const holidays = new Map<string, string>([
    ['1-1', 'Neujahr'],
    ['1-6', 'Heilige Drei Könige'],
    [fromEaster(-2), 'Karfreitag'],
    [fromEaster(1), 'Ostermontag'],
    ['5-1', 'Tag der Arbeit'],
    [fromEaster(39), 'Christi Himmelfahrt'],
    [fromEaster(50), 'Pfingstmontag'],
    [fromEaster(60), 'Fronleichnam'],
    ['8-15', 'Mariä Himmelfahrt'],
    ['10-3', 'Tag der Deutschen Einheit'],
    ['11-1', 'Allerheiligen'],
    ['12-25', '1. Weihnachtstag'],
    ['12-26', '2. Weihnachtstag'],
  ])
  if (options.augsburgCity) holidays.set('8-8', 'Friedensfest')
  return holidays
}

/** Name of the public holiday on that day, or null. */
export function publicHoliday(date: Date, options: HolidayOptions = {}): string | null {
  return bavarianHolidays(date.getFullYear(), options).get(key(date)) ?? null
}

/**
 * Whether an address lies in the city of Augsburg, going by its postcode (86150 to 86199).
 * Without a postcode the place name decides, e.g. "Augsburg-Haunstetten".
 */
export function isAugsburgCity(address: string): boolean {
  const postcode = address.match(/\b(\d{5})\b/)?.[1]
  if (postcode === undefined) return /\bAugsburg\b/.test(address)
  return Number(postcode) >= 86150 && Number(postcode) <= 86199
}
