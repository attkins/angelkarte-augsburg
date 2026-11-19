import { describe, expect, it } from 'vitest'
import { overpassQuery, parkingCandidates, toAccessPoint } from '../scripts/lib/access-candidates.mjs'

const LAKE = {
  type: 'Polygon',
  coordinates: [
    [
      [10.9, 48.3],
      [10.91, 48.3],
      [10.91, 48.31],
      [10.9, 48.31],
      [10.9, 48.3],
    ],
  ],
}

describe('overpassQuery', () => {
  it('asks for parking in the box around the water, widened by the radius', () => {
    const query = overpassQuery(LAKE, 0.4)
    expect(query).toContain('nwr["amenity"="parking"]')
    expect(query).toContain('out center tags;')
    const box = /\(([^)]+)\);out/.exec(query)![1]!.split(',').map(Number)
    expect(box[0]).toBeCloseTo(48.3 - 0.4 / 111.2, 4)
    expect(box[2]).toBeCloseTo(48.31 + 0.4 / 111.2, 4)
    expect(box[1]).toBeLessThan(10.9)
    expect(box[3]).toBeGreaterThan(10.91)
  })
})

describe('parkingCandidates', () => {
  const elements = [
    { type: 'way', id: 2, center: { lat: 48.3001, lon: 10.9101 }, tags: { amenity: 'parking', fee: 'no' } },
    { type: 'node', id: 1, lat: 48.31, lon: 10.9, tags: { amenity: 'parking', name: 'P Nord' } },
    { type: 'way', id: 3, center: { lat: 48.3, lon: 10.92 }, tags: { amenity: 'parking', access: 'customers' } },
    { type: 'way', id: 4, center: { lat: 48.35, lon: 10.9 }, tags: { amenity: 'parking' } },
    { type: 'relation', id: 5, tags: { amenity: 'parking' } },
  ]

  it('keeps parking within the radius, nearest first, and skips elements without position', () => {
    const result = parkingCandidates(elements, LAKE, 0.8)
    expect(result.map((c) => c.osm)).toEqual(['node/1', 'way/2', 'way/3'])
    expect(result[0]).toMatchObject({ name: 'P Nord', coordinates: [10.9, 48.31], restricted: false, details: [] })
    expect(result[1]!.details).toEqual(['fee=no'])
  })

  it('marks parking that is probably not public', () => {
    const result = parkingCandidates(elements, LAKE, 0.8)
    expect(result.find((c) => c.osm === 'way/3')).toMatchObject({ restricted: true, details: ['access=customers'] })
  })

  it('turns a candidate into an access point without a note', () => {
    const [first] = parkingCandidates(elements, LAKE, 0.8)
    expect(toAccessPoint(first!)).toEqual({ type: 'parking', coordinates: [10.9, 48.31], name: 'P Nord', note: null })
  })
})
