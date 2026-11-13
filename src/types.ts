import type {
  Feature,
  FeatureCollection,
  LineString,
  MultiLineString,
  MultiPolygon,
  Point,
  Polygon,
} from 'geojson'

// Types for the data files in public/data. See docs/data-schema.md.

export type GuestAccess = 'open' | 'withMember' | 'membersOnly' | 'unknown'

export type GeometryStatus = 'placeholder' | 'traced' | 'verified'

export interface Club {
  id: string
  name: string
  shortName?: string
  website: string | null
  contact: string | null
}

export interface Prices {
  member?: number
  guest?: number
  youth?: number
  guestYouth?: number
  deposit?: number
  note?: string
  /** ISO date from which these prices apply, e.g. a new price list for the coming year. */
  validFrom?: string
}

export type PriceKey = Exclude<keyof Prices, 'note' | 'validFrom'>

export interface OnlinePurchase {
  provider?: string
  url: string
}

export interface WaterProperties {
  id: string
  name: string
  clubId: string
  guestAccess: GuestAccess
  accessNote: string | null
  /** Fishing season of the club as free text, e.g. "16.03. bis 14.12.". Null if all year or unknown. */
  season: string | null
  prices: Prices | null
  species: string[]
  rules: string[]
  closedSeasons: string[]
  onlinePurchase: OnlinePurchase | null
  lastChecked: string | null
  /** URL of the page or document the data was taken from, for the next check. */
  source: string | null
  geometryStatus: GeometryStatus
}

export type WaterGeometry = Polygon | MultiPolygon | LineString | MultiLineString

export type WaterFeature = Feature<WaterGeometry, WaterProperties>

export interface SalesPointProperties {
  id: string
  name: string
  address: string
  phone: string | null
  openingHours: string | null
  waterIds: string[]
  coordinatesApproximate: boolean
}

export type SalesPointFeature = Feature<Point, SalesPointProperties>

export interface MapData {
  clubs: Club[]
  waters: FeatureCollection<WaterGeometry, WaterProperties>
  salesPoints: FeatureCollection<Point, SalesPointProperties>
  clubsById: Map<string, Club>
  watersById: Map<string, WaterFeature>
  salesPointsById: Map<string, SalesPointFeature>
  /** Reverse lookup derived from SalesPointProperties.waterIds. */
  salesPointIdsByWater: Map<string, string[]>
}

/** What is currently selected on the map. Drives highlighting and the popup. */
export type Selection =
  | { kind: 'water'; id: string; latlng?: { lat: number; lng: number } }
  | { kind: 'salesPoint'; id: string }
