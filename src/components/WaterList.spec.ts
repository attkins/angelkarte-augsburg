// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import WaterList from '@/components/WaterList.vue'
import { resetFavouritesForTests, useFavourites } from '@/composables/useFavourites'
import { resetLocationForTests } from '@/composables/useLocation'
import type { WaterFeature } from '@/types'
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

  it('marks starred waters with a star', () => {
    window.localStorage.clear()
    resetFavouritesForTests()
    useFavourites().toggle('w-zusam')

    const rows = mount(WaterList, { props: { data } }).findAll('.row')
    const marked = rows.filter((r) => r.find('.favourite-mark').exists()).map((r) => r.find('.name').text())
    expect(marked).toHaveLength(1)
    expect(marked[0]).toContain('Zusam')
    expect(marked[0]).toContain('gemerkt')
    window.localStorage.clear()
    resetFavouritesForTests()
  })

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

  describe('sort by distance', () => {
    /** A small square lake whose south-west corner is at the given point. */
    function lakeAt(id: string, name: string, lng: number, lat: number): WaterFeature {
      const water = makeWater({ id, name, clubId: 'c1' })
      water.geometry = {
        type: 'Polygon',
        coordinates: [
          [
            [lng, lat],
            [lng + 0.005, lat],
            [lng + 0.005, lat + 0.005],
            [lng, lat + 0.005],
            [lng, lat],
          ],
        ],
      }
      return water
    }

    // Augsburg Mitte is the fallback start (48.3689, 10.8978).
    const lakes = makeMapData(
      [makeClub({ id: 'c1', shortName: 'FVA' })],
      [
        lakeAt('far', 'Aaa fern', 11.3, 48.5),
        lakeAt('near', 'Zzz nah', 10.9, 48.37),
        lakeAt('middle', 'Mmm mittel', 10.98, 48.36),
      ],
      [],
    )

    function mockGeolocation(result: { lat: number; lng: number } | 'denied' | 'pending') {
      const getCurrentPosition = vi.fn((success: PositionCallback, failure?: PositionErrorCallback | null) => {
        if (result === 'pending') return
        if (result === 'denied') {
          failure?.({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError)
          return
        }
        success({ coords: { latitude: result.lat, longitude: result.lng } } as GeolocationPosition)
      })
      Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true })
      return getCurrentPosition
    }

    const names = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('.row .name').map((n) => n.text().split(' ')[1])

    afterEach(() => {
      resetLocationForTests()
    })

    it('starts sorted by name without asking for the location', () => {
      const getCurrentPosition = mockGeolocation({ lat: 48.5, lng: 11.3 })
      const wrapper = mount(WaterList, { props: { data: lakes } })

      expect(names(wrapper)).toEqual(['fern', 'mittel', 'nah'])
      expect(getCurrentPosition).not.toHaveBeenCalled()
      expect(wrapper.find('.origin-note').exists()).toBe(false)
    })

    it('sorts by distance from the own location and shows the distance', async () => {
      mockGeolocation({ lat: 48.5, lng: 11.3 })
      const wrapper = mount(WaterList, { props: { data: lakes } })

      await wrapper.findAll('.sort-toggle button')[1]!.trigger('click')

      expect(names(wrapper)).toEqual(['fern', 'mittel', 'nah'])
      expect(wrapper.findAll('.club')[0]!.text()).toBe('FVA · unter 100 m')
      expect(wrapper.find('.origin-note').text()).toBe('Luftlinie von deinem Standort')
    })

    it('falls back to Augsburg Mitte when the location is not shared', async () => {
      mockGeolocation('denied')
      const wrapper = mount(WaterList, { props: { data: lakes } })

      await wrapper.findAll('.sort-toggle button')[1]!.trigger('click')

      expect(names(wrapper)).toEqual(['nah', 'mittel', 'fern'])
      expect(wrapper.find('.origin-note').text()).toContain('Augsburg Mitte')
    })

    it('uses Augsburg Mitte while the location is still being found', async () => {
      mockGeolocation('pending')
      const wrapper = mount(WaterList, { props: { data: lakes } })

      await wrapper.findAll('.sort-toggle button')[1]!.trigger('click')

      expect(names(wrapper)).toEqual(['nah', 'mittel', 'fern'])
      expect(wrapper.find('.origin-note').text()).toContain('Standort wird ermittelt')
    })

    it('goes back to the name order', async () => {
      mockGeolocation('denied')
      const wrapper = mount(WaterList, { props: { data: lakes } })
      const [byName, byDistance] = wrapper.findAll('.sort-toggle button')

      await byDistance!.trigger('click')
      await byName!.trigger('click')

      expect(names(wrapper)).toEqual(['fern', 'mittel', 'nah'])
      expect(wrapper.find('.club').text()).toBe('FVA')
    })
  })
})
