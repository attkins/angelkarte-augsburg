import { describe, expect, it } from 'vitest'
import { checkLink, checkLinks, classify, collectLinks, formatReport, networkLooksDown } from '../scripts/lib/links.mjs'
import { makeClub, makeSalesPoint, makeWater } from './fixtures'
import type { WaterFeature } from '../src/types'

function data(waters: WaterFeature[]) {
  return {
    clubs: [makeClub({ website: 'https://club.example.org' })],
    waters: { type: 'FeatureCollection', features: waters },
    salesPoints: { type: 'FeatureCollection', features: [makeSalesPoint()] },
  }
}

/** A fake fetch: answers per URL and method, records the calls. */
function fakeFetch(answers: Record<string, { status?: number; url?: string; error?: string; head?: number }>) {
  const calls: string[] = []
  const fn = async (url: string, init?: RequestInit) => {
    calls.push(`${init?.method} ${url}`)
    const answer = answers[url]
    if (!answer || answer.error) throw new TypeError(answer?.error ?? 'fetch failed')
    const status = init?.method === 'HEAD' && answer.head !== undefined ? answer.head : (answer.status ?? 200)
    return { status, url: answer.url ?? url }
  }
  return { fn, calls }
}

describe('collectLinks', () => {
  it('finds every URL once with all its uses, in any field', () => {
    const links = collectLinks(
      data([
        makeWater({
          id: 'w1',
          source: 'https://club.example.org',
          onlinePurchase: { provider: 'hejfish', url: 'https://hejfish.example/d/1' },
          warning: { text: 'Achtung', url: 'https://amt.example/pfc' },
          accessNote: 'Nur Text, keine Adresse https://im-text.example',
        }),
      ]),
    )

    expect(links).toEqual([
      { url: 'https://amt.example/pfc', uses: ['water "w1": warning.url'] },
      { url: 'https://club.example.org', uses: ['club "club-a": website', 'water "w1": source'] },
      { url: 'https://hejfish.example/d/1', uses: ['water "w1": onlinePurchase.url'] },
    ])
  })
})

describe('classify', () => {
  it('tells ok, moved, blocked and broken apart', () => {
    expect(classify('https://a.example/x', { status: 200, finalUrl: 'https://a.example/x' })).toBe('ok')
    expect(classify('http://www.a.example/x/', { status: 200, finalUrl: 'https://a.example/x' })).toBe('ok')
    expect(classify('https://a.example/x', { status: 200, finalUrl: 'https://a.example/neu' })).toBe('moved')
    expect(classify('https://a.example/x', { status: 403 })).toBe('blocked')
    expect(classify('https://a.example/x', { status: 429 })).toBe('blocked')
    expect(classify('https://a.example/x', { status: 404 })).toBe('broken')
    expect(classify('https://a.example/x', { status: 503 })).toBe('broken')
    expect(classify('https://a.example/x', { error: 'ENOTFOUND' })).toBe('broken')
  })
})

describe('checkLink', () => {
  it('uses HEAD when the server answers it', async () => {
    const { fn, calls } = fakeFetch({ 'https://a.example/': { status: 200 } })
    expect(await checkLink('https://a.example/', { fetch: fn })).toMatchObject({ status: 200, verdict: 'ok' })
    expect(calls).toEqual(['HEAD https://a.example/'])
  })

  it('falls back to GET when HEAD fails', async () => {
    const { fn, calls } = fakeFetch({ 'https://a.example/': { head: 405, status: 200 } })
    expect(await checkLink('https://a.example/', { fetch: fn })).toMatchObject({ status: 200, verdict: 'ok' })
    expect(calls).toEqual(['HEAD https://a.example/', 'GET https://a.example/'])
  })

  it('reports network errors as broken', async () => {
    const { fn } = fakeFetch({ 'https://a.example/': { error: 'getaddrinfo ENOTFOUND' } })
    expect(await checkLink('https://a.example/', { fetch: fn })).toMatchObject({ verdict: 'broken', error: 'getaddrinfo ENOTFOUND' })
  })

  it('gives up after the timeout', async () => {
    const hanging = (_url: string, init?: RequestInit) =>
      new Promise<never>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))))
    expect(await checkLink('https://slow.example/', { fetch: hanging, timeoutMs: 20 })).toMatchObject({
      verdict: 'broken',
      error: 'no answer within 0.02 s',
    })
  })
})

describe('checkLinks and formatReport', () => {
  it('checks all links and lists the problems first', async () => {
    const { fn } = fakeFetch({
      'https://a.example/ok': { status: 200 },
      'https://a.example/alt': { status: 200, url: 'https://a.example/neu' },
      'https://b.example/weg': { status: 404 },
      'https://c.example/bot': { status: 403 },
    })
    const links = [
      { url: 'https://a.example/ok', uses: ['club "a": website'] },
      { url: 'https://a.example/alt', uses: ['water "w": source'] },
      { url: 'https://b.example/weg', uses: ['water "x": source', 'water "y": source'] },
      { url: 'https://c.example/bot', uses: ['water "z": source'] },
    ]
    const seen: string[] = []
    const results = await checkLinks(links, { fetch: fn, pauseMs: 0, onResult: (r) => seen.push(r.url) })

    expect(seen).toHaveLength(4)
    expect(results.map((r) => [r.url, r.verdict])).toEqual([
      ['https://a.example/alt', 'moved'],
      ['https://a.example/ok', 'ok'],
      ['https://b.example/weg', 'broken'],
      ['https://c.example/bot', 'blocked'],
    ])

    const report = formatReport(results)
    expect(report.indexOf('Broken')).toBeLessThan(report.indexOf('Moved'))
    expect(report).toContain('  - https://b.example/weg\n      HTTP 404\n      used by water "x": source\n      used by water "y": source')
    expect(report).toContain('now https://a.example/neu')
    expect(report).toContain('4 links checked, 1 ok.')
    expect(report).not.toContain('https://a.example/ok')
  })
})

describe('networkLooksDown', () => {
  const failed = (url: string) => ({ url, uses: [], error: 'EAI_AGAIN', verdict: 'broken' as const })

  it('blames the network when not a single link answered', () => {
    const results = [failed('https://a.example'), failed('https://b.example'), failed('https://c.example')]
    expect(networkLooksDown(results)).toBe(true)
    expect(formatReport(results)).toBe('\nNo link got an answer (EAI_AGAIN). Check the network connection and run again.')
  })

  it('reports single failures as broken links', () => {
    const results = [failed('https://a.example'), failed('https://b.example'), { url: 'https://c.example', uses: [], status: 200, verdict: 'ok' as const }]
    expect(networkLooksDown(results)).toBe(false)
    expect(networkLooksDown([failed('https://a.example')])).toBe(false)
  })
})
