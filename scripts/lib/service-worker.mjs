// Vite plugin that writes dist/sw.js from scripts/service-worker.js.
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const TEMPLATE = fileURLToPath(new URL('../service-worker.js', import.meta.url))

/**
 * Files from public/ the installed app needs offline: the manifest and the icons the page links to.
 * The large icons are only read when the app is installed, which needs a connection anyway.
 */
export const APP_FILES = ['./manifest.webmanifest', './icon.svg', './icons/icon-192.png', './icons/apple-touch-icon.png']

/**
 * URLs the service worker stores on install, relative to the site root.
 * The page itself, the manifest and small icons, the hashed JS and CSS, only the Latin fonts
 * (the other subsets are only fetched for other scripts) and the data files.
 *
 * @param {string[]} bundleFiles file names of the Vite bundle
 * @param {string[]} dataFiles file names in public/data
 * @returns {string[]}
 */
export function precacheUrls(bundleFiles, dataFiles) {
  const assets = bundleFiles
    .filter((name) => /\.(js|css)$/.test(name) || /-latin-wght-normal-[^/]*\.woff2$/.test(name))
    .sort()
  return [
    './',
    './index.html',
    ...APP_FILES,
    ...assets.map((name) => `./${name}`),
    ...[...dataFiles].sort().map((name) => `./data/${name}`),
  ]
}

/**
 * The service worker source with the placeholders filled in.
 *
 * @param {string} template
 * @param {string[]} urls
 * @param {string} version
 * @returns {string}
 */
export function renderServiceWorker(template, urls, version) {
  return template.replace("'__VERSION__'", JSON.stringify(version)).replace('__PRECACHE_URLS__', JSON.stringify(urls, null, 2))
}

/**
 * @param {{ publicDir?: string }} [options]
 * @returns {import('vite').Plugin}
 */
export function serviceWorker(options = {}) {
  const publicDir = options.publicDir ?? fileURLToPath(new URL('../../public', import.meta.url))
  return {
    name: 'angelkarte-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const dataDir = join(publicDir, 'data')
      const dataFiles = readdirSync(dataDir).filter((name) => !name.startsWith('.'))
      const urls = precacheUrls(Object.keys(bundle), dataFiles)
      // A new version whenever the app or the data changes, so returning visitors get both.
      const hash = createHash('sha256')
      for (const name of Object.keys(bundle).sort()) hash.update(name)
      // Manifest and icons keep their names, their content has to count.
      for (const url of APP_FILES) hash.update(readFileSync(join(publicDir, url)))
      for (const name of dataFiles.sort()) hash.update(readFileSync(join(dataDir, name)))
      const version = hash.digest('hex').slice(0, 12)
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: renderServiceWorker(readFileSync(TEMPLATE, 'utf8'), urls, version),
      })
    },
  }
}
