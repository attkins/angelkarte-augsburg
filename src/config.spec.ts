import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { cartoTileUrl, GUEST_ACCESS, PRICE_LABELS, readImprint, REGION_BOUNDS, TILE_LAYERS } from '@/config'
import { GUEST_ACCESS as VALIDATOR_GUEST_ACCESS, PRICE_KEYS } from '../scripts/lib/validate-data.mjs'

const css = readFileSync(fileURLToPath(new URL('./style.css', import.meta.url)), 'utf8')

/** Variables defined inside the block for the given theme selector. */
function themeVariables(selector: string): Set<string> {
  const start = css.indexOf(`${selector} {`)
  const block = css.slice(start, css.indexOf('}', start))
  return new Set([...block.matchAll(/--([\w-]+):/g)].map((match) => match[1]!))
}

describe('config', () => {
  it('has a label for every guest access value the validator accepts', () => {
    expect(Object.keys(GUEST_ACCESS).sort()).toEqual([...VALIDATOR_GUEST_ACCESS].sort())
    for (const { label } of Object.values(GUEST_ACCESS)) expect(label).not.toBe('')
  })

  it.each(["[data-theme='light']", "[data-theme='dark']"])(
    'defines the colour tokens of every guest access value in the %s theme',
    (theme) => {
      const variables = themeVariables(`:root${theme}`)
      for (const { token } of Object.values(GUEST_ACCESS)) {
        for (const name of [token, `${token}-bg`, `${token}-text`]) expect(variables).toContain(name)
      }
    },
  )

  it('defines the same variables in both themes', () => {
    expect([...themeVariables(":root[data-theme='dark']")].sort()).toEqual(
      [...themeVariables(":root[data-theme='light']")].filter((name) => name !== 'color-scheme').sort(),
    )
  })

  it('has a label for every numeric price key except the deposit, which is shown separately', () => {
    const tileKeys = PRICE_KEYS.filter((key: string) => !['note', 'validFrom', 'deposit'].includes(key))
    expect(Object.keys(PRICE_LABELS).sort()).toEqual([...tileKeys].sort())
  })

  it('has a tile layer with attribution for both themes', () => {
    for (const layer of Object.values(TILE_LAYERS)) {
      expect(layer.url).toMatch(/^https:\/\//)
      expect(layer.options.attribution).toContain('OpenStreetMap')
      expect(layer.options.attribution).toContain('CARTO')
    }
  })

  describe('cartoTileUrl', () => {
    it('appends the API key', () => {
      expect(cartoTileUrl('light_all', 'abc123')).toBe(
        'https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png?key=abc123',
      )
    })

    it('encodes the key and ignores surrounding whitespace', () => {
      expect(cartoTileUrl('dark_all', ' a+b/c \n')).toBe(
        'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=a%2Bb%2Fc',
      )
    })

    it('leaves the key out when none is configured', () => {
      expect(cartoTileUrl('light_all', undefined)).toBe('https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png')
      expect(cartoTileUrl('light_all', '  ')).toBe('https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png')
    })
  })

  it('uses region bounds around Augsburg with south-west before north-east', () => {
    const [[south, west], [north, east]] = REGION_BOUNDS as [[number, number], [number, number]]
    expect(south).toBeLessThan(north)
    expect(west).toBeLessThan(east)
    // Augsburg city centre must be inside.
    expect(48.37).toBeGreaterThan(south)
    expect(48.37).toBeLessThan(north)
    expect(10.9).toBeGreaterThan(west)
    expect(10.9).toBeLessThan(east)
  })

  describe('readImprint', () => {
    const env = {
      VITE_IMPRINT_NAME: ' Erika Mustermann ',
      VITE_IMPRINT_STREET: 'Seeweg 1',
      VITE_IMPRINT_CITY: '86150 Augsburg',
      VITE_IMPRINT_EMAIL: 'erika@example.org',
    }

    it('reads and trims all values', () => {
      expect(readImprint(env)).toEqual({
        name: 'Erika Mustermann',
        street: 'Seeweg 1',
        city: '86150 Augsburg',
        email: 'erika@example.org',
      })
    })

    it('returns null when a value is missing or blank', () => {
      expect(readImprint({ ...env, VITE_IMPRINT_STREET: undefined })).toBeNull()
      expect(readImprint({ ...env, VITE_IMPRINT_EMAIL: '  ' })).toBeNull()
      expect(readImprint({})).toBeNull()
    })
  })
})
