import { describe, expect, it } from 'vitest'
import { dueList } from '../scripts/lib/due.mjs'
import { makeClub, makeSalesPoint, makeWater } from './fixtures'
import type { SalesPointFeature, WaterFeature } from '../src/types'

const NOW = new Date('2026-11-17T08:00:00Z')

function due(waters: WaterFeature[], salesPoints: SalesPointFeature[] = [], oldest = 10) {
  return dueList(
    {
      clubs: [makeClub()],
      waters: { type: 'FeatureCollection', features: waters },
      salesPoints: { type: 'FeatureCollection', features: salesPoints },
    },
    { now: NOW, oldest },
  )
}

const section = (sections: { title: string; items: string[] }[], start: string) =>
  sections.find((s) => s.title.startsWith(start))?.items

describe('dueList', () => {
  it('names waters with the short club name', () => {
    const items = section(due([makeWater({ guestAccess: 'unknown' })]), 'Unclear guest access')
    expect(items).toEqual(['Testsee (FV A)'])
  })

  it('announces price lists that start soon per club, not those far away', () => {
    const sections = due([
      makeWater({ id: 'a', name: 'Bald', prices: { guest: 20, validFrom: '2027-01-01' } }),
      makeWater({ id: 'b', name: 'Auch bald', prices: { guest: 20, validFrom: '2027-01-01' } }),
      makeWater({ id: 'c', name: 'Später', prices: { guest: 20, validFrom: '2027-06-01' } }),
    ])
    expect(section(sections, 'New price lists')).toEqual(['FV A: 2 waters, prices from 2027-01-01 (in 45 days)'])
  })

  it('reminds to remove previousPrices once the new list applies', () => {
    const water = makeWater({ prices: { guest: 22, validFrom: '2026-11-01' }, previousPrices: { guest: 20 } })
    expect(section(due([water]), 'New price lists')).toEqual([
      'FV A: Testsee, prices from 2026-11-01 (since 16 days, previousPrices can go)',
    ])
  })

  it('finds open waters without guest price or without a way to buy the ticket', () => {
    const sections = due(
      [
        makeWater({ id: 'a', name: 'Ohne Preis', prices: { member: 10 } }),
        makeWater({ id: 'b', name: 'Ohne Verkauf' }),
        makeWater({ id: 'c', name: 'Online', onlinePurchase: { provider: 'hejfish', url: 'https://example.org' } }),
        makeWater({ id: 'd', name: 'Laden' }),
        makeWater({ id: 'e', name: 'Nur Mitglied', guestAccess: 'withMember' }),
      ],
      [makeSalesPoint({ waterIds: ['d'] })],
    )
    expect(section(sections, 'Open for guests but no guest price')).toEqual(['Ohne Preis (FV A)'])
    expect(section(sections, 'Open for guests but neither')).toEqual(['Ohne Preis (FV A)', 'Ohne Verkauf (FV A)'])
  })

  it('lists placeholders and sales points that need a visit or a call', () => {
    const sections = due(
      [makeWater({ geometryStatus: 'placeholder' })],
      [makeSalesPoint({ name: 'Laden', openingHours: null, coordinatesApproximate: true })],
    )
    expect(section(sections, 'Placeholder geometry')).toEqual(['Testsee (FV A)'])
    expect(section(sections, 'Sales points without opening hours')).toEqual(['Laden'])
    expect(section(sections, 'Sales points with approximate')).toEqual(['Laden'])
  })

  it('lists the longest unchecked waters first, up to the limit', () => {
    const sections = due(
      [
        makeWater({ id: 'a', name: 'Neu', lastChecked: '2026-11-16' }),
        makeWater({ id: 'b', name: 'Alt', lastChecked: '2026-05-01' }),
        makeWater({ id: 'c', name: 'Mittel', lastChecked: '2026-08-01' }),
      ],
      [],
      2,
    )
    expect(section(sections, 'Longest unchecked')).toEqual([
      'Alt (FV A): last checked 2026-05-01',
      'Mittel (FV A): last checked 2026-08-01',
    ])
  })

  it('leaves out empty sections', () => {
    const titles = due([makeWater({ onlinePurchase: { provider: 'hejfish', url: 'https://example.org' } })]).map(
      (s) => s.title,
    )
    expect(titles).toEqual(['Longest unchecked waters (top 10)'])
  })
})
