import { test as base, expect, type Page } from '@playwright/test'

/**
 * Every test starts without network beyond the preview server, so map tiles and external links
 * cannot make it flaky, and with the first-visit explanation already seen unless a test wants it.
 */
export const test = base.extend<{ firstVisit: boolean }>({
  firstVisit: [false, { option: true }],
  page: async ({ page, firstVisit }, use) => {
    await page.route(/^https?:\/\/(?!localhost)/, (route) => route.abort())
    if (!firstVisit) await page.addInitScript(() => window.localStorage.setItem('angelkarte-welcome-seen', 'e2e'))
    await use(page)
  },
})

export { expect }

/** Opens the app and waits until the data is loaded. */
export async function openApp(page: Page, hash = '') {
  await page.goto(`./${hash}`)
  // The base map shows before the data, the waters on the map mean the data is there.
  await expect(page.locator('.leaflet-overlay-pane path').first()).toBeAttached()
}

/** Shows the water list on phones, where it sits in the collapsed bottom sheet. */
export async function showList(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole('button', { name: /Alle \d+ Gewässer/ }).click()
}

export const isMobileProject = (name: string) => name === 'mobile'
