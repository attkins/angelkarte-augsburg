#!/usr/bin/env python3
# Renders the link preview image public/og-image.png (1200x630) from the current data.
# Run from the repo root after larger data changes: python3 scripts/og-image.py
# Needs Python 3 with Playwright (pip install playwright, python -m playwright install chromium)
# and the installed npm dependencies for the fonts.
import json, math, pathlib, tempfile
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
W = json.load(open(ROOT / 'public/data/waters.geojson'))['features']
S = json.load(open(ROOT / 'public/data/sales-points.geojson'))['features']
FONTS = ROOT / 'node_modules/@fontsource-variable'
col={'open':'#4e8a3b','withMember':'#c4841a','membersOnly':'#9a4b3c','unknown':'#8a9590'}
# focus on the core region so the map is not too sparse
lon0,lon1,lat0,lat1=10.66,11.10,48.17,48.58
lat_c=(lat0+lat1)/2; kx=math.cos(math.radians(lat_c))
PX,PY,PW,PH=600,0,600,630
sx=PW/((lon1-lon0)*kx); sy=PH/(lat1-lat0); s=max(sx,sy)
cx=(lon0+lon1)/2; cy=(lat0+lat1)/2
def P(c): return (PX+PW/2+(c[0]-cx)*kx*s, PY+PH/2-(c[1]-cy)*s)
def path(rings,close):
    out=''
    for r in rings:
        q=[P(c) for c in r]
        out+='M'+' L'.join(f'{x:.1f},{y:.1f}' for x,y in q)+(' Z' if close else '')
    return out
shapes=[]
for f in W:
    g=f['geometry']; a=col[f['properties']['guestAccess']]
    if g['type']=='Polygon': shapes.append(('poly',path(g['coordinates'],True),a))
    elif g['type']=='MultiPolygon':
        for pp in g['coordinates']: shapes.append(('poly',path(pp,True),a))
    elif g['type']=='LineString': shapes.append(('line',path([g['coordinates']],False),a))
    else: shapes.append(('line',path(g['coordinates'],False),a))
svg=[]
for k,d,a in shapes:
    if k=='line': svg.append(f'<path d="{d}" fill="none" stroke="{a}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')
    else: svg.append(f'<path d="{d}" fill="{a}" stroke="{a}" stroke-width="3" stroke-linejoin="round"/>')
for f in S:
    x,y=P(f['geometry']['coordinates'])
    if PX<x<PX+PW and 0<y<630: svg.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5.5" fill="#24332f" stroke="#f7f9f6" stroke-width="2"/>')
ax,ay=P([10.8978,48.3705])
html=f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:Vollkorn;src:url({(FONTS / 'vollkorn/files/vollkorn-latin-wght-normal.woff2').as_uri()});font-weight:400 900}}
@font-face{{font-family:Figtree;src:url({(FONTS / 'figtree/files/figtree-latin-wght-normal.woff2').as_uri()});font-weight:300 900}}
html,body{{margin:0;width:1200px;height:630px;overflow:hidden;background:#e7ece5}}
.card{{position:relative;width:1200px;height:630px}}
svg{{position:absolute;inset:0}}
.fade{{position:absolute;inset:0;background:linear-gradient(90deg,#f7f9f6 0,#f7f9f6 520px,rgba(247,249,246,0) 700px)}}
.text{{position:absolute;left:72px;top:0;bottom:0;width:470px;display:flex;flex-direction:column;justify-content:center;color:#1f2d2b;font-family:Figtree}}
.eyebrow{{font-size:22px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#1f5c63}}
h1{{font-family:Vollkorn;font-weight:600;font-size:96px;line-height:1;margin:18px 0 10px}}
.sub{{font-size:34px;color:#51625e;margin:0 0 36px}}
.claim{{font-size:30px;line-height:1.3;margin:0 0 34px}}
.legend{{display:flex;gap:22px;font-size:21px;color:#51625e}}
.legend span{{display:flex;align-items:center;gap:8px}}
.legend i{{width:14px;height:14px;border-radius:50%;display:inline-block}}
.city{{font-family:Figtree;font-size:20px;font-weight:600;fill:#51625e;letter-spacing:.08em}}
</style></head><body><div class="card">
<svg width="1200" height="630" viewBox="0 0 1200 630">{''.join(svg)}
<text class="city" x="{ax+14:.0f}" y="{ay-12:.0f}">AUGSBURG</text></svg>
<div class="fade"></div>
<div class="text"><div class="eyebrow">Tageskarten finden</div><h1>Angelkarte</h1><p class="sub">Augsburg und Umland</p>
<p class="claim">Welcher Verein verkauft wo eine Tageskarte, und dürfen Gäste allein fischen?</p>
<div class="legend"><span><i style="background:#4e8a3b"></i>Gäste willkommen</span><span><i style="background:#c4841a"></i>Mit Mitglied</span></div></div>
</div></body></html>'''

with tempfile.TemporaryDirectory() as tmp:
    page_file = pathlib.Path(tmp) / 'og.html'
    page_file.write_text(html, encoding='utf-8')
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1200, 'height': 630})
        page.goto(page_file.as_uri())
        page.wait_for_timeout(500)
        page.screenshot(path=str(ROOT / 'public/og-image.png'))
        browser.close()
print('wrote public/og-image.png')
