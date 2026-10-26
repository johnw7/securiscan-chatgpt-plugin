"""Bannière LinkedIn E-DUST « correction » pour attirer les marques : « Votre marque mérite plus qu'un packshot. »,
« packshot » barré à la main (trait bois) et corrigé au-dessus en manuscrit or par « une histoire. ». Sans visuel, charte E-DUST.
Deux passes : 1) rendu avec mesure de la position du mot « packshot » (mesure.json), 2) placement du trait et de la correction.
Usage : python3 build_correction.py ; NODE_PATH=$(npm root -g) node mesure.cjs ; python3 build_correction.py ; node render.cjs banniere_correction.html <sortie>."""
import json, os
D = os.path.dirname(os.path.abspath(__file__))
FONTS = ('<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap">')
SANS, SER, MO, HAND = "'dm-sans',sans-serif", "'dm-serif-display',serif", "'montserrat',sans-serif", "'Caveat',cursive"
NOIR, CREME, OR, BOIS = '#141210', '#f2ebe0', '#e2b98c', '#c89b6d'
M = json.load(open(f'{D}/mesure.json')) if os.path.exists(f'{D}/mesure.json') else {}

def box(x, y, w, h, st=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}"></div>'
def t(x, y, w, s, size, fam=SANS, col=CREME, wt=400, ls=0, lh=1.05, al='left', st='', id_=''):
    i = f' id="{id_}"' if id_ else ''
    return f'<p{i} style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};white-space:nowrap;{st}">{s}</p>'
POINT = f'<span style="color:{BOIS}">&nbsp;·&nbsp;</span>'

def correction(n, x, y, size):
    """Ligne « Votre marque mérite plus qu'un » + « packshot. » barré + « une histoire. » manuscrit au-dessus."""
    s = t(x, y, 1100, 'Votre marque mérite plus qu’un', size, SER, CREME, 400, -.01, 1, id_=f'{n}_debut')
    m = M.get(n)
    px = m['fin'] + size * .26 if m else x + 900
    s += t(px, y, 400, 'packshot.', size, SER, 'rgba(242,235,224,.42)', 400, -.01, 1, id_=f'{n}_pk')
    if m:
        w = m['pk_w']
        # trait de rature bois, légèrement de travers, comme tracé à la main
        s += box(px - size * .06, y + size * .56, w + size * .12, max(3, size * .075), f'background:{BOIS};border-radius:3px;transform:rotate(-3deg);opacity:.95;')
        # correction manuscrite au-dessus, avec un petit chevron d'insertion
        s += t(px - size * .1, y - size * 1.12, 600, 'une histoire.', size * 1.42, HAND, OR, 700, 0, 1, st='transform:rotate(-5deg);transform-origin:left bottom;')
        s += t(px - size * .36, y + size * .52, 60, '‸', size * .8, SANS, OR, 400, 0, 1)
    return s

def profil():
    W, H = 1584, 396
    s = box(0, 0, W, H, f'background:{NOIR};')
    s += box(W - 760, -H // 2, 900, H * 2, 'background:radial-gradient(closest-side,rgba(200,155,109,.16),rgba(200,155,109,0));')
    s += box(460, 58, 2, 280, f'background:linear-gradient(180deg,rgba(200,155,109,0),{BOIS},rgba(200,155,109,0));')
    s += t(490, 58, 700, 'COMMUNICATION DIGITALE POUR LES MARQUES', 13, SANS, OR, 800, .3)
    s += correction('profil', 487, 178, 54)
    s += box(492, 262, 120, 2, f'background:{BOIS};')
    s += t(490, 282, 900, f'Identité visuelle{POINT}Réseaux sociaux{POINT}Contenus vidéo{POINT}Sites{POINT}Campagnes', 17, SANS, 'rgba(242,235,224,.85)', 600, .01)
    s += t(490, 322, 700, f'Parlons de votre marque <span style="color:{BOIS}">→</span> <span style="color:{OR}">edust-solutions.fr</span>', 18, MO, CREME, 800, 0)
    s += t(W - 560, 330, 500, f'ÉCOUTE{POINT}STRATÉGIE{POINT}CRÉATION', 12, SANS, 'rgba(242,235,224,.6)', 800, .3, 1, 'right')
    s += t(W - 560, 352, 500, 'Créer pour être vu. Communiquer pour être compris.', 12, SANS, 'rgba(242,235,224,.45)', 600, .06, 1, 'right')
    return W, H, s
def entreprise():
    W, H = 1128, 191
    X = 190  # le logo de la page entreprise recouvre le coin bas gauche
    s = box(0, 0, W, H, f'background:{NOIR};')
    s += box(W - 520, -H // 2, 640, H * 2, 'background:radial-gradient(closest-side,rgba(200,155,109,.16),rgba(200,155,109,0));')
    s += t(X, 22, 600, 'COMMUNICATION DIGITALE POUR LES MARQUES', 10, SANS, OR, 800, .28)
    s += correction('entreprise', X - 2, 92, 32)
    s += t(X, 146, 700, f'Identité visuelle{POINT}Réseaux sociaux{POINT}Contenus vidéo{POINT}Sites{POINT}Campagnes', 12, SANS, 'rgba(242,235,224,.85)', 600, .01)
    s += t(W - 400, 150, 360, f'Parlons de votre marque <span style="color:{BOIS}">→</span> <span style="color:{OR}">edust-solutions.fr</span>', 13, MO, CREME, 800, 0, 1, 'right')
    return W, H, s

out = ''
for n, f in [('profil', profil), ('entreprise', entreprise)]:
    W, H, s = f()
    out += f'<section class="slide" id="{n}" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden">{s}</section>'
open(f'{D}/banniere_correction.html', 'w').write(f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide">'
                                                 f'<title>E-DUST — bannière LinkedIn correction</title>{FONTS}<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>{out}</body></html>')
print('ok banniere_correction.html', 'avec mesures' if M else '(passe 1 : lancer mesure.cjs)')
