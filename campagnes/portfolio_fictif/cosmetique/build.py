"""« Pourquoi celui-ci ? » — carrousel LinkedIn 4:5 (1080×1350), 7 pages, démonstration créative cosmétique.
Inès (personnage fictif) devant un rayon où tout se ressemble ; la marque fictive « Accalmie » (sérum apaisant, démo)
transforme son bénéfice produit (apaiser) en univers de campagne (l'accalmie après la tempête), jusqu'au test du logo retiré.
Charte E-DUST partout (noir chaud, crème, or, bois). Photos Adobe Stock (licence gratuite) dans raw/ ; Inès détourée avec
Adobe Photoshop (raw/rayon_cut.png) pour glisser POURQUOI derrière elle. Éléments posés à plat (import Adobe Express).
Usage : python3 build.py → carrousel.html (rendu PNG) + carrousel_express.html (images intégrées) ;
rendu : NODE_PATH=$(npm root -g) node render.cjs carrousel.html <sortie>."""
import os, base64
import numpy as np
from PIL import Image, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/img', exist_ok=True)
LOGO = f'{D}/../../logo_edust/out/ref/horizontal_transparent_clair.svg'
FONTS = ('<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap">')
SANS, SER, AN, MO, HAND = "'dm-sans',sans-serif", "'dm-serif-display',serif", "'anton',sans-serif", "'montserrat',sans-serif", "'Caveat',cursive"
NUIT, BOIS, OR, CREME = '#141210', '#c89b6d', '#e2b98c', '#f2ebe0'
W, H = 1080, 1350
RNG = np.random.default_rng(7)
EMB = False

# ---------- images
def crop_img(i, w, h, fx=.5, fy=.5):
    r = w / h; cw, ch = (i.height * r, i.height) if i.width / i.height > r else (i.width, i.width / r)
    x = min(max(fx * i.width - cw / 2, 0), i.width - cw); y = min(max(fy * i.height - ch / 2, 0), i.height - ch)
    return i.crop((int(x), int(y), int(x + cw), int(y + ch))).resize((w, h), Image.LANCZOS)
def cine(a, w, h, vig=.5):
    """Étalonnage chaud « atelier » + vignettage + grain."""
    a = np.clip((a - .5) * 1.08 + .5, 0, 1) * np.array([1.06, 1.0, .88]) + np.array([.015, .005, 0])
    yy, xx = np.mgrid[0:h, 0:w]; d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    return a * (1 - vig * np.clip(d - .5, 0, 1) ** 1.3)[..., None] + RNG.normal(0, .02, (h, w, 1))
def film(src, out, w, h, fx=.5, fy=.5, vig=.5, cut=False, flou=0):
    if not os.path.exists(f'{D}/img/{out}.jpg'):
        i = crop_img(Image.open(f'{D}/raw/{src}.jpg').convert('RGB'), w, h, fx, fy)
        if flou: i = i.filter(ImageFilter.GaussianBlur(flou))
        Image.fromarray((np.clip(cine(np.asarray(i, dtype=np.float32) / 255, w, h, vig), 0, 1) * 255).astype(np.uint8)).save(f'{D}/img/{out}.jpg', quality=90)
        if cut:
            c = np.asarray(crop_img(Image.open(f'{D}/raw/{src}_cut.png').convert('RGBA'), w, h, fx, fy), dtype=np.float32) / 255
            rgb = cine(c[..., :3], w, h, vig)
            Image.fromarray((np.clip(np.dstack([rgb, c[..., 3:]]), 0, 1) * 255).astype(np.uint8), 'RGBA').save(f'{D}/img/{out}_cut.png')
    return f'{out}.jpg'
def I(n):
    if not EMB: return f'img/{n}'
    return f'data:image/{"png" if n.endswith(".png") else "jpeg"};base64,' + base64.b64encode(open(f'{D}/img/{n}', 'rb').read()).decode()
def logo_src():
    s = open(LOGO).read()
    return 'data:image/svg+xml;base64,' + base64.b64encode(s.encode()).decode()

# ---------- mise en page (tout à plat : pas d'élément positionné dans un autre)
def box(x, y, w, h, st=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}"></div>'
def t(x, y, w, s, size, fam=SANS, col=CREME, wt=400, ls=0, lh=1.05, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def img(src, x, y, w, h, st=''): return f'<img src="{I(src)}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">'
def fond(col=NUIT): return box(0, 0, W, H, f'background:{col};')
def fondu(y, h, rev=False):
    a, z = 'rgba(20,18,16,0)', 'rgba(20,18,16,1)'
    return box(0, y, W, h, f'background:linear-gradient(180deg,{z if rev else a},{a if rev else z});')
SH = 'text-shadow:0 3px 22px rgba(0,0,0,.7);'
NB = '&nbsp;'
MUET = 'rgba(242,235,224,.5)'
def pied(n):
    c = 'rgba(242,235,224,.45)'
    return t(60, 1296, 760, 'E-DUST SOLUTIONS · démonstration créative (démo)', 18, SANS, c, 700, .2) + t(820, 1296, 200, f'{n}/7', 18, SANS, c, 700, .2, al='right')
def chapitre(s, y=64): return t(60, y, 960, s, 20, SANS, OR, 800, .42, al='center')
def main(x, y, w, s, size=46, col=OR, al='left', st=''): return t(x, y, w, s, size, HAND, col, 700, 0, 1.05, al, st)

# ---------- pages
def p1():
    s = img(film('rayon', 'p_rayon', W, H, .53, .5, .55, cut=True), 0, 0, W, H)
    s += t(0, 250, W, 'POURQUOI', 250, AN, BOIS, 400, .01, .9, 'center', 'opacity:.95;')
    s += img('p_rayon_cut.png', 0, 0, W, H) + fondu(800, 550) + fondu(0, 240, True)
    s += chapitre('DÉMONSTRATION CRÉATIVE · COSMÉTIQUE')
    s += main(60, 120, 500, 'Samedi, 11 h.', 72, CREME, st='transform:rotate(-4deg);')
    s += t(70, 900, 940, 'Une belle marque n’est pas forcément une marque que l’on comprend.', 58, SER, CREME, 400, -.01, 1.12, 'center', SH)
    s += main(60, 1110, 960, 'L’histoire d’Inès, devant un rayon.', 54, OR, 'center', SH)
    s += t(60, 1210, 960, 'personnage et marque fictifs · photo Adobe Stock', 18, SANS, MUET, 600, .18, al='center')
    return s + pied(1)

def flacon(cx, y, mot, teinte):
    s = box(cx - 34, y, 68, 54, f'background:{BOIS};border-radius:10px 10px 4px 4px;')
    s += box(cx - 22, y + 50, 44, 16, f'background:{teinte};')
    s += box(cx - 85, y + 64, 170, 240, f'background:{teinte};border-radius:26px;box-shadow:0 24px 50px rgba(0,0,0,.45);')
    s += t(cx - 85, y + 150, 170, mot, 30, SER, NUIT, 400, 0, 1, 'center', 'opacity:.82;')
    s += t(cx - 85, y + 196, 170, 'SOIN VISAGE', 12, SANS, NUIT, 800, .28, 1, 'center', 'opacity:.5;')
    return s
def p2():
    s = fond() + chapitre('CHAPITRE I · LE RAYON')
    s += t(60, 118, 960, 'Tout est beau.<br>Rien ne se distingue.', 58, SER, CREME, 400, -.01, 1.1, 'center')
    mots = [('Hydratant', '#e9dfd0'), ('Éclat', '#efe7db'), ('Pur', '#e4d8c6'), ('Naturel', '#ece3d6'), ('Essentiel', '#e6dac8'), ('Sublime', '#efe6d9')]
    for k, (m, c) in enumerate(mots):
        s += flacon(240 + (k % 3) * 300, 290 + (k // 3) * 330, m, c)
    s += main(60, 960, 960, f'«{NB}Pourquoi celui-ci plutôt qu’un autre{NB}?{NB}»', 64, OR, 'center')
    s += t(60, 1060, 960, 'Packaging soigné, couleurs douces, jolies photos…', 32, SANS, 'rgba(242,235,224,.8)', 500, 0, 1.3, 'center')
    s += t(60, 1130, 960, 'Inès repose le flacon. Et repart sans rien.', 46, SER, '#ffffff', 400, -.01, 1.1, 'center', 'font-style:italic;')
    return s + pied(2)

def p3():
    s = fond() + chapitre('CHAPITRE II · CE QUI MANQUAIT')
    s += t(60, 118, 960, 'Une communication efficace fait comprendre trois choses.', 52, SER, CREME, 400, -.01, 1.12, 'center')
    s += box(56, 316, 408, 628, f'border:2px solid {OR};border-radius:30px;')
    s += img(film('flacon', 'p_flacon', 400, 620, .5, .55, .35), 60, 320, 400, 620, 'border-radius:28px;')
    s += t(60, 960, 400, 'ACCALMIE · SÉRUM APAISANT', 17, SANS, OR, 800, .22, 1.2, 'center')
    s += t(60, 990, 400, 'marque fictive (démo)', 17, SANS, MUET, 600, .1, 1.2, 'center')
    blocs = [('→ À QUI IL S’ADRESSE', 'Aux peaux qui tiraillent au moindre coup de froid.'),
             ('→ CE QUI LE REND DIFFÉRENT', 'Une formule courte, sans parfum.'),
             ('→ POURQUOI ÇA COMPTE', 'Une peau qui réagit à tout a besoin de moins, pas de plus.')]
    for k, (titre, rep) in enumerate(blocs):
        y = 330 + k * 210
        s += t(510, y, 510, titre, 20, SANS, OR, 800, .2, 1.2) + t(510, y + 40, 510, rep, 36, SER, CREME, 400, 0, 1.18)
    s += box(510, 975, 120, 2, f'background:{BOIS};')
    s += main(60, 1080, 960, 'Le bénéfice : apaiser. Reste à le faire ressentir.', 54, OR, 'center')
    return s + pied(3)

def p4():
    s = fond() + chapitre('CHAPITRE III · DU BÉNÉFICE À L’UNIVERS')
    s += t(60, 118, 960, 'Un bénéfice : <i>apaiser</i>.', 54, SER, CREME, 400, -.01, 1.1, 'center')
    s += main(60, 196, 960, 'Un univers : l’accalmie après la tempête.', 60, OR, 'center')
    for k, (src, fx, titre, sous) in enumerate([('froid', .5, 'LE FROID', 'la peau tiraille'), ('vent', .42, 'LE VENT', 'elle se protège'), ('peau', .5, 'LE CALME', 'elle respire')]):
        x = 60 + k * 330
        s += img(film(src, f'p4_{src}', 300, 520, fx, .45, .35), x, 330, 300, 520, 'border-radius:22px;')
        s += t(x, 880, 300, titre, 22, SANS, OR, 800, .3, 1, 'center') + t(x, 918, 300, sous, 30, SER, 'rgba(242,235,224,.85)', 400, 0, 1.1, 'center', 'font-style:italic;')
        if k < 2: s += t(x + 296, 560, 38, '→', 34, SANS, BOIS, 700, 0, 1, 'center')
    s += box(60, 1010, 960, 2, f'background:linear-gradient(90deg,transparent,{BOIS},transparent);')
    s += t(90, 1050, 900, 'Un bénéfice produit devient une émotion que chacun a déjà vécue.', 38, SER, CREME, 400, 0, 1.25, 'center')
    s += t(60, 1210, 960, 'Accalmie est une marque fictive · photos Adobe Stock', 18, SANS, MUET, 600, .12, al='center')
    return s + pied(4)

def p5():
    s = img(film('vent', 'p_vent', W, H, .42, .5, .5), 0, 0, W, H) + fondu(760, 590) + fondu(0, 220, True)
    s += chapitre('CHAPITRE IV · LA CAMPAGNE')
    s += t(60, 900, 960, 'Après le vent,', 92, SER, CREME, 400, -.01, 1, 'center', SH)
    s += main(60, 1000, 960, 'la peau respire.', 104, OR, 'center', SH)
    s += box(440, 1146, 200, 2, f'background:{OR};')
    s += t(60, 1166, 960, 'ACCALMIE', 26, SANS, CREME, 800, .6, 1, 'center')
    s += t(60, 1220, 960, 'affiche de campagne · marque fictive (démo) · photo Adobe Stock', 18, SANS, MUET, 600, .12, al='center')
    return s + pied(5)

def p6():
    s = fond() + chapitre('CHAPITRE V · LE TEST', 52)
    s += t(60, 100, 960, 'Si je retire mon logo,', 52, SER, CREME, 400, -.01, 1.1, 'center')
    s += main(60, 168, 960, f'reconnaît-on encore ma marque{NB}?', 72, OR, 'center')
    s += box(236, 286, 608, 758, f'border:2px solid rgba(226,185,140,.5);border-radius:26px;')
    s += img(film('peau', 'p6_peau', 600, 750, .5, .5, .45), 240, 290, 600, 750, 'border-radius:24px;')
    s += box(240, 740, 600, 300, 'background:linear-gradient(180deg,rgba(20,18,16,0),rgba(20,18,16,.85));border-radius:0 0 24px 24px;')
    s += t(240, 820, 600, 'Le froid passe.', 54, SER, CREME, 400, -.01, 1, 'center', SH)
    s += main(240, 885, 600, 'Le calme reste.', 66, OR, 'center', SH)
    s += box(480, 975, 120, 2, f'background:{OR};')
    s += box(400, 988, 280, 40, f'background:{CREME};border-radius:4px;box-shadow:0 6px 16px rgba(0,0,0,.4);')
    s += t(400, 998, 280, 'LOGO RETIRÉ', 18, SANS, NUIT, 800, .3, 1, 'center')
    s += main(30, 400, 200, 'la même lumière chaude →', 34, OR, 'right')
    s += main(30, 940, 200, 'la ligne d’horizon →', 34, OR, 'right')
    s += main(856, 560, 210, '← le visage apaisé', 34, OR)
    s += main(856, 860, 210, f'← les mots{NB}: froid, calme', 34, OR)
    s += t(60, 1092, 960, 'Quelques semaines plus tard, Inès croise cette affiche.', 34, SER, CREME, 400, 0, 1.2, 'center', 'font-style:italic;')
    s += main(60, 1150, 960, 'Elle sait déjà de quelle marque il s’agit.', 50, OR, 'center')
    s += t(60, 1226, 960, 'affiche fictive (démo) · photo Adobe Stock', 16, SANS, MUET, 600, .12, al='center')
    return s + pied(6)

def p7():
    s = fond() + img(film('peau', 'p7_peau', W, H, .5, .5, .7, flou=4), 0, 0, W, H, 'opacity:.14;')
    s += t(30, 100, 1020, 'L’esthétique attire le regard.', 36, SER, 'rgba(242,235,224,.85)', 400, 0, 1.15, 'center')
    s += t(30, 156, 1020, 'Le positionnement donne une raison de s’intéresser.', 36, SER, 'rgba(242,235,224,.85)', 400, 0, 1.15, 'center')
    s += main(30, 214, 1020, 'Le storytelling rend la marque mémorable.', 60, OR, 'center')
    s += box(480, 330, 120, 2, f'background:{BOIS};')
    s += t(30, 384, 1020, 'Et vous, qu’est-ce qui rend votre marque', 46, SER, CREME, 400, -.01, 1.1, 'center')
    s += main(60, 452, 960, f'immédiatement reconnaissable{NB}?', 84, OR, 'center')
    s += box(190, 620, 700, 96, f'background:{BOIS};border-radius:48px;box-shadow:0 18px 40px rgba(0,0,0,.4);')
    s += t(190, 651, 700, 'Parlons de votre marque →', 30, MO, NUIT, 800, 0, 1.15, 'center')
    s += f'<img src="{logo_src() if EMB else "../../logo_edust/out/ref/horizontal_transparent_clair.svg"}" style="position:absolute;left:330px;top:790px;width:420px;height:{420 * LH / LW:.0f}px">'
    s += t(60, 990, 960, 'Tarik Belattar — E-DUST Solutions', 34, MO, CREME, 800, 0, 1.2, 'center')
    s += t(60, 1040, 960, '06 13 24 96 80 · tarikbelatta@gmail.com · edust-solutions.fr', 25, SANS, 'rgba(242,235,224,.8)', 500, 0, 1.2, 'center')
    s += t(90, 1140, 900, 'Démonstration créative : concept fictif, non réalisé pour un client. Inès et la marque Accalmie sont fictives · photos Adobe Stock.', 20, SANS, 'rgba(242,235,224,.55)', 500, 0, 1.45, 'center')
    return s + pied(7)

import re
LW, LH = (int(v) for v in re.search(r'viewBox="0 0 (\d+) (\d+)"', open(LOGO).read()).groups())
def page(title, sections):
    return (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide"><meta name="hz:canvas-width" content="{W}"><meta name="hz:canvas-height" content="{H}">'
            f'<title>{title}</title>{FONTS}<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>'
            + ''.join(f'<section class="slide" id="{n}" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden">{f()}</section>' for n, f in sections) + '</body></html>')
PAGES = [(f'p{k + 1:02d}', f) for k, f in enumerate([p1, p2, p3, p4, p5, p6, p7])]
for emb, nom in [(False, 'carrousel.html'), (True, 'carrousel_express.html')]:
    EMB = emb
    open(f'{D}/{nom}', 'w').write(page('E-DUST — Pourquoi celui-ci ? (démo cosmétique)', PAGES))
print('ok', os.path.getsize(f'{D}/carrousel_express.html') // 1000, 'Ko (express)')
