import { describe, expect, it } from 'vitest'
import type { Club, MapData, SalesPointFeature, WaterFeature } from '@/types'
import { emptyFilter, isFilterActive, matchingWaterIds } from '@/utils/filter'

function water(id: string, props: Partial<WaterFeature['properties']>): WaterFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [] },
    properties: {
      id,
      name: id,
      clubId: 'c1',
      guestAccess: 'open',
      accessNote: null,
      season: null,
      seasonNote: null,
      guestPeriod: null,
      prices: null,
      species: [],
      rules: [],
      closedSeasons: [],
      onlinePurchase: null,
      lastChecked: null,
      source: null,
      geometryStatus: 'placeholder',
      ...props,
    },
  }
}

function build(waters: WaterFeature[], clubs: Club[] = [{ id: 'c1', name: 'Club One', shortName: 'C1', website: null, contact: null }]): MapData {
  return {
    clubs,
    waters: { type: 'FeatureCollection', features: waters },
    salesPoints: { type: 'FeatureCollection', features: [] as SalesPointFeature[] },
    clubsById: new Map(clubs.map((c) => [c.id, c])),
    watersById: new Map(waters.map((w) => [w.properties.id, w])),
    salesPointsById: new Map(),
    salesPointIdsByWater: new Map(),
  }
}

const NOW = new Date(2026, 6, 1) // 1 July 2026

describe('matchingWaterIds', () => {
  it('returns all ids for an empty filter', () => {
    const data = build([water('a', {}), water('b', {})])
    expect([...matchingWaterIds(data, emptyFilter(), NOW)]).toEqual(['a', 'b'])
    expect(isFilterActive(emptyFilter())).toBe(false)
  })

  it('search matches water and club name, case-insensitively', () => {
    const data = build([water('lech', { name: 'Lech' }), water('ach', { name: 'Ach' })])
    expect([...matchingWaterIds(data, { ...emptyFilter(), search: 'LEC' }, NOW)]).toEqual(['lech'])
    expect([...matchingWaterIds(data, { ...emptyFilter(), search: 'club one' }, NOW)]).toEqual(['lech', 'ach'])
  })

  it('guests chip keeps only open waters', () => {
    const data = build([water('a', { guestAccess: 'open' }), water('b', { guestAccess: 'membersOnly' })])
    const f = { ...emptyFilter(), chips: new Set(['guests' as const]) }
    expect([...matchingWaterIds(data, f, NOW)]).toEqual(['a'])
  })

  it('online chip keeps only waters with an online purchase', () => {
    const data = build([water('a', { onlinePurchase: { url: 'x' } }), water('b', {})])
    const f = { ...emptyFilter(), chips: new Set(['online' as const]) }
    expect([...matchingWaterIds(data, f, NOW)]).toEqual(['a'])
  })

  it('flyFishing chip matches the Fliegen rule', () => {
    const data = build([water('a', { rules: ['Nur Fliegenfischen'] }), water('b', { rules: ['Spinnfischen'] })])
    const f = { ...emptyFilter(), chips: new Set(['flyFishing' as const]) }
    expect([...matchingWaterIds(data, f, NOW)]).toEqual(['a'])
  })

  it('seasonOpen chip respects the season range', () => {
    const data = build([
      water('open', { season: { from: '05-01', to: '09-30' } }),
      water('closed', { season: { from: '11-01', to: '12-31' } }),
    ])
    const f = { ...emptyFilter(), chips: new Set(['seasonOpen' as const]) }
    expect([...matchingWaterIds(data, f, NOW)]).toEqual(['open'])
  })

  it('club filter and chips combine', () => {
    const clubs: Club[] = [
      { id: 'c1', name: 'One', website: null, contact: null },
      { id: 'c2', name: 'Two', website: null, contact: null },
    ]
    const data = build(
      [water('a', { clubId: 'c1', guestAccess: 'open' }), water('b', { clubId: 'c2', guestAccess: 'open' }), water('c', { clubId: 'c1', guestAccess: 'membersOnly' })],
      clubs,
    )
    const f = { ...emptyFilter(), clubId: 'c1', chips: new Set(['guests' as const]) }
    expect([...matchingWaterIds(data, f, NOW)]).toEqual(['a'])
  })
})
