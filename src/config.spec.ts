import { describe, expect, it } from 'vitest'
import { GUEST_ACCESS, PRICE_LABELS, REGION_BOUNDS } from '@/config'
import { GUEST_ACCESS as VALIDATOR_GUEST_ACCESS, PRICE_KEYS } from '../scripts/lib/validate-data.mjs'

describe('config', () => {
  it('has a label and a colour for every guest access value the validator accepts', () => {
    expect(Object.keys(GUEST_ACCESS).sort()).toEqual([...VALIDATOR_GUEST_ACCESS].sort())
    for (const { label, color } of Object.values(GUEST_ACCESS)) {
      expect(label).not.toBe('')
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('has a label for every numeric price key the validator accepts', () => {
    const numericKeys = PRICE_KEYS.filter((key: string) => key !== 'note' && key !== 'validFrom')
    expect(Object.keys(PRICE_LABELS).sort()).toEqual([...numericKeys].sort())
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
})
