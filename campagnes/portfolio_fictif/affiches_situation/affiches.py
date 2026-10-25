"""6 nouvelles affiches de secteurs (marques fictives, démo), en 4:5 (1080×1350) et 9:16 (1080×1920) → affiches.html.
Photos Adobe Stock (licence gratuite) dans raw_affiches/ ; recadrages dans img/a_*.jpg.
Rendu : NODE_PATH=$(npm root -g) node render.cjs affiches.html img/affiches (puis build.py les pose en situation)."""
import os
from PIL import Image, ImageEnhance
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/img', exist_ok=True)
FONTS = ('<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap">')
SANS, MO, SER, CG, AN, UB, HAND = "'dm-sans',sans-serif", "'montserrat',sans-serif", "'dm-serif-display',serif", "'cormorant-garamond',serif", "'anton',sans-serif", "'unbounded',sans-serif", "'Caveat',cursive"
W = 1080
def crop(src, out, w, h, fx=.5, fy=.5, fx_=None):
    if not os.path.exists(f'{D}/img/{out}'):
        i = Image.open(f'{D}/raw_affiches/{src}').convert('RGB'); r = w / h
        cw, ch = (i.height * r, i.height) if i.width / i.height > r else (i.width, i.width / r)
        x = min(max(fx * i.width - cw / 2, 0), i.width - cw); y = min(max(fy * i.height - ch / 2, 0), i.height - ch)
        i = i.crop((int(x), int(y), int(x + cw), int(y + ch))).resize((w, h), Image.LANCZOS)
        (fx_(i) if fx_ else i).save(f'{D}/img/{out}', quality=88)
    return f'img/{out}'
def entiere(src, out, w):
    """Photo entière (aucun recadrage), redimensionnée à la largeur w."""
    i = Image.open(f'{D}/raw_affiches/{src}').convert('RGB'); h = int(w * i.height / i.width)
    if not os.path.exists(f'{D}/img/{out}'): i.resize((w, h), Image.LANCZOS).save(f'{D}/img/{out}', quality=88)
    return f'img/{out}', h
def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam=SANS, col='#fff', wt=400, ls=0, lh=1.05, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def img(src, x, y, w, h, st=''): return f'<img src="{src}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;object-fit:cover;{st}">'
def demo(H, col='rgba(255,255,255,.55)'): return t(60, H - 46, 960, 'Démo · marque fictive · photo Adobe Stock · création E-DUST Solutions', 16, col=col, al='center')
def rond(x, y, d, bg, txt, col, fam=SANS, size=28, rot=-10):
    return box(x, y, d, d, f'background:{bg};border-radius:{d // 2}px;transform:rotate({rot}deg);', t(0, int(d * .3), d, txt, size, fam, col, 800, .04, 1.1, 'center'))

# 1 · FORNO NERO — pizzeria au feu de bois : noir, braise, typo massive
def pizza(H):
    st = H > 1500; ph = 1400 if st else 800
    s = box(0, 0, W, H, 'background:#0d0907;') + img(crop('pizza.jpg', f'a_pizza_{H}.jpg', W, ph, .5, .82), 0, 0, W, ph)
    s += box(0, ph - 360, W, 362, 'background:linear-gradient(180deg,rgba(13,9,7,0),#0d0907 92%);')
    s += t(60, 60, 960, 'PIZZERIA AU FEU DE BOIS', 22, SANS, '#ffb067', 800, .4, al='center')
    s += t(30, ph - 250, 1020, 'FORNO NERO', 210 if st else 190, AN, '#ff6a1a', 400, .01, .95, 'center', 'text-shadow:0 0 60px rgba(255,106,26,.45);')
    s += t(60, ph - 30, 960, 'Le feu fait le reste.', 74 if st else 62, SER, '#f6e7d4', 400, -.01, 1.05, 'center', 'font-style:italic;')
    s += t(60, ph + (110 if st else 80), 960, 'Pâte maison · cuite au bois · sur place ou à emporter', 28, SANS, 'rgba(246,231,212,.8)', 500, .04, al='center')
    s += rond(800, 130, 200, '#ff6a1a', 'AU FEU<br>DE BOIS', '#0d0907', AN, 34, 12)
    return s + demo(H)
# 2 · LA PAGE — librairie : papier crème, éditorial, photo entière comme une page de livre
def livre(H):
    st = H > 1500; src, ih = entiere('librairie.jpg', 'a_librairie.jpg', 560)
    s = box(0, 0, W, H, 'background:#f3ece0;')
    s += t(60, 60, 960, 'La Page', 92, CG, '#2c2420', 600, 0, 1, 'center', 'font-style:italic;') + t(60, 168, 960, 'LIBRAIRIE INDÉPENDANTE', 20, SANS, '#a2553a', 800, .4, al='center')
    py = 250 if st else 230; pw = 560 if st else 470; phh = int(pw * ih / 560)
    s += box((W - pw) // 2 - 16, py - 16, pw + 32, phh + 32, 'background:#fff;box-shadow:0 20px 50px rgba(44,36,32,.18);') + img(src, (W - pw) // 2, py, pw, phh, 'object-fit:contain;')
    ty = py + phh + (70 if st else 50)
    s += t(60, ty, 960, 'Il y a un livre<br><i>qui vous attend.</i>', 84 if st else 66, SER, '#2c2420', 400, -.01, 1.02, 'center')
    s += t(60, ty + (200 if st else 160), 960, 'Conseils de lecture chaque samedi matin', 26, SANS, '#7a5a48', 600, .04, al='center')
    return s + demo(H, 'rgba(44,36,32,.55)')
# 3 · GARAGE DU PONT — garage : moteur dramatique, bandes de chantier, typo condensée
def garage(H):
    st = H > 1500
    s = img(crop('moteur.jpg', f'a_moteur_{H}.jpg', W, H, .5, .45, lambda i: ImageEnhance.Contrast(i).enhance(1.1)), 0, 0, W, H)
    s += box(0, int(H * .42), W, H - int(H * .42), 'background:linear-gradient(180deg,rgba(12,12,12,0),rgba(12,12,12,.95) 38%);')
    s += box(0, 50, W, 70, 'background:repeating-linear-gradient(-45deg,#ffcc00 0 40px,#111 40px 80px);')
    s += box(240, 50, 600, 70, 'background:#111;', t(0, 14, 600, 'GARAGE DU PONT', 40, AN, '#ffcc00', 400, .12, 1.1, 'center'))
    by = 1160 if st else 760
    s += t(60, by, 960, 'ON L’ÉCOUTE<br>AVANT DE LA<br><span style="color:#ffcc00">RÉPARER.</span>', 132 if st else 112, AN, '#fff', 400, .01, .92)
    s += t(60, by + (390 if st else 330), 960, 'Diagnostic expliqué · devis avant travaux · toutes marques', 28, SANS, 'rgba(255,255,255,.85)', 600, .02)
    return s + demo(H)
# 4 · MAISON CLARA — institut : rose poudré, photo entière dans une arche, sérif doux
def soin(H):
    st = H > 1500; src, ih = entiere('soin.jpg', 'a_soin.jpg', 900)
    s = box(0, 0, W, H, 'background:#f4e4dc;') + box(-180, H - 700, 800, 800, 'background:#ecd2c6;border-radius:400px;')
    s += t(60, 70, 960, 'Maison Clara', 84, CG, '#5a3a35', 600, 0, 1, 'center', 'font-style:italic;') + t(60, 168, 960, 'INSTITUT DE BEAUTÉ', 20, SANS, '#b07462', 800, .4, al='center')
    pw = 900 if st else 760; phh = int(pw * ih / 900); py = 300 if st else 250
    s += img(src, (W - pw) // 2, py, pw, phh, f'object-fit:contain;border-radius:{pw // 2}px {pw // 2}px 30px 30px;')
    ty = py + phh + (90 if st else 50)
    s += t(60, ty, 960, 'Une heure.', 120 if st else 92, SER, '#5a3a35', 400, -.01, 1, 'center') + t(60, ty + (130 if st else 100), 960, 'Rien que pour vous.', 76 if st else 58, SER, '#b07462', 400, -.01, 1, 'center', 'font-style:italic;')
    s += t(60, ty + (250 if st else 190), 960, 'Soins visage · sur rendez-vous', 28, SANS, '#7c5a52', 600, .06, al='center')
    s += rond(810, py - 40, 190, '#5a3a35', 'Prenez<br>soin', '#f4e4dc', CG, 40, 8)
    return s + demo(H, 'rgba(90,58,53,.55)')
# 5 · SOUFFLE — studio de yoga : beaucoup d'air, typo fine, sable
def yoga(H):
    st = H > 1500; src, ih = entiere('yoga.jpg', 'a_yoga.jpg', W)
    s = box(0, 0, W, H, 'background:#e8ccab;')
    py = (H - ih) // 2 - (20 if st else 30)
    s += img(src, 0, py, W, ih) + box(0, py - 2, W, 120, 'background:linear-gradient(180deg,#e8ccab,rgba(232,204,171,0));') + box(0, py + ih - 118, W, 120, 'background:linear-gradient(180deg,rgba(232,204,171,0),#e8ccab);')
    s += t(60, py - (300 if st else 190), 960, 'Inspirez.', 150 if st else 120, SER, '#fff', 400, -.02, 1, 'center', 'text-shadow:0 4px 30px rgba(120,70,30,.3);')
    s += t(60, py + ih + (30 if st else 10), 960, 'Expirez.', 150 if st else 120, SER, '#5b3a22', 400, -.02, 1, 'center', 'font-style:italic;')
    s += t(60, py + ih + (220 if st else 150), 960, 'SOUFFLE · STUDIO DE YOGA', 28, MO, '#5b3a22', 700, .32, al='center')
    s += t(60, py + ih + (270 if st else 195), 960, 'Cours tous niveaux · premier cours découverte', 24, SANS, '#7a5638', 600, .04, al='center')
    return s + demo(H, 'rgba(91,58,34,.55)')
# 6 · VILLAGE DE NOËL DE BELLEVAL — marché de Noël (ville fictive) : nuit bleue, or, magie
def noel(H):
    st = H > 1500; G = '#ffd27a'
    s = img(crop('noel.jpg', f'a_noel_{H}.jpg', W, H, .5, .55), 0, 0, W, H)
    s += box(0, 0, W, 760 if st else 600, 'background:linear-gradient(180deg,rgba(8,16,40,.92),rgba(8,16,40,.6) 55%,rgba(8,16,40,0));') + box(0, H - 520, W, 520, 'background:linear-gradient(180deg,rgba(8,16,40,0),rgba(8,16,40,.95));')
    s += t(60, 70, 960, 'VILLE DE BELLEVAL PRÉSENTE', 22, SANS, G, 800, .4, al='center')
    s += t(40, 130, 1000, 'Le village', 150 if st else 128, SER, '#fff8ea', 400, -.02, .95, 'center') + t(40, 130 + (150 if st else 125), 1000, 's’allume.', 170 if st else 140, HAND, G, 700, 0, .95, 'center', 'text-shadow:0 0 40px rgba(255,210,122,.55);')
    s += t(60, 130 + (340 if st else 290), 960, 'MARCHÉ DE NOËL', 34, UB, '#fff8ea', 700, .1, al='center')
    s += t(60, H - (330 if st else 260), 960, 'Du 4 au 24 décembre', 64, SER, '#fff8ea', 400, -.01, 1, 'center')
    s += t(60, H - (240 if st else 180), 960, 'Artisans · vin chaud · patinoire', 30, SANS, 'rgba(255,248,234,.85)', 600, .04, al='center')
    s += rond(820, H - (520 if st else 430), 190, G, 'ENTRÉE<br>LIBRE', '#081028', UB, 30, 12)
    return s + demo(H)

ALL = [('pizza', pizza), ('librairie', livre), ('garage', garage), ('institut', soin), ('yoga', yoga), ('noel', noel)]
html = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>E-DUST — 6 nouvelles affiches (démo)</title>{FONTS}'
        '<style>html,body{margin:0;background:#222}.slide{margin:0 auto 40px}</style></head><body>'
        + ''.join(f'<section class="slide" id="{n}_{tag}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden">{f(H)}</section>'
                  for n, f in ALL for H, tag in ((1350, 'post'), (1920, 'story'))) + '</body></html>')
open(f'{D}/affiches.html', 'w').write(html); print('ok affiches.html', len(ALL) * 2)
