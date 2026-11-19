// Finds parking places from OpenStreetMap near a water, as candidates for `accessPoints`.
// Pure functions without network access, the CLI in scripts/access-candidates.mjs does the requests.

import { bbox, nearestVertexKm } from './geo.mjs'

/** Parking further away than this is rarely meant for the water. */
export const DEFAULT_RADIUS_KM = 0.4

/** Parking that is usually not open to anglers. Still listed, but marked. */
const RESTRICTED_ACCESS = ['private', 'no', 'customers', 'permit', 'delivery']

/** Overpass QL for all parking (nodes, ways and relations with their centre) around a water. */
export function overpassQuery(geometry, radiusKm = DEFAULT_RADIUS_KM) {
  const box = bbox(geometry, radiusKm)
    .map((n) => n.toFixed(5))
    .join(',')
  return `[out:json][timeout:25];nwr["amenity"="parking"](${box});out center tags;`
}

/** `[lon, lat]` of an Overpass element, `center` for ways and relations. */
function elementCoordinates(element) {
  if (typeof element.lat === 'number') return [element.lon, element.lat]
  if (element.center) return [element.center.lon, element.center.lat]
  return null
}

/**
 * Turns the Overpass elements into candidates within `radiusKm` of the water, nearest first.
 * @returns {{ osm: string, coordinates: [number, number], km: number, name: string | null,
 *   restricted: boolean, details: string[] }[]}
 */
export function parkingCandidates(elements, geometry, radiusKm = DEFAULT_RADIUS_KM) {
  const result = []
  for (const element of elements) {
    const coordinates = elementCoordinates(element)
    if (!coordinates) continue
    const km = nearestVertexKm(coordinates, geometry)
    if (km > radiusKm) continue
    const tags = element.tags ?? {}
    const details = []
    if (tags.access) details.push(`access=${tags.access}`)
    if (tags.fee) details.push(`fee=${tags.fee}`)
    if (tags.parking) details.push(`parking=${tags.parking}`)
    if (tags.capacity) details.push(`capacity=${tags.capacity}`)
    if (tags.operator) details.push(`operator=${tags.operator}`)
    result.push({
      osm: `${element.type}/${element.id}`,
      coordinates: [round(coordinates[0]), round(coordinates[1])],
      km,
      name: tags.name ?? null,
      restricted: RESTRICTED_ACCESS.includes(tags.access),
      details,
    })
  }
  return result.sort((a, b) => a.km - b.km)
}

/** Six decimals are about 10 cm, more only bloats the data file. */
function round(n) {
  return Math.round(n * 1e6) / 1e6
}

/** A ready-to-paste entry for `accessPoints`. The note is left for a human who knows the place. */
export function toAccessPoint(candidate) {
  return { type: 'parking', coordinates: candidate.coordinates, name: candidate.name, note: null }
}
