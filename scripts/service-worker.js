// Service worker of the Angelkarte, see docs/concept.md (offline use).
// Built by scripts/lib/service-worker.mjs: the placeholders below are replaced at build time.

const VERSION = '__VERSION__'
/** App shell: index.html, the hashed JS and CSS, the Latin fonts and the data files. */
const PRECACHE_URLS = __PRECACHE_URLS__

const APP_CACHE = `angelkarte-app-${VERSION}`
const DATA_CACHE = 'angelkarte-data'
const TILE_CACHE = 'angelkarte-tiles'

/** Map tiles kept for offline use, the oldest go first. About 15 to 30 MB at this size. */
const MAX_TILES = 1500
const TILE_HOSTS = ['basemaps.cartocdn.com', 'geoservices.bayern.de']
/** After this long without an answer the data comes from the cache. */
const DATA_TIMEOUT_MS = 4000

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_CACHE)
      await cache.addAll(PRECACHE_URLS.filter((url) => !url.startsWith('./data/')))
      // The data has its own cache, so a data update does not need a new app version.
      const data = await caches.open(DATA_CACHE)
      await data.addAll(PRECACHE_URLS.filter((url) => url.startsWith('./data/')))
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith('angelkarte-app-') && key !== APP_CACHE) await caches.delete(key)
      }
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (url.origin === self.location.origin) {
    if (request.mode === 'navigate') event.respondWith(networkFirst(request, APP_CACHE, './index.html'))
    else if (url.pathname.includes('/data/')) event.respondWith(networkFirst(request, DATA_CACHE))
    else event.respondWith(cacheFirst(request, APP_CACHE))
    return
  }

  if (TILE_HOSTS.includes(url.hostname)) event.respondWith(tile(request))
})

/** Fresh from the network, the cached copy when offline or slow. */
async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName)
  try {
    const response = await withTimeout(fetch(request), DATA_TIMEOUT_MS)
    if (response.ok) await cache.put(request, response.clone())
    return response
  } catch (error) {
    const cached =
      (await cache.match(request, { ignoreSearch: true })) ?? (fallbackUrl ? await cache.match(fallbackUrl) : undefined)
    if (cached) return cached
    throw error
  }
}

/** Hashed assets never change, the cache is always right. */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(cacheName)
    await cache.put(request, response.clone())
  }
  return response
}

let tilesSinceTrim = 0

/** Tiles seen once are kept, so the last viewed areas work offline. */
async function tile(request) {
  const cache = await caches.open(TILE_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  // Tiles loaded as plain images come back opaque (status 0), they are fine to keep.
  if (response.ok || response.type === 'opaque') {
    await cache.put(request, response.clone())
    if (++tilesSinceTrim >= 50) {
      tilesSinceTrim = 0
      await trim(cache, MAX_TILES)
    }
  }
  return response
}

async function trim(cache, max) {
  const keys = await cache.keys()
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key)
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}
