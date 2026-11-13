// Checks the data files against the schema described in docs/data-schema.md.
// Pure function without file access, so it can be used by the CLI script and by the tests.

export const GUEST_ACCESS = ['open', 'withMember', 'membersOnly', 'unknown']
export const GEOMETRY_STATUS = ['placeholder', 'traced', 'verified']
export const WATER_GEOMETRIES = ['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString']
export const PRICE_KEYS = ['member', 'guest', 'youth', 'guestYouth', 'deposit', 'note', 'validFrom']
const TEXT_PRICE_KEYS = ['note', 'validFrom']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * @param {{ clubs: any[], waters: { type?: string, features: any[] }, salesPoints: { type?: string, features: any[] } }} data
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateData({ clubs, waters, salesPoints }) {
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
    if (!p.lastChecked) warnings.push(`${where}: lastChecked is not set`)

    if (p.prices) {
      for (const [key, value] of Object.entries(p.prices)) {
        if (!PRICE_KEYS.includes(key)) errors.push(`${where}: unknown price key "${key}"`)
        else if (!TEXT_PRICE_KEYS.includes(key) && typeof value !== 'number') {
          errors.push(`${where}: price "${key}" must be a number`)
        }
      }
      if (p.prices.validFrom && !ISO_DATE.test(p.prices.validFrom)) {
        errors.push(`${where}: prices.validFrom must be YYYY-MM-DD`)
      }
    }

    if (p.onlinePurchase && !p.onlinePurchase.url) errors.push(`${where}: onlinePurchase needs a url`)
    if (!('season' in p)) errors.push(`${where}: missing season (use null if all year or unknown)`)
    if (!('source' in p)) errors.push(`${where}: missing source (use null if unknown)`)
    else if (!p.source) warnings.push(`${where}: source is not set`)
  }

  const referencedWaterIds = new Set()

  for (const feature of salesPoints.features) {
    const p = feature.properties
    const where = `sales point "${p.id}"`

    if (!p.name) errors.push(`${where}: missing name`)
    if (!p.address) errors.push(`${where}: missing address`)
    if (feature.geometry?.type !== 'Point') errors.push(`${where}: geometry must be a Point`)
    if (p.coordinatesApproximate) warnings.push(`${where}: coordinates are approximate`)

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
