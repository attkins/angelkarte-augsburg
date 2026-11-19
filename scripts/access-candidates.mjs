#!/usr/bin/env node
// Lists parking places from OpenStreetMap near waters, as candidates for `accessPoints`.
// Nothing is written: check each candidate on the aerial images, then copy the good ones into
// public/data/waters.geojson. See docs/data-maintenance.md.
//
// Run with:
//   npm run access-candidates -- fva-kuhsee lfv-lech     (the given waters)
//   npm run access-candidates -- --missing               (all waters without access points)
//   npm run access-candidates -- --radius=600 fva-kuhsee (search radius in metres, default 400)
//
// Uses the public Overpass API. Set OVERPASS_URL to use another instance.

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_RADIUS_KM, overpassQuery, parkingCandidates, toAccessPoint } from './lib/access-candidates.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const endpoint = process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter'
// The public instance asks for at most one request at a time and a short pause in between.
const PAUSE_MS = 1500

const args = process.argv.slice(2)
const radiusArg = args.find((a) => a.startsWith('--radius='))
const radiusKm = radiusArg ? Number(radiusArg.split('=')[1]) / 1000 : DEFAULT_RADIUS_KM
const missing = args.includes('--missing')
const ids = args.filter((a) => !a.startsWith('--'))

const waters = JSON.parse(await readFile(join(root, 'public/data/waters.geojson'), 'utf8')).features
const selected = missing
  ? waters.filter((w) => !w.properties.accessPoints?.length)
  : waters.filter((w) => ids.includes(w.properties.id))

for (const id of ids) {
  if (!waters.some((w) => w.properties.id === id)) console.error(`Unknown water id "${id}"`)
}
if (!selected.length) {
  console.error('No waters selected. Pass water ids or --missing.')
  process.exit(1)
}

for (const [index, water] of selected.entries()) {
  if (index > 0) await new Promise((resolve) => setTimeout(resolve, PAUSE_MS))
  const { id, name } = water.properties
  let elements
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'angelkarte-augsburg data script' },
      body: `data=${encodeURIComponent(overpassQuery(water.geometry, radiusKm))}`,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    elements = (await response.json()).elements ?? []
  } catch (error) {
    console.error(`\n${name} (${id}): request failed, ${error.message}`)
    continue
  }

  const candidates = parkingCandidates(elements, water.geometry, radiusKm)
  console.log(`\n${name} (${id}): ${candidates.length} parking candidates within ${Math.round(radiusKm * 1000)} m`)
  for (const c of candidates) {
    const flag = c.restricted ? '  [not public?]' : ''
    const label = c.name ? `"${c.name}"` : 'no name'
    console.log(`  ${Math.round(c.km * 1000)} m  ${label}  https://www.openstreetmap.org/${c.osm}${flag}`)
    if (c.details.length) console.log(`         ${c.details.join(', ')}`)
    console.log(`         ${JSON.stringify(toAccessPoint(c))}`)
  }
}
