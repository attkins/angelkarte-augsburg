import type { Position } from 'geojson'
import type { AccessPoint, AccessPointType, WaterFeature, WaterGeometry } from '@/types'
import type { LatLng } from '@/utils/distance'

export const ACCESS_POINT_LABELS: Record<AccessPointType, string> = {
  parking: 'Parkplatz',
  access: 'Zugang',
}

/** Directions to a point in Google Maps, opened in the app on phones. */
export function directionsUrl({ lat, lng }: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

/** `[lon, lat]` as stored in the data to `{ lat, lng }`. */
export function toLatLng([lng, lat]: Position): LatLng {
  return { lat: lat!, lng: lng! }
}

/** The access points of a water, parking first, otherwise in data order. */
export function accessPointsOf(water: WaterFeature): AccessPoint[] {
  const points = water.properties.accessPoints ?? []
  return [...points.filter((p) => p.type === 'parking'), ...points.filter((p) => p.type !== 'parking')]
}

function segmentLength(a: Position, b: Position): number {
  // Only used to compare lengths along one line, a flat approximation is enough.
  const dx = (b[0]! - a[0]!) * Math.cos((a[1]! * Math.PI) / 180)
  return Math.hypot(dx, b[1]! - a[1]!)
}

function lineLength(line: Position[]): number {
  let length = 0
  for (let i = 1; i < line.length; i++) length += segmentLength(line[i - 1]!, line[i]!)
  return length
}

/** The point halfway along a line. */
function midpoint(line: Position[]): Position {
  let rest = lineLength(line) / 2
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1]!
    const b = line[i]!
    const length = segmentLength(a, b)
    if (length >= rest && length > 0) {
      const t = rest / length
      return [a[0]! + t * (b[0]! - a[0]!), a[1]! + t * (b[1]! - a[1]!)]
    }
    rest -= length
  }
  return line[line.length - 1] ?? [0, 0]
}

/** Average of the outline vertices without the closing one. Lies inside for the roundish lakes of this map. */
function ringCentre(ring: Position[]): Position {
  const open = ring.length > 1 ? ring.slice(0, -1) : ring
  const sum = open.reduce((acc, [x, y]) => [acc[0]! + x!, acc[1]! + y!], [0, 0])
  return [sum[0]! / open.length, sum[1]! / open.length]
}

/**
 * Destination for "Route zum Gewässer" when no parking is known: the middle of a lake, or the
 * point halfway along a river stretch (along its longest part). Navigation apps snap it to the
 * nearest road, so it only needs to be on or near the water.
 */
export function routePoint(geometry: WaterGeometry): LatLng {
  switch (geometry.type) {
    case 'LineString':
      return toLatLng(midpoint(geometry.coordinates))
    case 'MultiLineString': {
      const longest = geometry.coordinates.reduce((a, b) => (lineLength(b) > lineLength(a) ? b : a))
      return toLatLng(midpoint(longest))
    }
    case 'Polygon':
      return toLatLng(ringCentre(geometry.coordinates[0] ?? []))
    case 'MultiPolygon': {
      const largest = geometry.coordinates.reduce((a, b) => ((b[0]?.length ?? 0) > (a[0]?.length ?? 0) ? b : a))
      return toLatLng(ringCentre(largest[0] ?? []))
    }
  }
}
