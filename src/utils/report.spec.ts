import { describe, expect, it } from 'vitest'
import { reportMailto } from '@/utils/report'

describe('reportMailto', () => {
  const water = { id: 'fva-kuhsee', name: 'Kuhsee & Co' }
  const href = reportMailto('team@example.org', water, 'https://example.org/#/gewaesser/fva-kuhsee')
  const query = new URLSearchParams(href.split('?')[1])

  it('addresses the given mail', () => {
    expect(href.startsWith('mailto:team@example.org?')).toBe(true)
  })

  it('names the water in the subject', () => {
    expect(query.get('subject')).toBe('Angelkarte: Fehler bei Kuhsee & Co')
  })

  it('puts name, ID and link into the body', () => {
    const body = query.get('body')!
    expect(body).toContain('Gewässer: Kuhsee & Co')
    expect(body).toContain('ID: fva-kuhsee')
    expect(body).toContain('Link: https://example.org/#/gewaesser/fva-kuhsee')
  })

  it('encodes spaces as %20, not +, so mail apps show them', () => {
    expect(href).not.toContain('+')
  })
})
