"""Génère les variantes du logo SMASH HOUSE en SVG autonome (texte converti en tracés)."""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FONT = TTFont(sys.argv[1])
OUT = sys.argv[2]
GS = FONT.getGlyphSet()
CMAP = FONT.getBestCmap()
UPM = FONT['head'].unitsPerEm
HMTX = FONT['hmtx']

INK, CREAM, MUSTARD, TOMATO, BUN, PATTY = '#17110e', '#fff7ea', '#ffc22b', '#e4361b', '#ec8f2c', '#5a2914'


def text_width(text, size, tracking=0.0):
    w = 0
    for ch in text:
        w += HMTX[CMAP[ord(ch)]][0]
    return (w + tracking * UPM * (len(text) - 1)) * size / UPM


def text_path(text, x, y, size, anchor='middle', tracking=0.0):
    """Chemin SVG du texte ; y = ligne de base."""
    s = size / UPM
    total = text_width(text, size, tracking)
    cx = x - total / 2 if anchor == 'middle' else (x - total if anchor == 'end' else x)
    pen = SVGPathPen(GS)
    for ch in text:
        g = CMAP[ord(ch)]
        tp = TransformPen(pen, (s, 0, 0, -s, cx, y))
        GS[g].draw(tp)
        cx += (HMTX[g][0] + tracking * UPM) * s
    return pen.getCommands()


def burger(x, y, scale=1.0, outline=INK, sw=7):
    """Icône burger smashé (boîte 200×160, (x, y) = coin haut-gauche) : pain, steak croustillant, cheddar qui coule."""
    seeds = ''.join(
        f'<ellipse cx="{cx}" cy="{cy}" rx="5.5" ry="2.8" transform="rotate({r} {cx} {cy})" fill="{CREAM}"/>'
        for cx, cy, r in [(66, 58, -25), (100, 46, 0), (134, 58, 25), (83, 70, -12), (117, 70, 12)]
    )
    top = ' '.join(f'L{22 + i * 12} {94 + (4 if i % 2 else -2)}' for i in range(14))
    bot = ' '.join(f'L{178 - i * 12} {124 + (2 if i % 2 else -4)}' for i in range(14))
    cheese = ('M16 92 L184 92 L184 101 Q184 106 178 106 L160 106 Q155 106 153 112 L150 128 Q148 135 144 128 L139 110 '
              'Q137 106 131 106 L92 106 Q86 106 84 112 L82 120 Q80 126 77 120 L73 110 Q71 106 65 106 L42 106 '
              'Q37 106 35 112 L32 124 Q30 131 27 124 L22 108 Q16 106 16 100 Z')
    return f'''<g transform="translate({x} {y}) scale({scale})" stroke="{outline}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round">
  <path d="M22 84 C22 24, 178 24, 178 84 Q178 90 170 90 L30 90 Q22 90 22 84 Z" fill="{BUN}"/>
  <g stroke="none">{seeds}</g>
  <path d="M22 96 {top} L178 96 L178 124 {bot} L22 124 Z" fill="{PATTY}"/>
  <path d="{cheese}" fill="{MUSTARD}"/>
  <path d="M18 132 L182 132 Q186 132 186 136 L186 140 Q186 156 170 156 L30 156 Q14 156 14 140 L14 136 Q14 132 18 132 Z" fill="{BUN}"/>
</g>'''


def svg(w, h, body, bg=None, rx=0):
    rect = f'<rect width="{w}" height="{h}" rx="{rx}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="SMASH HOUSE">{rect}{body}</svg>\n'


def write(name, content):
    with open(f'{OUT}/{name}', 'w') as f:
        f.write(content)


# 1. Badge principal (rond)
badge = f'''
<circle cx="300" cy="300" r="290" fill="{INK}"/>
<circle cx="300" cy="300" r="268" fill="none" stroke="{TOMATO}" stroke-width="16"/>
<circle cx="300" cy="300" r="246" fill="none" stroke="{MUSTARD}" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>
{burger(180, 82, 1.2)}
<path d="{text_path('SMASH', 300, 405, 150, tracking=0.02)}" fill="{MUSTARD}"/>
<rect x="150" y="433" width="60" height="6" rx="3" fill="{TOMATO}"/>
<rect x="390" y="433" width="60" height="6" rx="3" fill="{TOMATO}"/>
<path d="{text_path('HOUSE', 300, 457, 54, tracking=0.18)}" fill="{CREAM}"/>
<path d="{text_path('BURGERS · TACOS · FRITES', 300, 503, 22, tracking=0.12)}" fill="{MUSTARD}" opacity=".9"/>
'''
write('smashhouse-logo-badge.svg', svg(600, 600, badge))

# 2. Logo horizontal (fond sombre / fond clair)
def horizontal(dark=True):
    wm1, wm2 = (MUSTARD, CREAM) if dark else (TOMATO, INK)
    return f'''
<circle cx="110" cy="110" r="100" fill="{TOMATO if dark else MUSTARD}"/>
{burger(42, 46, 0.68, sw=8)}
<path d="{text_path('SMASH', 236, 128, 118, anchor='start', tracking=0.01)}" fill="{wm1}"/>
<path d="{text_path('HOUSE', 236 + text_width('SMASH', 118, 0.01) + 14, 128, 118, anchor='start', tracking=0.01)}" fill="{wm2}"/>
<path d="{text_path('SMASH BURGERS · TACOS · FRITES MAISON', 238, 176, 26, anchor='start', tracking=0.14)}" fill="{wm1}" opacity=".85"/>
'''
hw = int(236 + text_width('SMASH', 118, 0.01) + 14 + text_width('HOUSE', 118, 0.01) + 30)
write('smashhouse-logo-horizontal-fond-sombre.svg', svg(hw, 220, horizontal(True), bg=INK, rx=28))
write('smashhouse-logo-horizontal-fond-clair.svg', svg(hw, 220, horizontal(False)))

# 3. Icône d'application / favicon
icon = f'{burger(40, 70, 1.6, sw=9)}'
write('smashhouse-icone.svg', svg(400, 400, icon, bg=MUSTARD, rx=88))

# 4. Version monochrome (tampon, emballages, sacs kraft)
mono = f'''
<circle cx="300" cy="300" r="280" fill="none" stroke="{INK}" stroke-width="16"/>
<g filter="none">{burger(180, 92, 1.2, outline=INK).replace(BUN, 'none').replace(MUSTARD, 'none').replace(PATTY, INK).replace(CREAM, INK)}</g>
<path d="{text_path('SMASH', 300, 415, 150, tracking=0.02)}" fill="{INK}"/>
<path d="{text_path('HOUSE', 300, 470, 54, tracking=0.18)}" fill="{INK}"/>
'''
write('smashhouse-logo-monochrome.svg', svg(600, 600, mono))
print('ok')

# 5. Pastille seule (en-tête du site, avatar réseaux sociaux)
write('smashhouse-pastille.svg', svg(220, 220, f'<circle cx="110" cy="110" r="104" fill="{TOMATO}" stroke="{INK}" stroke-width="6"/>{burger(42, 44, 0.68, sw=8)}'))
