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

export type GuestAccess = 'open' | 'withMember' | 'membersOnly' | 'restricted' | 'prohibited' | 'unknown'

export type GeometryStatus = 'placeholder' | 'traced' | 'verified'

/** Day of the year as `MM-DD`, without a year. */
export type MonthDay = string

/** Recurring period within a year, both ends inclusive. `from` after `to` wraps over New Year. */
export interface DateRange {
  from: MonthDay
  to: MonthDay
}

export type Weekday = 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su'

/** A weekday or `ph` for public holidays. */
export type OpeningDay = Weekday | 'ph'

/** One opening interval on the given weekdays, optionally only in some months (1 to 12). */
export interface OpeningRule {
  /** On a public holiday only the `ph` rules apply. */
  days: OpeningDay[]
  /** `HH:MM` */
  open: string
  /** `HH:MM`, later than `open` on the same day. */
  close: string
  months?: number[]
}

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

/** An important warning for a water, e.g. a health advisory. Shown in bold above all other notices. */
export interface WaterWarning {
  text: string
  /** Page with the details, shown as a "Mehr dazu" link. */
  url?: string | null
}

export type AccessPointType = 'parking' | 'access'

/** A parking place or an access point (path to the shore, jetty, gate) that belongs to a water. */
export interface AccessPoint {
  type: AccessPointType
  /** `[lon, lat]`, in the same order as GeoJSON. */
  coordinates: [number, number]
  /** Short name, e.g. "Parkplatz Nordufer". Without one the type label is shown. */
  name?: string | null
  /** Details, e.g. "Schranke, nur für Mitglieder" or "Einstieg über den Steg". */
  note?: string | null
}

export interface WaterProperties {
  id: string
  name: string
  clubId: string
  guestAccess: GuestAccess
  accessNote: string | null
  /** Fishing season. Null if fishing is allowed all year or the season is unknown. */
  season: DateRange | null
  /** Season details that do not fit a fixed date range. */
  seasonNote: string | null
  /** Period in which guests may fish, if shorter than the season. Null if no extra limit. */
  guestPeriod: DateRange | null
  prices: Prices | null
  /** The list that applies until `prices.validFrom`, while the new prices are only announced. */
  previousPrices?: Prices | null
  species: string[]
  rules: string[]
  closedSeasons: string[]
  onlinePurchase: OnlinePurchase | null
  lastChecked: string | null
  /** URL of the page or document the data was taken from, for the next check. */
  source: string | null
  /** Deepest point in metres, for lakes. Optional, most waters have none. */
  maxDepth?: number | null
  /** Where `maxDepth` comes from, required together with it. */
  maxDepthSource?: string | null
  /** Link to a depth map of the lake, e.g. on the club website. Optional. */
  depthMapUrl?: string | null
  /** Important warning, e.g. not to eat the fish. Optional, most waters have none. */
  warning?: WaterWarning | null
  /** No state fishing licence needed, e.g. a Tyrolean Angelteich. Only set when a source says so. */
  licenceExempt?: boolean
  /** Parking places and access points, shown on the map while the water is selected. Optional. */
  accessPoints?: AccessPoint[] | null
  geometryStatus: GeometryStatus
}

export type WaterGeometry = Polygon | MultiPolygon | LineString | MultiLineString

export type WaterFeature = Feature<WaterGeometry, WaterProperties>

export interface SalesPointProperties {
  id: string
  name: string
  address: string
  phone: string | null
  /** Machine readable opening hours. Null if unknown. */
  openingHours: OpeningRule[] | null
  /** Free text that the rules cannot express, e.g. "nur nach Terminabsprache". */
  openingHoursNote: string | null
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
  /** Ids of the waters of each club, derived from WaterProperties.clubId. */
  waterIdsByClub: Map<string, string[]>
}

/** What is currently selected. Drives the panel, the highlighting on the map and the URL hash. */
export type Selection = { kind: 'water' | 'salesPoint' | 'club'; id: string }
