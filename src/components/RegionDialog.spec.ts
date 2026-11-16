// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RegionDialog from '@/components/RegionDialog.vue'
import { REGIONS } from '@/config'

function mountDialog(current: (typeof REGIONS)[number]['id'] | null = 'augsburg') {
  return mount(RegionDialog, { props: { regions: REGIONS, current }, attachTo: document.body })
}

describe('RegionDialog', () => {
  it('opens on mount and lists every region with its description', () => {
    const wrapper = mountDialog()
    expect(wrapper.find('dialog').attributes()).toHaveProperty('open')
    const names = wrapper.findAll('.region .name').map((n) => n.text())
    expect(names).toEqual(REGIONS.map((r) => r.label))
    expect(wrapper.text()).toContain('Tannheimer Tal')
    wrapper.unmount()
  })

  it('marks the current region only', () => {
    const wrapper = mountDialog('fernpass')
    const current = wrapper.findAll('.region[aria-current="true"]')
    expect(current).toHaveLength(1)
    expect(current[0]!.text()).toContain('Fernpass')
    wrapper.unmount()
  })

  it('marks nothing while the map is between regions', () => {
    const wrapper = mountDialog(null)
    expect(wrapper.findAll('.region[aria-current]')).toHaveLength(0)
    wrapper.unmount()
  })

  it('emits the picked region', async () => {
    const wrapper = mountDialog()
    await wrapper.findAll('.region')[2]!.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([REGIONS[2]])
    wrapper.unmount()
  })

  it('closes with the close button, Escape and a click on the backdrop', async () => {
    const wrapper = mountDialog()
    await wrapper.find('.close').trigger('click')
    await wrapper.find('dialog').trigger('cancel')
    await wrapper.find('dialog').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(3)
    wrapper.unmount()
  })

  it('does not close on a click inside the box', async () => {
    const wrapper = mountDialog()
    await wrapper.find('.box').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()
    wrapper.unmount()
  })
})
