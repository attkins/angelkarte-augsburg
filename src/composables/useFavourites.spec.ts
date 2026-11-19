// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { resetFavouritesForTests, useFavourites } from '@/composables/useFavourites'

describe('useFavourites', () => {
  beforeEach(() => {
    window.localStorage.clear()
    resetFavouritesForTests()
  })

  it('starts empty and toggles a water on and off', () => {
    const { favourites, isFavourite, toggle } = useFavourites()
    expect(favourites.value.size).toBe(0)

    toggle('fva-kuhsee')
    expect(isFavourite('fva-kuhsee')).toBe(true)
    toggle('fva-kuhsee')
    expect(isFavourite('fva-kuhsee')).toBe(false)
  })

  it('keeps the favourites in local storage, sorted', () => {
    const { toggle } = useFavourites()
    toggle('lfv-lech')
    toggle('fva-kuhsee')

    expect(JSON.parse(window.localStorage.getItem('angelkarte-favourites')!)).toEqual(['fva-kuhsee', 'lfv-lech'])
  })

  it('reads stored favourites on start and ignores broken entries', () => {
    window.localStorage.setItem('angelkarte-favourites', JSON.stringify(['fva-kuhsee', 42, null]))
    expect([...useFavourites().favourites.value]).toEqual(['fva-kuhsee'])

    resetFavouritesForTests()
    window.localStorage.setItem('angelkarte-favourites', '{broken')
    expect(useFavourites().favourites.value.size).toBe(0)
  })

  it('shares one state between all callers', () => {
    useFavourites().toggle('fva-kuhsee')
    expect(useFavourites().isFavourite('fva-kuhsee')).toBe(true)
  })

  it('follows changes from another tab', () => {
    const { favourites } = useFavourites()
    window.localStorage.setItem('angelkarte-favourites', JSON.stringify(['lfv-lech']))
    window.dispatchEvent(new StorageEvent('storage', { key: 'angelkarte-favourites' }))

    expect([...favourites.value]).toEqual(['lfv-lech'])
  })
})
