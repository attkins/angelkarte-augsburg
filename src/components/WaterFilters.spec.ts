// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import WaterFilters from '@/components/WaterFilters.vue'
import { resetFavouritesForTests, useFavourites } from '@/composables/useFavourites'
import { emptyFilter } from '@/utils/filter'
import { makeClub, makeMapData, makeWater } from '../../tests/fixtures'

function mountFilters(clubId: string | null) {
  const filter = reactive({ ...emptyFilter(), clubId })
  const data = makeMapData([makeClub({ id: 'fva' })], [makeWater({ clubId: 'fva' })])
  return mount(WaterFilters, { props: { data, filter, count: 1 } })
}

describe('WaterFilters', () => {
  beforeEach(() => {
    window.localStorage.clear()
    resetFavouritesForTests()
  })

  it('offers "Meine Gewässer" only once a water is starred, and toggles it', async () => {
    expect(mountFilters(null).find('.favourites-chip').exists()).toBe(false)

    useFavourites().toggle('water-a')
    const filter = reactive(emptyFilter())
    const wrapper = mount(WaterFilters, {
      props: { data: makeMapData([makeClub()], [makeWater()]), filter, count: 1 },
    })
    const chip = wrapper.find('.favourites-chip')
    expect(chip.text()).toBe('Meine Gewässer')

    await chip.trigger('click')
    expect(filter.chips.has('favourites')).toBe(true)
    expect(chip.attributes('aria-pressed')).toBe('true')
  })

  it('offers the club page only while a club is selected', () => {
    expect(mountFilters(null).find('.club-page').exists()).toBe(false)
    expect(mountFilters('fva').find('.club-page').exists()).toBe(true)
  })

  it('emits the selected club', async () => {
    const wrapper = mountFilters('fva')

    await wrapper.find('.club-page').trigger('click')

    expect(wrapper.emitted('selectClub')).toEqual([['fva']])
  })

  it('offers the species of the data and resets them', async () => {
    const filter = reactive({ ...emptyFilter(), species: 'Hecht' as string | null })
    const data = makeMapData([makeClub({ id: 'fva' })], [makeWater({ clubId: 'fva', species: ['Hecht', 'Bachforelle'] })])
    const wrapper = mount(WaterFilters, { props: { data, filter, count: 1 } })

    const options = wrapper.findAll('.species-select option').map((o) => o.text())
    expect(options).toEqual(['Alle Fischarten', 'Forelle', 'Hecht'])
    expect(wrapper.find('.species-hint').exists()).toBe(true)

    await wrapper.find('.reset').trigger('click')

    expect(filter.species).toBeNull()
  })

  it('hides the species select when no water has species', () => {
    expect(mountFilters(null).find('.species-select').exists()).toBe(false)
  })

  describe('planning for a day', () => {
    it('sets a later day and renames the ticket chip', async () => {
      const wrapper = mountFilters(null)

      await wrapper.find('.date-chip input').setValue('2099-07-01')

      expect(wrapper.emitted('update:planDay')).toEqual([['2099-07-01']])
      await wrapper.setProps({ planDay: '2099-07-01' })
      expect(wrapper.text()).toContain('Karte an dem Tag')
      expect(wrapper.text()).not.toContain('Karte heute noch')
    })

    it('treats today or an emptied field as now', async () => {
      const wrapper = mountFilters(null)
      await wrapper.setProps({ planDay: '2099-07-01' })

      await wrapper.find('.date-chip input').setValue('')

      expect(wrapper.emitted('update:planDay')).toEqual([[null]])
    })

    it('goes back to today with the button', async () => {
      const wrapper = mountFilters(null)
      await wrapper.setProps({ planDay: '2099-07-01' })

      const back = wrapper.findAll('.date-row button').find((b) => b.text() === 'Heute')!
      await back.trigger('click')

      expect(wrapper.emitted('update:planDay')).toEqual([[null]])
    })
  })
})

