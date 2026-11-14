import { describe, expect, it } from 'vitest'
import type { LatLngBoundsLiteral } from 'leaflet'
import { dataBounds } from '@/utils/bounds'
import { makeClub, makeMapData, makeSalesPoint, makeWater } from '../../tests/fixtures'

const START: LatLngBoundsLiteral = [
  [48.0, 10.5],
  [48.5, 11.0],
]

function rounded(bounds: LatLngBoundsLiteral) {
  return bounds.map((corner) => (corner as number[]).map((value) => Math.round(value * 1000) / 1000))
}

describe('dataBounds', () => {
  it('covers waters and sales points outside the start view, plus a margin', () => {
    const water = makeWater()
    water.geometry = {
      type: 'Polygon',
      coordinates: [
        [
          [11.4, 48.1],
          [11.5, 48.1],
          [11.5, 48.2],
          [11.4, 48.1],
        ],
      ],
    }
    const salesPoint = makeSalesPoint()
    salesPoint.geometry.coordinates = [10.7, 47.8]

    // Span 0.7 lat by 1.0 lng, 10 % of the larger side is 0.1.
    expect(rounded(dataBounds(makeMapData([makeClub()], [water], [salesPoint]), START))).toEqual([
      [47.7, 10.4],
      [48.6, 11.6],
    ])
  })

  it('handles line geometries', () => {
    const water = makeWater()
    water.geometry = {
      type: 'MultiLineString',
      coordinates: [
        [
          [10.8, 48.2],
          [10.9, 48.7],
        ],
      ],
    }

    expect(rounded(dataBounds(makeMapData([makeClub()], [water], []), START, 0))).toEqual([
      [48.0, 10.5],
      [48.7, 11.0],
    ])
  })

  it('keeps the start view when all data lies inside it', () => {
    expect(rounded(dataBounds(makeMapData(), START, 0))).toEqual(rounded(START))
  })
})
