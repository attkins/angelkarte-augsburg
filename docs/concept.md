# Angelkarte Augsburg – Concept

Status: draft, started on mobile 2026-11-10. Project scaffold created 2026-11-11. Tech stack switched to Vue 2026-11-13. Design "Morgennebel" implemented 2026-11-13.

## Goal

An interactive web map for Augsburg and the surrounding area that shows which angling clubs sell day tickets (Tageskarten) for which waters, and where to buy them. Audience is the owner and a few friends, not the general public.

## Scope

Core region: city of Augsburg, district of Augsburg and district of Aichach-Friedberg.

The map also includes waters just outside the core region, for example Hurlacher See, Günz, Kammel, Kirnach or Zusam Unterthürheim (decided 2026-11-13). Working rule: every water of a club based in the core region is included, plus single waters right at the edge. Far away waters of those clubs (e.g. 1. AAC waters near Höchstädt or Günzburg) are still open for discussion.

Sales points outside the region are included as long as they sell tickets for at least one water inside the region (decided 2026-11-10).

## Content per water

Always visible in the detail view:
- Water name and club
- Guest access: open to guests, guests only with a member, members only (plus seasonal limits)
- Prices (guest, member, youth, guest youth, deposit if any)
- Where to buy: linked sales points and online purchase (e.g. hejfish link)
- Fish species

Expandable "more info" section:
- Rules and special conditions (bait, catch limits, night fishing, boat, fly fishing only)
- Closed seasons and protected sizes if they differ from the state rules
- Club website and contact
- Date the information was last checked

## Sales points (Ausgabestellen)

Shown as their own markers on the map, visually distinct from the waters (e.g. a shop icon).

Hidden by default (decided 2026-11-14): in the first step the waters matter, the sales points are a second step. The layer toggle shows them. While the layer is hidden, selecting a water draws no connection lines and fits the map to the water only. The sales points stay listed in the water detail, and selecting one there shows that single marker with its connection lines.

Detail view content:
- Name, address, phone
- Opening hours if known
- Which clubs and waters it sells tickets for, with links that highlight those waters on the map

Clicking a water should also highlight its sales points, so the connection works both ways.

Sales points are a separate entity because one shop often sells tickets for several clubs (e.g. Jafispo in Augsburg).

Sales points outside the region are shown like all others. The initial map view stays focused on the region, so with the sales point layer switched on they only appear when zooming out or when a water's sales points are highlighted (the map then fits its bounds to include them).

## Design (decided 2026-11-13)

The look follows the design draft "Morgennebel" (Claude design artifact of the same name).

- Light and dark theme. Starts with the system setting, a toggle switches and remembers the choice.
- Fonts Figtree (text) and Vollkorn (headings), bundled with the app instead of loaded from Google Fonts.
- Calm CARTO base maps (Positron and Dark Matter) instead of the standard OSM tiles.
- No map popups. On wide screens the details are in a side panel on the left, on phones in a bottom sheet over the map. Without a selection the panel lists all waters.
- The detail view of a water has access and season badges, a notice when guests cannot fish right now, price tiles, a button for online purchase, the sales points with their opening state, fish species and collapsible sections for rules, closed seasons and club contact.
- The detail view of a sales point shows whether it is open right now, buttons to call and for a route, and its waters grouped by club with the guest price.
- On the map the selection is highlighted, everything else is dimmed and dashed lines connect a water with its sales points.

Seasons, guest periods and opening hours are stored in a structured form since 2026-11-13, so the app can tell whether a water is open for guests today and whether a shop is open right now.

## Map

- CARTO base maps (OpenStreetMap data) with Leaflet
- Waters drawn as polygons (lakes) and as polygons or line segments (river stretches). River stretches will mostly need custom geometry because club boundaries do not match OSM objects.
- Sales points as point markers
- Colour coding for waters: open to guests, guests only with member, members only, unknown
- Layer toggle: waters (on by default), sales points (off by default)
- Own zoom and location buttons, legend with icons
- Filters as chips from the design: guests welcome, online purchase, season open, fly fishing, fish species (not built yet)

## Data model

See [data-schema.md](data-schema.md) for the detailed schema.

- clubs: id, name, website, contact
- waters: id, name, club id, geometry, guest access, prices, species, rules, online link, last checked
- sales points: id, name, address, location, phone, opening hours, list of water ids

## Tech (decided 2026-11-13)

- Vue 3 with Single File Components and the Composition API (`<script setup>`)
- TypeScript, with types derived from the data schema (Club, Water, SalesPoint)
- Vite as build tool
- Leaflet used directly (no vue-leaflet wrapper), encapsulated in the MapView component so highlighting and fitBounds stay fully under our control
- Still a static site without backend: data as GeoJSON (waters, sales points) plus a small JSON for clubs, loaded at runtime from `public/data/`
- Hosting on GitHub Pages, built and deployed via a GitHub Action, unlisted link for friends. No password for now (decided 2026-11-16, T4)
- Geometry drawn with geojson.io or traced from OSM via Overpass
- Sales point coordinates via geocoding the address once (e.g. Nominatim) and stored in the data

This replaces the earlier plan of a static site without build step. The plain Leaflet prototype was migrated on 2026-11-13.

## Offline use (decided 2026-11-16, F7)

Anglers often stand at the water with bad reception, so the map should keep working there.

- Hand-written service worker in `scripts/service-worker.js`, no extra dependency. The Vite plugin `scripts/lib/service-worker.mjs` fills in the file list and a version and writes `dist/sw.js`. `src/main.ts` registers it only in the build
- On install it stores the app shell (page, hashed JS and CSS, the Latin fonts) and the three data files
- Page and data are network first with a 4 second timeout, so a visitor online always gets the newest data and offline the last one seen
- Hashed assets are cache first. Old app caches are deleted when a new version activates
- Map tiles (CARTO and the Bavarian aerial images) are kept as they are viewed, up to 1500 tiles, the oldest go first. There is no download of whole regions, only what was looked at
- The version changes with every change to the bundle or the data, so returning visitors get both
- While the browser is offline a notice on top of the panel says that the data is from the last visit. The privacy note mentions the offline storage

## Open questions

- How the data is maintained later (editing GeoJSON by hand vs. a small editor)
- State management: plain composables or Pinia (composables are enough so far)

## Next steps

Open tasks, feature ideas and the build milestones are tracked in [backlog.md](backlog.md) so several chats can work on them in parallel.
