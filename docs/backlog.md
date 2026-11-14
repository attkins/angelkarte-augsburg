# Backlog

Open tasks and feature ideas for the Angelkarte, collected on 2026-11-14.
This file is the shared work list for parallel chats and agents.

## How to use this file

- Every item has a fixed ID (e.g. `D3`). Refer to it in chats and commit messages.
- Before starting an item, set its status to `in progress` and add a short note who works on it (e.g. "chat opening hours"). Save the file right away so other chats see the claim.
- Check `git status` and `git diff` before editing data files. Several chats may change `public/data/*.json|geojson` at the same time. Edit only the features you need and never rewrite a whole file from an old copy.
- When an item is done, set its status to `done` with the date and move on. Keep done items here until the next cleanup so others can see what changed.
- New findings go to the matching section with the next free ID.
- Larger decisions and the reasoning behind them still belong in `concept.md`, research results in `research-clubs.md`.

Status values: `open`, `in progress`, `done`, `blocked`.

## Milestones (initial build, moved from concept.md 2026-11-14)

| ID | Task | Status |
|----|------|--------|
| M1 | Finish club research | ✅ done 2026-11-13 (second pass, see research-clubs.md). Open details tracked in D2 (Friedberg), D4 (Bobingen prices), D5 (Wehringen sales points) |
| M2 | Collect sales points with addresses | ✅ done for FVA, Friedberg, Haunstetten, Königsbrunn, Bobingen |
| M3 | Define the data schema in detail | ✅ done, see data-schema.md |
| M4 | Build a map prototype with sample waters and sales points | ✅ done (placeholder geometry) |
| M5 | Set up Vue 3 + Vite + TypeScript project and migrate the prototype | ✅ done 2026-11-13 |
| M6 | Replace placeholder geometries and geocode sales point addresses | ✅ mostly done 2026-11-14 (sales points geocoded 2026-11-13; all lakes have OSM outlines; river stretches snapped to OSM waterway relations). Remaining extents tracked in D6 |
| M7 | Search and filter chips from the design | ✅ done 2026-11-14 (search box + chips: guests welcome, online purchase, season open, fly fishing, club selector). Fish species chip still open, see D7 |
| M8 | Extend the schema where research showed gaps | ✅ done 2026-11-13 (`season`, `source`, `prices.validFrom`; deposit deadlines and weekday limits stay free text in `prices.note`/`accessNote`) |
| M9 | Enter the researched clubs into the data files | ✅ done 2026-11-13. Left out: Kirnach, LFV Paar, Schmutter, Zusam, 1. AAC waters outside the core region (see D8, D9) |
| M10 | Implement the design "Morgennebel" | ✅ done 2026-11-13 (themes, fonts, CARTO, side panel and bottom sheet, structured seasons and opening hours) |
| M11 | Structure the remaining opening hours and check holidays | ✅ done 2026-11-14 (24 of 27 sales points have hours; `ph` rules, Bavarian holidays + Augsburg Friedensfest). Open: Osetskiy, Fischerheim FV Friedberg, Holland Blumen (see D1). Found on the way: Angel-Zoo-Ernst moved to Industriestr. 44 Kissing, Zum Isarfischer to Sachsenkamer Str. 6 Bad Tölz — both need new coordinates |

## Cleanup

| ID | Task | Status |
|----|------|--------|
| C1 | Remove stale "Lage nur ungefähr" and "Grenzen noch nicht geprüft" from the `accessNote` of waters that are now traced: Lechauensee 1 and 2, FVA-See, Paintensee, Rollweiher, Hurlacher See, Baggerseen Sand, Günz, Lochbach Haunstetten | ✅ done 2026-11-14 for the seven lakes. Günz and Lochbach Haunstetten keep their note because the stretch limits are still unchecked, moved to D6 |
| C2 | Update step 6 in `concept.md`: Paintensee, Rollweiher and Hurlacher See are traced by now | ✅ done 2026-11-14 |
| C3 | Run `npm test` in the GitHub Actions workflow before the build. `.github/` can only be edited by Thomas | ⬜ open |

## Data

| ID | Task | Status |
|----|------|--------|
| D1 | Opening hours of the sales points and holidays, see step 11 in `concept.md` | ✅ done 2026-11-14: 24 of 27 have hours, `ph` rules for holidays. Open: Osetskiy, Fischerheim FV Friedberg, Holland Blumen |
| D2 | Friedberg: can guests fish the Paar and Friedberger Ach stretches without a member? | ⬜ open |
| D3 | Clarify the 7 waters with `guestAccess: unknown` | ⬜ open |
| D4 | Singold Bobingen is open for guests but has no guest price. Bobingen prices are not online at all | ⬜ open |
| D5 | Singold Wehringen has no sales point and no online purchase. Wehringen sales points are unknown | ⬜ open |
| D6 | Real extent of the placeholder stretches: Lech (LFV), Wertach Großaitingen, Wehringen, Siebnach, Göggingen. Also check the limits of Günz (Deisenhausen) and Lochbach Haunstetten. Club water maps help most | ⬜ open |
| D7 | Fish species: only 5 of 62 waters have species. Start with FVA and LFV | ⬜ open |
| D8 | Missing LFV waters: Paar 3, Paar 4, Schmutter, Zusam | ⬜ open |
| D9 | Missing waters outside the core region: Kirnach (FVA), 1. AAC waters (Mindel, Günz, Höchstädt and others) | ⬜ open |
| D10 | Third research pass west of Augsburg: Staudenfischereiverein, hejfish Neufnach and Weiher H5, clubs in Diedorf, Dinkelscherben, Fischach, Welden and others | ⬜ open |
| D11 | FVA prices change on 2027-01-01 (`prices.validFrom`). Check all other clubs for 2027 prices in January. First pass 2026-11-14: Königsbrunn published 2027 prices (entered with `validFrom`). LFV, Friedberg, Haunstetten, Wehringen and the Augsburger Angelcenter list show no 2027 prices yet, Bobingen has no prices online. Recheck in January, and switch Hintersee (Königsbrunn) to guests with a member on 2027-01-01 | ⬜ open (recheck January 2027) |
| D12 | Maximum depth for the remaining 16 lakes (list in `concept.md`, depth maps section). Club pages first, ask the clubs if nothing is online | ⬜ open |
| D13 | Add waters in Austria: Fernpass area and Wilder Kaiser. Research which clubs/holiday regions sell guest or day tickets there and how (Fischereikarte Tirol, hejfish, local Tourismusverband), then geometry with OSM outlines. Outside the core region, so widen `REGION_BOUNDS`/`dataBounds()` handling | 🔄 **relevant**, in progress (chat D13: research pass) |

## Technical

| ID | Task | Status |
|----|------|--------|
| T1 | Validator warning when `lastChecked` is older than about 6 months | ✅ done 2026-11-14 (warning after 183 days, error for future dates) |
| T2 | Show prices with `validFrom` automatically once the date is reached, keep the old prices until then | ✅ done 2026-11-14: new optional `previousPrices` next to `prices`, the app switches on `prices.validFrom` and announces the new list until then. Set for the five Königsbrunn waters. FVA has no known 2026 prices, so its 2027 list stays visible with its date. Guest access changes on a date (Hintersee, see D11) are not covered |
| T3 | Decide how data is maintained later: hand-edited GeoJSON with docs, or a small editor | ⬜ open |
| T4 | Decide whether the site needs a password or an unlisted link is enough | ⬜ open |
| T5 | Changelog generated from the Conventional Commits | ✅ done 2026-11-14 with git-cliff: `cliff.toml`, `npm run changelog`, usage in the README. Not part of the deploy workflow, could be added there later (needs Thomas, see C3) |

## Feature ideas

| ID | Idea | Notes | Status |
|----|------|-------|--------|
| F1 | Filter "Karte heute noch bekommen" | Waters where a sales point is open right now or online purchase exists. Needs D1 | ⬜ open |
| F2 | Plan for a date | Date picker instead of only "today": seasons, guest periods and opening hours on that day. `availability()` and `openingStatus()` already take a date | ⬜ open |
| F3 | Fish species filter | Chip or selector, needs D7 | ⬜ open |
| F4 | Sort by distance | Toggle "Name / Entfernung" in the water list, straight-line distance to the nearest point of the water from the own location, fallback `DEFAULT_ORIGIN` (Augsburg Mitte) in `src/config.ts`. Driving time left out, a guess from straight-line distance would mislead | ✅ done 2026-11-14 |
| F5 | Share button | Web Share API with the existing hash routes, fallback copy link | ⬜ open |
| F6 | Water level and temperature | Open data of the Hochwassernachrichtendienst Bayern for Lech, Wertach, Schmutter, Paar. First check which gauges fit which stretches | ⬜ open |
| F7 | Offline use | Service worker caching the data files and recently viewed tiles | ⬜ open |
| F8 | Report an error | Mail link in the water detail with the water ID prefilled | ⬜ open |
| F9 | Parking and access points | A few points per water, drawn with the aerial images. Needs a schema extension | ⬜ open |
| F10 | Depth maps for lakes | No depth maps to embed, see `concept.md`. Built `maxDepth` (14 lakes so far) and an optional `depthMapUrl` link instead | ✅ done 2026-11-14 |
| F11 | Link previews | `og:title`, `og:description`, `og:image` and `og:locale` in `index.html` so a shared link shows a card in messengers. Only one preview for the whole site: crawlers do not run JavaScript and ignore the `#/...` hash, so a link to a water shows the same card. Per-water cards would need prerendered pages per route. Needs an absolute URL for `og:image` (GitHub Pages domain) | ✅ done 2026-11-14 (tags in index.html, image public/og-image.png from scripts/og-image.py) |
| F12 | Hide sales points by default | Layer toggle starts off. A sales point selected in the water detail is still shown on its own with its connection lines. Selecting a water fits only to the water while the layer is off | ✅ done 2026-11-14 |
| F13 | Restrict panning to the data area | `maxBounds` + `maxBoundsViscosity: 1.0` and a `minZoom` from the loaded data. `dataBounds()` in `src/utils/bounds.ts` computes the box from all waters and sales points, always including `REGION_BOUNDS`, plus 10 % margin. MapView updates `minZoom` on resize. "Mein Standort" only moves the map when the location is inside the area | ✅ done 2026-11-14 |
| F14 | Satellite / aerial toggle | Second tile layer with a switch. Official Bavarian aerial images, free WMS `https://geoservices.bayern.de/od/wms/dop/v1/dop20`, layer `by_dop20c` (20 cm), CC BY 4.0, attribution "Datenquelle: Bayerische Vermessungsverwaltung – www.geodaten.bayern.de". CARTO `dark_only_labels` on top for place names. Toggle "Luftbild", choice not stored, tiles requested only after switching. Esri World Imagery dropped (unclear terms). Not tested against the live service yet | ✅ done 2026-11-14 |
| F15 | Imprint and credits page | `ImprintPage.vue` opens in the panel via `#/impressum` (`useHashRoute`), link in panel footer and info button in the mobile bar. Imprint, no-guarantee note, short privacy note (GitHub Pages, CARTO, theme in local storage, external links) and credits (OSM/ODbL, CARTO, Leaflet, Vue, Figtree/Vollkorn SIL OFL, Nominatim, data sources). Operator details from `VITE_IMPRINT_*` env vars so they stay out of the public repo. Legal note: § 5 DDG / § 18 MStV exemption likely for a family/friends map, simple imprint is the safe choice | ✅ done 2026-11-14 |
| F16 | Club detail pages | `ClubDetail.vue` shows contact, website, all waters of the club (guest price, season, online purchase, closed right now) and the sales points that sell for them. On the map the club's waters are highlighted with name labels (up to 8) and their sales points, view fits to the waters only. Entry points: club name in the water detail, club headings in the sales point detail, "Zum Verein" chip. Introduced hash routes `#/gewaesser/<id>`, `#/verkaufsstelle/<id>`, `#/verein/<id>`, `#/impressum` via `useHashRoute`; each opened page adds a history entry, closing goes back, unknown ids fall back to the list | ✅ done 2026-11-14 |
