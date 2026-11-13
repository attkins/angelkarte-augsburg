# Angelkarte Augsburg

Interactive map for Augsburg and the surrounding area that shows which angling clubs sell day tickets (Tageskarten), for which waters, and where to buy them.

Built with [Vue 3](https://vuejs.org), TypeScript, [Vite](https://vite.dev) and [Leaflet](https://leafletjs.com) on OpenStreetMap tiles. There is no backend. The data lives in plain GeoJSON and JSON files that are fetched at runtime.

## Getting started

Requires Node 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

Other scripts:

```sh
npm run build       # type-check and build into dist/
npm run preview     # serve the build locally
npm run type-check  # vue-tsc only
npm run validate    # check the data files
```

## Project structure

```
index.html                      Vite entry point
src/main.ts                     app bootstrap, global styles
src/App.vue                     layout, loads the data, owns the selection
src/config.ts                   region bounds, colours, labels, data file paths
src/types.ts                    types for clubs, waters, sales points and the selection
src/composables/useMapData.ts   loads data files and builds lookups
src/components/MapView.vue      Leaflet map, layers, highlighting, fitBounds
src/components/MapPopup.vue     renders Vue content inside a Leaflet popup
src/components/WaterPopup.vue   popup content for a water
src/components/SalesPointPopup.vue  popup content for a sales point
src/components/MapLegend.vue    legend overlay
src/style.css                   global styles (popups, marker icon)
public/data/                    clubs.json, waters.geojson, sales-points.geojson
scripts/validate-data.mjs       checks the data files
docs/                           concept, research and data schema
```

## How the map works

`App.vue` holds a single `selection` (a water or a sales point, or nothing). `MapView` reacts to it by highlighting the selected item and everything linked to it, zooming so that all of it is visible, and showing the matching popup. Clicking a water, a marker or a link inside a popup only changes the selection. Leaflet objects are kept outside of Vue reactivity.

## Editing data

The schema is described in [docs/data-schema.md](docs/data-schema.md). The data files are in `public/data/` and are copied unchanged into the build, so they can be edited without touching the code.

Geometry can be drawn on [geojson.io](https://geojson.io) or traced from OSM via [Overpass Turbo](https://overpass-turbo.eu). Paste the result into `public/data/waters.geojson` and set `geometryStatus` to `traced`.

After every change run

```sh
npm run validate
```

It reports broken references (unknown club or water ids) as errors and placeholders or missing check dates as warnings.

## Current state

The data covers 12 clubs, 62 waters and 27 sales points from the research in `docs/research-clubs.md` (as of 2026-11-13).

Lakes that exist in OpenStreetMap under their name use the OSM outline (`geometryStatus: traced`). River stretches are cut from the OSM river around the nearest village and are still marked as `placeholder`, because the real club boundaries are not known yet. A few waters without OSM match are small stand-in squares or lines. Sales point coordinates are geocoded from their address via Nominatim.

## Deployment

`.github/workflows/deploy.yml` validates the data, builds the site and publishes `dist/` to GitHub Pages on every push to `main`. In the repository settings set Pages to "GitHub Actions" as source. The build uses a relative base path, so it works under `/<repo>/` without further configuration.

The page sets `noindex` so it stays out of search engines, but anyone with the link can open it.
