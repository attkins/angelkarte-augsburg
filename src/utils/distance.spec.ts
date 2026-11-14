import { describe, expect, it } from 'vitest'
import { distanceKm, distanceToWaterKm, formatDistance } from '@/utils/distance'

const AUGSBURG = { lat: 48.3705, lng: 10.8978 }
const FRIEDBERG = { lat: 48.3565, lng: 10.9843 }

describe('distanceKm', () => {
  it('measures Augsburg to Friedberg', () => {
    expect(distanceKm(AUGSBURG, FRIEDBERG)).toBeCloseTo(6.6, 1)
  })

  it('is 0 for the same point', () => {
    expect(distanceKm(AUGSBURG, AUGSBURG)).toBe(0)
  })
})

describe('distanceToWaterKm', () => {
  // A square lake of roughly 1.1 km by 0.74 km east of the origin.
  const lake = {
    type: 'Polygon' as const,
    coordinates: [
      [
        [10.91, 48.36],
        [10.92, 48.36],
        [10.92, 48.37],
        [10.91, 48.37],
        [10.91, 48.36],
      ],
    ],
  }

  it('is 0 inside a lake', () => {
    expect(distanceToWaterKm({ lat: 48.365, lng: 10.915 }, lake)).toBe(0)
  })

  it('measures to the nearest shore, not the centre', () => {
    // 0.01 degrees west of the western shore is about 0.74 km.
    expect(distanceToWaterKm({ lat: 48.365, lng: 10.9 }, lake)).toBeCloseTo(0.74, 1)
  })

  it('treats a hole like land', () => {
    const withIsland = {
      ...lake,
      coordinates: [
        lake.coordinates[0]!,
        [
          [10.914, 48.364],
          [10.916, 48.364],
          [10.916, 48.366],
          [10.914, 48.366],
          [10.914, 48.364],
        ],
      ],
    }
    expect(distanceToWaterKm({ lat: 48.365, lng: 10.915 }, withIsland)).toBeGreaterThan(0)
  })

  it('measures to the nearest point along a river, between its vertices', () => {
    const river = {
      type: 'MultiLineString' as const,
      coordinates: [
        [
          [10.9, 48.3],
          [10.9, 48.4],
        ],
      ],
    }
    // The vertices are 7 km away, the river passes 0.74 km east of the origin.
    expect(distanceToWaterKm({ lat: 48.35, lng: 10.89 }, river)).toBeCloseTo(0.74, 1)
  })

  it('takes the nearest part of a multi polygon', () => {
    const multi = { type: 'MultiPolygon' as const, coordinates: [lake.coordinates, lake.coordinates.map((r) => r.map(([x, y]) => [x! + 1, y!]))] }
    expect(distanceToWaterKm({ lat: 48.365, lng: 10.915 }, multi)).toBe(0)
  })
})

describe('formatDistance', () => {
  it.each([
    [0, 'unter 100 m'],
    [0.15, '200 m'],
    [0.42, '400 m'],
    [3.24, '3,2 km'],
    [27.6, '28 km'],
  ])('%f km -> %s', (km, text) => {
    expect(formatDistance(km)).toBe(text)
  })
})
