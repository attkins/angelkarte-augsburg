// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WelcomeDialog from '@/components/WelcomeDialog.vue'

function mountDialog() {
  return mount(WelcomeDialog, { attachTo: document.body })
}

describe('WelcomeDialog', () => {
  it('opens on mount and explains colours, filters and the missing guarantee', () => {
    const wrapper = mountDialog()
    expect(wrapper.find('dialog').attributes()).toHaveProperty('open')
    const colours = wrapper.findAll('.colours li').map((item) => item.text())
    expect(colours).toEqual(['Gäste willkommen', 'Nur mit Mitglied', 'Nur Mitglieder', 'Unbekannt'])
    expect(wrapper.text()).toContain('Saison offen')
    expect(wrapper.text()).toContain('Karte heute noch')
    expect(wrapper.text()).toContain('ohne Gewähr')
    wrapper.unmount()
  })

  it('closes with the start button, the close button and Escape', async () => {
    const wrapper = mountDialog()
    await wrapper.find('.start').trigger('click')
    await wrapper.find('.close').trigger('click')
    await wrapper.find('dialog').trigger('cancel')
    expect(wrapper.emitted('close')).toHaveLength(3)
    wrapper.unmount()
  })
})
