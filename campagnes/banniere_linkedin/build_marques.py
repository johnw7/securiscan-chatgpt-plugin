"""Bannière LinkedIn E-DUST « marques » (repositionnement communication digitale pour les marques, même style que build_typo.py) : sans visuel, juste la charte (noir chaud #141210, crème #F2EBE0, or #E2B98C, bois #C89B6D)
et le message du site edust-solutions.fr. Effet créatif : contraste serif crème / manuscrit or, filet bois et lueur chaude.
Profil 1584×396 et page entreprise 1128×191, rendues en ×2. Usage : python3 build_typo.py → banniere_marques.html ;
rendu : NODE_PATH=$(npm root -g) node render.cjs banniere_marques.html <sortie>."""
import os
D = os.path.dirname(os.path.abspath(__file__))
FONTS = ('<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap">')
SANS, SER, AN, MO, HAND = "'dm-sans',sans-serif", "'dm-serif-display',serif", "'anton',sans-serif", "'montserrat',sans-serif", "'Caveat',cursive"
NOIR, CREME, OR, BOIS = '#141210', '#f2ebe0', '#e2b98c', '#c89b6d'

def box(x, y, w, h, st=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}"></div>'
def t(x, y, w, s, size, fam=SANS, col=CREME, wt=400, ls=0, lh=1.05, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};white-space:nowrap;{st}">{s}</p>'
POINT = f'<span style="color:{BOIS}">&nbsp;·&nbsp;</span>'

def profil():
    W, H = 1584, 396
    s = box(0, 0, W, H, f'background:{NOIR};')
    s += box(W - 760, -H // 2, 900, H * 2, 'background:radial-gradient(closest-side,rgba(200,155,109,.16),rgba(200,155,109,0));')
    s += box(460, 58, 2, 280, f'background:linear-gradient(180deg,rgba(200,155,109,0),{BOIS},rgba(200,155,109,0));')
    s += t(490, 60, 700, 'COMMUNICATION DIGITALE POUR LES MARQUES', 13, SANS, OR, 800, .3)
    s += t(487, 92, 900, 'Votre marque mérite plus qu’une image.', 50, SER, CREME, 400, -.01, 1)
    s += t(489, 150, 900, 'Elle mérite une histoire.', 84, HAND, OR, 700, 0, 1)
    s += box(492, 252, 120, 2, f'background:{BOIS};')
    s += t(490, 274, 900, f'Identité visuelle{POINT}Réseaux sociaux{POINT}Contenus vidéo{POINT}Sites{POINT}Campagnes', 17, SANS, 'rgba(242,235,224,.85)', 600, .01)
    s += t(490, 316, 700, f'Parlons de votre marque <span style="color:{BOIS}">→</span> <span style="color:{OR}">edust-solutions.fr</span>', 18, MO, CREME, 800, 0)
    s += t(W - 560, 326, 500, f'ÉCOUTE{POINT}STRATÉGIE{POINT}CRÉATION', 12, SANS, 'rgba(242,235,224,.6)', 800, .3, 1, 'right')
    s += t(W - 560, 348, 500, 'Créer pour être vu. Communiquer pour être compris.', 12, SANS, 'rgba(242,235,224,.45)', 600, .06, 1, 'right')
    return W, H, s
def entreprise():
    W, H = 1128, 191
    X = 190  # le logo de la page entreprise recouvre le coin bas gauche
    s = box(0, 0, W, H, f'background:{NOIR};')
    s += box(W - 520, -H // 2, 640, H * 2, 'background:radial-gradient(closest-side,rgba(200,155,109,.16),rgba(200,155,109,0));')
    s += t(X, 26, 600, 'COMMUNICATION DIGITALE POUR LES MARQUES', 10, SANS, OR, 800, .28)
    s += t(X - 2, 46, 700, 'Votre marque mérite plus qu’une image.', 30, SER, CREME, 400, -.01, 1)
    s += t(X, 80, 700, 'Elle mérite une histoire.', 50, HAND, OR, 700, 0, 1)
    s += t(X, 142, 700, f'Identité visuelle{POINT}Réseaux sociaux{POINT}Contenus vidéo{POINT}Sites{POINT}Campagnes', 12, SANS, 'rgba(242,235,224,.85)', 600, .01)
    s += t(W - 400, 150, 360, f'Parlons de votre marque <span style="color:{BOIS}">→</span> <span style="color:{OR}">edust-solutions.fr</span>', 13, MO, CREME, 800, 0, 1, 'right')
    return W, H, s

out = ''
for n, f in [('profil', profil), ('entreprise', entreprise)]:
    W, H, s = f()
    out += f'<section class="slide" id="{n}" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden">{s}</section>'
open(f'{D}/banniere_marques.html', 'w').write(f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide">'
                                           f'<title>E-DUST — bannière LinkedIn marques</title>{FONTS}<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>{out}</body></html>')
print('ok banniere_marques.html')
