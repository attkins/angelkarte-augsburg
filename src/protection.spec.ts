import { describe, expect, it } from 'vitest'
import { groupProtection, PROTECTION, protectionAreaOf, speciesProtection, UPPER_BAVARIA_WATERS } from '@/protection'
import { makeWater } from '../tests/fixtures'

const day = (month: number, date: number) => new Date(2026, month - 1, date)

describe('protectionAreaOf', () => {
  it('tells Swabia, Upper Bavaria and Tyrol apart', () => {
    expect(protectionAreaOf(makeWater({ id: 'fva-kuhsee' }))).toBe('swabia')
    expect(protectionAreaOf(makeWater({ id: 'fgb-hurlacher-see' }))).toBe('upperBavaria')
    expect(protectionAreaOf(makeWater({ id: 'at-plansee-heiterwanger' }))).toBe('tyrol')
  })
})

describe('speciesProtection', () => {
  it('marks the species in their closed season, both ends included', () => {
    const water = makeWater({ species: ['Hecht', 'Karpfen'] })
    expect(speciesProtection(water, day(2, 14)).map((s) => s.protectedNow)).toEqual([false, false])
    expect(speciesProtection(water, day(2, 15)).map((s) => s.protectedNow)).toEqual([true, false])
    expect(speciesProtection(water, day(4, 30))[0]!.protectedNow).toBe(true)
    expect(speciesProtection(water, day(5, 1))[0]!.protectedNow).toBe(false)
  })

  it('handles closed seasons over New Year', () => {
    const water = makeWater({ species: ['Bachforelle'] })
    expect(speciesProtection(water, day(12, 24))[0]!.protectedNow).toBe(true)
    expect(speciesProtection(water, day(3, 15))[0]!.protectedNow).toBe(true)
    expect(speciesProtection(water, day(3, 16))[0]!.protectedNow).toBe(false)
  })

  it('treats all-year protected species as protected on every day', () => {
    expect(speciesProtection(makeWater({ species: ['Karausche'] }), day(7, 1))[0]).toMatchObject({ protectedNow: true })
  })

  it('maps regional names and leaves out group names without a rule', () => {
    const water = makeWater({ id: 'at-x', species: ['Aitel (Döbel)', 'Waller', 'Forelle', 'Weißfisch', 'Aalrutte'] })
    expect(speciesProtection(water, day(6, 15)).map((s) => [s.name, s.protectedNow])).toEqual([
      ['Aitel (Döbel)', false],
      ['Waller', true],
      ['Aalrutte', false],
    ])
  })

  it('uses the Swabian eel size only in Swabia', () => {
    expect(speciesProtection(makeWater({ id: 'fva-kuhsee', species: ['Aal'] }), day(6, 1))[0]!.rule.minSize).toBe(50)
    expect(speciesProtection(makeWater({ id: 'lfv-paar-4', species: ['Aal'] }), day(6, 1))[0]!.rule.minSize).toBeUndefined()
  })

  it('applies the Tyrolean rules to at- waters', () => {
    const [hecht] = speciesProtection(makeWater({ id: 'at-plansee', species: ['Hecht'] }), day(2, 20))
    expect(hecht).toMatchObject({ protectedNow: false, rule: { minSize: 50, closed: { from: '03-01', to: '04-30' } } })
  })
})

describe('PROTECTION data', () => {
  it('has valid date ranges and plausible sizes', () => {
    for (const area of Object.values(PROTECTION)) {
      for (const [name, rule] of Object.entries(area.rules)) {
        if (rule.closed) {
          expect(rule.closed.from, name).toMatch(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
          expect(rule.closed.to, name).toMatch(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
        }
        if (rule.minSize !== undefined) expect(rule.minSize, name).toBeGreaterThan(5)
      }
    }
  })

  it('lists only Bavarian waters as Upper Bavaria', () => {
    for (const id of UPPER_BAVARIA_WATERS) expect(id.startsWith('at-')).toBe(false)
  })
})

describe('groupProtection', () => {
  it('returns null when the water does not list the group', () => {
    expect(groupProtection(makeWater({ species: ['Karpfen'] }), 'Hecht', day(3, 1))).toBeNull()
  })

  it('reports a single protected species with the end of its season', () => {
    expect(groupProtection(makeWater({ species: ['Hecht'] }), 'Hecht', day(3, 1))).toEqual({ protected: true, until: '04-30' })
    expect(groupProtection(makeWater({ species: ['Hecht'] }), 'Hecht', day(5, 1))).toEqual({ protected: false, until: null })
  })

  it('counts a group as protected only when every species of it is', () => {
    const water = makeWater({ species: ['Bachforelle', 'Regenbogenforelle'] })
    // 1 March: both closed in Bavaria, the brown trout and the rainbow trout season both end on 15 March.
    expect(groupProtection(water, 'Forelle', day(3, 1))).toEqual({ protected: true, until: '03-15' })
    // 1 November: only the brown trout is closed, rainbow trout may be fished.
    expect(groupProtection(water, 'Forelle', day(11, 1))).toEqual({ protected: false, until: null })
  })

  it('picks the season that ends first, over New Year as well', () => {
    const water = makeWater({ id: 'at-see', species: ['Bachforelle', 'Seeforelle'] })
    // 15 December in Tyrol: brown trout until 28.2., lake trout until 31.12.
    expect(groupProtection(water, 'Forelle', day(12, 15))).toEqual({ protected: true, until: '12-31' })
  })

  it('cannot judge a group name without rule', () => {
    expect(groupProtection(makeWater({ species: ['Forelle'] }), 'Forelle', day(12, 24))).toEqual({ protected: false, until: null })
  })

  it('has no end for species protected all year', () => {
    expect(groupProtection(makeWater({ species: ['Karausche'] }), 'Karausche', day(7, 1))).toEqual({ protected: true, until: null })
  })
})
