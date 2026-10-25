"""« Imaginez-la dans votre vitrine » : les 6 affiches secteurs (démo) posées en situation réelle.
1) Photos de maquettes Adobe Stock (licence gratuite) dans raw/ : la zone d'affiche vierge est détectée automatiquement,
   l'affiche y est plaquée en perspective (homographie) avec la lumière d'origine (ombres, reflets) → img/scene_*.jpg
2) carrousel.html : carrousel 4:5 (1080×1350) de 9 pages ; rendu PNG via render.cjs.
Affiches : img/affiches/ (rendus de affiches.py : 6 secteurs en 4:5 et 9:16).
Usage : python3 build.py ; NODE_PATH=$(npm root -g) node render.cjs carrousel.html <sortie>"""
import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/img', exist_ok=True)
A = os.path.abspath(f'{D}/../../../livraison/portfolio_fictif/affiches_secteurs')
FONTS = ('<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap">')
SANS, MO, SER, AN, HAND = "'dm-sans',sans-serif", "'montserrat',sans-serif", "'dm-serif-display',serif", "'anton',sans-serif", "'Caveat',cursive"

# ---------- mise en situation
def zone(photo):
    """Coins (HG, HD, BD, BG) de la plus grande zone blanche peu saturée = l'affiche vierge de la maquette."""
    a = np.asarray(photo).astype(int); m = (a.mean(2) > 200) & (a.max(2) - a.min(2) < 30)
    lab, n = ndimage.label(ndimage.binary_opening(m, iterations=3)); k = int(np.argmax(ndimage.sum(m, lab, range(1, n + 1)))) + 1
    ys, xs = np.nonzero(lab == k); s, d = xs + ys, xs - ys
    return [(xs[s.argmin()], ys[s.argmin()]), (xs[d.argmax()], ys[d.argmax()]), (xs[s.argmax()], ys[s.argmax()]), (xs[d.argmin()], ys[d.argmin()])], lab == k
def coeffs(dst, src):
    """Coefficients PIL PERSPECTIVE qui envoient les points dst (image finale) vers src (affiche)."""
    M = []; b = []
    for (x, y), (u, v) in zip(dst, src):
        M += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]; b += [u, v]
    return np.linalg.solve(np.array(M, float), np.array(b, float))
def scene(fond, affiche, out, marge=.04, retrait=0):
    """Plaque l'affiche (proportions conservées, entière) dans la zone vierge ; la marge laisse voir le papier d'origine."""
    if os.path.exists(f'{D}/img/{out}'): return f'img/{out}'
    photo = Image.open(f'{D}/raw/{fond}').convert('RGB'); q, masque = zone(photo)
    q = np.array(q, float); c = q.mean(0); q = c + (q - c) * (1 - retrait)          # retrait : garder le cadre d'origine visible
    wr = (np.linalg.norm(q[1] - q[0]) + np.linalg.norm(q[2] - q[3])) / 2; hr = (np.linalg.norm(q[3] - q[0]) + np.linalg.norm(q[2] - q[1])) / 2
    S = 4; cw, ch = int(wr * S / 2), int(hr * S / 2)                                   # toile intermédiaire en haute définition
    aff = Image.open(affiche).convert('RGB'); ra = aff.width / aff.height
    pw, ph = (int(cw * (1 - 2 * marge)), int(cw * (1 - 2 * marge) / ra)) if ra > cw / ch else (int(ch * (1 - 2 * marge) * ra), int(ch * (1 - 2 * marge)))
    toile = Image.new('RGBA', (cw, ch), (0, 0, 0, 0)); toile.paste(aff.resize((pw, ph), Image.LANCZOS), ((cw - pw) // 2, (ch - ph) // 2))
    k = coeffs([tuple(p) for p in q], [(0, 0), (cw, 0), (cw, ch), (0, ch)])
    plaque = toile.transform(photo.size, Image.PERSPECTIVE, tuple(k), Image.BICUBIC)
    a = np.asarray(plaque).astype(float) / 255; p = np.asarray(photo).astype(float) / 255
    g = p.mean(2); ref = np.percentile(g[masque], 92); lum = np.clip(g / ref, .55, 1.06)[..., None]   # ombres et reflets de la photo
    al = np.asarray(Image.fromarray((a[..., 3] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.8))).astype(float)[..., None] / 255
    res = p * (1 - al) + (a[..., :3] * lum * .94 + p * .06) * al
    Image.fromarray((np.clip(res, 0, 1) * 255).astype(np.uint8)).save(f'{D}/img/{out}', quality=90)
    return f'img/{out}'
P = lambda n: f'{D}/img/affiches/{n}_post.png'
S_ = lambda n: f'{D}/img/affiches/{n}_story.png'
SCENES = [  # (photo maquette, affiche, sortie, marge, retrait, secteur, marque, phrase, message, univers, raison de venir)
    ('vitrine_pain.jpg', P('pizza'), 'scene2_pizza.jpg', .03, 0, 'PIZZERIA', 'Forno Nero', 'Le feu fait le reste.',
     'Une seule promesse : le goût du feu de bois.', 'Noir et braise, typo massive : on sent la chaleur.', '« Sur place ou à emporter » : ce soir, c’est réglé.'),
    ('mur_noir.jpg', P('librairie'), 'scene2_librairie.jpg', .02, .1, 'LIBRAIRIE', 'La Page', 'Il y a un livre qui vous attend.',
     'On ne vend pas des livres : on promet une rencontre.', 'Papier crème, sérif élégante : on tourne déjà la page.', '« Conseils chaque samedi » : un rendez-vous, pas une vente.'),
    ('mur_brique.jpg', P('garage'), 'scene2_garage.jpg', .03, 0, 'GARAGE AUTO', 'Garage du Pont', 'On l’écoute avant de la réparer.',
     'La confiance d’abord : on explique avant de toucher.', 'Moteur en gros plan, jaune chantier : le sérieux du métier.', '« Devis avant travaux » : zéro mauvaise surprise.'),
    ('chevalet.jpg', S_('institut'), 'scene2_institut.jpg', .03, 0, 'INSTITUT DE BEAUTÉ', 'Maison Clara', 'Une heure. Rien que pour vous.',
     'On vend du temps pour soi, pas une liste de soins.', 'Rose poudré, photo en arche : la douceur dès le trottoir.', '« Sur rendez-vous » : on réserve son moment.'),
    ('totem_vitrine.jpg', P('yoga'), 'scene2_yoga.jpg', .03, 0, 'STUDIO DE YOGA', 'Souffle', 'Inspirez. Expirez.',
     'Deux mots : on respire déjà en lisant.', 'Sable et blanc, beaucoup d’air : le calme se voit.', '« Premier cours découverte » : la porte est ouverte.'),
    ('abribus_soir.jpg', S_('noel'), 'scene2_noel.jpg', .02, 0, 'MARCHÉ DE NOËL', 'Village de Noël de Belleval', 'Le village s’allume.',
     'Une image magique et une date qu’on lit de loin.', 'Nuit bleue, or et lumières : l’émotion de décembre.', '« Entrée libre » : on y va en famille.'),
]
COUV = ('abribus_vertical.jpg', P('noel'), 'scene2_couverture.jpg', .025, 0)

# ---------- carrousel 4:5
W, H = 1080, 1350; FOND, OR, CREME = '#0f0f12', '#ffd27a', '#f4efe6'
def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam=SANS, col='#fff', wt=400, ls=0, lh=1.05, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def img(src, x, y, w, h, st=''): return f'<img src="{src}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">'
def pill(x, y, s, bg=OR, col='#111'): return f'<p style="position:absolute;left:{x}px;top:{y}px;margin:0;padding:10px 26px;border-radius:30px;background:{bg};font-family:{SANS};font-size:22px;font-weight:800;color:{col};letter-spacing:.22em;">{s}</p>'
def pied(n): return t(60, 1296, 700, 'E-DUST SOLUTIONS · affiches en situation (démo)', 18, SANS, 'rgba(255,255,255,.45)', 700, .2) + t(780, 1296, 240, f'{n}/9', 18, SANS, 'rgba(255,255,255,.45)', 700, .2, al='right')
def taille(src): return Image.open(f'{D}/{src}').size
def c_couv():
    src = scene(*COUV); w, h = taille(src); ih = 900; iw = int(ih * w / h)
    s = box(0, 0, W, H, f'background:{FOND};') + box(-200, 600, 900, 900, 'background:radial-gradient(circle,rgba(194,24,122,.35),rgba(194,24,122,0) 68%);')
    s += t(60, 70, 960, 'Imaginez-la dans votre', 74, SER, '#fff', 400, -.01, 1.02) + t(60, 150, 960, 'vitrine.', 120, HAND, OR, 700, 0, 1)
    s += img(src, W - iw - 60, 320, iw, ih, 'border-radius:22px;box-shadow:0 40px 90px rgba(0,0,0,.6);')
    s += t(60, 360, 340, 'Une affiche ne vit pas sur un écran.<br><br>Elle vit dans la rue, à 5 mètres, en 3 secondes.', 30, SANS, 'rgba(255,255,255,.82)', 500, 0, 1.4)
    s += t(60, 760, 340, '6 commerces.<br>6 affiches.<br>6 endroits.', 44, MO, '#fff', 800, -.01, 1.15)
    s += t(60, 1150, 340, 'Marques fictives · démo · maquettes et photos Adobe Stock', 20, SANS, 'rgba(255,255,255,.5)', 500, .04, 1.4)
    return s + pied(1)
def c_scene(n, sc):
    fond, aff, out, marge, retrait, secteur, marque, phrase, msg, uni, raison = sc
    src = scene(fond, aff, out, marge, retrait); w, h = taille(src)
    s = box(0, 0, W, H, f'background:{FOND};')
    if w / h >= 1.2:   # photo paysage : entière en haut
        ih = int(W * h / w); s += img(src, 0, 0, W, ih); y0 = ih + 40
    else:              # photo portrait : entière, centrée, fond flouté de la même photo
        ih = 700; iw = int(ih * w / h)
        s += img(src, 0, 0, W, 740, 'object-fit:cover;filter:blur(30px) brightness(.45);transform:scale(1.15);') + img(src, (W - iw) // 2, 20, iw, ih, 'border-radius:16px;box-shadow:0 30px 60px rgba(0,0,0,.6);')
        y0 = 760
    s += box(0, y0 - 40, W, H - y0 + 40, f'background:{FOND};')
    s += pill(60, y0, secteur) + t(60, y0 + 70, 960, f'«&nbsp;{phrase}&nbsp;»', 46, SER, '#fff', 400, -.01, 1.12, st='font-style:italic;')
    for k, (lab, txt) in enumerate([('MESSAGE', msg), ('UNIVERS', uni), ('RAISON DE VENIR', raison)]):
        y = y0 + 190 + k * 92
        s += t(60, y, 300, lab, 18, SANS, OR, 800, .22) + t(60, y + 28, 980, txt, 28, SANS, 'rgba(255,255,255,.85)', 500, 0, 1.25)
    return s + t(60, 1254, 960, f'{marque} · marque fictive (démo)', 18, SANS, 'rgba(255,255,255,.45)', 500, .04) + pied(n)
def c_grille():
    s = box(0, 0, W, H, f'background:{FOND};') + t(60, 70, 960, 'Même méthode.', 76, MO, '#fff', 800, -.02, 1, 'center') + t(60, 160, 960, 'Six univers qui ne se ressemblent pas.', 44, SER, OR, 400, -.01, 1.1, 'center', 'font-style:italic;')
    for k, sc in enumerate(SCENES):
        src = f'img/{sc[2]}'; w, h = taille(src); cx, cy = 60 + (k % 2) * 490, 270 + (k // 2) * 330
        bw, bh = 470, 310; r = w / h; iw, ih = (bw, int(bw / r)) if r > bw / bh else (int(bh * r), bh)
        s += box(cx, cy, bw, bh, 'background:#1b1c21;border-radius:16px;', img(src, (bw - iw) // 2, (bh - ih) // 2, iw, ih, 'border-radius:12px;'))
        s += t(cx + 14, cy + bh - 44, 440, sc[5], 18, SANS, '#fff', 800, .18, st='text-shadow:0 2px 8px rgba(0,0,0,.8);')
    return s + pied(8)
def c_cta():
    s = box(0, 0, W, H, f'background:{FOND};') + box(-200, 300, 1480, 900, 'background:radial-gradient(ellipse,rgba(255,210,122,.18),rgba(255,210,122,0) 70%);')
    s += t(60, 230, 960, 'Et votre affiche,', 80, SER, '#fff', 400, -.01, 1.05, 'center') + t(60, 330, 960, 'elle tient en 3 secondes ?', 80, SER, OR, 400, -.01, 1.05, 'center', 'font-style:italic;')
    s += t(110, 540, 860, 'Une phrase que l’on ressent. Un univers que l’on reconnaît. Une raison de venir maintenant.', 36, SANS, 'rgba(255,255,255,.85)', 500, 0, 1.4, 'center')
    s += box(240, 760, 600, 110, f'background:{OR};border-radius:55px;', t(0, 32, 600, 'Écrivez AVIS en commentaire', 38, MO, '#111', 800, 0, 1.1, 'center'))
    s += t(60, 930, 960, 'Je regarde votre affiche ou votre vitrine et je vous dis gratuitement ce que je changerais en priorité.', 28, SANS, 'rgba(255,255,255,.7)', 500, 0, 1.35, 'center')
    s += t(60, 1060, 960, 'Tarik Belattar — E-DUST Solutions', 36, MO, '#fff', 800, 0, 1.2, 'center') + t(60, 1112, 960, '06 13 24 96 80 · edust-solutions.fr', 28, SANS, 'rgba(255,255,255,.8)', 500, 0, 1.2, 'center')
    return s + t(60, 1210, 960, 'Marques fictives · démo · maquettes et photos Adobe Stock', 20, SANS, 'rgba(255,255,255,.5)', 500, .04, 1, 'center') + pied(9)
PAGES = [c_couv] + [(lambda k=k, sc=sc: c_scene(k + 2, sc)) for k, sc in enumerate(SCENES)] + [c_grille, c_cta]
html = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide"><meta name="hz:canvas-width" content="{W}"><meta name="hz:canvas-height" content="{H}">'
        f'<title>E-DUST — Affiches en situation (démo)</title>{FONTS}<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>'
        + ''.join(f'<section class="slide" id="p{k + 1:02d}" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden">{f()}</section>' for k, f in enumerate(PAGES)) + '</body></html>')
open(f'{D}/carrousel.html', 'w').write(html); print('ok carrousel.html', len(PAGES))
