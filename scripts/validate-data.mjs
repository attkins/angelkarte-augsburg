#!/usr/bin/env node
// Validates the data files against the schema described in docs/data-schema.md.
// No dependencies, run with: node scripts/validate-data.mjs

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const GUEST_ACCESS = ['open', 'withMember', 'membersOnly', 'unknown']
const GEOMETRY_STATUS = ['placeholder', 'traced', 'verified']
const WATER_GEOMETRIES = ['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString']
const PRICE_KEYS = ['member', 'guest', 'youth', 'guestYouth', 'deposit', 'note']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const errors = []
const warnings = []

async function readJson(relativePath) {
  return JSON.parse(await readFile(join(root, relativePath), 'utf8'))
}

function checkUniqueIds(items, label) {
  const seen = new Set()
  for (const id of items) {
    if (!id) errors.push(`${label}: missing id`)
    else if (seen.has(id)) errors.push(`${label}: duplicate id "${id}"`)
    seen.add(id)
  }
  return seen
}

const clubs = await readJson('public/data/clubs.json')
const waters = await readJson('public/data/waters.geojson')
const salesPoints = await readJson('public/data/sales-points.geojson')

const clubIds = checkUniqueIds(clubs.map((c) => c.id), 'clubs')
const waterIds = checkUniqueIds(waters.features.map((f) => f.properties?.id), 'waters')
checkUniqueIds(salesPoints.features.map((f) => f.properties?.id), 'sales points')

for (const club of clubs) {
  if (!club.name) errors.push(`club "${club.id}": missing name`)
}

const referencedWaterIds = new Set()

for (const feature of waters.features) {
  const p = feature.properties
  const where = `water "${p.id}"`

  if (!p.name) errors.push(`${where}: missing name`)
  if (!clubIds.has(p.clubId)) errors.push(`${where}: unknown clubId "${p.clubId}"`)
  if (!GUEST_ACCESS.includes(p.guestAccess)) errors.push(`${where}: invalid guestAccess "${p.guestAccess}"`)
  if (!WATER_GEOMETRIES.includes(feature.geometry?.type)) {
    errors.push(`${where}: geometry must be one of ${WATER_GEOMETRIES.join(', ')}`)
  }
  if (p.geometryStatus && !GEOMETRY_STATUS.includes(p.geometryStatus)) {
    errors.push(`${where}: invalid geometryStatus "${p.geometryStatus}"`)
  }
  if (p.geometryStatus === 'placeholder') warnings.push(`${where}: geometry is a placeholder`)
  if (p.lastChecked && !ISO_DATE.test(p.lastChecked)) errors.push(`${where}: lastChecked must be YYYY-MM-DD`)
  if (!p.lastChecked) warnings.push(`${where}: lastChecked is not set`)

  if (p.prices) {
    for (const [key, value] of Object.entries(p.prices)) {
      if (!PRICE_KEYS.includes(key)) errors.push(`${where}: unknown price key "${key}"`)
      else if (key !== 'note' && typeof value !== 'number') errors.push(`${where}: price "${key}" must be a number`)
    }
  }

  if (p.onlinePurchase && !p.onlinePurchase.url) errors.push(`${where}: onlinePurchase needs a url`)
}

for (const feature of salesPoints.features) {
  const p = feature.properties
  const where = `sales point "${p.id}"`

  if (!p.name) errors.push(`${where}: missing name`)
  if (!p.address) errors.push(`${where}: missing address`)
  if (feature.geometry?.type !== 'Point') errors.push(`${where}: geometry must be a Point`)
  if (p.coordinatesApproximate) warnings.push(`${where}: coordinates are approximate`)

  for (const waterId of p.waterIds ?? []) {
    if (!waterIds.has(waterId)) errors.push(`${where}: unknown waterId "${waterId}"`)
    referencedWaterIds.add(waterId)
  }
}

for (const feature of waters.features) {
  const p = feature.properties
  if (!referencedWaterIds.has(p.id) && !p.onlinePurchase) {
    warnings.push(`water "${p.id}": no sales point and no online purchase`)
  }
}

for (const warning of warnings) console.warn(`warning  ${warning}`)
for (const error of errors) console.error(`error    ${error}`)

console.log(
  `\n${clubs.length} clubs, ${waters.features.length} waters, ${salesPoints.features.length} sales points. ` +
    `${errors.length} errors, ${warnings.length} warnings.`,
)

process.exit(errors.length ? 1 : 0)
