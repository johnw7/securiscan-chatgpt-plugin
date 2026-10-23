"""6 affiches de secteurs différents (marques fictives, démo) : post 4:5 (1080×1350) et story 9:16 (1080×1920).
Photos : Adobe Stock (licence gratuite) dans raw/ ; recadrages et retouches (N&B chaud, bichromie) générés ici dans img/.
Polices : kit Adobe Fonts ark1qxx. Sorties : posts.html / stories.html (rendu PNG) et *_express.html (images intégrées, Adobe Express)."""
import os, base64
from PIL import Image, ImageOps
D = os.path.dirname(os.path.abspath(__file__)); W = 1080
KIT = '<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
SANS, UB, SER, CG, AN, MO = "'dm-sans',sans-serif", "'unbounded',sans-serif", "'dm-serif-display',serif", "'cormorant-garamond',serif", "'anton',sans-serif", "'montserrat',sans-serif"
EMB = False

def crop(src, out, w, h, fx=.5, fy=.5, zoom=1.0, fx_=None):
    """Recadre raw/src au ratio w/h autour du point (fx, fy), applique fx_ (retouche) et enregistre img/out (w×h)."""
    if not os.path.exists(f'{D}/img/{out}'):
        i = Image.open(f'{D}/raw/{src}').convert('RGB'); r = w / h
        cw, ch = (i.height * r, i.height) if i.width / i.height > r else (i.width, i.width / r)
        cw, ch = cw / zoom, ch / zoom
        x = min(max(fx * i.width - cw / 2, 0), i.width - cw); y = min(max(fy * i.height - ch / 2, 0), i.height - ch)
        i = i.crop((int(x), int(y), int(x + cw), int(y + ch))).resize((w, h), Image.LANCZOS)
        (fx_(i) if fx_ else i).save(f'{D}/img/{out}', quality=86, optimize=True, progressive=True)
    return out
def warm_bw(i): return ImageOps.colorize(ImageOps.autocontrast(i.convert('L'), cutoff=1), '#0d0b08', '#f2e3c6', mid='#7a6a55')
def duo(i): return ImageOps.colorize(ImageOps.autocontrast(i.convert('L'), cutoff=1), '#14062e', '#ffd27a', mid='#c2187a')

def I(n): return f'img/{n}' if not EMB else 'data:image/jpeg;base64,' + base64.b64encode(open(f'{D}/img/{n}', 'rb').read()).decode()
def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam=SANS, col='#fff', wt=400, ls=0, lh=1.05, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def pic(src, x, y, w, h, st=''): return f'<img src="{I(src)}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;object-fit:cover;{st}">'
def demo(H, col='rgba(255,255,255,.6)'): return t(60, H - 58, 960, 'Démo · marque fictive · photo Adobe Stock · création E-DUST Solutions', 18, col=col, al='center')

# ---------- 1 · MIE & LEVAIN — boulangerie, éditorial chaleureux, photo en arche
def pain(H):
    st = H > 1500; ah = 1000 if st else 640; ay = 250 if st else 200
    s = box(0, 0, W, H, 'background:#f1e7d6;')
    s += t(60, 66, 960, 'MIE &amp; LEVAIN', 54, CG, '#3a2416', 600, .25, al='center') + t(60, 136, 960, 'BOULANGERIE ARTISANALE', 18, SANS, '#a0703c', 700, .35, al='center')
    s += pic(crop('pain.jpg', f'pain_{H}.jpg', 800, ah, .56, .62, 1.05), 140, ay, 800, ah, 'border-radius:400px 400px 0 0;')
    s += box(140, ay + ah, 800, 3, 'background:#3a2416;')
    s += box(800, ay - 30, 190, 190, 'background:#a0703c;border-radius:95px;transform:rotate(10deg);', t(0, 52, 190, 'CUIT<br>CHAQUE<br>MATIN', 26, SANS, '#f1e7d6', 700, .12, 1.15, 'center'))
    ty = ay + ah + (70 if st else 40)
    s += t(60, ty, 960, 'Le pain prend<br><i>son temps.</i>', 112 if st else 96, SER, '#3a2416', 400, -.01, 1.0, 'center')
    s += t(60, ty + (250 if st else 215), 960, 'Levain naturel · façonné à la main', 26, SANS, '#7a5236', 500, .04, al='center')
    return s + demo(H, 'rgba(58,36,22,.55)')
# ---------- 2 · ATELIER RASOIR — barbier, noir & or, N&B chaud
def barbier(H):
    st = H > 1500; ph = 1350 if st else 900; base = 1150 if st else 740
    s = box(0, 0, W, H, 'background:#0d0c0a;') + pic(crop('barbier.jpg', f'barbier_{H}.jpg', W, ph, .62, .45, 1.0, warm_bw), 0, 0, W, ph)
    s += box(0, ph - 420, W, 421, 'background:linear-gradient(180deg,rgba(13,12,10,0),#0d0c0a 85%);')
    s += box(30, 30, W - 60, H - 60, 'border:2px solid #c9a45c;')
    s += t(60, base, 960, 'A T E L I E R', 30, MO, '#c9a45c', 600, .3, al='center')
    s += t(40, base + 40, 1000, 'RASOIR', 250 if st else 230, AN, '#c9a45c', 400, .02, .95, 'center')
    s += t(60, base + (300 if st else 280), 960, 'Le geste. La précision. Le temps pour soi.', 40, SER, '#efe6d4', 400, 0, 1.2, 'center', 'font-style:italic;')
    s += t(60, base + (390 if st else 360), 960, 'BARBIER · RASAGE À L’ANCIENNE · SUR RENDEZ-VOUS', 20, SANS, '#c9a45c', 700, .2, al='center')
    return s + demo(H, 'rgba(201,164,92,.6)')
# ---------- 3 · UPPERCUT CLUB — boxe, typographie massive
def boxe(H):
    st = H > 1500; wy = 1170 if st else 720; fs = 168 if st else 150
    s = box(0, 0, W, H, 'background:#121212;') + pic(crop('boxe.jpg', f'boxe_{H}.jpg', W, H, .52, .4, 1.0), 0, 0, W, H)
    s += box(0, int(H * .45), W, H - int(H * .45), 'background:linear-gradient(180deg,rgba(18,18,18,0),rgba(18,18,18,.92) 45%);')
    s += box(-120, 120, 1320, 74, 'background:#f4efe6;transform:rotate(-6deg);', t(0, 14, 1320, 'UPPERCUT CLUB · BOXE ANGLAISE · UPPERCUT CLUB · BOXE ANGLAISE', 40, AN, '#121212', 400, .06, 1.1, 'center', 'white-space:nowrap;'))
    s += t(60, wy, 960, 'FRAPPE.<br>RESPIRE.<br><span style="color:#e3262f">RECOMMENCE.</span>', fs, AN, '#f4efe6', 400, .01, .92)
    s += t(60, wy + int(fs * .92 * 3) + 30, 960, 'Cours tous niveaux · débutants bienvenus', 28, SANS, 'rgba(244,239,230,.8)', 500, .02)
    s += box(780, 860 if st else 520, 220, 220, 'background:#e3262f;border-radius:110px;transform:rotate(-12deg);', t(0, 62, 220, '1<sup style="font-size:22px">er</sup> COURS<br>OFFERT', 36, AN, '#f4efe6', 400, .04, 1.1, 'center'))
    return s + demo(H)
# ---------- 4 · MAISON PÉTALE — fleuriste, doux et botanique
def fleurs(H):
    st = H > 1500; py = 1380 if st else 920
    s = pic(crop('fleurs.jpg', f'fleurs_{H}.jpg', W, py + 80, .42, .40, 1.0), 0, 0, W, py + 80)
    s += box(270, 46, 540, 156, 'background:rgba(255,255,255,.88);border-radius:22px;box-shadow:0 10px 30px rgba(0,0,0,.12);')
    s += t(60, 64, 960, 'Maison Pétale', 76, SER, '#4f5d45', 400, -.01, al='center') + t(60, 154, 960, 'ARTISAN FLEURISTE', 18, SANS, '#b8706f', 700, .35, al='center')
    s += box(0, py, W, H - py, 'background:#4f5d45;border-radius:60px 60px 0 0;')
    s += t(60, py + 56, 960, 'Un bouquet,<br><i>et tout change.</i>', 96 if st else 84, SER, '#f6efe6', 400, -.01, 1.02, 'center')
    s += t(60, py + (276 if st else 246), 960, 'Compositions du jour · fleurs de saison', 26, SANS, '#f0c9c0', 500, .04, al='center')
    s += box(800, py - 120, 190, 190, 'background:#f0c9c0;border-radius:95px;transform:rotate(-10deg);', t(0, 58, 190, 'Fait<br>main', 40, SER, '#4f5d45', 400, 0, 1.0, 'center', 'font-style:italic;'))
    return s + demo(H, 'rgba(246,239,230,.6)')
# ---------- 5 · CLÉ HORIZON — immobilier, luxe épuré
def maison(H):
    st = H > 1500; ph = 1300 if st else 760; G = '#d8b878'
    s = box(0, 0, W, H, 'background:#0f1b2d;') + pic(crop('maison.jpg', f'maison_{H}_{ph}.jpg', W, ph, .5, .5, 1.0), 0, 0, W, ph)
    s += box(0, 0, W, 280, 'background:linear-gradient(180deg,rgba(15,27,45,.9),rgba(15,27,45,.5) 60%,rgba(15,27,45,0));') + box(0, ph - 300, W, 301, 'background:linear-gradient(180deg,rgba(15,27,45,0),#0f1b2d);')
    s += t(70, 70, 600, 'CLÉ HORIZON', 30, MO, '#fff', 600, .35) + box(70, 118, 60, 2, f'background:{G};') + t(70, 132, 600, 'AGENCE IMMOBILIÈRE', 16, SANS, G, 700, .3)
    ty = ph + (30 if st else 20)
    s += t(70, ty, 940, f'Il y a des maisons<br>qu’on <i style="color:{G}">reconnaît</i> tout de suite.', 80 if st else 68, CG, '#fff', 500, -.01, 1.05)
    s += box(70, ty + (200 if st else 170), 940, 1, 'background:rgba(216,184,120,.5);')
    for i, w in enumerate(['ESTIMATION', 'VENTE', 'ACCOMPAGNEMENT']):
        s += t(70 + i * 310, ty + (230 if st else 195), 310, w, 18, MO, 'rgba(255,255,255,.8)', 600, .25)
    s += box(70, ty + (310 if st else 260), 360, 72, f'border:2px solid {G};border-radius:36px;', t(0, 20, 356, 'Estimer mon bien →', 26, SANS, G, 700, .02, 1.1, 'center'))
    return s + demo(H)
# ---------- 6 · NUITS D'ÉTÉ — festival de ville, bichromie néon
def concert(H):
    st = H > 1500; G = '#ffd27a'
    s = pic(crop('concert.jpg', f'concert_{H}.jpg', W, H, .5, .55, 1.0, duo), 0, 0, W, H)
    s += box(0, 0, W, 620 if st else 520, 'background:linear-gradient(180deg,rgba(20,6,46,.85),rgba(20,6,46,0));') + box(0, H - 460, W, 460, 'background:linear-gradient(180deg,rgba(20,6,46,0),rgba(20,6,46,.92));')
    s += t(60, 140 if st else 80, 960, 'NUITS<br>D’ÉTÉ', 200 if st else 180, UB, '#fff5e6', 700, -.04, .92)
    s += t(64, 560 if st else 440, 960, '12 · 13 · 14 JUILLET', 44, UB, G, 700, .02)
    s += box(790, 1300 if st else 880, 210, 210, f'background:{G};border-radius:105px;transform:rotate(12deg);', t(0, 66, 210, 'ENTRÉE<br>LIBRE', 34, UB, '#14062e', 700, 0, 1.05, 'center'))
    by = H - (300 if st else 250)
    s += t(60, by, 960, 'Concerts en plein air', 46, SANS, '#fff', 700, -.01) + t(60, by + 66, 960, 'Parc de la ville · dès 19 h · buvette &amp; food trucks', 26, SANS, 'rgba(255,245,230,.85)', 500, .02)
    return s + demo(H)

ALL = [('01_mie_levain', pain), ('02_atelier_rasoir', barbier), ('03_uppercut_club', boxe), ('04_maison_petale', fleurs), ('05_cle_horizon', maison), ('06_nuits_ete', concert)]
def page(H, title):
    head = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide"><meta name="hz:canvas-width" content="{W}"><meta name="hz:canvas-height" content="{H}">'
            f'<title>{title}</title>{KIT}<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>')
    return head + ''.join(f'<section class="slide" id="{n}" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden">{f(H)}</section>' for n, f in ALL) + '</body></html>'
os.makedirs(f'{D}/img', exist_ok=True)
for emb in (False, True):
    EMB = emb; x = '_express' if emb else ''
    open(f'{D}/posts{x}.html', 'w').write(page(1350, 'E-DUST — Affiches secteurs (posts 4:5)'))
    open(f'{D}/stories{x}.html', 'w').write(page(1920, 'E-DUST — Affiches secteurs (stories 9:16)'))
print('ok', os.path.getsize(f'{D}/posts_express.html'), os.path.getsize(f'{D}/stories_express.html'))
