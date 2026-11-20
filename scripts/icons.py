#!/usr/bin/env python3
# Renders the app icons in public/ from the fish logo of the panel header (AppIcon `fish`).
# Run from the repo root after changing the logo or the accent colour: python3 scripts/icons.py
# Needs Python 3 with Playwright (pip install playwright, python -m playwright install chromium).
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public'

# Same colours as --accent and --on-accent of the light theme in src/style.css.
ACCENT = '#1f5c63'
ON_ACCENT = '#f4f7f3'

# Same paths as the `fish` icon in src/components/AppIcon.vue (24 x 24 viewBox).
FISH = (
    '<path d="M3 12c2.5-3.5 6-5.5 10-5.5 3.5 0 6 2 8 5.5-2 3.5-4.5 5.5-8 5.5-4 0-7.5-2-10-5.5z"/>'
    '<path d="M3 12L1 9.5M3 12l-2 2.5"/>'
    f'<circle cx="16.5" cy="11" r="0.8" fill="{ON_ACCENT}" stroke="none"/>'
)


def icon_svg(full_bleed: bool, fish_share: float) -> str:
    """The logo on a 512 px canvas.

    full_bleed: square background without rounded corners, for maskable and Apple icons,
    which the system crops itself.
    fish_share: width of the 24 px icon box relative to the canvas. The header shows the
    24 px icon in a 40 px tile, that is 0.6.
    """
    size = 512
    box = size * fish_share
    offset = (size - box) / 2
    scale = box / 24
    radius = 0 if full_bleed else 112
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">'
        f'<rect width="{size}" height="{size}" rx="{radius}" fill="{ACCENT}"/>'
        f'<g transform="translate({offset:g} {offset:g}) scale({scale:g})" fill="none" stroke="{ON_ACCENT}"'
        ' stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'
        f'{FISH}</g></svg>\n'
    )


# Rounded logo for browsers and the "any" purpose. Maskable icons need the content inside the
# inner 80 % circle, the fish at 0.6 stays well inside.
ROUNDED = icon_svg(full_bleed=False, fish_share=0.6)
FULL = icon_svg(full_bleed=True, fish_share=0.6)

PNGS = [
    ('icons/icon-192.png', ROUNDED, 192),
    ('icons/icon-512.png', ROUNDED, 512),
    ('icons/icon-maskable-512.png', FULL, 512),
    ('icons/apple-touch-icon.png', FULL, 180),
]


def main():
    (PUBLIC / 'icon.svg').write_text(ROUNDED)
    (PUBLIC / 'icons').mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for name, svg, px in PNGS:
            page = browser.new_page(viewport={'width': px, 'height': px})
            html = (
                '<style>html,body{margin:0;background:transparent}svg{display:block;width:100vw;height:100vh}</style>'
                + svg
            )
            page.set_content(html)
            page.screenshot(path=str(PUBLIC / name), omit_background=True)
            page.close()
        browser.close()
    print('written:', 'icon.svg', *(name for name, _, _ in PNGS))


if __name__ == '__main__':
    main()
