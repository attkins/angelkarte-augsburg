import type { Position } from 'geojson'
import type { WaterGeometry } from '@/types'

export interface LatLng {
  lat: number
  lng: number
}

const EARTH_RADIUS_KM = 6371

/** Great circle distance in kilometres. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

type Point = [x: number, y: number]

/**
 * Projects around the origin onto a flat plane in kilometres. Good enough for the
 * few dozen kilometres this map covers.
 */
function projector(origin: LatLng) {
  const kmPerDegLat = (Math.PI / 180) * EARTH_RADIUS_KM
  const kmPerDegLng = kmPerDegLat * Math.cos((origin.lat * Math.PI) / 180)
  return ([lng, lat]: Position): Point => [(lng! - origin.lng) * kmPerDegLng, (lat! - origin.lat) * kmPerDegLat]
}

/** Distance from the origin (0, 0) to the segment a-b in the projected plane. */
function segmentDistance(a: Point, b: Point): number {
  const [ax, ay] = a
  const dx = b[0] - ax
  const dy = b[1] - ay
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared))
  return Math.hypot(ax + t * dx, ay + t * dy)
}

/** Whether the origin (0, 0) lies inside the ring, ray casting. */
function containsOrigin(ring: Point[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!
    const [xj, yj] = ring[j]!
    if (yi > 0 !== yj > 0 && 0 < ((xj - xi) * -yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function lineDistance(line: Point[]): number {
  if (line.length === 1) return Math.hypot(...line[0]!)
  let min = Infinity
  for (let i = 1; i < line.length; i++) min = Math.min(min, segmentDistance(line[i - 1]!, line[i]!))
  return min
}

/** Polygon with holes: 0 inside, otherwise the distance to the nearest edge. */
function polygonDistance(rings: Point[][]): number {
  const [outer, ...holes] = rings
  if (!outer) return Infinity
  if (containsOrigin(outer) && !holes.some(containsOrigin)) return 0
  return Math.min(...rings.map(lineDistance))
}

/**
 * Distance in kilometres from the origin to the nearest point of a water: the shore
 * of a lake (0 when standing in it) or the nearest point along a river.
 */
export function distanceToWaterKm(origin: LatLng, geometry: WaterGeometry): number {
  const project = projector(origin)
  switch (geometry.type) {
    case 'LineString':
      return lineDistance(geometry.coordinates.map(project))
    case 'MultiLineString':
      return Math.min(...geometry.coordinates.map((line) => lineDistance(line.map(project))))
    case 'Polygon':
      return polygonDistance(geometry.coordinates.map((ring) => ring.map(project)))
    case 'MultiPolygon':
      return Math.min(...geometry.coordinates.map((poly) => polygonDistance(poly.map((ring) => ring.map(project)))))
  }
}

/** `0.4` -> `400 m`, `3.24` -> `3,2 km`, `27.6` -> `28 km`. */
export function formatDistance(km: number): string {
  if (km < 0.1) return 'unter 100 m'
  if (km < 1) return `${Math.round((km * 1000) / 100) * 100} m`
  if (km < 10) return `${km.toLocaleString('de-DE', { maximumFractionDigits: 1 })} km`
  return `${Math.round(km)} km`
}
