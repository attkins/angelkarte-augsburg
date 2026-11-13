import type { LatLngBoundsLiteral, TileLayerOptions } from 'leaflet'
import type { GuestAccess, PriceKey } from './types'

// Initial view: city of Augsburg plus the districts of Augsburg and Aichach-Friedberg.
// Sales points outside these bounds are still loaded, the map only starts here.
export const REGION_BOUNDS: LatLngBoundsLiteral = [
  [48.15, 10.6], // south-west
  [48.6, 11.3], // north-east
]

export const TILE_LAYER: { url: string; options: TileLayerOptions } = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  options: {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende',
  },
}

export const HIGHLIGHT_COLOR = '#ffd400'
export const SALES_POINT_COLOR = '#1f5fa8'

export const GUEST_ACCESS: Record<GuestAccess, { label: string; color: string }> = {
  open: { label: 'Gastkarten erhältlich', color: '#2e8b57' },
  withMember: { label: 'Gäste nur mit Mitglied', color: '#e69500' },
  membersOnly: { label: 'Nur Mitglieder', color: '#c0392b' },
  unknown: { label: 'Unbekannt', color: '#7f8c8d' },
}

export const PRICE_LABELS: Record<PriceKey, string> = {
  guest: 'Gast',
  guestYouth: 'Gast Jugend',
  member: 'Mitglied',
  youth: 'Jugend',
  deposit: 'Pfand',
}

// Files live in public/data and are fetched at runtime, so they can be edited without a rebuild.
const base = import.meta.env.BASE_URL

export const DATA_FILES = {
  clubs: `${base}data/clubs.json`,
  waters: `${base}data/waters.geojson`,
  salesPoints: `${base}data/sales-points.geojson`,
}
