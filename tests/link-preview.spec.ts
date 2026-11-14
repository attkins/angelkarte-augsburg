// Checks the link preview tags in index.html and the image they point to.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8')
const image = readFileSync(fileURLToPath(new URL('../public/og-image.png', import.meta.url)))

function meta(attribute: 'property' | 'name', key: string): string | undefined {
  const match = new RegExp(`<meta ${attribute}="${key}" content="([^"]*)"`).exec(html)
  return match?.[1]
}

describe('link preview', () => {
  it('has title, description, type, locale and a large image card', () => {
    expect(meta('property', 'og:title')).toBeTruthy()
    expect(meta('property', 'og:description')).toBeTruthy()
    expect(meta('property', 'og:type')).toBe('website')
    expect(meta('property', 'og:locale')).toBe('de_DE')
    expect(meta('name', 'twitter:card')).toBe('summary_large_image')
  })

  it('uses absolute https URLs, because crawlers do not resolve relative ones', () => {
    const url = meta('property', 'og:url')
    expect(url).toMatch(/^https:\/\/.+\/$/)
    expect(meta('property', 'og:image')).toBe(`${url}og-image.png`)
  })

  it('points to a PNG of the declared size', () => {
    expect(image.subarray(1, 4).toString('ascii')).toBe('PNG')
    // Width and height are the first two fields of the IHDR chunk.
    const width = image.readUInt32BE(16)
    const height = image.readUInt32BE(20)
    expect([width, height]).toEqual([1200, 630])
    expect(meta('property', 'og:image:width')).toBe(String(width))
    expect(meta('property', 'og:image:height')).toBe(String(height))
  })
})
