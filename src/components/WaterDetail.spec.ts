// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WaterDetail from '@/components/WaterDetail.vue'
import type { WaterFeature } from '@/types'
import { makeClub, makeMapData, makeSalesPoint, makeWater } from '../../tests/fixtures'

// Friday, 13 November 2026, 15:00 local time.
const NOW = new Date(2026, 10, 13, 15, 0)

function mountDetail(water: WaterFeature, data = makeMapData([makeClub()], [water])) {
  // No report address, so the result does not depend on the imprint in the local .env.
  return mount(WaterDetail, { props: { water, data, now: NOW, reportEmail: null } })
}

describe('WaterDetail', () => {
  it('shows name, club and the guest access badge', () => {
    const wrapper = mountDetail(makeWater({ name: 'Kuhsee', guestAccess: 'withMember' }))

    expect(wrapper.find('h1').text()).toBe('Kuhsee')
    expect(wrapper.find('.subtitle').text()).toBe('Fischereiverein A')
    expect(wrapper.find('.access-badge').text()).toBe('Nur mit Mitglied')
  })

  it('shows a warning in bold with its link', () => {
    const wrapper = mountDetail(makeWater({ warning: { text: 'Fische nicht essen.', url: 'https://example.org/pfc' } }))

    const alert = wrapper.find('.notice.is-alert')
    expect(alert.find('strong').text()).toBe('Fische nicht essen.')
    expect(alert.find('a').attributes('href')).toBe('https://example.org/pfc')
  })

  it('shows no warning when the water has none', () => {
    expect(mountDetail(makeWater()).find('.notice.is-alert').exists()).toBe(false)
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

      const badges = wrapper.findAll('.info-badge:not(.sun-badge)').map((b) => b.text())
      expect(badges).toEqual(['Saison 16.3. bis 14.12.', 'Gäste 1.5. bis 31.10.'])
    })

    it('shows the maximum depth and links a depth map, only when known', () => {
      const withDepth = mountDetail(
        makeWater({ maxDepth: 14.5, maxDepthSource: 'https://example.org', depthMapUrl: 'https://example.org/tiefen.pdf' }),
      )
      expect(withDepth.findAll('.info-badge:not(.sun-badge)').map((b) => b.text())).toEqual(['bis 14,5 m tief', 'Tiefenkarte'])
      const link = withDepth.find('a.info-badge')
      expect(link.attributes('href')).toBe('https://example.org/tiefen.pdf')
      expect(link.attributes('target')).toBe('_blank')

      expect(mountDetail(makeWater()).findAll('.info-badge:not(.sun-badge)')).toHaveLength(0)
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

    it('keeps the old prices until the new list starts and announces it', () => {
      // NOW is 13 November 2026.
      const water = makeWater({
        prices: { guest: 25, member: 20, validFrom: '2027-01-01', note: 'Neue Preisliste.' },
        previousPrices: { guest: 20, member: 15, note: 'Alte Preisliste.' },
      })
      const wrapper = mountDetail(water)

      expect(wrapper.findAll('.price-value').map((v) => v.text())).toEqual(['20 €', '15 €'])
      expect(wrapper.find('.price-note').text()).toBe('Alte Preisliste.')
      expect(wrapper.find('.upcoming-prices').text()).toBe('Ab 1.1.2027: Gast 25 €, Mitglied 20 €.')
    })

    it('shows the new prices once they apply', () => {
      const water = makeWater({
        prices: { guest: 25, member: 20, validFrom: '2026-11-01' },
        previousPrices: { guest: 20, member: 15 },
      })
      const wrapper = mountDetail(water)

      expect(wrapper.findAll('.price-value').map((v) => v.text())).toEqual(['25 €', '20 €'])
      expect(wrapper.find('.upcoming-prices').exists()).toBe(false)
      // The start date lies in the past, no need to mention it.
      expect(wrapper.find('.price-note').exists()).toBe(false)
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

      const rows = wrapper.findAll('button.list-row')
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
      const rows = mountDetail(water, data).findAll('button.list-row')

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
    expect(mountDetail(makeWater({ species: ['Hecht', 'Zander'] })).findAll('.chips .chip').map((c) => c.text())).toEqual([
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

    const sections = wrapper.findAll('details:not(.legal):not(.protection)')
    expect(sections.map((s) => s.find('summary').text())).toEqual([
      'Regeln und Besonderheiten',
      'Schonzeiten und Mindestmaße des Vereins',
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

    expect(wrapper.findAll('details:not(.legal):not(.protection)')).toHaveLength(0)
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

  describe('error report link', () => {
    it('opens a mail with the water name and ID', () => {
      const water = makeWater({ id: 'fva-kuhsee', name: 'Kuhsee' })
      const wrapper = mount(WaterDetail, {
        props: { water, data: makeMapData([makeClub()], [water]), now: NOW, reportEmail: 'team@example.org' },
      })

      const link = wrapper.find('.meta .report a')
      expect(link.text()).toBe('Fehler melden')
      const href = link.attributes('href')!
      expect(href.startsWith('mailto:team@example.org?')).toBe(true)
      const body = new URLSearchParams(href.split('?')[1]).get('body')!
      expect(body).toContain('ID: fva-kuhsee')
      expect(body).toContain('#/gewaesser/fva-kuhsee')
    })

    it('is hidden without a report address', () => {
      const water = makeWater()
      const wrapper = mount(WaterDetail, {
        props: { water, data: makeMapData([makeClub()], [water]), now: NOW, reportEmail: null },
      })

      expect(wrapper.find('.meta .report').exists()).toBe(false)
    })
  })

  describe('directions', () => {
    it('lists parking first with a route link to each point', () => {
      const wrapper = mountDetail(
        makeWater({
          accessPoints: [
            { type: 'access', coordinates: [10.905, 48.301], note: 'Einstieg über den Steg' },
            { type: 'parking', coordinates: [10.902, 48.299], name: 'Am Nordufer', note: 'Schranke ab 22 Uhr' },
          ],
        }),
      )

      const rows = wrapper.findAll('.directions a.list-row')
      expect(rows).toHaveLength(2)
      expect(rows[0]!.find('.row-title').text()).toBe('Am Nordufer')
      expect(rows[0]!.find('.row-sub').text()).toBe('Parkplatz, Schranke ab 22 Uhr')
      expect(rows[0]!.attributes('href')).toBe('https://www.google.com/maps/dir/?api=1&destination=48.299,10.902')
      expect(rows[0]!.attributes('target')).toBe('_blank')
      expect(rows[1]!.find('.row-title').text()).toBe('Zugang')
      expect(rows[1]!.find('.row-sub').text()).toBe('Einstieg über den Steg')
    })

    it('falls back to a route to the middle of the lake', () => {
      const wrapper = mountDetail(makeWater())

      const rows = wrapper.findAll('.directions a.list-row')
      expect(rows).toHaveLength(1)
      expect(rows[0]!.find('.row-title').text()).toBe('Route zum Gewässer')
      expect(rows[0]!.find('.row-sub').text()).toBe('Noch kein Parkplatz erfasst. Die Route führt zur Mitte des Sees.')
      expect(rows[0]!.attributes('href')).toMatch(/^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=48\.30\d*,10\.90\d*$/)
    })

    it('says "Strecke" for a river', () => {
      const water: WaterFeature = {
        ...makeWater(),
        geometry: {
          type: 'LineString',
          coordinates: [
            [10.9, 48.3],
            [10.9, 48.4],
          ],
        },
      }

      expect(mountDetail(water).find('.directions .row-sub').text()).toBe(
        'Noch kein Parkplatz erfasst. Die Route führt zur Mitte der Strecke.',
      )
    })
  })

  describe('sun times', () => {
    it('shows sunrise and sunset at the water on the shown day', () => {
      const badge = mountDetail(makeWater()).find('.sun-badge')

      // Testsee near Augsburg on 13 November 2026: sunrise 7:21, sunset 16:40 (astral, NOAA).
      expect(badge.find('.sun-text').text()).toMatch(/^Sonne 7:2[01] bis 16:(39|40)$/)
      expect(badge.attributes('title')).toMatch(/^Sonnenaufgang 7:2\d Uhr, Sonnenuntergang 16:[34]\d Uhr\. Hell genug ab 6:4\d Uhr und bis 17:1\d Uhr\.$/)
    })

    it('follows the planned day', () => {
      const water = makeWater()
      const wrapper = mount(WaterDetail, {
        props: { water, data: makeMapData([makeClub()], [water]), now: new Date(2026, 5, 21), planned: true, reportEmail: null },
      })

      expect(wrapper.find('.sun-badge .sun-text').text()).toMatch(/^Sonne 5:1\d bis 21:2\d$/)
    })
  })

  describe('legal requirements', () => {
    it('shows the Bavarian rules for waters in Bavaria', () => {
      const legal = mountDetail(makeWater({ id: 'fva-kuhsee' })).find('details.legal')

      expect(legal.find('summary').text()).toBe('Was Du in Bayern zum Angeln brauchst')
      expect(legal.text()).toContain('Fischereischein')
      expect(legal.text()).toContain('Ohne Gewähr, Stand 19.11.2026.')
      expect(legal.find('a').attributes('href')).toContain('stadt.muenchen.de')
    })

    it('shows the Tyrolean rules for waters with an at- id', () => {
      const legal = mountDetail(makeWater({ id: 'at-plansee' })).find('details.legal')

      expect(legal.find('summary').text()).toBe('Was Du in Tirol zum Angeln brauchst')
      expect(legal.text()).toContain('Gastfischerkarte')
      expect(legal.findAll('a')).toHaveLength(2)
      expect(legal.find('.legal-sources').text()).toMatch(/Quellen: oesterreich\.gv\.at: Fischen in Tirol, Tiroler Fischereiverband$/)
    })

    it('replaces the licence points for waters that need no licence', () => {
      const legal = mountDetail(makeWater({ id: 'at-teich', licenceExempt: true })).find('details.legal')

      expect(legal.findAll('li').map((li) => li.text())).toEqual([
        'An diesem Gewässer brauchst Du keinen staatlichen Schein, weder Fischerkarte noch Gastfischerkarte. Es reicht die Karte des Betreibers.',
      ])
    })
  })

  describe('closed seasons by law', () => {
    it('marks protected species and names them with the end of the closed season', () => {
      const water = makeWater({ species: ['Hecht', 'Karpfen', 'Bachforelle', 'Forelle'] })
      const wrapper = mount(WaterDetail, {
        props: { water, data: makeMapData([makeClub()], [water]), now: new Date(2026, 2, 1), reportEmail: null },
      })

      expect(wrapper.findAll('.chip.is-protected').map((c) => c.text())).toEqual(['Hecht, geschont', 'Bachforelle, geschont'])
      expect(wrapper.find('.protection-summary').text()).toBe('Heute gesetzlich geschont: Hecht bis 30.4., Bachforelle bis 15.3.')
    })

    it('says so when nothing is protected, and names the planned day', () => {
      const water = makeWater({ species: ['Hecht'] })
      const wrapper = mount(WaterDetail, {
        props: { water, data: makeMapData([makeClub()], [water]), now: new Date(2026, 6, 20), planned: true, reportEmail: null },
      })

      expect(wrapper.find('.protection-summary').text()).toBe('Am 20. Juli ist keine dieser Fischarten gesetzlich geschont.')
    })

    it('lists the legal rules with sources, leaving out group names', () => {
      const water = makeWater({ id: 'at-see', species: ['Hecht', 'Weißfisch', 'Regenbogenforelle'] })
      const table = mountDetail(water).find('details.protection')

      expect(table.findAll('tbody tr').map((r) => r.findAll('th, td').map((c) => c.text()))).toEqual([
        ['Hecht', '1.3. bis 30.4.', '50 cm'],
        ['Regenbogenforelle', 'keine', '30 cm'],
      ])
      expect(table.find('.legal-sources').text()).toContain('Gilt in Tirol. Der Verein kann strengere Regeln haben.')
      expect(table.find('.legal-sources a').text()).toBe('Tiroler Fischereiverordnung')
    })

    it('shows nothing when no species has a rule', () => {
      const wrapper = mountDetail(makeWater({ species: ['Forelle'] }))
      expect(wrapper.find('.protection-summary').exists()).toBe(false)
      expect(wrapper.find('details.protection').exists()).toBe(false)
    })
  })
})
