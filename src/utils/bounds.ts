import type { Position } from 'geojson'
import type { LatLngBoundsLiteral } from 'leaflet'
import type { MapData } from '@/types'

/** Nested coordinate arrays of any GeoJSON geometry. */
type Coordinates = Position | Coordinates[]

function isPosition(value: Coordinates): value is Position {
  return typeof value[0] === 'number'
}

/**
 * Bounding box of all waters and sales points plus a margin on every side, as
 * `[[south, west], [north, east]]`. The `include` box (the start view) is always
 * inside, so the map never starts outside its own limits. The margin is a share of
 * the larger side, so the box keeps some room even for a single point.
 */
export function dataBounds(data: MapData, include: LatLngBoundsLiteral, margin = 0.1): LatLngBoundsLiteral {
  let [[south, west], [north, east]] = include as [[number, number], [number, number]]

  function extend(coordinates: Coordinates) {
    if (isPosition(coordinates)) {
      const [lng, lat] = coordinates as [number, number]
      south = Math.min(south, lat)
      north = Math.max(north, lat)
      west = Math.min(west, lng)
      east = Math.max(east, lng)
    } else {
      for (const child of coordinates) extend(child)
    }
  }

  for (const feature of data.waters.features) extend(feature.geometry.coordinates)
  for (const feature of data.salesPoints.features) extend(feature.geometry.coordinates)

  const pad = Math.max(north - south, east - west) * margin
  return [
    [south - pad, west - pad],
    [north + pad, east + pad],
  ]
}

/** Id of the first region whose bounds contain the point, or null outside all of them. */
export function regionAt<T extends { id: string; bounds: LatLngBoundsLiteral }>(
  regions: readonly T[],
  lat: number,
  lng: number,
): T['id'] | null {
  for (const region of regions) {
    const [[south, west], [north, east]] = region.bounds as [[number, number], [number, number]]
    if (lat >= south && lat <= north && lng >= west && lng <= east) return region.id
  }
  return null
}
