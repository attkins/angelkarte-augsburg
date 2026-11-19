// Collects the external links in the data and checks whether they still work.
// The checks take `fetch` as a parameter, so the tests run without network.

/** Hosts are checked one link after the other with this pause, to be polite to small club servers. */
export const HOST_PAUSE_MS = 500
export const TIMEOUT_MS = 15_000
/** Some servers block unknown clients, a browser-like agent with a contact makes that rarer. */
export const USER_AGENT = 'Mozilla/5.0 (compatible; angelkarte-link-check; +https://attkins.github.io/angelkarte-augsburg/)'

const URL_PATTERN = /^https?:\/\/\S+$/

/** Every string in `value` that is a whole URL, with the property path it was found at. */
function findUrls(value, path, out) {
  if (typeof value === 'string') {
    if (URL_PATTERN.test(value.trim())) out.push({ url: value.trim(), path })
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => findUrls(item, `${path}[${index}]`, out))
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) findUrls(item, path ? `${path}.${key}` : key, out)
  }
  return out
}

/**
 * All external links of the data, each once, with where it is used, sorted by URL.
 * @returns {{ url: string, uses: string[] }[]}
 */
export function collectLinks({ clubs, waters, salesPoints }) {
  const uses = new Map()
  const add = (label, object) => {
    for (const { url, path } of findUrls(object, '', [])) {
      if (!uses.has(url)) uses.set(url, [])
      uses.get(url).push(`${label}: ${path}`)
    }
  }
  for (const club of clubs) add(`club "${club.id}"`, club)
  for (const feature of waters.features) add(`water "${feature.properties.id}"`, feature.properties)
  for (const feature of salesPoints.features) add(`sales point "${feature.properties.id}"`, feature.properties)
  return [...uses.entries()].map(([url, list]) => ({ url, uses: list })).sort((a, b) => a.url.localeCompare(b.url))
}

/** Same page in the sense of the check: ignores http or https, www and a trailing slash. */
function normalise(url) {
  try {
    const u = new URL(url)
    return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '')}${u.search}`
  } catch {
    return url
  }
}

/**
 * What the check means for the data:
 * - `ok`: answers and stays where it is
 * - `moved`: answers, but only after a redirect to another page, so the data should get the new address
 * - `blocked`: the server refuses automated requests (401, 403, 429), open it in a browser to be sure
 * - `broken`: not found, server error, timeout or no connection
 */
export function classify(url, { status, finalUrl, error }) {
  if (error || status === undefined) return 'broken'
  if ([401, 403, 429].includes(status)) return 'blocked'
  if (status >= 400) return 'broken'
  if (finalUrl && normalise(finalUrl) !== normalise(url)) return 'moved'
  return 'ok'
}

async function request(fetchImpl, url, method, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/pdf,*/*' },
    })
    // Only the status matters, the body is dropped.
    response.body?.cancel?.().catch(() => {})
    return { status: response.status, finalUrl: response.url || url }
  } catch (error) {
    return { error: controller.signal.aborted ? `no answer within ${timeoutMs / 1000} s` : String(error?.cause?.code ?? error?.message ?? error) }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Checks one link. HEAD first, because it is cheap, and GET when the server does not like HEAD
 * or the answer looks wrong. Many small sites answer HEAD with 404, 405 or 403 although the page exists.
 */
export async function checkLink(url, { fetch: fetchImpl = globalThis.fetch, timeoutMs = TIMEOUT_MS } = {}) {
  const head = await request(fetchImpl, url, 'HEAD', timeoutMs)
  const result = head.error || head.status >= 400 ? await request(fetchImpl, url, 'GET', timeoutMs) : head
  return { ...result, verdict: classify(url, result) }
}

function hostOf(url) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/**
 * Checks all links. Different hosts run in parallel (`concurrency` at a time), the links of one host
 * one after the other with a short pause. `onResult` is called after each link, for progress output.
 */
export async function checkLinks(
  links,
  { fetch: fetchImpl = globalThis.fetch, concurrency = 6, pauseMs = HOST_PAUSE_MS, timeoutMs = TIMEOUT_MS, onResult } = {},
) {
  const byHost = new Map()
  for (const link of links) {
    const host = hostOf(link.url)
    if (!byHost.has(host)) byHost.set(host, [])
    byHost.get(host).push(link)
  }
  const queue = [...byHost.values()]
  const results = []

  async function worker() {
    for (let group = queue.shift(); group; group = queue.shift()) {
      for (const [index, link] of group.entries()) {
        if (index > 0 && pauseMs > 0) await new Promise((resolve) => setTimeout(resolve, pauseMs))
        const result = { ...link, ...(await checkLink(link.url, { fetch: fetchImpl, timeoutMs })) }
        results.push(result)
        onResult?.(result)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker))
  return results.sort((a, b) => a.url.localeCompare(b.url))
}

const SECTIONS = [
  ['broken', 'Broken, fix or replace the link'],
  ['moved', 'Moved, update the address in the data'],
  ['blocked', 'Refused by the server, open in a browser to check'],
]

/** When no link got any answer at all, the problem is the network, not the data. */
export function networkLooksDown(results) {
  return results.length >= 3 && results.every((r) => r.error)
}

/** Text report, problems first. Working links are only counted. */
export function formatReport(results) {
  if (networkLooksDown(results)) {
    return `\nNo link got an answer (${results[0].error}). Check the network connection and run again.`
  }
  const lines = []
  for (const [verdict, title] of SECTIONS) {
    const items = results.filter((r) => r.verdict === verdict)
    if (!items.length) continue
    lines.push(`\n${title} (${items.length})`)
    for (const r of items) {
      const detail = r.error ?? (verdict === 'moved' ? `now ${r.finalUrl}` : `HTTP ${r.status}`)
      lines.push(`  - ${r.url}`, `      ${detail}`, ...r.uses.map((use) => `      used by ${use}`))
    }
  }
  const ok = results.filter((r) => r.verdict === 'ok').length
  lines.push(`\n${results.length} links checked, ${ok} ok.`)
  return lines.join('\n')
}
