// Lists what in the data should be checked next. Pure function, used by scripts/due.mjs and the tests.
// The validator says what is broken, this says what is worth a look or a phone call.

const DAY_MS = 24 * 60 * 60 * 1000
/** Price lists starting within this many days are announced. */
export const UPCOMING_PRICES_DAYS = 60

function utcDay(now) {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

/** Whole days from `now` to an ISO date, negative when the date has passed. */
function daysUntil(isoDate, now) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return Math.round((Date.UTC(year, month - 1, day) - utcDay(now)) / DAY_MS)
}

/**
 * Groups the open points of the data into sections, most urgent first. Empty sections are left out.
 *
 * @param {{ clubs: any[], waters: any, salesPoints: any }} data
 * @param {{ now?: Date, oldest?: number }} [options] `oldest` is how many of the longest unchecked waters to list
 * @returns {{ title: string, items: string[] }[]}
 */
export function dueList({ clubs, waters, salesPoints }, { now = new Date(), oldest = 10 } = {}) {
  const clubName = new Map(clubs.map((c) => [c.id, c.shortName ?? c.name]))
  const label = (p) => `${p.name} (${clubName.get(p.clubId) ?? p.clubId})`
  const sold = new Set(salesPoints.features.flatMap((f) => f.properties.waterIds ?? []))
  const all = waters.features.map((f) => f.properties)
  const sections = []
  const add = (title, items) => {
    if (items.length) sections.push({ title, items })
  }

  // One line per club and start date, clubs usually change all their prices at once.
  const priceGroups = new Map()
  for (const p of all) {
    const validFrom = p.prices?.validFrom
    if (!validFrom || daysUntil(validFrom, now) > UPCOMING_PRICES_DAYS) continue
    const key = `${p.clubId}|${validFrom}`
    const group = priceGroups.get(key) ?? { clubId: p.clubId, validFrom, names: [], previous: false }
    group.names.push(p.name)
    group.previous ||= Boolean(p.previousPrices)
    priceGroups.set(key, group)
  }
  add(
    'New price lists starting soon or already started',
    [...priceGroups.values()].map(({ clubId, validFrom, names, previous }) => {
      const days = daysUntil(validFrom, now)
      const when = days >= 0 ? `in ${days} days` : `since ${-days} days`
      const hint = days < 0 && previous ? ', previousPrices can go' : ''
      const what = names.length === 1 ? names[0] : `${names.length} waters`
      return `${clubName.get(clubId) ?? clubId}: ${what}, prices from ${validFrom} (${when}${hint})`
    }),
  )

  add(
    'Open for guests but no guest price',
    all.filter((p) => p.guestAccess === 'open' && typeof p.prices?.guest !== 'number').map(label),
  )

  add(
    'Open for guests but neither sales point nor online purchase',
    all.filter((p) => p.guestAccess === 'open' && !p.onlinePurchase && !sold.has(p.id)).map(label),
  )

  add('Unclear guest access', all.filter((p) => p.guestAccess === 'unknown').map(label))

  add('Placeholder geometry, real limits unknown', all.filter((p) => p.geometryStatus === 'placeholder').map(label))

  add(
    'Sales points without opening hours',
    salesPoints.features.filter((f) => !f.properties.openingHours).map((f) => f.properties.name),
  )

  add(
    'Sales points with approximate coordinates',
    salesPoints.features.filter((f) => f.properties.coordinatesApproximate).map((f) => f.properties.name),
  )

  add(
    `Longest unchecked waters (top ${oldest})`,
    all
      .filter((p) => p.lastChecked)
      .sort((a, b) => a.lastChecked.localeCompare(b.lastChecked) || a.name.localeCompare(b.name, 'de'))
      .slice(0, oldest)
      .map((p) => `${label(p)}: last checked ${p.lastChecked}`),
  )

  return sections
}
