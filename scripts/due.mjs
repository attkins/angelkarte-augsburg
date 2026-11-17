#!/usr/bin/env node
// Prints what in the data should be checked next, see docs/data-maintenance.md.
// Run with: npm run due  (or: node scripts/due.mjs 20  to list the 20 longest unchecked waters)

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dueList } from './lib/due.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

async function readJson(relativePath) {
  return JSON.parse(await readFile(join(root, relativePath), 'utf8'))
}

const oldest = Number(process.argv[2]) || 10
const sections = dueList(
  {
    clubs: await readJson('public/data/clubs.json'),
    waters: await readJson('public/data/waters.geojson'),
    salesPoints: await readJson('public/data/sales-points.geojson'),
  },
  { oldest },
)

for (const { title, items } of sections) {
  console.log(`\n${title} (${items.length})`)
  for (const item of items) console.log(`  - ${item}`)
}
if (!sections.length) console.log('Nothing due.')
