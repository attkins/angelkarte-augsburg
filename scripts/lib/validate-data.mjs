// Checks the data files against the schema described in docs/data-schema.md.
// Pure function without file access, so it can be used by the CLI script and by the tests.

export const GUEST_ACCESS = ['open', 'withMember', 'membersOnly', 'unknown']
export const GEOMETRY_STATUS = ['placeholder', 'traced', 'verified']
export const WATER_GEOMETRIES = ['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString']
export const PRICE_KEYS = ['member', 'guest', 'youth', 'guestYouth', 'deposit', 'note', 'validFrom']
const TEXT_PRICE_KEYS = ['note', 'validFrom']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const MONTH_DAY = /^(\d{2})-(\d{2})$/
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
export const WEEKDAYS = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su']
/** Weekdays plus `ph` for public holidays. */
export const OPENING_DAYS = [...WEEKDAYS, 'ph']
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
/** Data checked longer ago than this is probably out of date (prices, rules, guest access). */
export const STALE_AFTER_DAYS = 183
const DAY_MS = 24 * 60 * 60 * 1000

/** Whole days from an ISO date (YYYY-MM-DD, read as UTC) to `now`. Negative for dates in the future. */
function daysSince(isoDate, now) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.floor((today - Date.UTC(year, month - 1, day)) / DAY_MS)
}

function isMonthDay(value) {
  const match = typeof value === 'string' ? MONTH_DAY.exec(value) : null
  if (!match) return false
  const month = Number(match[1])
  const day = Number(match[2])
  return month >= 1 && month <= 12 && day >= 1 && day <= DAYS_IN_MONTH[month - 1]
}

/** Checks a nullable `{ from, to }` date range and reports problems with the given label. */
function checkDateRange(range, label, errors) {
  if (range === null) return
  if (typeof range !== 'object' || !isMonthDay(range.from) || !isMonthDay(range.to)) {
    errors.push(`${label} must be null or { from: "MM-DD", to: "MM-DD" }`)
  }
}

function checkOpeningRules(rules, where, errors) {
  if (rules === null) return
  if (!Array.isArray(rules)) {
    errors.push(`${where}: openingHours must be null or a list of rules`)
    return
  }
  rules.forEach((rule, index) => {
    const label = `${where}: openingHours[${index}]`
    if (!Array.isArray(rule.days) || rule.days.length === 0 || rule.days.some((d) => !OPENING_DAYS.includes(d))) {
      errors.push(`${label}: days must be a non-empty list of ${OPENING_DAYS.join(', ')}`)
    }
    if (!TIME.test(rule.open ?? '') || !TIME.test(rule.close ?? '')) {
      errors.push(`${label}: open and close must be HH:MM`)
    } else if (rule.open >= rule.close) {
      errors.push(`${label}: open must be before close`)
    }
    if (rule.months !== undefined) {
      const valid = Array.isArray(rule.months) && rule.months.length > 0 &&
        rule.months.every((m) => Number.isInteger(m) && m >= 1 && m <= 12)
      if (!valid) errors.push(`${label}: months must be a non-empty list of numbers from 1 to 12`)
    }
  })
}

function checkPrices(prices, label, errors) {
  for (const [key, value] of Object.entries(prices)) {
    if (!PRICE_KEYS.includes(key)) errors.push(`${label}: unknown price key "${key}"`)
    else if (!TEXT_PRICE_KEYS.includes(key) && typeof value !== 'number') {
      errors.push(`${label}: price "${key}" must be a number`)
    }
  }
  if (prices.validFrom && !ISO_DATE.test(prices.validFrom)) errors.push(`${label}.validFrom must be YYYY-MM-DD`)
}

/** The depth fields are optional, most waters have none. */
function checkDepth(p, where, errors) {
  if (p.maxDepth !== undefined && p.maxDepth !== null) {
    if (typeof p.maxDepth !== 'number' || !(p.maxDepth > 0 && p.maxDepth < 100)) {
      errors.push(`${where}: maxDepth must be a number of metres between 0 and 100`)
    } else if (!p.maxDepthSource) {
      errors.push(`${where}: maxDepth needs a maxDepthSource`)
    }
  }
  for (const key of ['maxDepthSource', 'depthMapUrl']) {
    const value = p[key]
    if (value !== undefined && value !== null && !/^https:\/\//.test(value)) {
      errors.push(`${where}: ${key} must be an https URL`)
    }
  }
}

/**
 * @param {{ clubs: any[], waters: { type?: string, features: any[] }, salesPoints: { type?: string, features: any[] } }} data
 * @param {{ now?: Date }} [options] `now` is the reference date for the age of `lastChecked`, mainly for tests
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateData({ clubs, waters, salesPoints }, { now = new Date() } = {}) {
  const errors = []
  const warnings = []

  function checkUniqueIds(items, label) {
    const seen = new Set()
    for (const id of items) {
      if (!id) errors.push(`${label}: missing id`)
      else if (seen.has(id)) errors.push(`${label}: duplicate id "${id}"`)
      seen.add(id)
    }
    return seen
  }

  const clubIds = checkUniqueIds(clubs.map((c) => c.id), 'clubs')
  const waterIds = checkUniqueIds(waters.features.map((f) => f.properties?.id), 'waters')
  checkUniqueIds(salesPoints.features.map((f) => f.properties?.id), 'sales points')

  for (const club of clubs) {
    if (!club.name) errors.push(`club "${club.id}": missing name`)
  }

  for (const feature of waters.features) {
    const p = feature.properties
    const where = `water "${p.id}"`

    if (!p.name) errors.push(`${where}: missing name`)
    if (!clubIds.has(p.clubId)) errors.push(`${where}: unknown clubId "${p.clubId}"`)
    if (!GUEST_ACCESS.includes(p.guestAccess)) errors.push(`${where}: invalid guestAccess "${p.guestAccess}"`)
    if (!WATER_GEOMETRIES.includes(feature.geometry?.type)) {
      errors.push(`${where}: geometry must be one of ${WATER_GEOMETRIES.join(', ')}`)
    }
    if (p.geometryStatus && !GEOMETRY_STATUS.includes(p.geometryStatus)) {
      errors.push(`${where}: invalid geometryStatus "${p.geometryStatus}"`)
    }
    if (p.geometryStatus === 'placeholder') warnings.push(`${where}: geometry is a placeholder`)
    if (p.lastChecked && !ISO_DATE.test(p.lastChecked)) errors.push(`${where}: lastChecked must be YYYY-MM-DD`)
    else if (p.lastChecked) {
      const age = daysSince(p.lastChecked, now)
      if (age < 0) errors.push(`${where}: lastChecked ${p.lastChecked} is in the future`)
      else if (age > STALE_AFTER_DAYS) {
        warnings.push(`${where}: last checked ${p.lastChecked}, more than ${STALE_AFTER_DAYS} days ago`)
      }
    }
    if (!p.lastChecked) warnings.push(`${where}: lastChecked is not set`)

    if (p.prices) checkPrices(p.prices, `${where}: prices`, errors)
    if (p.previousPrices) {
      checkPrices(p.previousPrices, `${where}: previousPrices`, errors)
      const validFrom = p.prices?.validFrom
      if (!validFrom) {
        errors.push(`${where}: previousPrices need prices.validFrom, the date the new prices start`)
      } else if (ISO_DATE.test(validFrom) && daysSince(validFrom, now) >= 0) {
        warnings.push(`${where}: prices are valid since ${validFrom}, previousPrices can be removed`)
      }
    }

    if (p.onlinePurchase && !p.onlinePurchase.url) errors.push(`${where}: onlinePurchase needs a url`)
    for (const key of ['season', 'seasonNote', 'guestPeriod']) {
      if (!(key in p)) errors.push(`${where}: missing ${key} (use null if not applicable)`)
    }
    if ('season' in p) checkDateRange(p.season, `${where}: season`, errors)
    if ('guestPeriod' in p) checkDateRange(p.guestPeriod, `${where}: guestPeriod`, errors)
    if (!('source' in p)) errors.push(`${where}: missing source (use null if unknown)`)
    else if (!p.source) warnings.push(`${where}: source is not set`)
    checkDepth(p, where, errors)
  }

  const referencedWaterIds = new Set()

  for (const feature of salesPoints.features) {
    const p = feature.properties
    const where = `sales point "${p.id}"`

    if (!p.name) errors.push(`${where}: missing name`)
    if (!p.address) errors.push(`${where}: missing address`)
    if (feature.geometry?.type !== 'Point') errors.push(`${where}: geometry must be a Point`)
    if (p.coordinatesApproximate) warnings.push(`${where}: coordinates are approximate`)
    for (const key of ['openingHours', 'openingHoursNote']) {
      if (!(key in p)) errors.push(`${where}: missing ${key} (use null if unknown)`)
    }
    if ('openingHours' in p) checkOpeningRules(p.openingHours, where, errors)

    for (const waterId of p.waterIds ?? []) {
      if (!waterIds.has(waterId)) errors.push(`${where}: unknown waterId "${waterId}"`)
      referencedWaterIds.add(waterId)
    }
  }

  for (const feature of waters.features) {
    const p = feature.properties
    if (p.guestAccess !== 'membersOnly' && !referencedWaterIds.has(p.id) && !p.onlinePurchase) {
      warnings.push(`water "${p.id}": no sales point and no online purchase`)
    }
  }

  return { errors, warnings }
}
