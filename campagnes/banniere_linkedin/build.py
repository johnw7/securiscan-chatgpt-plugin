"""Bannière LinkedIn E-DUST dans la charte (noir chaud #141210, crème #F2EBE0, or #E2B98C, bois #C89B6D).
Profil 1584×396 et page entreprise 1128×191, rendues en ×2 (render.cjs). Les vignettes sont les pages des carrousels
« Les mains qui savent » et « 22 h 14 » (livraison/portfolio_fictif/…), copiées réduites dans img/.
Usage : python3 build.py → banniere.html ; rendu : NODE_PATH=$(npm root -g) node render.cjs banniere.html <sortie>."""
import os
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.abspath(f'{D}/../..'); os.makedirs(f'{D}/img', exist_ok=True)
FONTS = ('<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap">')
SANS, SER, AN, MO, HAND = "'dm-sans',sans-serif", "'dm-serif-display',serif", "'anton',sans-serif", "'montserrat',sans-serif", "'Caveat',cursive"
NOIR, CREME, OR, BOIS = '#141210', '#f2ebe0', '#e2b98c', '#c89b6d'
SOURCES = {'artisan': 'mains_artisans/p01.png', 'site': 'page_accueil/p01.png', 'affiche': 'mains_artisans/affiche_copeaux.png', 'carrousel': 'mains_artisans/p04.png'}

def vignette(n):
    if not os.path.exists(f'{D}/img/{n}.jpg'):
        Image.open(f'{R}/livraison/portfolio_fictif/{SOURCES[n]}').convert('RGB').resize((432, 540), Image.LANCZOS).save(f'{D}/img/{n}.jpg', quality=90)
    return f'img/{n}.jpg'
def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam=SANS, col=CREME, wt=400, ls=0, lh=1.05, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};white-space:nowrap;{st}">{s}</p>'
def fond(w, h):
    return (box(0, 0, w, h, f'background:{NOIR};')
            + box(int(w * .52), -h // 2, int(w * .6), h * 2, 'background:radial-gradient(closest-side,rgba(200,155,109,.22),rgba(200,155,109,0));'))
def carte(n, x, y, w, rot, label):
    """Vignette inclinée + étiquette : éléments positionnés à plat (sans conteneur tourné) pour l'import Adobe Express."""
    h = int(w * 1.25); fs = max(6, w // 16); lw = int(len(label) * fs * .82 + fs * 2.2); lh = int(fs * 2.1)
    return (f'<img src="{vignette(n)}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;border-radius:14px;transform:rotate({rot}deg);box-shadow:0 0 0 2px rgba(242,235,224,.18),0 22px 40px rgba(0,0,0,.6);">'
            + box(x + fs, y + fs + int(rot * .6), lw, lh, f'background:{NOIR};border:1px solid rgba(226,185,140,.5);border-radius:{lh // 2}px;transform:rotate({rot}deg);',
                  t(0, int(fs * .55), lw, label, fs, SANS, OR, 800, .14, 1, 'center')))
def pastille(x, y, s, size=14, rot=0):
    w, h = int(len(s) * size * .58 + 30), int(size * 2.3)
    return box(x, y, w, h, f'border:1.5px solid {OR};border-radius:{h // 2}px;background:rgba(20,18,16,.85);transform:rotate({rot}deg);',
               t(0, int(size * .6), w, s, size, SANS, OR, 700, 0, 1, 'center'))
def puce(x, y, s, size=14):
    return box(x, y, 0, 0, '', f'<span style="position:absolute;left:0;top:0;white-space:nowrap;border:1.5px solid rgba(200,155,109,.55);color:{CREME};font-family:{SANS};font-weight:600;font-size:{size}px;padding:7px 15px;border-radius:20px;">{s}</span>')

def profil():
    W, H = 1584, 396
    s = fond(W, H) + box(440, 40, 2, 316, f'background:linear-gradient(180deg,rgba(200,155,109,0),{BOIS},rgba(200,155,109,0));')
    s += t(468, 44, 600, 'VIDÉOS REELS &amp; TIKTOK · SITES VITRINES · COMMUNICATION VISUELLE', 13, SANS, OR, 800, .26)
    s += t(466, 74, 640, 'Votre activité mérite', 54, SER, CREME, 400, -.01, 1)
    s += t(466, 134, 640, 'd’être <span style="font-family:Caveat,cursive;font-weight:700;color:#e2b98c;font-size:84px;line-height:0;">vue.</span>', 54, SER, CREME, 400, -.01, 1)
    s += t(468, 210, 640, 'Des histoires courtes qui <b>arrêtent le scroll</b> et font venir vos clients.', 18, SANS, 'rgba(242,235,224,.85)', 500)
    s += box(468, 246, 640, 40, 'display:flex;gap:10px;', ''.join(f'<span style="white-space:nowrap;border:1.5px solid rgba(200,155,109,.55);color:{CREME};font-family:{SANS};font-weight:600;font-size:14px;padding:7px 15px;border-radius:20px;">{lb}</span>' for lb in ['Commerces', 'Restaurants', 'Artisans', 'Immobilier', 'Santé', 'Mairies']))
    s += box(468, 300, 560, 50, f'background:{BOIS};border-radius:25px;box-shadow:0 12px 28px rgba(0,0,0,.45);',
             box(8, 8, 84, 34, f'background:{NOIR};border-radius:17px;', t(0, 9, 84, 'OFFERT', 13, SANS, OR, 800, .18, 1, 'center'))
             + t(106, 15, 450, 'Votre 1<sup>re</sup> vidéo à vos couleurs · edust-solutions.fr', 16, MO, NOIR, 800, 0, 1.1))
    s += carte('artisan', 1110, 70, 150, -9, 'ARTISAN') + carte('affiche', 1404, 66, 150, 8, 'AFFICHE')
    s += carte('carrousel', 1205, 52, 158, -3, 'CARROUSEL') + carte('site', 1310, 46, 164, 3, 'SITE VITRINE')
    s += pastille(1104, 286, '⚡ Livrée en 48 h', 14, -4) + pastille(1290, 302, 'Sans tournage', 14, 2) + pastille(1452, 286, '9:16 · 4:5', 14, -3)
    s += t(1100, 340, 400, 'et si c’était la vôtre&nbsp;?', 34, HAND, OR, 700, 0, 1, st='transform:rotate(-3deg);')
    s += t(1540 - 300, 372, 300, 'exemples démo · marques fictives', 10, SANS, 'rgba(242,235,224,.4)', 600, .1, 1, 'right')
    return W, H, s
def entreprise():
    W, H = 1128, 191
    s = fond(W, H)
    X = 190  # marge gauche : le logo de la page entreprise recouvre le coin bas gauche
    s += t(X, 26, 560, 'VIDÉOS REELS &amp; TIKTOK · SITES VITRINES · COMMUNICATION VISUELLE', 10, SANS, OR, 800, .24)
    s += t(X - 2, 48, 640, 'Votre activité mérite d’être <span style="font-family:Caveat,cursive;font-weight:700;color:#e2b98c;font-size:46px;line-height:0;">vue.</span>', 31, SER, CREME, 400, -.01, 1)
    s += t(X, 96, 600, 'Des histoires courtes qui <b>arrêtent le scroll</b> et font venir vos clients.', 13, SANS, 'rgba(242,235,224,.85)', 500)
    s += box(X, 128, 420, 38, f'background:{BOIS};border-radius:19px;',
             box(6, 6, 66, 26, f'background:{NOIR};border-radius:13px;', t(0, 7, 66, 'OFFERT', 10, SANS, OR, 800, .16, 1, 'center'))
             + t(84, 12, 330, 'Votre 1<sup>re</sup> vidéo à vos couleurs · edust-solutions.fr', 12, MO, NOIR, 800, 0, 1.1))
    s += carte('artisan', 810, 40, 82, -8, 'ARTISAN') + carte('carrousel', 884, 30, 86, -2, 'CARROUSEL')
    s += carte('site', 962, 28, 90, 3, 'SITE VITRINE') + carte('affiche', 1040, 40, 80, 8, 'AFFICHE')
    s += t(X + 440, 126, 200, 'et si c’était<br>la vôtre&nbsp;?', 22, HAND, OR, 700, 0, .95, 'left', 'transform:rotate(-3deg);')
    return W, H, s

def page():
    out = ''
    for n, f in [('profil', profil), ('entreprise', entreprise)]:
        W, H, s = f()
        out += f'<section class="slide" id="{n}" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden">{s}</section>'
    return (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide">'
            f'<title>E-DUST — bannière LinkedIn</title>{FONTS}<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>{out}</body></html>')
open(f'{D}/banniere.html', 'w').write(page())
print('ok banniere.html')
