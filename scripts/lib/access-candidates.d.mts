export const DEFAULT_RADIUS_KM: number
export function overpassQuery(geometry: unknown, radiusKm?: number): string
export interface ParkingCandidate {
  osm: string
  coordinates: [number, number]
  km: number
  name: string | null
  restricted: boolean
  details: string[]
}
export function parkingCandidates(elements: unknown[], geometry: unknown, radiusKm?: number): ParkingCandidate[]
export function toAccessPoint(candidate: ParkingCandidate): {
  type: 'parking'
  coordinates: [number, number]
  name: string | null
  note: null
}
