import { describe, expect, it } from 'vitest'
import { validateData } from '../scripts/lib/validate-data.mjs'
import { makeClub, makeSalesPoint, makeWater } from './fixtures'
import type { Club, SalesPointFeature, WaterFeature } from '../src/types'

function validate({
  clubs = [makeClub()],
  waters = [makeWater()],
  salesPoints = [makeSalesPoint()],
}: { clubs?: Club[]; waters?: WaterFeature[]; salesPoints?: SalesPointFeature[] } = {}) {
  return validateData({
    clubs,
    waters: { type: 'FeatureCollection', features: waters },
    salesPoints: { type: 'FeatureCollection', features: salesPoints },
  })
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

    it('requires season and source to be present, null is allowed', () => {
      const { errors } = validate({ waters: [withoutProperty(withoutProperty(makeWater(), 'season'), 'source')] })

      expect(errors).toContain('water "water-a": missing season (use null if all year or unknown)')
      expect(errors).toContain('water "water-a": missing source (use null if unknown)')
      expect(validate({ waters: [makeWater({ season: null })] }).errors).toEqual([])
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

      expect(validate({ waters: [water] }).errors).toContain('water "water-a": unknown price key "senior"')
    })

    it('requires numbers for price values', () => {
      const water = makeWater({ prices: { guest: '20 €' } as never })

      expect(validate({ waters: [water] }).errors).toContain('water "water-a": price "guest" must be a number')
    })

    it('checks the date format of validFrom', () => {
      const water = makeWater({ prices: { guest: 20, validFrom: 'Januar 2027' } })

      expect(validate({ waters: [water] }).errors).toContain('water "water-a": prices.validFrom must be YYYY-MM-DD')
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
