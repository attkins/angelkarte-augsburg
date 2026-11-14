// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WaterDetail from '@/components/WaterDetail.vue'
import type { WaterFeature } from '@/types'
import { makeClub, makeMapData, makeSalesPoint, makeWater } from '../../tests/fixtures'

// Friday, 13 November 2026, 15:00 local time.
const NOW = new Date(2026, 10, 13, 15, 0)

function mountDetail(water: WaterFeature, data = makeMapData([makeClub()], [water])) {
  return mount(WaterDetail, { props: { water, data, now: NOW } })
}

describe('WaterDetail', () => {
  it('shows name, club and the guest access badge', () => {
    const wrapper = mountDetail(makeWater({ name: 'Kuhsee', guestAccess: 'withMember' }))

    expect(wrapper.find('h1').text()).toBe('Kuhsee')
    expect(wrapper.find('.subtitle').text()).toBe('Fischereiverein A')
    expect(wrapper.find('.access-badge').text()).toBe('Nur mit Mitglied')
  })

  it('links the club to its page', async () => {
    const wrapper = mountDetail(makeWater())

    await wrapper.find('.club-link').trigger('click')

    expect(wrapper.emitted('selectClub')).toEqual([['club-a']])
  })

  it('falls back to "Verein unbekannt" for an unknown club', () => {
    const water = makeWater({ clubId: 'missing' })
    const wrapper = mountDetail(water, makeMapData([], [water], []))

    expect(wrapper.find('.subtitle').text()).toBe('Verein unbekannt')
    expect(wrapper.find('.club-link').exists()).toBe(false)
  })

  it('emits close from the back link and the close button', async () => {
    const wrapper = mountDetail(makeWater())

    await wrapper.find('.back-link').trigger('click')
    await wrapper.find('.close-button').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(2)
  })

  describe('season and guest period', () => {
    it('shows season and guest period as badges', () => {
      const wrapper = mountDetail(
        makeWater({ season: { from: '03-16', to: '12-14' }, guestPeriod: { from: '05-01', to: '10-31' } }),
      )

      const badges = wrapper.findAll('.info-badge').map((b) => b.text())
      expect(badges).toEqual(['Saison 16.3. bis 14.12.', 'Gäste 1.5. bis 31.10.'])
    })

    it('warns when guests are outside their period, together with the access note', () => {
      const wrapper = mountDetail(
        makeWater({ guestPeriod: { from: '07-15', to: '10-31' }, accessNote: 'Nur mit erwachsenem Mitglied.' }),
      )

      const notice = wrapper.find('.notice')
      expect(notice.classes()).toContain('is-warning')
      expect(notice.text()).toBe(
        'Für Gäste gerade nicht freigegeben, wieder ab 15. Juli. Nur mit erwachsenem Mitglied.',
      )
    })

    it('warns about the closed season', () => {
      const wrapper = mountDetail(makeWater({ season: { from: '03-16', to: '10-31' } }))

      expect(wrapper.find('.notice').text()).toBe('Gerade Schonzeit, wieder ab 16. März.')
    })

    it('shows no warning for members-only waters', () => {
      const wrapper = mountDetail(makeWater({ guestAccess: 'membersOnly', season: { from: '03-16', to: '10-31' } }))

      expect(wrapper.find('.notice').exists()).toBe(false)
    })

    it('shows the access note alone as a neutral notice', () => {
      const wrapper = mountDetail(makeWater({ accessNote: 'Ausdruck der Karte erforderlich.' }))

      const notice = wrapper.find('.notice')
      expect(notice.classes()).not.toContain('is-warning')
      expect(notice.text()).toBe('Ausdruck der Karte erforderlich.')
    })
  })

  describe('prices', () => {
    it('shows price tiles in the configured order with the guest price first and emphasised', () => {
      const wrapper = mountDetail(makeWater({ prices: { member: 15, youth: 12, guest: 20, guestYouth: 20 } }))

      const tiles = wrapper.findAll('.price-tile')
      expect(tiles.map((t) => [t.find('.price-label').text(), t.find('.price-value').text()])).toEqual([
        ['Gast', '20 €'],
        ['Mitglied', '15 €'],
        ['Jugend', '12 €'],
        ['Gast Jgd.', '20 €'],
      ])
      expect(tiles[0]!.classes()).toContain('is-main')
    })

    it('shows deposit, validity and note below the tiles instead of as a tile', () => {
      const wrapper = mountDetail(
        makeWater({ prices: { guest: 20, deposit: 5, validFrom: '2027-01-01', note: 'Rückgabe bis 31. Januar.' } }),
      )

      expect(wrapper.findAll('.price-tile')).toHaveLength(1)
      expect(wrapper.find('.price-note').text()).toBe(
        'Plus 5 € Pfand pro Karte. Preise gültig ab 1.1.2027. Rückgabe bis 31. Januar.',
      )
    })

    it('says so when no prices are known', () => {
      const wrapper = mountDetail(makeWater({ prices: null }))

      expect(wrapper.find('.price-grid').exists()).toBe(false)
      expect(wrapper.text()).toContain('Preise noch nicht erfasst.')
    })
  })

  describe('where to buy', () => {
    it('lists the sales points with address and emits their id when clicked', async () => {
      const water = makeWater({ id: 'w1' })
      const data = makeMapData(
        [makeClub()],
        [water],
        [
          makeSalesPoint({ id: 's1', name: 'Jafispo', address: 'Kurzes Geländ 8a', waterIds: ['w1'] }),
          makeSalesPoint({ id: 's2', name: 'Anderer Laden', waterIds: ['other'] }),
        ],
      )
      const wrapper = mountDetail(water, data)

      const rows = wrapper.findAll('.list-row')
      expect(rows).toHaveLength(1)
      expect(rows[0]!.find('.row-title').text()).toBe('Jafispo')
      expect(rows[0]!.text()).toContain('Kurzes Geländ 8a')

      await rows[0]!.trigger('click')
      expect(wrapper.emitted('selectSalesPoint')).toEqual([['s1']])
    })

    it('shows whether a sales point is open right now', () => {
      const water = makeWater({ id: 'w1' })
      const data = makeMapData(
        [makeClub()],
        [water],
        [
          makeSalesPoint({ id: 'open', waterIds: ['w1'], openingHours: [{ days: ['fr'], open: '14:00', close: '18:00' }] }),
          makeSalesPoint({ id: 'closed', waterIds: ['w1'], openingHours: [{ days: ['mo'], open: '16:00', close: '19:00' }] }),
          makeSalesPoint({ id: 'unknown', waterIds: ['w1'], openingHours: null }),
        ],
      )
      const rows = mountDetail(water, data).findAll('.list-row')

      expect(rows[0]!.find('.is-open').text()).toBe('Geöffnet, heute bis 18 Uhr')
      expect(rows[1]!.find('.is-closed').text()).toBe('Geschlossen, öffnet Montag um 16 Uhr')
      expect(rows[2]!.find('.is-open, .is-closed').exists()).toBe(false)
    })

    it('shows the online purchase button and calls the sales points "Oder vor Ort"', () => {
      const water = makeWater({ onlinePurchase: { provider: 'hejfish', url: 'https://www.hejfish.com' } })
      const wrapper = mountDetail(water)

      const button = wrapper.find('a.primary-action')
      expect(button.text()).toBe('Online kaufen bei hejfish')
      expect(button.attributes('href')).toBe('https://www.hejfish.com')
      expect(button.attributes('rel')).toBe('noopener')
      expect(wrapper.find('.section-label').text()).toBe('Oder vor Ort')
    })

    it('uses the long heading without online purchase', () => {
      expect(mountDetail(makeWater()).find('h2').text()).toBe('Hier bekommst Du die Karte')
    })

    it('says so when there is no way to buy a ticket', () => {
      const water = makeWater()
      const wrapper = mountDetail(water, makeMapData([makeClub()], [water], []))

      expect(wrapper.text()).toContain('Noch keine Ausgabestelle erfasst.')
    })
  })

  it('shows fish species as chips, only when there are any', () => {
    expect(mountDetail(makeWater({ species: ['Hecht', 'Zander'] })).findAll('.chip').map((c) => c.text())).toEqual([
      'Hecht',
      'Zander',
    ])
    expect(mountDetail(makeWater({ species: [] })).text()).not.toContain('Fischarten')
  })

  it('puts rules, season note, closed seasons and club details into collapsible sections', () => {
    const wrapper = mountDetail(
      makeWater({
        rules: ['Nur Fliegenfischen'],
        seasonNote: 'Saison beginnt mit dem Karfreitagsfischen.',
        closedSeasons: ['Gesperrt 01.10. bis 15.03.'],
      }),
    )

    const sections = wrapper.findAll('details')
    expect(sections.map((s) => s.find('summary').text())).toEqual([
      'Regeln und Besonderheiten',
      'Schonzeiten und Mindestmaße',
      'Verein und Kontakt',
    ])
    expect(sections[0]!.text()).toContain('Saison beginnt mit dem Karfreitagsfischen.')
    expect(sections[0]!.text()).toContain('Nur Fliegenfischen')
    expect(sections[1]!.text()).toContain('Gesperrt 01.10. bis 15.03.')
    expect(sections[2]!.find('a').text()).toBe('example.org')
  })

  it('leaves out empty sections', () => {
    const club = makeClub({ website: null, contact: null })
    const water = makeWater()
    const wrapper = mountDetail(water, makeMapData([club], [water]))

    expect(wrapper.findAll('details')).toHaveLength(0)
  })

  it('links the source next to the check date', () => {
    const meta = mountDetail(makeWater({ lastChecked: '2026-11-13', source: 'https://example.org/preise' })).find('.meta')

    expect(meta.text()).toContain('Zuletzt geprüft am 13.11.2026')
    expect(meta.find('a').attributes('href')).toBe('https://example.org/preise')
  })

  it('shows the check date without a link when the source is missing', () => {
    const meta = mountDetail(makeWater({ lastChecked: '2026-11-13', source: null })).find('.meta')

    expect(meta.text()).toBe('Zuletzt geprüft am 13.11.2026')
  })

  it('mentions placeholder geometry only', () => {
    expect(mountDetail(makeWater({ geometryStatus: 'placeholder' })).find('.warning').exists()).toBe(true)
    expect(mountDetail(makeWater({ geometryStatus: 'traced' })).find('.warning').exists()).toBe(false)
  })
})
