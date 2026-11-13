// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SalesPointPopup from '@/components/SalesPointPopup.vue'
import type { SalesPointFeature } from '@/types'
import { makeClub, makeMapData, makeSalesPoint, makeWater } from '../../tests/fixtures'

function mountPopup(salesPoint: SalesPointFeature, data = makeMapData(undefined, undefined, [salesPoint])) {
  return mount(SalesPointPopup, { props: { salesPoint, data } })
}

describe('SalesPointPopup', () => {
  it('shows name, address, phone link and opening hours', () => {
    const wrapper = mountPopup(
      makeSalesPoint({
        name: 'Jafispo',
        address: 'Kurzes Geländ 8a, 86156 Augsburg',
        phone: '0821 472105',
        openingHours: 'Mo bis Fr 9 bis 18',
      }),
    )

    expect(wrapper.find('h3').text()).toBe('Jafispo')
    expect(wrapper.text()).toContain('Kurzes Geländ 8a, 86156 Augsburg')
    expect(wrapper.find('a[href="tel:0821472105"]').text()).toBe('0821 472105')
    expect(wrapper.text()).toContain('Öffnungszeiten: Mo bis Fr 9 bis 18')
  })

  it('leaves out phone and opening hours when unknown', () => {
    const wrapper = mountPopup(makeSalesPoint({ phone: null, openingHours: null }))

    expect(wrapper.text()).not.toContain('Telefon')
    expect(wrapper.text()).not.toContain('Öffnungszeiten')
  })

  it('lists its waters with the short club name and emits the water id when clicked', async () => {
    const salesPoint = makeSalesPoint({ waterIds: ['w1', 'w2'] })
    const data = makeMapData(
      [makeClub({ id: 'c1', shortName: 'FVA' }), makeClub({ id: 'c2', name: 'Langer Vereinsname', shortName: undefined })],
      [makeWater({ id: 'w1', name: 'Kuhsee', clubId: 'c1' }), makeWater({ id: 'w2', name: 'Römersee', clubId: 'c2' })],
      [salesPoint],
    )
    const wrapper = mountPopup(salesPoint, data)

    const items = wrapper.findAll('li').map((li) => li.text())
    expect(items).toEqual(['Kuhsee (FVA)', 'Römersee (Langer Vereinsname)'])

    await wrapper.findAll('button.link')[1]!.trigger('click')
    expect(wrapper.emitted('selectWater')).toEqual([['w2']])
  })

  it('skips water ids that do not exist', () => {
    const salesPoint = makeSalesPoint({ waterIds: ['water-a', 'gone'] })
    const wrapper = mountPopup(salesPoint, makeMapData(undefined, undefined, [salesPoint]))

    expect(wrapper.findAll('li')).toHaveLength(1)
  })

  it('says so when no waters are assigned', () => {
    const wrapper = mountPopup(makeSalesPoint({ waterIds: [] }))

    expect(wrapper.find('ul').exists()).toBe(false)
    expect(wrapper.text()).toContain('Noch keine Gewässer zugeordnet.')
  })

  it('warns when the position is only approximate', () => {
    expect(mountPopup(makeSalesPoint({ coordinatesApproximate: true })).find('.warning').exists()).toBe(true)
    expect(mountPopup(makeSalesPoint({ coordinatesApproximate: false })).find('.warning').exists()).toBe(false)
  })
})
