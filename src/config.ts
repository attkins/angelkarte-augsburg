import type { LatLngBoundsLiteral, TileLayerOptions } from 'leaflet'
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
export function cartoTileUrl(style: 'light_all' | 'dark_all', apiKey: string | undefined): string {
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
