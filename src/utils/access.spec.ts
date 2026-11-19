import { describe, expect, it } from 'vitest'
import { makeWater } from '../../tests/fixtures'
import { accessPointsOf, directionsUrl, routePoint, toLatLng } from '@/utils/access'

describe('directionsUrl', () => {
  it('builds a Google Maps directions link with lat before lng', () => {
    expect(directionsUrl({ lat: 48.3, lng: 10.9 })).toBe('https://www.google.com/maps/dir/?api=1&destination=48.3,10.9')
  })
})

describe('toLatLng', () => {
  it('reads GeoJSON order [lon, lat]', () => {
    expect(toLatLng([10.9, 48.3])).toEqual({ lat: 48.3, lng: 10.9 })
  })
})

describe('accessPointsOf', () => {
  it('returns an empty list for waters without access points', () => {
    expect(accessPointsOf(makeWater())).toEqual([])
    expect(accessPointsOf(makeWater({ accessPoints: null }))).toEqual([])
  })

  it('puts parking first and keeps the data order otherwise', () => {
    const water = makeWater({
      accessPoints: [
        { type: 'access', coordinates: [10.9, 48.3], name: 'Steg' },
        { type: 'parking', coordinates: [10.91, 48.3], name: 'P1' },
        { type: 'access', coordinates: [10.9, 48.31], name: 'Einstieg' },
        { type: 'parking', coordinates: [10.91, 48.31], name: 'P2' },
      ],
    })
    expect(accessPointsOf(water).map((p) => p.name)).toEqual(['P1', 'P2', 'Steg', 'Einstieg'])
  })
})

describe('routePoint', () => {
  it('takes the middle of a lake outline', () => {
    const point = routePoint({
      type: 'Polygon',
      coordinates: [
        [
          [10, 48],
          [10.02, 48],
          [10.02, 48.02],
          [10, 48.02],
          [10, 48],
        ],
      ],
    })
    expect(point.lat).toBeCloseTo(48.01)
    expect(point.lng).toBeCloseTo(10.01)
  })

  it('takes the point halfway along a river, not the middle vertex', () => {
    const point = routePoint({
      type: 'LineString',
      coordinates: [
        [10, 48],
        [10, 48.001],
        [10, 48.002],
        [10, 48.1],
      ],
    })
    expect(point.lng).toBe(10)
    expect(point.lat).toBeCloseTo(48.05)
  })

  it('uses the longest part of a multi line', () => {
    const point = routePoint({
      type: 'MultiLineString',
      coordinates: [
        [
          [11, 47],
          [11, 47.001],
        ],
        [
          [10, 48],
          [10, 48.1],
        ],
      ],
    })
    expect(point.lng).toBe(10)
    expect(point.lat).toBeCloseTo(48.05)
  })

  it('uses the outline with most vertices of a multi polygon', () => {
    const point = routePoint({
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [11, 47],
            [11.01, 47],
            [11, 47.01],
            [11, 47],
          ],
        ],
        [
          [
            [10, 48],
            [10.02, 48],
            [10.02, 48.02],
            [10, 48.02],
            [10, 48],
          ],
        ],
      ],
    })
    expect(point.lat).toBeCloseTo(48.01)
  })
})
