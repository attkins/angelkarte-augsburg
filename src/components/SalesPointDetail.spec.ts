// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SalesPointDetail from '@/components/SalesPointDetail.vue'
import type { SalesPointFeature } from '@/types'
import { makeClub, makeMapData, makeSalesPoint, makeWater } from '../../tests/fixtures'

// Friday, 13 November 2026, 15:00 local time.
const NOW = new Date(2026, 10, 13, 15, 0)

function mountDetail(salesPoint: SalesPointFeature, data = makeMapData(undefined, undefined, [salesPoint])) {
  return mount(SalesPointDetail, { props: { salesPoint, data, now: NOW } })
}

describe('SalesPointDetail', () => {
  it('shows name and address', () => {
    const wrapper = mountDetail(makeSalesPoint({ name: 'Jafispo', address: 'Kurzes Geländ 8a, 86156 Augsburg' }))

    expect(wrapper.find('.eyebrow').text()).toBe('Verkaufsstelle')
    expect(wrapper.find('h1').text()).toBe('Jafispo')
    expect(wrapper.find('.subtitle').text()).toBe('Kurzes Geländ 8a, 86156 Augsburg')
  })

  it('emits close', async () => {
    const wrapper = mountDetail(makeSalesPoint())

    await wrapper.find('.back-link').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  describe('opening hours', () => {
    const rules = [
      { days: ['mo' as const, 'fr' as const], open: '14:00', close: '18:00' },
      { days: ['sa' as const], open: '08:00', close: '13:00', months: [3, 4, 5, 6, 7, 8, 9, 10] },
    ]

    it('shows whether the shop is open right now', () => {
      const status = mountDetail(makeSalesPoint({ openingHours: rules })).find('.opening-status')

      expect(status.text()).toBe('Geöffnet, heute bis 18 Uhr')
    })

    it('shows when a closed shop opens next', () => {
      const status = mountDetail(
        makeSalesPoint({ openingHours: [{ days: ['mo'], open: '16:00', close: '19:00' }] }),
      ).find('.opening-status')

      expect(status.text()).toBe('Geschlossen, öffnet Montag um 16 Uhr')
    })

    it('lists the opening hours of the current month only', () => {
      const lines = mountDetail(makeSalesPoint({ openingHours: rules }))
        .findAll('.opening-times dt, .opening-times dd')
        .map((el) => el.text())

      // Saturday hours only apply from March to October.
      expect(lines).toEqual(['Mo, Fr', '14 bis 18 Uhr'])
    })

    it('shows the opening hours note, also without rules', () => {
      const wrapper = mountDetail(makeSalesPoint({ openingHours: null, openingHoursNote: 'Nur nach Terminabsprache.' }))

      expect(wrapper.find('.opening-status').exists()).toBe(false)
      expect(wrapper.text()).toContain('Nur nach Terminabsprache.')
    })

    it('shows nothing about opening hours when they are unknown', () => {
      const wrapper = mountDetail(makeSalesPoint({ openingHours: null, openingHoursNote: null }))

      expect(wrapper.find('.opening').exists()).toBe(false)
    })
  })

  it('offers a call button only with a phone number', () => {
    expect(mountDetail(makeSalesPoint({ phone: '0821 472105' })).find('a[href="tel:0821472105"]').text()).toBe('Anrufen')
    expect(mountDetail(makeSalesPoint({ phone: null })).find('a[href^="tel:"]').exists()).toBe(false)
  })

  it('links the route to the coordinates of the shop', () => {
    const route = mountDetail(makeSalesPoint()).find('a.is-primary')

    expect(route.text()).toBe('Route')
    expect(route.attributes('href')).toBe('https://www.google.com/maps/dir/?api=1&destination=48.36,10.89')
  })

  it('groups its waters by club, sorted by name, with the guest price', async () => {
    const salesPoint = makeSalesPoint({ waterIds: ['w-zusam', 'w-kuhsee', 'w-auensee', 'w-see'] })
    const data = makeMapData(
      [makeClub({ id: 'fva', name: 'Fischereiverein Augsburg' }), makeClub({ id: 'fgb', name: 'Fischergilde Barbara' })],
      [
        makeWater({ id: 'w-zusam', name: 'Zusam', clubId: 'fva', prices: { guest: 15 } }),
        makeWater({ id: 'w-kuhsee', name: 'Kuhsee', clubId: 'fva', prices: { guest: 20 } }),
        makeWater({ id: 'w-auensee', name: 'Auensee', clubId: 'fva', guestAccess: 'membersOnly', prices: { member: 15 } }),
        makeWater({ id: 'w-see', name: 'Herrentratsee', clubId: 'fgb', prices: null }),
      ],
      [salesPoint],
    )
    const wrapper = mountDetail(salesPoint, data)

    expect(wrapper.find('h2').text()).toBe('Tageskarten für 4 Gewässer')
    const groups = wrapper.findAll('.club-group').map((group) => ({
      club: group.find('.section-label').text(),
      waters: group.findAll('.water-row').map((row) => row.text()),
    }))
    expect(groups).toEqual([
      { club: 'Fischereiverein Augsburg', waters: ['Auenseenur Mitglieder', 'Kuhsee20 €', 'Zusam15 €'] },
      { club: 'Fischergilde Barbara', waters: ['Herrentratsee–'] },
    ])

    await wrapper.findAll('.water-row')[1]!.trigger('click')
    expect(wrapper.emitted('selectWater')).toEqual([['w-kuhsee']])
  })

  it('links the club headings to the club page, but not an unknown club', async () => {
    const salesPoint = makeSalesPoint({ waterIds: ['w1', 'w2'] })
    const data = makeMapData(
      [makeClub({ id: 'fva', name: 'Fischereiverein Augsburg' })],
      [makeWater({ id: 'w1', clubId: 'fva' }), makeWater({ id: 'w2', clubId: 'missing' })],
      [salesPoint],
    )
    const wrapper = mountDetail(salesPoint, data)

    const links = wrapper.findAll('.club-link')
    expect(links).toHaveLength(1)
    await links[0]!.trigger('click')
    expect(wrapper.emitted('selectClub')).toEqual([['fva']])
  })

  it('skips water ids that do not exist', () => {
    const salesPoint = makeSalesPoint({ waterIds: ['water-a', 'gone'] })

    expect(mountDetail(salesPoint).findAll('.water-row')).toHaveLength(1)
  })

  it('says so when no waters are assigned', () => {
    const wrapper = mountDetail(makeSalesPoint({ waterIds: [] }))

    expect(wrapper.text()).toContain('Noch keine Gewässer zugeordnet.')
  })

  it('mentions an approximate position', () => {
    expect(mountDetail(makeSalesPoint({ coordinatesApproximate: true })).text()).toContain('nur ungefähr')
    expect(mountDetail(makeSalesPoint({ coordinatesApproximate: false })).text()).not.toContain('nur ungefähr')
  })
})
