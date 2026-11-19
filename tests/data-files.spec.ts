// Checks the real data files in public/data, so broken data fails `npm test` and the CI build.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Position } from 'geojson'
import { describe, expect, it } from 'vitest'
import { REGIONS } from '../src/config'
import { UPPER_BAVARIA_WATERS, speciesProtection } from '../src/protection'
import { regionAt } from '../src/utils/bounds'
import { validateData } from '../scripts/lib/validate-data.mjs'
import type { Club, MapData } from '../src/types'

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(fileURLToPath(new URL(`../public/data/${name}`, import.meta.url)), 'utf8')) as T
}

const clubs = readJson<Club[]>('clubs.json')
const waters = readJson<MapData['waters']>('waters.geojson')
const salesPoints = readJson<MapData['salesPoints']>('sales-points.geojson')

// Generous box around Bavaria plus Tyrol (destination waters in Austria). A swapped lat/lon is not.
const REGION_BOX = { south: 46.8, north: 50.6, west: 8.9, east: 13.9 }

function positions(coordinates: unknown): Position[] {
  if (Array.isArray(coordinates) && typeof coordinates[0] === 'number') return [coordinates as Position]
  return (coordinates as unknown[]).flatMap(positions)
}

function isInRegion([lon, lat]: Position): boolean {
  return (
    lon !== undefined &&
    lat !== undefined &&
    lat > REGION_BOX.south &&
    lat < REGION_BOX.north &&
    lon > REGION_BOX.west &&
    lon < REGION_BOX.east
  )
}

describe('data files', () => {
  it('pass the validator without errors', () => {
    const { errors } = validateData({ clubs, waters, salesPoints })

    expect(errors).toEqual([])
  })

  it('contain at least one club, water and sales point', () => {
    expect(clubs.length).toBeGreaterThan(0)
    expect(waters.features.length).toBeGreaterThan(0)
    expect(salesPoints.features.length).toBeGreaterThan(0)
  })

  it.each(waters.features.map((f) => [f.properties.id, f] as const))(
    'water %s has all coordinates in the region in lon, lat order',
    (_id, feature) => {
      const outside = positions(feature.geometry.coordinates).filter((p) => !isInRegion(p))
      expect(outside).toEqual([])
    },
  )

  it.each(salesPoints.features.map((f) => [f.properties.id, f] as const))(
    'sales point %s is in the region in lon, lat order',
    (_id, feature) => {
      expect(isInRegion(feature.geometry.coordinates)).toBe(true)
    },
  )

  it.each(waters.features.filter((f) => f.properties.id.startsWith('at-')).map((f) => [f.properties.id, f] as const))(
    'Austrian water %s lies in one Tyrolean region of the region switch',
    (_id, feature) => {
      const regions = new Set(positions(feature.geometry.coordinates).map(([lng, lat]) => regionAt(REGIONS, lat!, lng!)))
      expect([...regions]).toHaveLength(1)
      expect(['fernpass', 'wilder-kaiser']).toContain([...regions][0])
    },
  )

  // The water detail shows the Tyrolean licence rules for `at-` ids and the Bavarian ones for all others (src/legal.ts).
  it('has no water outside the at- ids in a Tyrolean region', () => {
    const misplaced = waters.features
      .filter((f) => !f.properties.id.startsWith('at-'))
      .filter((f) =>
        positions(f.geometry.coordinates).some(([lng, lat]) => ['fernpass', 'wilder-kaiser'].includes(regionAt(REGIONS, lat!, lng!) ?? '')),
      )
      .map((f) => f.properties.id)
    expect(misplaced).toEqual([])
  })

  // Group names have no legal rule on purpose. Any other name without a rule is probably a new species
  // or a new spelling that needs an entry in src/protection.ts.
  it('knows a legal rule for every species name except the group names', () => {
    const groups = new Set(['Forelle', 'Saibling', 'Salmoniden', 'Weißfische', 'Weißfisch', 'Lachsforelle', 'Graskarpfen', 'Amur', 'Stör'])
    const unknown = new Set<string>()
    for (const feature of waters.features) {
      const known = new Set(speciesProtection(feature, new Date(2026, 0, 1)).map((s) => s.name))
      for (const name of feature.properties.species) if (!known.has(name) && !groups.has(name)) unknown.add(`${feature.properties.id}: ${name}`)
    }
    expect([...unknown]).toEqual([])
  })

  it('lists only existing waters as Upper Bavaria', () => {
    const ids = new Set(waters.features.map((f) => f.properties.id))
    expect([...UPPER_BAVARIA_WATERS].filter((id) => !ids.has(id))).toEqual([])
  })

  it('uses ids in lowercase with dashes only', () => {
    const ids = [
      ...clubs.map((c) => c.id),
      ...waters.features.map((f) => f.properties.id),
      ...salesPoints.features.map((f) => f.properties.id),
    ]
    expect(ids.filter((id) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id))).toEqual([])
  })

  it('has closed polygon rings', () => {
    const openRings: string[] = []
    for (const feature of waters.features) {
      const { geometry } = feature
      const polygons =
        geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : []
      for (const ring of polygons.flat()) {
        const first = ring[0]
        const last = ring[ring.length - 1]
        if (!first || !last || first[0] !== last[0] || first[1] !== last[1]) openRings.push(feature.properties.id)
      }
    }
    expect(openRings).toEqual([])
  })
})
