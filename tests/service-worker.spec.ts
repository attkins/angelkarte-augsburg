// Checks the build plugin that writes dist/sw.js.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Script } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { precacheUrls, renderServiceWorker } from '../scripts/lib/service-worker.mjs'

const template = readFileSync(fileURLToPath(new URL('../scripts/service-worker.js', import.meta.url)), 'utf8')

describe('precacheUrls', () => {
  const urls = precacheUrls(
    [
      'index.html',
      'assets/index-abc.js',
      'assets/index-def.css',
      'assets/figtree-latin-wght-normal-1.woff2',
      'assets/figtree-latin-ext-wght-normal-2.woff2',
      'assets/vollkorn-cyrillic-wght-normal-3.woff2',
      'og-image.png',
    ],
    ['waters.geojson', 'clubs.json'],
  )

  it('keeps the page, scripts, styles and data', () => {
    expect(urls).toEqual([
      './',
      './index.html',
      './manifest.webmanifest',
      './icon.svg',
      './icons/icon-192.png',
      './icons/apple-touch-icon.png',
      './assets/figtree-latin-wght-normal-1.woff2',
      './assets/index-abc.js',
      './assets/index-def.css',
      './data/clubs.json',
      './data/waters.geojson',
    ])
  })

  it('leaves out font subsets for other scripts and the preview image', () => {
    expect(urls.some((url) => url.includes('latin-ext') || url.includes('cyrillic'))).toBe(false)
    expect(urls).not.toContain('./og-image.png')
  })
})

describe('renderServiceWorker', () => {
  const source = renderServiceWorker(template, ['./', './data/clubs.json'], 'v123')

  it('fills in version and file list', () => {
    expect(source).toContain(`const VERSION = "v123"`)
    expect(source).toContain('"./data/clubs.json"')
    expect(source).not.toContain('__PRECACHE_URLS__')
    expect(source).not.toContain('__VERSION__')
  })

  it('is valid JavaScript', () => {
    expect(() => new Script(source)).not.toThrow()
  })
})
