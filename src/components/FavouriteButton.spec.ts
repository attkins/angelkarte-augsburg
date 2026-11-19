// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import FavouriteButton from '@/components/FavouriteButton.vue'
import { resetFavouritesForTests, useFavourites } from '@/composables/useFavourites'

describe('FavouriteButton', () => {
  beforeEach(() => {
    window.localStorage.clear()
    resetFavouritesForTests()
  })

  it('stars and unstars the water', async () => {
    const wrapper = mount(FavouriteButton, { props: { waterId: 'fva-kuhsee', name: 'Kuhsee' } })
    const button = wrapper.find('button')
    expect(button.attributes('aria-pressed')).toBe('false')
    expect(button.attributes('aria-label')).toBe('Kuhsee merken')

    await button.trigger('click')
    expect(button.attributes('aria-pressed')).toBe('true')
    expect(useFavourites().isFavourite('fva-kuhsee')).toBe(true)

    await button.trigger('click')
    expect(button.attributes('aria-pressed')).toBe('false')
    expect(useFavourites().isFavourite('fva-kuhsee')).toBe(false)
  })

  it('shows a starred water as pressed from the start', () => {
    useFavourites().toggle('fva-kuhsee')
    const wrapper = mount(FavouriteButton, { props: { waterId: 'fva-kuhsee', name: 'Kuhsee' } })
    expect(wrapper.find('button').attributes('aria-pressed')).toBe('true')
  })
})
