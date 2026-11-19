// Sunrise, sunset and civil twilight after the NOAA solar calculator
// (https://gml.noaa.gov/grad/solcalc/calcdetails.html), which builds on Jean Meeus,
// Astronomical Algorithms. Accurate to about a minute at the latitudes of this map.

const RAD = Math.PI / 180
const DAY_MS = 86_400_000

/** Zenith angles in degrees: the upper rim at the horizon with refraction, and civil twilight. */
const SUNRISE_ZENITH = 90.833
const CIVIL_TWILIGHT_ZENITH = 96

/** All map regions are in Bavaria and Tyrol, so times are shown in their local time. */
const TIME_ZONE = 'Europe/Berlin'

export interface SunTimes {
  /** Start of civil twilight, bright enough to see the line. */
  dawn: Date
  sunrise: Date
  sunset: Date
  /** End of civil twilight. */
  dusk: Date
}

/** Declination (radians) and equation of time (minutes) at a moment, as Julian centuries since J2000. */
function solarPosition(centuries: number) {
  const t = centuries
  const meanLongitude = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360
  const meanAnomaly = 357.52911 + t * (35999.05029 - 0.0001537 * t)
  const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t)
  const m = meanAnomaly * RAD
  const centre =
    Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * m) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * m) * 0.000289
  const omega = (125.04 - 1934.136 * t) * RAD
  const apparentLongitude = (meanLongitude + centre - 0.00569 - 0.00478 * Math.sin(omega)) * RAD
  const meanObliquity = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60
  const obliquity = (meanObliquity + 0.00256 * Math.cos(omega)) * RAD
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(apparentLongitude))

  const y = Math.tan(obliquity / 2) ** 2
  const l = meanLongitude * RAD
  const equationOfTime =
    (4 / RAD) *
    (y * Math.sin(2 * l) -
      2 * eccentricity * Math.sin(m) +
      4 * eccentricity * y * Math.sin(m) * Math.cos(2 * l) -
      0.5 * y * y * Math.sin(4 * l) -
      1.25 * eccentricity * eccentricity * Math.sin(2 * m))
  return { declination, equationOfTime }
}

function centuriesSinceJ2000(ms: number): number {
  return (ms / DAY_MS + 2_440_587.5 - 2_451_545) / 36_525
}

/**
 * Minutes after midnight UTC of the event: before solar noon for `rising`, after it otherwise.
 * Computed twice, the second time with the sun's position at the first estimate, as NOAA advises.
 */
function eventMinutes(midnightUtc: number, lat: number, lng: number, zenith: number, rising: boolean): number | null {
  let minutes = 720
  for (let i = 0; i < 2; i++) {
    const { declination, equationOfTime } = solarPosition(centuriesSinceJ2000(midnightUtc + minutes * 60_000))
    const cos = Math.cos(zenith * RAD) / (Math.cos(lat * RAD) * Math.cos(declination)) - Math.tan(lat * RAD) * Math.tan(declination)
    if (cos < -1 || cos > 1) return null
    const hourAngle = Math.acos(cos) / RAD
    minutes = 720 - 4 * lng - equationOfTime + (rising ? -4 : 4) * hourAngle
  }
  return minutes
}

/**
 * Sun times on the calendar day of `day` (its local year, month and date) at the given place.
 * Null where the sun does not rise or set that day, which cannot happen in the Alps.
 */
export function sunTimes(day: Date, lat: number, lng: number): SunTimes | null {
  const midnight = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())
  const at = (zenith: number, rising: boolean) => {
    const minutes = eventMinutes(midnight, lat, lng, zenith, rising)
    return minutes === null ? null : new Date(midnight + minutes * 60_000)
  }
  const dawn = at(CIVIL_TWILIGHT_ZENITH, true)
  const sunrise = at(SUNRISE_ZENITH, true)
  const sunset = at(SUNRISE_ZENITH, false)
  const dusk = at(CIVIL_TWILIGHT_ZENITH, false)
  if (!dawn || !sunrise || !sunset || !dusk) return null
  return { dawn, sunrise, sunset, dusk }
}

const clock = new Intl.DateTimeFormat('de-DE', { hour: 'numeric', minute: '2-digit', timeZone: TIME_ZONE })

/** `7:32`, rounded to the minute, in German local time whatever the time zone of the device. */
export function formatClock(date: Date): string {
  return clock.format(new Date(Math.round(date.valueOf() / 60_000) * 60_000))
}
