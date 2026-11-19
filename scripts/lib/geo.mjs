// Small geometry helpers for the Node scripts. The app has its own in src/utils/distance.ts.

const KM_PER_DEG_LAT = 111.2

/** All positions of a GeoJSON geometry, flattened. */
export function positions(geometry) {
  const flatten = (value) => (typeof value[0] === 'number' ? [value] : value.flatMap(flatten))
  return Array.isArray(geometry?.coordinates) ? flatten(geometry.coordinates) : []
}

/** Rough distance in km from `[lon, lat]` to the nearest vertex. OSM outlines are dense enough for that. */
export function nearestVertexKm([lon, lat], geometry) {
  const kmPerDegLon = KM_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180)
  let min = Infinity
  for (const [x, y] of positions(geometry)) {
    min = Math.min(min, Math.hypot((x - lon) * kmPerDegLon, (y - lat) * KM_PER_DEG_LAT))
  }
  return min
}

/** `[south, west, north, east]` of a geometry, widened by `marginKm` on every side. */
export function bbox(geometry, marginKm = 0) {
  const all = positions(geometry)
  const lats = all.map((p) => p[1])
  const lons = all.map((p) => p[0])
  const south = Math.min(...lats)
  const north = Math.max(...lats)
  const dLat = marginKm / KM_PER_DEG_LAT
  const dLon = marginKm / (KM_PER_DEG_LAT * Math.cos((((south + north) / 2) * Math.PI) / 180))
  return [south - dLat, Math.min(...lons) - dLon, north + dLat, Math.max(...lons) + dLon]
}
