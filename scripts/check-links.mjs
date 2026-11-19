#!/usr/bin/env node
// Checks all external links in the data (club websites, sources, online purchase, depth sources,
// warning links) and lists the broken, moved and refused ones. See docs/data-maintenance.md.
//
// Run with:
//   npm run links                    (all links)
//   npm run links -- hejfish.com     (only links whose address contains the text)
//   npm run links -- --strict        (exit code 1 when a link is broken, e.g. for a scheduled job)
//
// Needs network access. Takes about a minute, small club servers get one request at a time.

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkLinks, collectLinks, formatReport, networkLooksDown } from './lib/links.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

async function readJson(relativePath) {
  return JSON.parse(await readFile(join(root, relativePath), 'utf8'))
}

const args = process.argv.slice(2)
const strict = args.includes('--strict')
const filters = args.filter((a) => !a.startsWith('--'))

const links = collectLinks({
  clubs: await readJson('public/data/clubs.json'),
  waters: await readJson('public/data/waters.geojson'),
  salesPoints: await readJson('public/data/sales-points.geojson'),
}).filter((link) => !filters.length || filters.some((f) => link.url.includes(f)))

if (!links.length) {
  console.error('No links match.')
  process.exit(1)
}

let done = 0
const results = await checkLinks(links, {
  onResult: (r) => {
    done++
    if (process.stderr.isTTY) process.stderr.write(`\r${done}/${links.length} checked`)
    else if (r.verdict !== 'ok') console.error(`${r.verdict}: ${r.url}`)
  },
})
if (process.stderr.isTTY) process.stderr.write('\n')

console.log(formatReport(results))
if (networkLooksDown(results)) process.exit(2)
if (strict && results.some((r) => r.verdict === 'broken')) process.exit(1)
