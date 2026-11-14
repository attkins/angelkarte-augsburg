// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import ImprintPage from '@/components/ImprintPage.vue'
import type { Imprint } from '@/config'

const imprint: Imprint = {
  name: 'Erika Mustermann',
  street: 'Seeweg 1',
  city: '86150 Augsburg',
  email: 'erika@example.org',
}

describe('ImprintPage', () => {
  it('starts with a short description of the project', () => {
    expect(mount(ImprintPage, { props: { imprint } }).find('.about').text()).toContain('Tageskarte')
  })

  it('shows the operator and a mail link', () => {
    const wrapper = mount(ImprintPage, { props: { imprint } })

    expect(wrapper.find('h1').text()).toBe('Impressum')
    expect(wrapper.find('address').text()).toContain('Erika Mustermann')
    expect(wrapper.find('address').text()).toContain('86150 Augsburg')
    expect(wrapper.find('a[href="mailto:erika@example.org"]').exists()).toBe(true)
  })

  it('leaves out the operator section without a hint when the operator is missing', () => {
    const wrapper = mount(ImprintPage, { props: { imprint: null } })

    expect(wrapper.find('address').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('§ 5 DDG')
    expect(wrapper.text()).not.toContain('VITE_')
  })

  it.each(['https://www.openstreetmap.org/copyright', 'https://www.geodaten.bayern.de'])('credits %s', (href) => {
    expect(mount(ImprintPage).find(`a[href="${href}"]`).exists()).toBe(true)
  })

  it('opens external links in a new tab without opener', () => {
    const external = mount(ImprintPage)
      .findAll('a')
      .filter((a) => a.attributes('href')?.startsWith('http'))

    expect(external.length).toBeGreaterThan(0)
    for (const link of external) {
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toBe('noopener')
    }
  })

  it('emits close from the back link and the close button', async () => {
    const wrapper = mount(ImprintPage)

    await wrapper.find('.back-link').trigger('click')
    await wrapper.find('.close-button').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(2)
  })

  it('shows the version from package.json', () => {
    const { version } = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as { version: string }

    expect(mount(ImprintPage).find('.version').text()).toBe(`Angelkarte Version ${version}`)
  })
})
