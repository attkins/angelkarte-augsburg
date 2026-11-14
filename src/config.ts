import type { LatLngBoundsLiteral, TileLayerOptions, WMSOptions } from 'leaflet'
import type { Theme } from './composables/useTheme'
import type { AppIconName } from './icons'
import type { GuestAccess, PriceKey } from './types'

// Initial view: city of Augsburg plus the districts of Augsburg and Aichach-Friedberg.
// Sales points outside these bounds are still loaded, the map only starts here.
export const REGION_BOUNDS: LatLngBoundsLiteral = [
  [48.15, 10.6], // south-west
  [48.6, 11.3], // north-east
]

const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende, ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>'

/**
 * URL of a CARTO raster base map. CARTO requires a free API key and puts an
 * "API KEY REQUIRED" watermark on tiles requested without one.
 */
export function cartoTileUrl(style: 'light_all' | 'dark_all' | 'dark_only_labels', apiKey: string | undefined): string {
  const url = `https://basemaps.cartocdn.com/rastertiles/${style}/{z}/{x}/{y}{r}.png`
  const key = apiKey?.trim()
  return key ? `${url}?key=${encodeURIComponent(key)}` : url
}

/**
 * The key ends up in the browser anyway, so it is not a secret. Restrict it to the
 * hosts of the site in the CARTO dashboard instead.
 */
const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY

/** Calm CARTO base maps, Positron for light and Dark Matter for dark. */
export const TILE_LAYERS: Record<Theme, { url: string; options: TileLayerOptions }> = {
  light: {
    url: cartoTileUrl('light_all', CARTO_API_KEY),
    options: { maxZoom: 20, attribution: CARTO_ATTRIBUTION },
  },
  dark: {
    url: cartoTileUrl('dark_all', CARTO_API_KEY),
    options: { maxZoom: 20, attribution: CARTO_ATTRIBUTION },
  },
}

/** Base map below the waters: the CARTO map in the current theme, or aerial images. */
export type BaseLayer = 'map' | 'aerial'

/**
 * Official aerial images of Bavaria (DOP20, 20 cm per pixel) from the Bayerische
 * Vermessungsverwaltung, open data under CC BY 4.0 with this attribution. Free WMS
 * without registration. Covers Bavaria only, which is where all the waters are.
 */
export const AERIAL_LAYER: { url: string; options: WMSOptions } = {
  url: 'https://geoservices.bayern.de/od/wms/dop/v1/dop20',
  options: {
    layers: 'by_dop20c',
    format: 'image/jpeg',
    maxZoom: 20,
    attribution:
      'Luftbild: Datenquelle: Bayerische Vermessungsverwaltung – ' +
      '<a href="https://www.geodaten.bayern.de">www.geodaten.bayern.de</a>, ' +
      '<a href="https://creativecommons.org/licenses/by/4.0/deed.de">CC BY 4.0</a>',
  },
}

/** Place names on top of the aerial images, light text that stays readable on photos. */
export const AERIAL_LABELS: { url: string; options: TileLayerOptions } = {
  url: cartoTileUrl('dark_only_labels', CARTO_API_KEY),
  options: { maxZoom: 20, attribution: CARTO_ATTRIBUTION },
}

/** Name of the colour tokens in style.css, e.g. `--open`, `--open-bg` and `--open-text`. */
export type AccessToken = 'open' | 'member' | 'closed' | 'unknown'

export const GUEST_ACCESS: Record<GuestAccess, { label: string; token: AccessToken; icon: AppIconName }> = {
  open: { label: 'Gäste willkommen', token: 'open', icon: 'check' },
  withMember: { label: 'Nur mit Mitglied', token: 'member', icon: 'member' },
  membersOnly: { label: 'Nur Mitglieder', token: 'closed', icon: 'lock' },
  unknown: { label: 'Unbekannt', token: 'unknown', icon: 'question' },
}

/** Order and labels of the price tiles. The deposit is shown separately below them. */
export const PRICE_LABELS: Record<Exclude<PriceKey, 'deposit'>, string> = {
  guest: 'Gast',
  member: 'Mitglied',
  youth: 'Jugend',
  guestYouth: 'Gast Jgd.',
}

// Files live in public/data and are fetched at runtime, so they can be edited without a rebuild.
const base = import.meta.env.BASE_URL

export const DATA_FILES = {
  clubs: `${base}data/clubs.json`,
  waters: `${base}data/waters.geojson`,
  salesPoints: `${base}data/sales-points.geojson`,
}

/** Operator of the site, shown in the imprint (§ 5 DDG) and as the controller in the privacy note. */
export interface Imprint {
  name: string
  street: string
  city: string
  email: string
}

/**
 * Reads the operator from the environment, so name and address stay out of the public
 * repository. They still end up in the built site, which is the point of an imprint.
 * Returns null when a value is missing.
 */
export function readImprint(env: Record<string, unknown>): Imprint | null {
  const read = (key: string) => {
    const value = env[key]
    return typeof value === 'string' ? value.trim() : ''
  }
  const imprint = {
    name: read('VITE_IMPRINT_NAME'),
    street: read('VITE_IMPRINT_STREET'),
    city: read('VITE_IMPRINT_CITY'),
    email: read('VITE_IMPRINT_EMAIL'),
  }
  return Object.values(imprint).every(Boolean) ? imprint : null
}

export const IMPRINT = readImprint(import.meta.env)

/**
 * Start for "sort by distance" when the browser does not share the location.
 * Rathausplatz Augsburg, change it to any place that suits the people using the map.
 */
export const DEFAULT_ORIGIN = { name: 'Augsburg Mitte', lat: 48.3689, lng: 10.8978 }

/** Version from package.json, see `define` in vite.config.ts. */
export const APP_VERSION = __APP_VERSION__
