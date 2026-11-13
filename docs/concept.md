# Angelkarte Augsburg – Concept

Status: draft, started on mobile 2026-11-10. Project scaffold created 2026-11-11. Tech stack switched to Vue 2026-11-13.

## Goal

An interactive web map for Augsburg and the surrounding area that shows which angling clubs sell day tickets (Tageskarten) for which waters, and where to buy them. Audience is the owner and a few friends, not the general public.

## Scope

Core region: city of Augsburg, district of Augsburg and district of Aichach-Friedberg.

The map also includes waters just outside the core region, for example Hurlacher See, Günz, Kammel, Kirnach or Zusam Unterthürheim (decided 2026-11-13). Working rule: every water of a club based in the core region is included, plus single waters right at the edge. Far away waters of those clubs (e.g. 1. AAC waters near Höchstädt or Günzburg) are still open for discussion.

Sales points outside the region are included as long as they sell tickets for at least one water inside the region (decided 2026-11-10).

## Content per water

Always visible in the popup:
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

Popup content:
- Name, address, phone
- Opening hours if known
- Which clubs and waters it sells tickets for, with links that highlight those waters on the map

Clicking a water should also highlight its sales points, so the connection works both ways.

Sales points are a separate entity because one shop often sells tickets for several clubs (e.g. Jafispo in Augsburg).

Sales points outside the region are shown like all others. The initial map view stays focused on the region, so they only appear when zooming out or when a water's sales points are highlighted (the map then fits its bounds to include them).

## Map

- OpenStreetMap tiles with Leaflet
- Waters drawn as polygons (lakes) and as polygons or line segments (river stretches). River stretches will mostly need custom geometry because club boundaries do not match OSM objects.
- Sales points as point markers
- Colour coding for waters: open to guests, guests only with member, members only, unknown
- Layer toggle: waters, sales points
- Possible filters: fish species, online purchase available, guest access level

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
- Hosting on GitHub Pages, built and deployed via a GitHub Action, unlisted link for friends
- Geometry drawn with geojson.io or traced from OSM via Overpass
- Sales point coordinates via geocoding the address once (e.g. Nominatim) and stored in the data

This replaces the earlier plan of a static site without build step. The plain Leaflet prototype was migrated on 2026-11-13.

## Open questions

- How the data is maintained later (editing GeoJSON by hand vs. a small editor)
- Whether access should be restricted (password) or an unlisted link is enough
- State management: plain composables or Pinia (composables are enough so far)

## Next steps

1. ~~Finish club research~~ (second pass done 2026-11-13, see research-clubs.md. Open: Friedberg guest rules, Bobingen prices, Wehringen sales points)
2. ~~Collect sales points with addresses~~ (done for FVA, Friedberg, Haunstetten, Königsbrunn, Bobingen)
3. ~~Define the data schema in detail~~ (done, see data-schema.md)
4. ~~Build a map prototype with a few sample waters and sales points~~ (done, placeholder geometry)
5. ~~Set up Vue 3 + Vite + TypeScript project and migrate the prototype~~ (done 2026-11-13)
6. Replace placeholder geometries and geocode sales point addresses (sales points geocoded and lake outlines from OSM on 2026-11-13. Still open: exact river stretches, lakes without OSM match, Wertach and Lech geometry)
7. Filters (species, online purchase, guest access)
8. ~~Extend the schema where the research showed gaps~~ (done 2026-11-13: `season`, `source`, `prices.validFrom`. Deposit deadlines and weekday limits stay free text in `prices.note` and `accessNote`)
9. ~~Enter the researched clubs into the data files~~ (done 2026-11-13. Left out for now: Kirnach, LFV Paar, Schmutter and Zusam, 1. AAC waters outside the core region)
