# Data schema

All data lives in `public/data/`. The app fetches the files at runtime, there is no backend. TypeScript types for the schema are in `src/types.ts`.

Run `npm run validate` after every change to the data. It checks references between the files and flags placeholders.

## clubs.json

A plain JSON array.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Unique, lowercase, dashes. Example `lfv-augsburg` |
| `name` | string | Full club name |
| `shortName` | string | Used in lists, e.g. `LFV` |
| `website` | string or null | |
| `contact` | string or null | Free text, e.g. office address |

## waters.geojson

A GeoJSON FeatureCollection. Geometry is `Polygon` or `MultiPolygon` for lakes and `LineString`, `MultiLineString` or `Polygon` for river stretches.

| Property | Type | Notes |
| --- | --- | --- |
| `id` | string | Unique. Prefix with the club, e.g. `lfv-lech` |
| `name` | string | |
| `clubId` | string | Must exist in `clubs.json` |
| `guestAccess` | string | `open`, `withMember`, `membersOnly` or `unknown` |
| `accessNote` | string or null | Seasonal limits and other access details, shown directly under the access badge |
| `season` | string or null | Fishing season of the club as free text, e.g. `16.03. bis 14.12.`. `null` if all year or unknown |
| `prices` | object or null | Keys `member`, `guest`, `youth`, `guestYouth`, `deposit` (numbers in euros), `note` (text) and `validFrom` (ISO date, when a price list only applies from a certain date). All optional |
| `species` | string[] | Fish species for this water |
| `rules` | string[] | Bait, catch limits, night fishing, fly only and so on |
| `closedSeasons` | string[] | Only where they differ from the state rules |
| `onlinePurchase` | object or null | `{ "provider": "hejfish", "url": "..." }`. Provider is the platform name, e.g. `hejfish` or `Angelroute` |
| `lastChecked` | string or null | ISO date `YYYY-MM-DD` |
| `source` | string or null | URL of the page or PDF the data comes from, so the next check knows where to look |
| `geometryStatus` | string | `placeholder`, `traced` (from OSM or geojson.io) or `verified` |

## sales-points.geojson

A GeoJSON FeatureCollection with `Point` geometries.

| Property | Type | Notes |
| --- | --- | --- |
| `id` | string | Unique |
| `name` | string | |
| `address` | string | |
| `phone` | string or null | |
| `openingHours` | string or null | Free text |
| `waterIds` | string[] | Waters this point sells tickets for. Must exist in `waters.geojson` |
| `coordinatesApproximate` | boolean | `true` until the address has been geocoded properly |

The relation between waters and sales points is stored only here, in `waterIds`. The app derives the reverse direction (which sales points sell a given water) when it loads the data, so nothing has to be kept in sync by hand.
