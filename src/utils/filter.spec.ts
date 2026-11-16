import { describe, expect, it } from 'vitest'
import { buildMapData } from '@/composables/useMapData'
import type { Club, MapData, SalesPointFeature, WaterFeature } from '@/types'
import { canGetTicketToday, emptyFilter, isFilterActive, matchingWaterIds } from '@/utils/filter'
import { makeClub, makeMapData, makeSalesPoint, makeWater } from '../../tests/fixtures'

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
  return buildMapData(
    clubs,
    { type: 'FeatureCollection', features: waters },
    { type: 'FeatureCollection', features: [] as SalesPointFeature[] },
  )
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

  it('species filter matches through the species groups', () => {
    const data = build([
      water('a', { species: ['Bachforelle', 'Hecht'] }),
      water('b', { species: ['Aitel (Döbel)'] }),
      water('c', { species: [] }),
    ])
    expect([...matchingWaterIds(data, { ...emptyFilter(), species: 'Forelle' }, NOW)]).toEqual(['a'])
    expect([...matchingWaterIds(data, { ...emptyFilter(), species: 'Döbel' }, NOW)]).toEqual(['b'])
  })

  it('counts the species filter as active', () => {
    expect(isFilterActive({ ...emptyFilter(), species: 'Hecht' })).toBe(true)
  })
})

describe('canGetTicketToday', () => {
  // Friday 13 November 2026. Shop hours Monday to Friday 14 to 18.
  const at = (hour: number, day = 13, month = 11) => new Date(2026, month - 1, day, hour)
  const weekdays = [{ days: ['mo' as const, 'tu' as const, 'we' as const, 'th' as const, 'fr' as const], open: '14:00', close: '18:00' }]

  function setup(salesPoint = makeSalesPoint({ openingHours: weekdays }), water = makeWater()) {
    const data = makeMapData([makeClub()], [water], [salesPoint])
    return (now: Date) => canGetTicketToday(water, data, now)
  }

  it('is true while a sales point is open', () => {
    expect(setup()(at(15))).toBe(true)
  })

  it('is true when a sales point still opens today', () => {
    expect(setup()(at(9))).toBe(true)
  })

  it('is false after the last sales point has closed', () => {
    expect(setup()(at(19))).toBe(false)
  })

  it('is false on a weekend without hours', () => {
    expect(setup()(at(10, 14))).toBe(false)
  })

  it('does not count sales points with unknown hours', () => {
    expect(setup(makeSalesPoint({ openingHours: null }))(at(15))).toBe(false)
  })

  it('does not count a holiday without holiday hours', () => {
    // Friday 25 December 2026.
    expect(setup()(at(15, 25, 12))).toBe(false)
  })

  it('is always true with online purchase', () => {
    const water = makeWater({ onlinePurchase: { provider: 'hejfish', url: 'https://example.org' } })
    expect(setup(makeSalesPoint({ waterIds: [] }), water)(at(23))).toBe(true)
  })
})

describe('ticketToday chip', () => {
  it('keeps only waters where a ticket can still be bought today', () => {
    const data = makeMapData(
      [makeClub()],
      [makeWater({ id: 'shop' }), makeWater({ id: 'none' })],
      [makeSalesPoint({ waterIds: ['shop'], openingHours: [{ days: ['fr'], open: '14:00', close: '18:00' }] })],
    )
    const f = { ...emptyFilter(), chips: new Set(['ticketToday' as const]) }

    expect([...matchingWaterIds(data, f, new Date(2026, 10, 13, 10))]).toEqual(['shop'])
  })
})
