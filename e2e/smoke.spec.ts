// Smoke tests of the main flows against the built site (T8).
import { expect, isMobileProject, openApp, showList, test } from './fixtures'

test.describe('smoke', () => {
  test('opens a water from the list', async ({ page }, info) => {
    await openApp(page)
    await showList(page, isMobileProject(info.project.name))
    const row = page.locator('.water-list .row').first()
    const name = (await row.locator('.name > span').first().innerText()).trim()
    await row.click()
    await expect(page.locator('.detail h1')).toHaveText(name)
    await expect(page).toHaveURL(/#\/gewaesser\//)
  })

  test('opens a water from the map', async ({ page }) => {
    await openApp(page)
    // A lake whose centre is really the lake on screen, not covered by a control or the sheet.
    const point = await page.locator('path.leaflet-interactive[fill]:not([fill="none"])').evaluateAll((paths) => {
      const sorted = paths
        .map((path) => ({ path, box: path.getBoundingClientRect() }))
        .sort((a, b) => b.box.width * b.box.height - a.box.width * a.box.height)
      for (const { path, box } of sorted) {
        const x = box.x + box.width / 2
        const y = box.y + box.height / 2
        if (document.elementFromPoint(x, y) === path) return { x, y }
      }
      return null
    })
    expect(point).not.toBeNull()
    await page.mouse.click(point!.x, point!.y)
    await expect(page.locator('.detail h1')).toBeVisible()
    await expect(page).toHaveURL(/#\/gewaesser\//)
  })

  test('filters the waters and plans a day', async ({ page }, info) => {
    await openApp(page)
    await showList(page, isMobileProject(info.project.name))
    const rows = page.locator('.water-list .row')
    const all = await rows.count()
    await page.getByRole('button', { name: 'Gäste willkommen', exact: true }).click()
    await expect.poll(() => rows.count()).toBeLessThan(all)

    await page.locator('.date-chip input').fill('2027-06-15')
    await page.locator('.date-chip input').dispatchEvent('change')
    await expect(page.getByRole('status').filter({ hasText: 'Geplant für Dienstag, 15. Juni 2027' })).toBeVisible()
    await page.getByRole('button', { name: 'Zurück zu heute' }).click()
    await expect(page.getByText('Geplant für')).toHaveCount(0)
  })

  test('opens a sales point from a water', async ({ page }) => {
    await openApp(page, '#/gewaesser/fva-kuhsee')
    const salesPoint = page.locator('.list-card button').first()
    await salesPoint.click()
    await expect(page.locator('.detail .eyebrow')).toHaveText('Verkaufsstelle')
    await expect(page).toHaveURL(/#\/verkaufsstelle\//)
  })

  test('shares a link that opens the same water on the planned day', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await openApp(page, '#/gewaesser/fva-kuhsee?tag=2027-06-15')
    await expect(page.getByText('Geplant für Dienstag, 15. Juni 2027')).toBeVisible()
    // Without a share sheet the link goes to the clipboard.
    await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }))
    await page.locator('.share-button:visible').click()
    await expect(page.getByText('Link kopiert')).toBeVisible()
    const link = await page.evaluate(() => navigator.clipboard.readText())
    expect(link).toMatch(/#\/gewaesser\/fva-kuhsee\?tag=2027-06-15$/)

    const friend = await context.newPage()
    await friend.goto(link)
    await expect(friend.locator('.detail h1')).toHaveText('Kuhsee')
    await expect(friend.getByText('Geplant für Dienstag, 15. Juni 2027')).toBeVisible()
  })

  test('collapses the detail sheet on phones', async ({ page }, info) => {
    test.skip(!isMobileProject(info.project.name), 'bottom sheet only on phones')
    await openApp(page, '#/gewaesser/fva-kuhsee')
    const handle = page.getByRole('button', { name: 'Details einklappen' })
    await handle.click()
    await expect(page.locator('.panel')).toHaveClass(/is-peek/)
    await expect(page.locator('.detail h1')).toBeVisible()
    await expect(page.locator('.price-grid')).toBeHidden()
    await page.getByRole('button', { name: 'Details ausklappen' }).click()
    await expect(page.locator('.price-grid')).toBeVisible()
  })

  test.describe('first visit', () => {
    test.use({ firstVisit: true })

    test('explains the map once', async ({ page }) => {
      await openApp(page)
      const dialog = page.getByRole('dialog', { name: 'Kurz erklärt' })
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: "Los geht's" }).click()
      await expect(dialog).toBeHidden()
      await page.reload()
      await expect(page.locator('.leaflet-overlay-pane path').first()).toBeAttached()
      await expect(dialog).toBeHidden()
    })
  })
})

test('shows the base map while the data is still loading', async ({ page }) => {
  // Hold the waters back until the base map is checked.
  let release: () => void = () => {}
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/data/waters.geojson', async (route) => {
    await held
    await route.continue()
  })
  await page.goto('./')
  await expect(page.locator('.leaflet-container')).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Gewässer werden geladen' })).toBeVisible()
  release()
  await expect(page.locator('.leaflet-overlay-pane path').first()).toBeAttached()
  await expect(page.getByText('Gewässer werden geladen')).toHaveCount(0)
})
