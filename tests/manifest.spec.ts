// Checks the web app manifest, the icons it lists and the theme colours of the installed app.
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { THEME_COLORS } from '@/composables/useTheme'

const root = new URL('../', import.meta.url)
const read = (path: string) => readFileSync(fileURLToPath(new URL(path, root)))
const manifest = JSON.parse(read('public/manifest.webmanifest').toString('utf8'))
const html = read('index.html').toString('utf8')
const css = read('src/style.css').toString('utf8')

interface ManifestIcon {
  src: string
  sizes: string
  type: string
  purpose: string
}

function pngSize(path: string): string {
  const image = read(path)
  expect(image.subarray(1, 4).toString('ascii')).toBe('PNG')
  return `${image.readUInt32BE(16)}x${image.readUInt32BE(20)}`
}

describe('web app manifest', () => {
  it('opens the map standalone from where it is installed', () => {
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name.length).toBeLessThanOrEqual(12)
    expect(manifest.lang).toBe('de')
    expect(manifest.display).toBe('standalone')
    // Relative, so it works on GitHub Pages under /<repo>/ like the rest of the build.
    expect(manifest.start_url).toBe('./')
    expect(manifest.scope).toBe('./')
  })

  it('lists icons that exist in the declared size', () => {
    const icons: ManifestIcon[] = manifest.icons
    for (const icon of icons) {
      const path = `public/${icon.src}`
      expect(existsSync(fileURLToPath(new URL(path, root))), path).toBe(true)
      if (icon.type === 'image/png') expect(pngSize(path)).toBe(icon.sizes)
    }
    const purposes = icons.map((icon) => `${icon.purpose} ${icon.sizes}`)
    expect(purposes).toContain('any 192x192')
    expect(purposes).toContain('any 512x512')
    expect(purposes).toContain('maskable 512x512')
  })

  it('is linked from the page together with favicon and Apple touch icon', () => {
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest">')
    expect(html).toContain('<link rel="icon" href="/icon.svg" type="image/svg+xml">')
    expect(html).toContain('<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">')
    expect(pngSize('public/icons/apple-touch-icon.png')).toBe('180x180')
  })
})

describe('theme colours', () => {
  const land = [...css.matchAll(/--land: (#[0-9a-f]{6});/g)].map((match) => match[1])

  it('use the map background of both themes', () => {
    expect(land).toEqual([THEME_COLORS.light, THEME_COLORS.dark])
  })

  it('are the same in the manifest and the script in index.html', () => {
    expect(manifest.theme_color).toBe(THEME_COLORS.light)
    expect(manifest.background_color).toBe(THEME_COLORS.light)
    expect(html).toContain(`<meta name="theme-color" content="${THEME_COLORS.light}">`)
    expect(html).toContain(`dark ? '${THEME_COLORS.dark}' : '${THEME_COLORS.light}'`)
  })
})
