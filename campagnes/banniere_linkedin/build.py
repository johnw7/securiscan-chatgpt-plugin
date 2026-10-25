"""Bannière LinkedIn E-DUST dans la charte (noir chaud #141210, crème #F2EBE0, or #E2B98C, bois #C89B6D).
Profil 1584×396 et page entreprise 1128×191, rendues en ×2 (render.cjs). Message aligné sur le site edust-solutions.fr. Les vignettes sont les pages des carrousels
« Les mains qui savent » et « 22 h 14 » (livraison/portfolio_fictif/…), copiées réduites dans img/.
Usage : python3 build.py → banniere.html ; rendu : NODE_PATH=$(npm root -g) node render.cjs banniere.html <sortie>."""
import os
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.abspath(f'{D}/../..'); os.makedirs(f'{D}/img', exist_ok=True)
FONTS = ('<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap">')
SANS, SER, AN, MO, HAND = "'dm-sans',sans-serif", "'dm-serif-display',serif", "'anton',sans-serif", "'montserrat',sans-serif", "'Caveat',cursive"
NOIR, CREME, OR, BOIS = '#141210', '#f2ebe0', '#e2b98c', '#c89b6d'
SOURCES = {'artisan': 'mains_artisans/p01.png', 'site': 'page_accueil/p01.png', 'affiche': 'mains_artisans/affiche_copeaux.png', 'carrousel': 'mains_artisans/p04.png',
           'site_clair': 'page_accueil/p06.png'}
# Message repris du site edust-solutions.fr : agence de communication digitale créative, « plus qu'une image, une histoire »,
# offres prioritaires (Pack Création, Site vitrine, Pack commercial), méthode Écoute · Stratégie · Création.
# Logo : img/logo.png (téléchargé depuis edust-solutions.fr/images/edust-logo-warm.png), posé sur une carte crème comme sur le site.

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

def logo(x, y, w, h):
    # logo posé à plat (pas dans la carte) : l'import Adobe Express perd la position des images imbriquées
    return (box(x, y, w, h, f'background:{CREME};border-radius:{h // 4}px;box-shadow:0 10px 24px rgba(0,0,0,.45);')
            + f'<img src="img/logo.png" style="position:absolute;left:{x + int(h * .2)}px;top:{y + int(h * .14)}px;width:{w - int(h * .4)}px;height:{h - int(h * .28)}px;object-fit:contain;">')
def methode(x, y, size):
    return t(x, y, 600, f'ÉCOUTE <span style="color:{BOIS}">·</span> STRATÉGIE <span style="color:{BOIS}">·</span> CRÉATION', size, SANS, 'rgba(242,235,224,.7)', 800, .3)

def profil():
    W, H = 1584, 396
    s = fond(W, H) + box(440, 40, 2, 316, f'background:linear-gradient(180deg,rgba(200,155,109,0),{BOIS},rgba(200,155,109,0));')
    s += t(468, 40, 600, 'AGENCE DE COMMUNICATION DIGITALE CRÉATIVE', 13, SANS, OR, 800, .28)
    s += t(466, 70, 700, 'Votre activité mérite plus qu’une image.', 37, SER, CREME, 400, -.01, 1)
    s += t(466, 114, 660, 'Elle mérite une histoire.', 64, HAND, OR, 700, 0, 1)
    s += t(468, 196, 640, 'Identité visuelle, sites web, réseaux sociaux et vidéos :<br>nous donnons forme à votre message pour <b>convaincre votre public</b>.', 17, SANS, 'rgba(242,235,224,.85)', 500, 0, 1.45)
    s += box(468, 258, 640, 36, 'display:flex;gap:9px;', ''.join(f'<span style="white-space:nowrap;border:1.5px solid rgba(200,155,109,.55);color:{CREME};font-family:{SANS};font-weight:600;font-size:13px;padding:6px 13px;border-radius:18px;">{lb}</span>' for lb in ['Pack Création', 'Identité de marque', 'Site vitrine', 'Réseaux sociaux', 'Pack commercial']))
    s += box(468, 312, 470, 48, f'background:{BOIS};border-radius:24px;box-shadow:0 12px 28px rgba(0,0,0,.45);',
             t(0, 15, 470, 'Parlons de votre projet · edust-solutions.fr', 17, MO, NOIR, 800, 0, 1.1, 'center'))
    s += t(958, 330, 300, 'Créer pour être vu.<br>Communiquer pour être compris.', 12, SANS, 'rgba(242,235,224,.6)', 700, .08, 1.45)
    s += carte('affiche', 1212, 66, 118, -8, 'IDENTITÉ') + carte('site_clair', 1450, 62, 118, 7, 'SITE VITRINE')
    s += carte('carrousel', 1290, 50, 124, -3, 'RÉSEAUX') + carte('artisan', 1370, 44, 128, 3, 'CAMPAGNE')
    s += methode(1222, 262, 11) + logo(1222, 300, 150, 52)
    s += t(1390, 312, 170, 'créations démo<br>marques fictives', 10, SANS, 'rgba(242,235,224,.45)', 600, .1, 1.4)
    return W, H, s
def entreprise():
    W, H = 1128, 191
    X = 190  # marge gauche : le logo de la page entreprise recouvre le coin bas gauche
    s = fond(W, H)
    s += t(X, 22, 560, 'AGENCE DE COMMUNICATION DIGITALE CRÉATIVE', 10, SANS, OR, 800, .26)
    s += t(X - 2, 40, 640, 'Votre activité mérite plus qu’une image.', 27, SER, CREME, 400, -.01, 1)
    s += t(X, 72, 640, 'Elle mérite une histoire.', 40, HAND, OR, 700, 0, 1)
    s += t(X, 120, 600, 'Identité visuelle · Sites vitrines · Réseaux sociaux · Vidéos', 12, SANS, 'rgba(242,235,224,.85)', 600, .02)
    s += box(X, 142, 330, 34, f'background:{BOIS};border-radius:17px;',
             t(0, 10, 330, 'Parlons de votre projet · edust-solutions.fr', 12, MO, NOIR, 800, 0, 1.1, 'center'))
    s += t(X + 346, 146, 260, 'Créer pour être vu.<br>Communiquer pour être compris.', 10, SANS, 'rgba(242,235,224,.6)', 700, .06, 1.4)
    s += carte('affiche', 810, 40, 82, -8, 'IDENTITÉ') + carte('carrousel', 884, 30, 86, -2, 'RÉSEAUX')
    s += carte('artisan', 962, 28, 90, 3, 'CAMPAGNE') + carte('site_clair', 1040, 40, 80, 8, 'SITE')
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
