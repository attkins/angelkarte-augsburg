// Automated accessibility checks (T9) with axe against WCAG 2.1 A and AA, in both themes.
// They cover what a tool can find: contrast, names, roles, ARIA. Keyboard use and screen reader
// wording were checked by hand, see concept.md.
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, openApp, test } from './fixtures'

const PAGES = [
  ['list', ''],
  ['water', '#/gewaesser/fva-kuhsee'],
  ['water with a planned day', '#/gewaesser/fva-kuhsee?tag=2027-03-10'],
  ['sales point', '#/verkaufsstelle/jafispo'],
  ['club', '#/verein/fva-augsburg'],
  ['imprint', '#/impressum'],
] as const

async function violations(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // Map tiles are pictures of a map, Leaflet's attribution links are checked with the rest.
    .exclude('.leaflet-tile-pane')
    .analyze()
  return result.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    nodes: v.nodes.map((n) => `${n.target.join(' ')}: ${n.failureSummary?.split('\n').slice(1).join(' ')}`),
  }))
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`accessibility, ${scheme}`, () => {
    test.use({ colorScheme: scheme })

    for (const [name, hash] of PAGES) {
      test(name, async ({ page }) => {
        await openApp(page, hash)
        if (hash) await expect(page.locator('.detail h1').first()).toBeVisible()
        expect(await violations(page)).toEqual([])
      })
    }
  })
}

test.describe('accessibility of dialogs and states', () => {
  test.describe('first visit', () => {
    test.use({ firstVisit: true })
    test('explanation', async ({ page }) => {
      await openApp(page)
      await expect(page.getByRole('dialog', { name: 'Kurz erklärt' })).toBeVisible()
      expect(await violations(page)).toEqual([])
    })
  })

  test('region dialog', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'the region button sits in the desktop header')
    await openApp(page)
    await page.getByRole('button', { name: /Region wählen/ }).click()
    await expect(page.getByRole('dialog', { name: 'Region wählen' })).toBeVisible()
    expect(await violations(page)).toEqual([])
  })

  test('collapsed sheet', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'bottom sheet only on phones')
    await openApp(page, '#/gewaesser/fva-kuhsee')
    await page.getByRole('button', { name: 'Details einklappen' }).click()
    expect(await violations(page)).toEqual([])
  })
})

test.describe('keyboard', () => {
  test('opens a water from the list and moves the focus to its heading', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'phones are used by touch')
    await openApp(page)
    const row = page.locator('.water-list .row').first()
    await row.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.detail h1')).toBeFocused()
    // The back link sits right before the heading.
    await page.keyboard.press('Shift+Tab')
    await expect(page.getByRole('button', { name: 'Alle Gewässer' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('.water-list h1')).toBeFocused()
  })

  test('collapses and expands the sheet with the keyboard', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'bottom sheet only on phones')
    await openApp(page, '#/gewaesser/fva-kuhsee')
    const handle = page.locator('.sheet-handle.is-draggable')
    await handle.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.panel')).toHaveClass(/is-peek/)
    await expect(handle).toHaveAttribute('aria-expanded', 'false')
    await page.keyboard.press('Space')
    await expect(page.locator('.panel')).not.toHaveClass(/is-peek/)
  })
})
