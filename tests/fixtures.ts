import { buildMapData } from '@/composables/useMapData'
import type {
  Club,
  MapData,
  SalesPointFeature,
  SalesPointProperties,
  WaterFeature,
  WaterProperties,
} from '@/types'

// Small builders for test data. Every builder returns a valid object, tests only override what they care about.

export function makeClub(overrides: Partial<Club> = {}): Club {
  return {
    id: 'club-a',
    name: 'Fischereiverein A',
    shortName: 'FV A',
    website: 'https://example.org',
    contact: 'Seestraße 1, 86150 Augsburg',
    ...overrides,
  }
}

export function makeWater(overrides: Partial<WaterProperties> = {}): WaterFeature {
  return {
    type: 'Feature',
    properties: {
      id: 'water-a',
      name: 'Testsee',
      clubId: 'club-a',
      guestAccess: 'open',
      accessNote: null,
      season: null,
      prices: { guest: 20, member: 15 },
      species: [],
      rules: [],
      closedSeasons: [],
      onlinePurchase: null,
      lastChecked: '2026-11-13',
      source: 'https://example.org/preise',
      geometryStatus: 'traced',
      ...overrides,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [10.9, 48.3],
          [10.91, 48.3],
          [10.91, 48.31],
          [10.9, 48.3],
        ],
      ],
    },
  }
}

export function makeSalesPoint(overrides: Partial<SalesPointProperties> = {}): SalesPointFeature {
  return {
    type: 'Feature',
    properties: {
      id: 'shop-a',
      name: 'Angelladen A',
      address: 'Hauptstraße 1, 86150 Augsburg',
      phone: '0821 123456',
      openingHours: null,
      waterIds: ['water-a'],
      coordinatesApproximate: false,
      ...overrides,
    },
    geometry: { type: 'Point', coordinates: [10.89, 48.36] },
  }
}

export function makeMapData(
  clubs: Club[] = [makeClub()],
  waters: WaterFeature[] = [makeWater()],
  salesPoints: SalesPointFeature[] = [makeSalesPoint()],
): MapData {
  return buildMapData(
    clubs,
    { type: 'FeatureCollection', features: waters },
    { type: 'FeatureCollection', features: salesPoints },
  )
}
