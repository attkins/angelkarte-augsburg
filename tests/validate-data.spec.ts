import { describe, expect, it } from 'vitest'
import { validateData } from '../scripts/lib/validate-data.mjs'
import { makeClub, makeSalesPoint, makeWater } from './fixtures'
import type { Club, SalesPointFeature, WaterFeature } from '../src/types'

function validate({
  clubs = [makeClub()],
  waters = [makeWater()],
  salesPoints = [makeSalesPoint()],
  now = new Date('2026-11-14T12:00:00Z'),
}: { clubs?: Club[]; waters?: WaterFeature[]; salesPoints?: SalesPointFeature[]; now?: Date } = {}) {
  return validateData(
    {
      clubs,
      waters: { type: 'FeatureCollection', features: waters },
      salesPoints: { type: 'FeatureCollection', features: salesPoints },
    },
    { now },
  )
}

/** Removes a property completely, which is different from setting it to null. */
function withoutProperty(water: WaterFeature, key: keyof WaterFeature['properties']): WaterFeature {
  const properties: Partial<WaterFeature['properties']> = { ...water.properties }
  delete properties[key]
  return { ...water, properties: properties as WaterFeature['properties'] }
}

describe('validateData', () => {
  it('accepts a complete, consistent data set without errors or warnings', () => {
    expect(validate()).toEqual({ errors: [], warnings: [] })
  })

  describe('ids', () => {
    it('reports duplicate ids per collection', () => {
      const { errors } = validate({
        clubs: [makeClub(), makeClub()],
        waters: [makeWater(), makeWater()],
        salesPoints: [makeSalesPoint(), makeSalesPoint()],
      })

      expect(errors).toContain('clubs: duplicate id "club-a"')
      expect(errors).toContain('waters: duplicate id "water-a"')
      expect(errors).toContain('sales points: duplicate id "shop-a"')
    })

    it('reports missing ids', () => {
      const { errors } = validate({ clubs: [makeClub({ id: '' })], waters: [], salesPoints: [] })

      expect(errors).toContain('clubs: missing id')
    })
  })

  describe('waters', () => {
    it('accepts waters with and without depth', () => {
      const waters = [
        makeWater(),
        makeWater({ id: 'w2', maxDepth: 14.5, maxDepthSource: 'https://example.org', depthMapUrl: null }),
      ]

      expect(validate({ waters }).errors).toEqual([])
    })

    it.each([
      ['a depth that is not a number', { maxDepth: '5 m', maxDepthSource: 'https://example.org' }, 'maxDepth must be a number of metres between 0 and 100'],
      ['a depth without source', { maxDepth: 5 }, 'maxDepth needs a maxDepthSource'],
      ['a source that is no URL', { maxDepth: 5, maxDepthSource: 'Vereinsheft' }, 'maxDepthSource must be an https URL'],
      ['a depth map that is no https URL', { depthMapUrl: 'http://example.org' }, 'depthMapUrl must be an https URL'],
    ])('reports %s', (_label, props, message) => {
      const { errors } = validate({ waters: [makeWater(props as never)] })

      expect(errors).toEqual([`water "water-a": ${message}`])
    })

    it('reports an unknown club', () => {
      const { errors } = validate({ waters: [makeWater({ clubId: 'nope' })] })

      expect(errors).toContain('water "water-a": unknown clubId "nope"')
    })

    it('reports an invalid guest access value', () => {
      const water = makeWater({ guestAccess: 'sometimes' as never })

      expect(validate({ waters: [water] }).errors).toContain('water "water-a": invalid guestAccess "sometimes"')
    })

    it('reports a geometry type that cannot be drawn as a water', () => {
      const water = makeWater()
      const point = { ...water, geometry: { type: 'Point', coordinates: [10.9, 48.3] } } as unknown as WaterFeature

      expect(validate({ waters: [point] }).errors).toContain(
        'water "water-a": geometry must be one of Polygon, MultiPolygon, LineString, MultiLineString',
      )
    })

    it('reports an invalid geometry status and warns about placeholders', () => {
      expect(validate({ waters: [makeWater({ geometryStatus: 'guessed' as never })] }).errors).toContain(
        'water "water-a": invalid geometryStatus "guessed"',
      )
      expect(validate({ waters: [makeWater({ geometryStatus: 'placeholder' })] }).warnings).toContain(
        'water "water-a": geometry is a placeholder',
      )
    })

    it('checks the date format of lastChecked and warns when it is missing', () => {
      expect(validate({ waters: [makeWater({ lastChecked: '13.11.2026' })] }).errors).toContain(
        'water "water-a": lastChecked must be YYYY-MM-DD',
      )
      expect(validate({ waters: [makeWater({ lastChecked: null })] }).warnings).toContain(
        'water "water-a": lastChecked is not set',
      )
    })

    it('warns when lastChecked is older than the stale limit', () => {
      const water = makeWater({ lastChecked: '2026-01-01' })
      // 183 days after 2026-01-01 is 2026-07-03, the warning starts one day later.
      expect(validate({ waters: [water], now: new Date('2026-07-03T23:00:00Z') }).warnings).toEqual([])
      expect(validate({ waters: [water], now: new Date('2026-07-04T00:30:00Z') }).warnings).toEqual([
        'water "water-a": last checked 2026-01-01, more than 183 days ago',
      ])
    })

    it('reports a lastChecked date in the future', () => {
      expect(validate({ waters: [makeWater({ lastChecked: '2026-11-15' })] }).errors).toContain(
        'water "water-a": lastChecked 2026-11-15 is in the future',
      )
      expect(validate({ waters: [makeWater({ lastChecked: '2026-11-14' })] }).errors).toEqual([])
    })

    it('requires season fields and source to be present, null is allowed', () => {
      let water = makeWater()
      for (const key of ['season', 'seasonNote', 'guestPeriod', 'source'] as const) water = withoutProperty(water, key)
      const { errors } = validate({ waters: [water] })

      expect(errors).toContain('water "water-a": missing season (use null if not applicable)')
      expect(errors).toContain('water "water-a": missing seasonNote (use null if not applicable)')
      expect(errors).toContain('water "water-a": missing guestPeriod (use null if not applicable)')
      expect(errors).toContain('water "water-a": missing source (use null if unknown)')
      expect(validate({ waters: [makeWater({ season: null, guestPeriod: null })] }).errors).toEqual([])
    })

    it('accepts valid date ranges, also over New Year', () => {
      const water = makeWater({ season: { from: '03-16', to: '12-14' }, guestPeriod: { from: '11-01', to: '02-29' } })

      expect(validate({ waters: [water] }).errors).toEqual([])
    })

    it.each([
      ['wrong format', { from: '16.03.', to: '12-14' }],
      ['month out of range', { from: '13-01', to: '12-14' }],
      ['day out of range', { from: '02-30', to: '12-14' }],
      ['missing end', { from: '03-16' }],
      ['text instead of range', '16.03. bis 14.12.'],
    ])('reports an invalid season (%s)', (_label, season) => {
      const water = makeWater({ season: season as never })

      expect(validate({ waters: [water] }).errors).toEqual([
        'water "water-a": season must be null or { from: "MM-DD", to: "MM-DD" }',
      ])
    })

    it('reports an invalid guest period', () => {
      const water = makeWater({ guestPeriod: { from: '07-15', to: '' } })

      expect(validate({ waters: [water] }).errors).toEqual([
        'water "water-a": guestPeriod must be null or { from: "MM-DD", to: "MM-DD" }',
      ])
    })

    it('warns when the source is null', () => {
      expect(validate({ waters: [makeWater({ source: null })] }).warnings).toContain(
        'water "water-a": source is not set',
      )
    })

    it('reports an online purchase without url', () => {
      const water = makeWater({ onlinePurchase: { provider: 'hejfish', url: '' } })

      expect(validate({ waters: [water] }).errors).toContain('water "water-a": onlinePurchase needs a url')
    })
  })

  describe('prices', () => {
    it('accepts all known keys including note and validFrom', () => {
      const water = makeWater({
        prices: { member: 15, guest: 20, youth: 8, guestYouth: 12, deposit: 2.5, note: 'Text', validFrom: '2027-01-01' },
      })

      expect(validate({ waters: [water] }).errors).toEqual([])
    })

    it('reports unknown keys', () => {
      const water = makeWater({ prices: { senior: 10 } as never })

      expect(validate({ waters: [water] }).errors).toContain('water "water-a": prices: unknown price key "senior"')
    })

    it('requires numbers for price values', () => {
      const water = makeWater({ prices: { guest: '20 €' } as never })

      expect(validate({ waters: [water] }).errors).toContain('water "water-a": prices: price "guest" must be a number')
    })

    it('checks the date format of validFrom', () => {
      const water = makeWater({ prices: { guest: 20, validFrom: 'Januar 2027' } })

      expect(validate({ waters: [water] }).errors).toContain('water "water-a": prices.validFrom must be YYYY-MM-DD')
    })

    describe('previousPrices', () => {
      const check = (props: object) => validate({ waters: [makeWater({ lastChecked: '2026-11-01', ...props })] })

      it('accepts old prices next to an announced new list', () => {
        const result = check({ prices: { guest: 25, validFrom: '2027-01-01' }, previousPrices: { guest: 20 } })

        expect(result.errors).toEqual([])
        expect(result.warnings.filter((w) => w.includes('previousPrices'))).toEqual([])
      })

      it('needs the date the new prices start', () => {
        expect(check({ prices: { guest: 25 }, previousPrices: { guest: 20 } }).errors).toEqual([
          'water "water-a": previousPrices need prices.validFrom, the date the new prices start',
        ])
      })

      it('checks the old prices like the new ones', () => {
        expect(check({ prices: { guest: 25, validFrom: '2027-01-01' }, previousPrices: { guest: '20' } }).errors).toEqual([
          'water "water-a": previousPrices: price "guest" must be a number',
        ])
      })

      it('suggests removing them once the new prices apply', () => {
        expect(check({ prices: { guest: 25, validFrom: '2026-01-01' }, previousPrices: { guest: 20 } }).warnings).toContain(
          'water "water-a": prices are valid since 2026-01-01, previousPrices can be removed',
        )
      })
    })
  })

  describe('sales points', () => {
    it('reports missing name and address', () => {
      const { errors } = validate({ salesPoints: [makeSalesPoint({ name: '', address: '' })] })

      expect(errors).toContain('sales point "shop-a": missing name')
      expect(errors).toContain('sales point "shop-a": missing address')
    })

    it('reports a geometry other than Point', () => {
      const salesPoint = makeSalesPoint()
      const line = {
        ...salesPoint,
        geometry: { type: 'LineString', coordinates: [[10.9, 48.3], [10.91, 48.3]] },
      } as unknown as SalesPointFeature

      expect(validate({ salesPoints: [line] }).errors).toContain('sales point "shop-a": geometry must be a Point')
    })

    it('reports references to unknown waters', () => {
      const { errors } = validate({ salesPoints: [makeSalesPoint({ waterIds: ['water-a', 'ghost'] })] })

      expect(errors).toEqual(['sales point "shop-a": unknown waterId "ghost"'])
    })

    it('requires opening hour fields to be present, null is allowed', () => {
      const salesPoint = makeSalesPoint()
      const properties: Partial<SalesPointFeature['properties']> = { ...salesPoint.properties }
      delete properties.openingHours
      delete properties.openingHoursNote
      const { errors } = validate({
        salesPoints: [{ ...salesPoint, properties: properties as SalesPointFeature['properties'] }],
      })

      expect(errors).toEqual([
        'sales point "shop-a": missing openingHours (use null if unknown)',
        'sales point "shop-a": missing openingHoursNote (use null if unknown)',
      ])
    })

    it('accepts valid opening rules', () => {
      const salesPoint = makeSalesPoint({
        openingHours: [
          { days: ['mo', 'tu'], open: '09:00', close: '18:00' },
          { days: ['sa'], open: '08:00', close: '13:00', months: [3, 4, 5, 6, 7, 8, 9, 10] },
          { days: ['su', 'ph'], open: '08:00', close: '19:00' },
        ],
      })

      expect(validate({ salesPoints: [salesPoint] }).errors).toEqual([])
    })

    it.each([
      ['unknown weekday', { days: ['monday'], open: '09:00', close: '18:00' }, 'days must be a non-empty list of mo, tu, we, th, fr, sa, su, ph'],
      ['no weekday', { days: [], open: '09:00', close: '18:00' }, 'days must be a non-empty list of mo, tu, we, th, fr, sa, su, ph'],
      ['time without leading zero', { days: ['mo'], open: '9:00', close: '18:00' }, 'open and close must be HH:MM'],
      ['hour out of range', { days: ['mo'], open: '09:00', close: '24:00' }, 'open and close must be HH:MM'],
      ['close before open', { days: ['mo'], open: '18:00', close: '09:00' }, 'open must be before close'],
      ['month out of range', { days: ['mo'], open: '09:00', close: '18:00', months: [13] }, 'months must be a non-empty list of numbers from 1 to 12'],
      ['empty months', { days: ['mo'], open: '09:00', close: '18:00', months: [] }, 'months must be a non-empty list of numbers from 1 to 12'],
    ])('reports an invalid opening rule (%s)', (_label, rule, message) => {
      const salesPoint = makeSalesPoint({ openingHours: [rule as never] })

      expect(validate({ salesPoints: [salesPoint] }).errors).toEqual([`sales point "shop-a": openingHours[0]: ${message}`])
    })

    it('reports opening hours that are not a list', () => {
      const salesPoint = makeSalesPoint({ openingHours: 'Mo bis Fr 9 bis 18' as never })

      expect(validate({ salesPoints: [salesPoint] }).errors).toEqual([
        'sales point "shop-a": openingHours must be null or a list of rules',
      ])
    })

    it('warns about approximate coordinates', () => {
      expect(validate({ salesPoints: [makeSalesPoint({ coordinatesApproximate: true })] }).warnings).toContain(
        'sales point "shop-a": coordinates are approximate',
      )
    })
  })

  describe('waters without a place to buy tickets', () => {
    it('warns when a water has neither a sales point nor online purchase', () => {
      const { warnings } = validate({ salesPoints: [] })

      expect(warnings).toContain('water "water-a": no sales point and no online purchase')
    })

    it('does not warn when online purchase is available', () => {
      const water = makeWater({ onlinePurchase: { provider: 'hejfish', url: 'https://www.hejfish.com' } })

      expect(validate({ waters: [water], salesPoints: [] }).warnings).toEqual([])
    })

    it('does not warn for members-only waters', () => {
      const water = makeWater({ guestAccess: 'membersOnly' })

      expect(validate({ waters: [water], salesPoints: [] }).warnings).toEqual([])
    })
  })
})
