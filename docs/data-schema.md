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
| `guestAccess` | string | `open`, `withMember`, `membersOnly`, `restricted`, `prohibited` or `unknown`. `restricted` for waters open only under a condition the badge cannot show (hotel guests, a booked hut); the price stays visible and the detail goes in `accessNote`. `prohibited` where fishing is banned |
| `accessNote` | string or null | Access details that are not covered by the other fields, e.g. weekday limits. Shown as a notice below the badges |
| `season` | date range or null | Fishing season, e.g. `{ "from": "03-16", "to": "12-14" }`. `null` if fishing is allowed all year or the season is unknown |
| `seasonNote` | string or null | Season details that do not fit a fixed range, e.g. a season that starts with a club event |
| `guestPeriod` | date range or null | Period in which guests may fish, if shorter than the season. `null` if there is no extra limit |
| `prices` | object or null | Keys `member`, `guest`, `youth`, `guestYouth`, `deposit` (numbers in euros), `note` (text) and `validFrom` (ISO date, when a price list only applies from a certain date). All optional. Always the newest known list |
| `previousPrices` | object, null or missing | Optional. Same keys as `prices` without `validFrom`: the list that applies until `prices.validFrom`. The app shows it until that day and announces the new prices below, then switches on its own. Without it a future list is shown right away with "Preise gültig ab". Remove it after the switch, the validator warns |
| `species` | string[] | Fish species for this water, named as in the source. Prefer Döbel, Wels and Flussbarsch over Aitel, Waller and Barsch. The filter groups names through `src/utils/species.ts`, so a new name that should join a group (e.g. another trout variant) needs an entry there |
| `rules` | string[] | Bait, catch limits, night fishing, fly only and so on |
| `closedSeasons` | string[] | Only where they differ from the state rules |
| `onlinePurchase` | object or null | `{ "provider": "hejfish", "url": "..." }`. Provider is the platform name, e.g. `hejfish` or `Angelroute` |
| `lastChecked` | string or null | ISO date `YYYY-MM-DD`. The validator warns when it is more than 183 days old and reports dates in the future as errors |
| `source` | string or null | URL of the page or PDF the data comes from, so the next check knows where to look |
| `maxDepth` | number, null or missing | Optional. Deepest point of a lake in metres |
| `maxDepthSource` | string, null or missing | URL the depth comes from, required with `maxDepth`. Club or city pages first, angling portals only when nothing better exists |
| `depthMapUrl` | string, null or missing | Optional. Link to a depth map, e.g. on the club website |
| `warning` | object or null | Optional. `{ "text": "...", "url": "https://..." }`, shown in bold above all other notices, e.g. a health advisory. Used for the PFC warning on the Friedberger Ach |
| `accessPoints` | list or null | Optional. Parking places and access points, see below |
| `geometryStatus` | string | `placeholder`, `traced` (from OSM or geojson.io) or `verified` |

### Access points

Parking places and ways to the shore of a water, shown as small markers while the water is selected and listed under "Anfahrt" in the detail, each with a route link. Without access points the detail offers a route to the middle of the lake or the stretch instead.

```json
"accessPoints": [
  { "type": "parking", "coordinates": [10.938512, 48.338841], "name": "Parkplatz Nordufer", "note": "Kostenlos" },
  { "type": "access", "coordinates": [10.941203, 48.337102], "note": "Einstieg über den Steg" }
]
```

| Field | Type | Notes |
| --- | --- | --- |
| `type` | string | `parking` or `access` (path to the shore, jetty, gate) |
| `coordinates` | `[lon, lat]` | Same order as GeoJSON. The validator warns when a point is more than 1 km from the water, which usually means swapped coordinates |
| `name` | string, null or missing | Short name. Without one the app shows "Parkplatz" or "Zugang" |
| `note` | string, null or missing | Details that matter on site, e.g. a barrier, a fee or "nur für Mitglieder" |

The detail lists parking first, otherwise the order of the data.

### Waters in Austria (Tyrol)

A few destination waters sit in Tyrol, outside the Augsburg core region. They reuse the schema with two conventions instead of new fields:

- **Two-license system:** besides the per-water day ticket (`prices.guest`), Tyrol needs a state Gastfischerkarte (about 25 €, 14 days, whole of Tyrol, a valid German Angelschein required). Put that as a sentence in `prices.note`, e.g. "Zusätzlich Tiroler Gastfischerkarte (25 €, 14 Tage, ganz Tirol), gültiger deutscher Angelschein erforderlich." When a water has no `prices` (the fee is bundled, e.g. with a booked hut), put it in `accessNote` instead.
- **Operator instead of club:** these waters have a Bewirtschafter, not a club. Add it to `clubs.json` like any other club, with `(Bewirtschafter)` in the `name` so the "Verein" labels read sensibly.

The map keeps its Augsburg start view. `dataBounds()` widens on its own, and the region switch (`REGIONS` in `src/config.ts`) jumps to the Fernpass and the Wilder Kaiser. A new Austrian water must lie inside one of these two regions, `npm test` checks this for every id starting with `at-`.

## sales-points.geojson

A GeoJSON FeatureCollection with `Point` geometries.

| Property | Type | Notes |
| --- | --- | --- |
| `id` | string | Unique |
| `name` | string | |
| `address` | string | |
| `phone` | string or null | |
| `openingHours` | list of opening rules or null | See below. `null` if unknown |
| `openingHoursNote` | string or null | What the rules cannot express, e.g. `Nur nach Terminabsprache.` |
| `waterIds` | string[] | Waters this point sells tickets for. Must exist in `waters.geojson` |
| `coordinatesApproximate` | boolean | `true` until the address has been geocoded properly |

### Opening rules

Each rule is one opening interval on some weekdays:

```json
{ "days": ["mo", "tu", "we", "th", "fr"], "open": "09:00", "close": "12:00" }
```

- `days`: any of `mo`, `tu`, `we`, `th`, `fr`, `sa`, `su`, plus `ph` for public holidays
- `open` and `close`: `HH:MM` with leading zeros, `open` before `close` on the same day
- `months` (optional): numbers from 1 to 12 in which the rule applies, for seasonal hours

A lunch break is two rules for the same days.

Public holidays are the Bavarian ones (`src/utils/holidays.ts`), plus the Augsburger Friedensfest on 8 August for addresses in the city of Augsburg (postcodes 86150 to 86199). Sales points whose address ends with "Österreich" use the 13 Austrian public holidays instead, without Karfreitag and without the Tyrolean Josefitag. On a holiday only the `ph` rules apply, e.g. `{ "days": ["su", "ph"], "open": "07:00", "close": "22:00" }` for a petrol station. A shop without `ph` rules shows "Feiertag, Zeiten können abweichen" on the holiday and is treated as closed when the app looks for the next opening.

The app uses these rules to show whether a shop is open right now and when it opens next.

## Date ranges

`season` and `guestPeriod` use `{ "from": "MM-DD", "to": "MM-DD" }` without a year, both ends inclusive. A range where `from` is after `to` runs over New Year, e.g. `{ "from": "11-01", "to": "02-28" }`.

The app compares them with today's date to show that a water is closed or not open for guests right now, and from when it opens again.

## Relation between waters and sales points

The relation between waters and sales points is stored only here, in `waterIds`. The app derives the reverse direction (which sales points sell a given water) when it loads the data, so nothing has to be kept in sync by hand.
