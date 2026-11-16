// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import WaterFilters from '@/components/WaterFilters.vue'
import { emptyFilter } from '@/utils/filter'
import { makeClub, makeMapData, makeWater } from '../../tests/fixtures'

function mountFilters(clubId: string | null) {
  const filter = reactive({ ...emptyFilter(), clubId })
  const data = makeMapData([makeClub({ id: 'fva' })], [makeWater({ clubId: 'fva' })])
  return mount(WaterFilters, { props: { data, filter, count: 1 } })
}

describe('WaterFilters', () => {
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
})
