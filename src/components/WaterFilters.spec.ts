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
})
