import { describe, expect, it } from 'vitest'
import { formatClock, sunTimes } from '@/utils/sun'

// Reference values from the Python library astral, which iterates the NOAA formulas per event.
// Local time Europe/Berlin.
// Each case: date, lat, lng, then dawn, sunrise, sunset and dusk as HH:MM:SS.
const CASES: [string, number, number, string, string, string, string][] = [
  ['2026-06-21', 48.37, 10.9, '04:32:41', '05:15:23', '21:21:02', '22:03:44'],
  ['2026-12-21', 48.37, 10.9, '07:27:43', '08:05:15', '16:23:39', '17:01:11'],
  // The days on which the clocks change.
  ['2026-03-29', 48.37, 10.9, '06:29:07', '07:01:12', '19:42:00', '20:14:11'],
  ['2026-10-25', 48.37, 10.9, '06:18:33', '06:51:20', '17:08:48', '17:41:33'],
  ['2026-06-21', 47.44, 11.7, '04:35:08', '05:16:26', '21:13:35', '21:54:53'],
  ['2026-12-21', 47.44, 11.7, '07:21:29', '07:58:07', '16:24:23', '17:01:01'],
]

/** Minutes since midnight in Berlin, independent of the time zone the tests run in. */
function berlinMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Europe/Berlin',
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value)
  return get('hour') * 60 + get('minute') + get('second') / 60
}

function minutes(hms: string): number {
  const [h, m, s] = hms.split(':').map(Number)
  return h! * 60 + m! + s! / 60
}

describe('sunTimes', () => {
  it.each(CASES)('matches the reference on %s at %f, %f within half a minute', (iso, lat, lng, dawn, rise, set, dusk) => {
    const [y, m, d] = iso.split('-').map(Number)
    const times = sunTimes(new Date(y!, m! - 1, d!), lat, lng)!
    expect(Math.abs(berlinMinutes(times.dawn) - minutes(dawn))).toBeLessThan(0.5)
    expect(Math.abs(berlinMinutes(times.sunrise) - minutes(rise))).toBeLessThan(0.5)
    expect(Math.abs(berlinMinutes(times.sunset) - minutes(set))).toBeLessThan(0.5)
    expect(Math.abs(berlinMinutes(times.dusk) - minutes(dusk))).toBeLessThan(0.5)
  })

  it('uses the calendar day of the given date, whatever its time', () => {
    const morning = sunTimes(new Date(2026, 5, 21, 0, 5), 48.37, 10.9)!
    const evening = sunTimes(new Date(2026, 5, 21, 23, 55), 48.37, 10.9)!
    expect(morning.sunrise.valueOf()).toBe(evening.sunrise.valueOf())
  })

  it('returns null where the sun does not set', () => {
    expect(sunTimes(new Date(2026, 5, 21), 80, 10)).toBeNull()
  })
})

describe('formatClock', () => {
  it('rounds to the nearest minute', () => {
    expect(formatClock(new Date('2026-12-21T07:05:29Z'))).toBe('8:05')
    expect(formatClock(new Date('2026-12-21T07:05:30Z'))).toBe('8:06')
  })

  it('shows hours without a leading zero in German time', () => {
    expect(formatClock(new Date('2026-12-21T07:05:00Z'))).toBe('8:05')
    expect(formatClock(new Date('2026-06-21T19:21:00Z'))).toBe('21:21')
  })
})
