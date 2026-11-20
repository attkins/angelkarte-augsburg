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
- Parking and access points of the selected water as small markers (since 2026-11-18)
- Colour coding for waters: open to guests, guests only with member, members only, unknown
- Layer toggle: waters (on by default), sales points (off by default)
- Own zoom and location buttons, legend with icons
- Filters as chips from the design: guests welcome, online purchase, season open, fly fishing, fish species (not built yet)
- Favourites (since 2026-11-19): a star in the water detail, kept in local storage on the device, and the chip "Meine Gewässer" once something is starred. No sync between devices, that would need an account

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

## Installable app (decided 2026-11-20, F25)

The map can be added to the home screen and then opens like an app, without the browser bar.

- `public/manifest.webmanifest` with name "Angelkarte", German language, `display: standalone` and relative `start_url` and `scope`, so it works under the GitHub Pages path
- Icons from the fish logo of the panel header, petrol with the light fish: `public/icon.svg` as favicon, PNGs in 192 and 512 px, a maskable 512 px icon and a 180 px Apple touch icon without rounded corners (Android and iOS crop those themselves). Rendered with `python3 scripts/icons.py`
- The browser and status bar take the map background (`--land`) of the current theme. The inline script in `index.html` sets it before the first paint, `useTheme()` keeps it up to date when the theme is switched
- iOS status bar style `default`, so the app starts below the status bar and needs no extra safe area handling
- The service worker also stores the manifest and the small icons, and their content counts for its version
- Checked with Chromium against the build: no manifest or installability errors. On real phones still open, see T7

## Short explanation on the first visit (decided 2026-11-20, F27)

Friends get only a link, so the map explains itself once.

- A dialog "Kurz erklärt" opens on the first visit, also when the visit starts with a shared link to a water
- Content: what the map shows, the four main colours of the guest access, the chips "Saison offen" and "Karte heute noch", planning another day, and that everything is without guarantee
- Closing it in any way (button, close button, Escape, backdrop) stores the day in local storage (`angelkarte-welcome-seen`), so it does not come back. If storage is blocked it shows on every visit
- The link "Kurzanleitung" in the panel footer opens it again. The privacy note mentions the stored flag

## Data maintenance (decided 2026-11-17, T3)

The data stays in the plain GeoJSON and JSON files. Almost all updates are research (club pages, hejfish, OSM) rather than typing, so an editor would not save much and would be one more thing to maintain. A spreadsheet as source was rejected for the same reason plus the extra format. Instead `docs/data-maintenance.md` holds the playbook and `npm run due` lists what to check next. Validator and tests guard the files.

## Parking and access points (decided 2026-11-18, F9)

Knowing where to park and how to get to the shore matters as much as the ticket, especially at rivers.

- Two kinds of points per water, parking and access (path to the shore, jetty, gate), stored as an optional `accessPoints` list on the water instead of a separate file. A parking place almost always belongs to one water
- On the map they only show while their water is selected, like the connection lines, so the map stays calm. They sit above the name labels and show their name on hover or tap
- The water detail has a section "Anfahrt" with a route link (Google Maps) for each point, parking first. Without points it offers a route to the middle of the lake or the stretch
- Data comes later. `npm run access-candidates` collects OSM parking near a water as candidates, a human checks them on the aerial images before they go into the data

## Sun times (decided 2026-11-19, F17)

Many anglers plan around the morning and evening, so the water detail shows sunrise and sunset for the shown day (today or the planned day) as a badge, with civil dawn and dusk in its title.

- Computed in the browser after the NOAA solar calculator (`src/utils/sun.ts`), no library and no network
- Taken at the middle of the lake or stretch, a few hundred metres make no visible difference
- Always shown in German local time (Europe/Berlin, the same as Tyrol), so a friend abroad sees the times at the water
- Allowed fishing hours tied to the sun are left out until a club rule in the data needs them

## Collapsible bottom sheet (decided 2026-11-19, F37)

On phones the detail page leaves little room for the map, so the sheet with a water, sales point or club page can be collapsed to a small peek.

- Three snap states: peek, half (the height so far, at most 62 % of the screen) and full. The handle switches between them, by dragging or by tapping (tap toggles peek and half, from full it goes to half)
- Peek shows only the header and the badges. For a water that is name, club and badges in one row that scrolls sideways, for a sales point name, address and the opening state, for a club the header. Elements that stay visible carry the class `.sheet-peek`
- Collapsing is manual only, moving the map does not change the sheet
- The state is kept when another page is selected, a collapsed sheet stays collapsed
- With a collapsed sheet the map fits the selection above the sheet's real height instead of the usual 62 %
- The list without a selection keeps its own open and close toggle, desktop is unchanged

## Licences and papers (decided 2026-11-19, F20)

Friends who fish in Tyrol for the first time need to know that a day ticket alone is not enough.

- The water detail has a collapsible section "Was Du in Bayern zum Angeln brauchst" or "… in Tirol …", as the first of the sections below the details
- The texts live in `src/legal.ts`, one block per country with the official sources and the date of the last check, shown as "Ohne Gewähr, Stand …"
- The country follows the water id: `at-` is Tyrol, everything else Bavaria. A data test makes sure no other water lies in a Tyrolean region
- Waters without a state licence (`licenceExempt`, so far the Aufeldteich) show a short note instead of the licence rules
- The Gastfischerkarte sentence in the price notes of the Tyrolean waters stays, it explains the extra 25 € right next to the price

## Closed seasons by law (decided 2026-11-19, F19)

"Was darf ich heute fangen?" is answered in the water detail from the legal rules, the club's own rules stay as text.

- `src/protection.ts` holds the closed seasons and minimum sizes per species: the AVBayFiG table (rows for the Danube basin, all our Bavarian waters drain into it), the Bezirksfischereiverordnung Schwaben on top (eel 50 cm, a note for lake trout in closed gravel pits) and the Tiroler Fischereiverordnung (Anlagen 9 and 10)
- The area follows the water: `at-` ids are Tyrol, six waters in the Landkreise Landsberg and Neuburg-Schrobenhausen are Upper Bavaria (looked up in OSM), all others Swabia
- The species chips of a water mark the ones protected on the shown day (today or the planned day), a sentence below names them with the end of the closed season. A collapsible table lists all rules with sources and check date
- Group names in the data (Forelle, Saibling, Weißfische) get no rule. A data test fails for any other species name without a rule, so new names are noticed
- With a fish species chosen in the filter, the list marks the waters where it is protected on the shown day ("Hecht geschont bis 30.4.") and the chip "Nur ohne Schonzeit" leaves them out. A group like "Forelle" counts as protected only when every trout species of the water is
- Not built: the Bavarian district rules outside Swabia and Upper Bavaria

## Out of scope (decided 2026-11-19)

The map stays a static site without backend and without accounts, so it needs almost no upkeep besides the data.

- No shared catch log and no favourites synced between devices, both would need accounts and a backend
- No automated reading of prices from hejfish or other shops, that touches their terms of use. Prices come from the club pages and price lists as before

## Open questions

- How the data is maintained later (editing GeoJSON by hand vs. a small editor)
- State management: plain composables or Pinia (composables are enough so far)

## Next steps

Open tasks, feature ideas and the build milestones are tracked in [backlog.md](backlog.md) so several chats can work on them in parallel.
