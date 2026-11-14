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

Detail view content:
- Name, address, phone
- Opening hours if known
- Which clubs and waters it sells tickets for, with links that highlight those waters on the map

Clicking a water should also highlight its sales points, so the connection works both ways.

Sales points are a separate entity because one shop often sells tickets for several clubs (e.g. Jafispo in Augsburg).

Sales points outside the region are shown like all others. The initial map view stays focused on the region, so they only appear when zooming out or when a water's sales points are highlighted (the map then fits its bounds to include them).

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
- Layer toggle: waters, sales points
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
- Hosting on GitHub Pages, built and deployed via a GitHub Action, unlisted link for friends
- Geometry drawn with geojson.io or traced from OSM via Overpass
- Sales point coordinates via geocoding the address once (e.g. Nominatim) and stored in the data

This replaces the earlier plan of a static site without build step. The plain Leaflet prototype was migrated on 2026-11-13.

## Ideas (collected 2026-11-13)

Not scheduled yet. Each idea has a first assessment.

### Depth maps for lakes

Show a depth map or depth contours for lakes, for example as an extra layer or in the water detail.

Assessment: there seems to be no open dataset for the small gravel pit lakes around Augsburg. The open data of the Bavarian water authorities (gkd.bayern.de, LfU) covers measurements at the deepest point of larger lakes, not full bathymetry. Possible sources to check: depth maps published by the clubs themselves, OpenSeaMap depth data (crowdsourced, probably sparse here), or simply a link to an external depth map per water. Needs research before any implementation.

### Filter: can I fish there today?

Some lakes are only open during a certain period. A filter should show only the waters where fishing is possible today (or on a chosen date).

Assessment: the data already supports this. `season` and `guestPeriod` are part of the schema and `availability()` in `src/utils/time.ts` already computes whether a guest can fish today. The filter chip "season open" in next step 7 covers it. Open point: whether "today" is enough or a date picker is wanted, e.g. to plan a trip for the weekend.

### Restrict panning to the data area

The user should not be able to scroll the map away from the area with data, so there is always something to see.

Assessment: Leaflet supports this out of the box with `maxBounds` plus `maxBoundsViscosity: 1.0` (hard stop at the edge) and a `minZoom` so the user cannot zoom out past the area. The bounds should be computed from the loaded data (all waters and sales points plus some padding) instead of the fixed `REGION_BOUNDS`, otherwise sales points outside the core region would be cut off. Highlighting with `fitBounds` stays inside these bounds automatically.

### Switch between normal map and satellite

A toggle between the current map style and aerial imagery, useful to see access points, parking and the shore.

Assessment: feasible as a second tile layer with a switch in the map controls. Candidate sources are Esri World Imagery (free to use with attribution, global) and the official Bavarian aerial images (DOP) from the Landesamt für Digitalisierung, Breitband und Vermessung, which are open data as far as known (to be verified, including license and tile service URL). The satellite mode is independent of the light and dark theme. Labels could be added on top with a transparent label layer.

### Imprint and credits page (added 2026-11-14)

A page with an imprint and links to all services, libraries, fonts and data sources the map uses.

Assessment (not legal advice): § 5 DDG only requires an imprint for business-like digital services, and § 18 MStV exempts sites that serve purely personal or family purposes. A map for the owner and a few friends probably falls under that exemption, but it is interpreted narrowly and the page is publicly reachable, so a simple imprint (name and an address for contact) is the safe choice. An address in the imprint is public, a c/o or service address is an option. A short privacy note matters at least as much: every CARTO tile request sends the visitor's IP address to CARTO, and GitHub Pages logs IP addresses as well.

Credits to list with links: OpenStreetMap contributors (ODbL), CARTO base maps, Leaflet (BSD 2-Clause), Vue (MIT), the fonts Figtree and Vollkorn (SIL Open Font License 1.1, bundled with the app, nothing is loaded from Google), Nominatim for geocoding, and the data sources (club websites, hejfish, Augsburger Angelcenter). Implementation: a link in the panel footer and in the mobile bar that opens the page in the panel. Fits well together with hash routes, see club pages.

Status: done 2026-11-14. `ImprintPage.vue` opens in the panel via `#/impressum` (`useHashPage`), with a link in the panel footer and an info button in the mobile bar. Contains imprint, a note that all data is without guarantee, a short privacy note (GitHub Pages, CARTO, theme in local storage, external links) and the credits. The operator details come from the `VITE_IMPRINT_*` environment variables (repository secrets for the deploy), so they stay out of the public repository.

### Club detail pages (added 2026-11-14)

A page per club with name, website and contact, an overview of all its waters (access, guest price, season) and the sales points that sell tickets for the club. On the map all waters of the club are highlighted and the view fits to them.

Assessment: the data is already there (`clubs.json` and `clubId` on every water). Needs a new selection kind `club` in `App.vue` and `MapView.vue` and a `ClubDetail` component similar to `SalesPointDetail`. Entry points: the club name in the water detail, the club selector of the filters and the club headings in the sales point detail. Good moment to introduce hash routes such as `#/gewaesser/<id>`, `#/verein/<id>` and `#/impressum`, so links can be sent to friends and the back button works on phones. GitHub Pages needs no extra setup for hash routes.

### More waters west of Augsburg (added 2026-11-14)

Cover the area west of Augsburg better: the Westliche Wälder nature park, the Stauden and the valleys of Schmutter, Zusam, Neufnach and Roth, around Neusäß, Diedorf, Gessertshausen, Horgau, Fischach, Dinkelscherben, Zusmarshausen and Welden.

Assessment: already in the data are the FVA Schmutter stretches, the Rothsee (FV Zusmarshausen) and the Bergheimer Baggersee. Leads from the first research that are not in the data yet: Staudenfischereiverein (Neufnach) and the hejfish listings Neufnach and Weiher H5 (Reinhartshofen). Needs a third research pass focused on the west: which local clubs exist in the towns above and whether they sell day tickets, more hejfish listings and the sales points in the area. Same workflow as before: research into `research-clubs.md`, then data with OSM outlines. The western edge of `REGION_BOUNDS` (10.6) already reaches Dinkelscherben, so the start view probably does not need to change.

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
6. Replace placeholder geometries and geocode sales point addresses (sales points geocoded and lake outlines from OSM on 2026-11-13. More lake outlines from OSM on 2026-11-14: FVA-See, Baggerseen Sand, Lechauensee 1 and 2. Still open: Paintensee, Rollweiher and Hurlacher See have mislocated placeholder coordinates and no nearby OSM water, need the correct spot first; river stretches snapped to the OSM waterway relations on 2026-11-14, 25 of 30 now traced. Wertach Bobingen cut from river kilometres 14.6 to 17.4. Still placeholders with unknown extent: Lech (LFV), Wertach Großaitingen, Wehringen, Siebnach and Göggingen (2 km around the assumed spot on the real river course), Lechkanäle (1. AAC) traced from the club description. Stadtwasser traced from the LFV map of the inner and outer city moat)
7. ~~Search and filter chips from the design~~ (done 2026-11-14: search box plus chips for guests welcome, online purchase, season open, fly fishing and a club selector. Filtering dims the map and fits bounds to the matches. Fish species chip still open until more waters have species data)
8. ~~Extend the schema where the research showed gaps~~ (done 2026-11-13: `season`, `source`, `prices.validFrom`. Deposit deadlines and weekday limits stay free text in `prices.note` and `accessNote`)
9. ~~Enter the researched clubs into the data files~~ (done 2026-11-13. Left out for now: Kirnach, LFV Paar, Schmutter and Zusam, 1. AAC waters outside the core region)
10. ~~Implement the design "Morgennebel"~~ (done 2026-11-13: themes, fonts, CARTO, side panel and bottom sheet, structured seasons and opening hours)
11. Structure the remaining opening hours (most shops only have an address so far) and check holidays
