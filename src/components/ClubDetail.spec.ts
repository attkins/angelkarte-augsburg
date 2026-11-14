// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ClubDetail from '@/components/ClubDetail.vue'
import type { Club, MapData } from '@/types'
import { makeClub, makeMapData, makeSalesPoint, makeWater } from '../../tests/fixtures'

// Friday, 13 November 2026, 15:00 local time.
const NOW = new Date(2026, 10, 13, 15, 0)

function mountDetail(club: Club = makeClub(), data: MapData = makeMapData([club])) {
  return mount(ClubDetail, { props: { club, data, now: NOW } })
}

describe('ClubDetail', () => {
  it('shows name, contact and website', () => {
    const wrapper = mountDetail(
      makeClub({ name: 'Fischereiverein Augsburg', contact: 'Holzbachstr. 12, 86152 Augsburg', website: 'https://www.fva-ev.de/' }),
    )

    expect(wrapper.find('.eyebrow').text()).toBe('Verein')
    expect(wrapper.find('h1').text()).toBe('Fischereiverein Augsburg')
    expect(wrapper.find('.subtitle').text()).toBe('Holzbachstr. 12, 86152 Augsburg')
    const website = wrapper.find('a.website')
    expect(website.attributes('href')).toBe('https://www.fva-ev.de/')
    expect(website.text()).toBe('fva-ev.de')
  })

  it('leaves out contact and website when unknown', () => {
    const wrapper = mountDetail(makeClub({ contact: null, website: null }))

    expect(wrapper.find('.subtitle').exists()).toBe(false)
    expect(wrapper.find('a.website').exists()).toBe(false)
  })

  it('lists only its own waters, sorted by name, with guest price or members only', async () => {
    const club = makeClub({ id: 'fva' })
    const data = makeMapData(
      [club, makeClub({ id: 'other' })],
      [
        makeWater({ id: 'w-zusam', name: 'Zusam', clubId: 'fva', prices: { guest: 15 } }),
        makeWater({ id: 'w-auensee', name: 'Auensee', clubId: 'fva', guestAccess: 'membersOnly' }),
        makeWater({ id: 'w-kuhsee', name: 'Kuhsee', clubId: 'fva', prices: null }),
        makeWater({ id: 'w-fremd', name: 'Fremdsee', clubId: 'other' }),
      ],
      [],
    )
    const wrapper = mountDetail(club, data)

    expect(wrapper.find('h2').text()).toBe('3 Gewässer')
    const rows = wrapper.findAll('.water-row')
    expect(rows.map((row) => row.find('.water-name').text())).toEqual(['Auensee', 'Kuhsee', 'Zusam'])
    expect(rows[0]!.find('.members-only').exists()).toBe(true)
    expect(rows[1]!.find('.water-price').text()).toBe('–')
    expect(rows[2]!.find('.water-price').text()).toBe('15 €')

    await rows[2]!.trigger('click')
    expect(wrapper.emitted('selectWater')).toEqual([['w-zusam']])
  })

  it('shows the season, online purchase and whether a water is closed right now', () => {
    const club = makeClub()
    const data = makeMapData(
      [club],
      [
        makeWater({
          id: 'w1',
          name: 'A',
          season: { from: '01-01', to: '12-31' },
          onlinePurchase: { provider: 'hejfish', url: 'https://example.org' },
        }),
        // Closed in November.
        makeWater({ id: 'w2', name: 'B', season: { from: '03-01', to: '10-31' } }),
      ],
      [],
    )
    const subs = mountDetail(club, data).findAll('.water-sub')

    expect(subs.map((sub) => sub.text())).toEqual(['Saison 1.1. bis 31.12., online buchbar', 'Gerade geschlossen'])
    expect(subs[1]!.classes()).toContain('is-closed')
  })

  it('says so when the club has no waters', () => {
    expect(mountDetail(makeClub(), makeMapData([makeClub()], [], [])).text()).toContain('Noch keine Gewässer erfasst.')
  })

  it('lists the sales points for its waters, the ones with most waters first', async () => {
    const club = makeClub({ id: 'fva' })
    const data = makeMapData(
      [club, makeClub({ id: 'other' })],
      [makeWater({ id: 'w1', clubId: 'fva' }), makeWater({ id: 'w2', clubId: 'fva' }), makeWater({ id: 'w3', clubId: 'other' })],
      [
        makeSalesPoint({ id: 's-one', name: 'Kiosk', waterIds: ['w1'] }),
        makeSalesPoint({ id: 's-two', name: 'Angelladen', waterIds: ['w1', 'w2', 'w3'] }),
        makeSalesPoint({ id: 's-none', name: 'Fremdladen', waterIds: ['w3'] }),
      ],
    )
    const wrapper = mountDetail(club, data)

    const rows = wrapper.findAll('.list-row')
    expect(rows.map((row) => row.find('.row-title').text())).toEqual(['Angelladen', 'Kiosk'])
    expect(rows[0]!.text()).toContain('für 2 Gewässer')

    await rows[1]!.trigger('click')
    expect(wrapper.emitted('selectSalesPoint')).toEqual([['s-one']])
  })

  it('says so when no sales point sells for the club', () => {
    expect(mountDetail(makeClub(), makeMapData([makeClub()], [makeWater()], [])).text()).toContain(
      'Noch keine Verkaufsstelle erfasst.',
    )
  })

  it('emits close from the back link and the close button', async () => {
    const wrapper = mountDetail()

    await wrapper.find('.back-link').trigger('click')
    await wrapper.find('.close-button').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(2)
  })
})
