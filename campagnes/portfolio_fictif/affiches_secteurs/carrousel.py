"""Couverture et page finale du carrousel PDF des 6 affiches (4:5, 1080×1350) ; les pages 2 à 7 sont les posts rendus.
Prérequis : build.py + rendu (livraison/portfolio_fictif/affiches_secteurs/posts_4x5). Sortie : carrousel.html (2 pages)."""
import os
D = os.path.dirname(os.path.abspath(__file__)); W, H = 1080, 1350; N = 8
KIT = '<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
SANS, UB = "'dm-sans',sans-serif", "'unbounded',sans-serif"
INK, PAPER, LIME = '#0e0f12', '#f3f0ea', '#c8ff2a'
P = '../../../livraison/portfolio_fictif/affiches_secteurs/posts_4x5/'
def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam=SANS, col='#fff', wt=400, ls=0, lh=1.1, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def pic(f, x, y, w, h, r): return f'<img src="{P}{f}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;object-fit:cover;border-radius:18px;box-shadow:0 26px 60px rgba(0,0,0,.45);transform:rotate({r}deg);">'
def foot(n): return t(70, 1280, 760, 'Tarik Belattar — E-DUST Solutions · marques fictives (démo) · photos Adobe Stock', 17, col='rgba(243,240,234,.55)') + t(850, 1280, 160, f'{n:02d} / {N:02d}', 17, col='rgba(243,240,234,.55)', al='right')
def slide(inner): return f'<section class="slide" style="position:relative;width:{W}px;height:{H}px;overflow:hidden;background:{INK}">{inner}</section>'

s = box(0, 0, W, H, f'background:radial-gradient(circle at 70% 75%,#1f2a12 0%,{INK} 62%);')
s += t(70, 90, 900, 'AFFICHES · DÉMO', 22, col=LIME, wt=700, ls=.22)
s += t(70, 140, 940, '6 secteurs.<br>6 affiches.<br>6 styles.', 92, UB, PAPER, 700, -.03, 1.04)
s += box(70, 462, 80, 6, f'background:{LIME};border-radius:3px;')
s += t(70, 498, 940, 'Boulangerie, barbier, boxe, fleuriste,<br>immobilier, festival : chaque métier a son univers.', 32, col='#b9bbc2', lh=1.4)
for x, y, f, r in [(100, 700, '01_mie_levain_post.jpg', -4), (680, 700, '06_nuits_ete_post.jpg', 4), (390, 670, '02_atelier_rasoir_post.jpg', 0)]:
    s += pic(f, x, y, 300, 375, r)
s += t(70, 1150, 940, 'Faites défiler →', 30, col=LIME, wt=700, al='right')
cover = slide(s + foot(1))

s = box(0, 0, W, H, f'background:radial-gradient(circle at 30% 30%,#1f2a12 0%,{INK} 62%);')
s += t(70, 120, 940, 'ET SI LA PROCHAINE, C’ÉTAIT LA VÔTRE ?', 22, col=LIME, wt=700, ls=.2)
s += t(70, 180, 940, 'Votre commerce mérite d’être vu.', 92, UB, PAPER, 700, -.03, 1.04)
s += t(70, 450, 900, 'Affiches, réseaux sociaux, identité visuelle : je crée une communication digitale qui donne envie de pousser votre porte.', 34, col='#b9bbc2', lh=1.45)
s += box(70, 720, 940, 130, f'background:{LIME};border-radius:65px;', t(0, 38, 940, 'Écrivez AVIS en commentaire', 44, UB, INK, 700, -.01, 1.2, 'center'))
s += t(70, 880, 940, 'Avis gratuit sur votre communication · sans engagement', 26, col=LIME, wt=700, al='center')
s += t(70, 1110, 940, 'Tarik Belattar — E-DUST Solutions', 30, col=PAPER, wt=700) + t(70, 1155, 940, '06 13 24 96 80 · tarikbelatta@gmail.com · edust-solutions.fr', 24, col='#b9bbc2')
end = slide(s + foot(N))

open(f'{D}/carrousel.html', 'w').write(f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>E-DUST — Carrousel affiches</title>{KIT}<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>{cover}{end}</body></html>')
print('ok')
