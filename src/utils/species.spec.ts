import { describe, expect, it } from 'vitest'
import { hasSpecies, speciesGroup, speciesOptions } from '@/utils/species'
import { makeWater } from '../../tests/fixtures'

describe('speciesGroup', () => {
  it('maps all trout variants and Salmoniden onto Forelle', () => {
    for (const name of ['Forelle', 'Bachforelle', 'Regenbogenforelle', 'Seeforelle', 'Lachsforelle', 'Salmoniden']) {
      expect(speciesGroup(name)).toBe('Forelle')
    }
  })

  it('maps regional names onto one name', () => {
    expect(speciesGroup('Aitel (Döbel)')).toBe('Döbel')
    expect(speciesGroup('Waller')).toBe('Wels')
    expect(speciesGroup('Amur')).toBe('Graskarpfen')
    expect(speciesGroup('Seesaibling')).toBe('Saibling')
    expect(speciesGroup('Weißfisch')).toBe('Weißfische')
  })

  it('keeps other names as they are', () => {
    expect(speciesGroup('Hecht')).toBe('Hecht')
    expect(speciesGroup(' Zander ')).toBe('Zander')
  })

  it('does not offer small fish nobody targets', () => {
    expect(speciesGroup('Elritze')).toBeNull()
    expect(speciesGroup('Koppe')).toBeNull()
  })
})

describe('hasSpecies', () => {
  it('matches a water through its data names', () => {
    const water = makeWater({ species: ['Regenbogenforelle', 'Waller'] })
    expect(hasSpecies(water, 'Forelle')).toBe(true)
    expect(hasSpecies(water, 'Wels')).toBe(true)
    expect(hasSpecies(water, 'Hecht')).toBe(false)
  })
})

describe('speciesOptions', () => {
  it('lists each offered name once, sorted the German way', () => {
    const waters = [
      makeWater({ species: ['Zander', 'Bachforelle', 'Äsche', 'Elritze'] }),
      makeWater({ species: ['Regenbogenforelle', 'Aal'] }),
      makeWater({ species: [] }),
    ]
    expect(speciesOptions(waters)).toEqual(['Aal', 'Äsche', 'Forelle', 'Zander'])
  })
})
