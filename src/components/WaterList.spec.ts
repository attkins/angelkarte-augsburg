// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WaterList from '@/components/WaterList.vue'
import { makeClub, makeMapData, makeSalesPoint, makeWater } from '../../tests/fixtures'

describe('WaterList', () => {
  const data = makeMapData(
    [makeClub({ id: 'c1', shortName: 'FVA' })],
    [
      makeWater({ id: 'w-zusam', name: 'Zusam', clubId: 'c1', prices: { guest: 15 } }),
      makeWater({ id: 'w-aue', name: 'Auensee', clubId: 'c1', guestAccess: 'membersOnly', prices: { member: 15 } }),
      makeWater({ id: 'w-oe', name: 'Ölsee', clubId: 'c1', prices: null }),
    ],
    [makeSalesPoint({ waterIds: [] }), makeSalesPoint({ id: 'shop-b', waterIds: [] })],
  )

  it('counts waters and sales points', () => {
    expect(mount(WaterList, { props: { data } }).find('p').text()).toContain('3 Gewässer und 2 Verkaufsstellen')
  })

  it('sorts by name the German way and shows club and guest price', () => {
    const rows = mount(WaterList, { props: { data } })
      .findAll('.row')
      .map((row) => ({
        name: row.find('.name').text(),
        price: row.find('.price').exists() ? row.find('.price').text() : null,
      }))

    expect(rows).toEqual([
      { name: 'Auensee FVA', price: null },
      { name: 'Ölsee FVA', price: null },
      { name: 'Zusam FVA', price: '15 €' },
    ])
  })

  it('emits the id of the clicked water', async () => {
    const wrapper = mount(WaterList, { props: { data } })

    await wrapper.findAll('.row')[2]!.trigger('click')

    expect(wrapper.emitted('selectWater')).toEqual([['w-zusam']])
  })
})
