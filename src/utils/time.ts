import type { DateRange, MonthDay, OpeningRule, Weekday } from '@/types'
import { type HolidayOptions, publicHoliday } from '@/utils/holidays'

// Date logic for seasons, guest periods and opening hours.
// Everything works on local time and takes `now` as a parameter, so it is easy to test.

const WEEKDAYS: Weekday[] = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa']
const WEEKDAY_ORDER: Weekday[] = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su']

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mo: 'Mo',
  tu: 'Di',
  we: 'Mi',
  th: 'Do',
  fr: 'Fr',
  sa: 'Sa',
  su: 'So',
}

const WEEKDAY_NAMES: Record<Weekday, string> = {
  mo: 'Montag',
  tu: 'Dienstag',
  we: 'Mittwoch',
  th: 'Donnerstag',
  fr: 'Freitag',
  sa: 'Samstag',
  su: 'Sonntag',
}

function parseMonthDay(value: MonthDay): { month: number; day: number } {
  const [month, day] = value.split('-').map(Number)
  return { month: month ?? 1, day: day ?? 1 }
}

/** Comparable number for a date within a year, e.g. 3 March -> 303. */
function dayKey(month: number, day: number): number {
  return month * 100 + day
}

export function isInRange(range: DateRange, now: Date): boolean {
  const from = parseMonthDay(range.from)
  const to = parseMonthDay(range.to)
  const today = dayKey(now.getMonth() + 1, now.getDate())
  const start = dayKey(from.month, from.day)
  const end = dayKey(to.month, to.day)
  return start <= end ? today >= start && today <= end : today >= start || today <= end
}

/** The next date (today or later) on which the range starts. */
export function nextStart(range: DateRange, now: Date): Date {
  const { month, day } = parseMonthDay(range.from)
  const candidate = new Date(now.getFullYear(), month - 1, day)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (candidate < today) candidate.setFullYear(candidate.getFullYear() + 1)
  return candidate
}

/** `16.3.` style, as used on club pages. */
export function formatMonthDay(value: MonthDay): string {
  const { month, day } = parseMonthDay(value)
  return `${day}.${month}.`
}

export function formatRange(range: DateRange): string {
  return `${formatMonthDay(range.from)} bis ${formatMonthDay(range.to)}`
}

/** `15. Juli` style for running text. */
export function formatDayMonth(date: Date): string {
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })
}

export interface AvailabilityStatus {
  /** Whether a guest could fish today, as far as season and guest period tell. */
  openForGuestsToday: boolean
  /** Why not, as a short sentence. Null when open or when nothing is known. */
  reason: string | null
}

/**
 * Combines season and guest period. Returns `openForGuestsToday: true` when nothing
 * restricts today, the guest access level itself is not looked at here.
 */
export function availability(
  season: DateRange | null,
  guestPeriod: DateRange | null,
  now: Date,
): AvailabilityStatus {
  if (season && !isInRange(season, now)) {
    return {
      openForGuestsToday: false,
      reason: `Gerade Schonzeit, wieder ab ${formatDayMonth(nextStart(season, now))}.`,
    }
  }
  if (guestPeriod && !isInRange(guestPeriod, now)) {
    return {
      openForGuestsToday: false,
      reason: `Für Gäste gerade nicht freigegeben, wieder ab ${formatDayMonth(nextStart(guestPeriod, now))}.`,
    }
  }
  return { openForGuestsToday: true, reason: null }
}

// --- opening hours ----------------------------------------------------------

function minutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** `14:30` -> `14:30`, `18:00` -> `18`. */
export function formatTime(time: string): string {
  const [h, m] = time.split(':')
  return m === '00' ? String(Number(h)) : `${Number(h)}:${m}`
}

/** Rules for that date. On a public holiday these are the `ph` rules instead of the weekday's. */
function rulesFor(rules: OpeningRule[], date: Date, holiday: boolean): OpeningRule[] {
  const day = holiday ? 'ph' : WEEKDAYS[date.getDay()]!
  const month = date.getMonth() + 1
  return rules
    .filter((r) => r.days.includes(day) && (!r.months || r.months.includes(month)))
    .sort((a, b) => minutes(a.open) - minutes(b.open))
}

export type OpeningStatus =
  | { open: true; closesAt: string }
  | { open: false; opensAt: string; opensOn: 'today' | 'tomorrow' | Weekday }
  | { open: false; opensAt: null; opensOn: null }
  /** Public holiday and the shop has no holiday hours: it may well be closed, but nobody knows. */
  | { open: null; holiday: string }

/**
 * Whether the shop is open at `now` and when it opens next.
 *
 * Public holidays use the `ph` rules. A shop without them is reported as unknown on the
 * holiday itself and skipped when looking for the next opening, as most shops close then.
 */
export function openingStatus(rules: OpeningRule[], now: Date, holidays: HolidayOptions = {}): OpeningStatus {
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const hasHolidayRules = rules.some((r) => r.days.includes('ph'))
  const holidayToday = publicHoliday(now, holidays)
  if (holidayToday && !hasHolidayRules) return { open: null, holiday: holidayToday }

  const today = rulesFor(rules, now, holidayToday !== null)

  const current = today.find((r) => minutes(r.open) <= nowMinutes && nowMinutes < minutes(r.close))
  if (current) return { open: true, closesAt: current.close }

  const laterToday = today.find((r) => minutes(r.open) > nowMinutes)
  if (laterToday) return { open: false, opensAt: laterToday.open, opensOn: 'today' }

  for (let offset = 1; offset <= 7; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
    const holiday = publicHoliday(day, holidays) !== null
    if (holiday && !hasHolidayRules) continue
    const first = rulesFor(rules, day, holiday)[0]
    if (first) {
      return {
        open: false,
        opensAt: first.open,
        opensOn: offset === 1 ? 'tomorrow' : WEEKDAYS[day.getDay()]!,
      }
    }
  }
  return { open: false, opensAt: null, opensOn: null }
}

/** Short German description, e.g. "heute bis 18 Uhr" or "öffnet Mittwoch um 14 Uhr". */
export function describeOpeningStatus(status: OpeningStatus): string {
  if (status.open === null) return `heute ${status.holiday}, Zeiten können abweichen`
  if (status.open) return `heute bis ${formatTime(status.closesAt)} Uhr`
  if (!status.opensAt) return 'keine Öffnungszeiten bekannt'
  const time = `${formatTime(status.opensAt)} Uhr`
  if (status.opensOn === 'today') return `öffnet heute um ${time}`
  if (status.opensOn === 'tomorrow') return `öffnet morgen um ${time}`
  return `öffnet ${WEEKDAY_NAMES[status.opensOn]} um ${time}`
}

export interface OpeningHoursLine {
  days: string
  hours: string
}

function formatDays(days: Weekday[]): string {
  const sorted = WEEKDAY_ORDER.filter((d) => days.includes(d))
  const groups: Weekday[][] = []
  for (const day of sorted) {
    const last = groups[groups.length - 1]
    const previous = last?.[last.length - 1]
    if (last && previous && WEEKDAY_ORDER.indexOf(day) === WEEKDAY_ORDER.indexOf(previous) + 1) last.push(day)
    else groups.push([day])
  }
  return groups
    .map((g) =>
      g.length > 2
        ? `${WEEKDAY_LABELS[g[0]!]} bis ${WEEKDAY_LABELS[g[g.length - 1]!]}`
        : g.map((d) => WEEKDAY_LABELS[d]).join(', '),
    )
    .join(', ')
}

/**
 * Turns the rules into readable lines, one per weekday group, for the given month.
 * Rules that do not apply in that month are left out.
 */
export function formatOpeningHours(rules: OpeningRule[], month: number): OpeningHoursLine[] {
  const applicable = rules.filter((r) => !r.months || r.months.includes(month))
  const byDay = new Map<Weekday, string[]>()
  for (const day of WEEKDAY_ORDER) {
    const intervals = applicable
      .filter((r) => r.days.includes(day))
      .sort((a, b) => minutes(a.open) - minutes(b.open))
      .map((r) => `${formatTime(r.open)} bis ${formatTime(r.close)}`)
    if (intervals.length) byDay.set(day, intervals)
  }

  // Merge weekdays with identical hours, keeping the week order.
  const lines: { days: Weekday[]; hours: string }[] = []
  for (const [day, intervals] of byDay) {
    const hours = `${intervals.join(' und ')} Uhr`
    const existing = lines.find((l) => l.hours === hours)
    if (existing) existing.days.push(day)
    else lines.push({ days: [day], hours })
  }
  const result = lines.map((l) => ({ days: formatDays(l.days), hours: l.hours }))

  // Holiday hours always get their own line at the end.
  const holiday = applicable
    .filter((r) => r.days.includes('ph'))
    .sort((a, b) => minutes(a.open) - minutes(b.open))
    .map((r) => `${formatTime(r.open)} bis ${formatTime(r.close)}`)
  if (holiday.length) result.push({ days: 'Feiertage', hours: `${holiday.join(' und ')} Uhr` })
  return result
}
