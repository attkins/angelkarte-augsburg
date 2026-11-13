// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WaterPopup from '@/components/WaterPopup.vue'
import { GUEST_ACCESS } from '@/config'
import type { WaterFeature } from '@/types'
import { makeClub, makeMapData, makeSalesPoint, makeWater } from '../../tests/fixtures'

function mountPopup(water: WaterFeature, data = makeMapData([makeClub()], [water])) {
  return mount(WaterPopup, { props: { water, data } })
}

describe('WaterPopup', () => {
  it('shows name, club and the guest access badge', () => {
    const wrapper = mountPopup(makeWater({ name: 'Kuhsee', guestAccess: 'withMember' }))

    expect(wrapper.find('h3').text()).toBe('Kuhsee')
    expect(wrapper.find('.club').text()).toBe('Fischereiverein A')
    expect(wrapper.find('.access').text()).toBe(GUEST_ACCESS.withMember.label)
  })

  it('falls back to "Verein unbekannt" for an unknown club', () => {
    const water = makeWater({ clubId: 'missing' })
    const wrapper = mountPopup(water, makeMapData([], [water], []))

    expect(wrapper.find('.club').text()).toBe('Verein unbekannt')
  })

  it('lists prices in the configured order and skips missing ones', () => {
    const wrapper = mountPopup(makeWater({ prices: { member: 15, deposit: 5, guest: 22 } }))

    const rows = wrapper.findAll('table.prices tr').map((row) => row.findAll('td').map((cell) => cell.text()))
    expect(rows).toEqual([
      ['Gast', '22 €'],
      ['Mitglied', '15 €'],
      ['Pfand', '5 €'],
    ])
  })

  it('says so when no prices are known', () => {
    const wrapper = mountPopup(makeWater({ prices: null }))

    expect(wrapper.find('table.prices').exists()).toBe(false)
    expect(wrapper.text()).toContain('Preise noch nicht erfasst.')
  })

  it('shows season, access note, price validity and price note', () => {
    const wrapper = mountPopup(
      makeWater({
        season: '16.03. bis 14.12.',
        accessNote: 'Gäste nur am Wochenende.',
        prices: { guest: 20, validFrom: '2027-01-01', note: 'Pfand laut Ladenliste.' },
      }),
    )

    const text = wrapper.text()
    expect(text).toContain('Saison: 16.03. bis 14.12.')
    expect(text).toContain('Gäste nur am Wochenende.')
    expect(text).toContain('Preise gültig ab 1.1.2027.')
    expect(text).toContain('Pfand laut Ladenliste.')
  })

  it('does not show season or validity when they are not set', () => {
    const wrapper = mountPopup(makeWater({ season: null, prices: { guest: 20 } }))

    expect(wrapper.text()).not.toContain('Saison')
    expect(wrapper.text()).not.toContain('gültig ab')
  })

  it('lists the sales points of the water and emits their id when clicked', async () => {
    const water = makeWater({ id: 'w1' })
    const data = makeMapData(
      [makeClub()],
      [water],
      [
        makeSalesPoint({ id: 's1', name: 'Jafispo', waterIds: ['w1'] }),
        makeSalesPoint({ id: 's2', name: 'Anderer Laden', waterIds: ['other'] }),
      ],
    )
    const wrapper = mountPopup(water, data)

    const buttons = wrapper.findAll('button.link')
    expect(buttons.map((b) => b.text())).toEqual(['Jafispo'])

    await buttons[0]!.trigger('click')
    expect(wrapper.emitted('selectSalesPoint')).toEqual([['s1']])
  })

  it('shows the online purchase link with its provider', () => {
    const wrapper = mountPopup(
      makeWater({ onlinePurchase: { provider: 'Angelroute', url: 'https://angelroute.de' } }),
      makeMapData([makeClub()], [makeWater()], []),
    )

    const link = wrapper.find('a[href="https://angelroute.de"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('Angelroute')
    expect(link.attributes('rel')).toBe('noopener')
  })

  it('says so when there is neither a sales point nor online purchase', () => {
    const water = makeWater({ onlinePurchase: null })
    const wrapper = mountPopup(water, makeMapData([makeClub()], [water], []))

    expect(wrapper.text()).toContain('Noch keine Ausgabestelle erfasst.')
  })

  it('shows rules and closed seasons in the details section', () => {
    const wrapper = mountPopup(
      makeWater({ rules: ['Nur Fliegenfischen'], closedSeasons: ['Gesperrt 01.10. bis 15.03.'] }),
    )

    const details = wrapper.find('details')
    expect(details.exists()).toBe(true)
    expect(details.text()).toContain('Nur Fliegenfischen')
    expect(details.text()).toContain('Gesperrt 01.10. bis 15.03.')
  })

  it('hides the details section when there is nothing to show', () => {
    const club = makeClub({ website: null, contact: null })
    const water = makeWater()
    const wrapper = mountPopup(water, makeMapData([club], [water]))

    expect(wrapper.find('details').exists()).toBe(false)
  })

  it('links the source next to the check date', () => {
    const wrapper = mountPopup(makeWater({ lastChecked: '2026-11-13', source: 'https://example.org/preise' }))

    const meta = wrapper.find('.meta')
    expect(meta.text()).toContain('Zuletzt geprüft am 13.11.2026')
    expect(meta.find('a').attributes('href')).toBe('https://example.org/preise')
  })

  it('shows the check date without a link when the source is missing', () => {
    const wrapper = mountPopup(makeWater({ lastChecked: '2026-11-13', source: null }))

    const meta = wrapper.find('.meta')
    expect(meta.text()).toBe('Zuletzt geprüft am 13.11.2026')
    expect(meta.find('a').exists()).toBe(false)
  })

  it('warns about placeholder geometry only', () => {
    expect(mountPopup(makeWater({ geometryStatus: 'placeholder' })).find('.warning').exists()).toBe(true)
    expect(mountPopup(makeWater({ geometryStatus: 'traced' })).find('.warning').exists()).toBe(false)
  })
})
