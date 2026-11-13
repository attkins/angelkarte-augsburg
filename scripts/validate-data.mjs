#!/usr/bin/env node
// Validates the data files against the schema described in docs/data-schema.md.
// No dependencies, run with: node scripts/validate-data.mjs
// The checks themselves live in scripts/lib/validate-data.mjs.

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateData } from './lib/validate-data.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

async function readJson(relativePath) {
  return JSON.parse(await readFile(join(root, relativePath), 'utf8'))
}

const clubs = await readJson('public/data/clubs.json')
const waters = await readJson('public/data/waters.geojson')
const salesPoints = await readJson('public/data/sales-points.geojson')

const { errors, warnings } = validateData({ clubs, waters, salesPoints })

for (const warning of warnings) console.warn(`warning  ${warning}`)
for (const error of errors) console.error(`error    ${error}`)

console.log(
  `\n${clubs.length} clubs, ${waters.features.length} waters, ${salesPoints.features.length} sales points. ` +
    `${errors.length} errors, ${warnings.length} warnings.`,
)

process.exit(errors.length ? 1 : 0)
