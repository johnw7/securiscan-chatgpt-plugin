"""Couverture et page contact du PDF « Stories 6 secteurs » (9:16, 1080×1920), puis assemblage du PDF.
Prérequis : stories rendues dans livraison/portfolio_fictif/stories_secteurs/stories_XX.png (render_slides.cjs).
Usage : python3 cover.py  →  cover.html ; puis rendu PNG (render_slides.cjs <sortie> cover.html) ; puis python3 cover.py pdf"""
import os, sys, glob
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); W, H = 1080, 1920
L = os.path.abspath(f'{D}/../../../livraison/portfolio_fictif/stories_secteurs')
KIT = '<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
SANS, UB, SER = "'dm-sans',sans-serif", "'unbounded',sans-serif", "'dm-serif-display',serif"
IG = 'linear-gradient(45deg,#feda75,#fa7e1e 30%,#d62976 55%,#962fbf 80%,#4f5bd5)'
def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam=SANS, col='#fff', wt=400, ls=0, lh=1.05, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def vign(n):
    """Vignette JPEG d'une story rendue (img/vign_XX.jpg)."""
    out = f'img/vign_{n:02d}.jpg'
    if not os.path.exists(f'{D}/{out}'):
        Image.open(f'{L}/stories_{n:02d}.png').convert('RGB').resize((540, 960), Image.LANCZOS).save(f'{D}/{out}', quality=88)
    return out
# Bulles « à la une » : nom de marque, photo ronde
BULLES = [("Grain d'Aube", 'cafe_latte.jpg'), ('Nonna Rosa', 'pates_machine.jpg'), ('Première Route', 'route_sourire.jpg'),
          ('Sève', 'spa_massage.jpg'), ('Clair Regard', 'vue_net.jpg'), ('Fil du Bois', 'bois_cuisine.jpg')]
def bulles(y):
    s = ''
    for k, (nom, img) in enumerate(BULLES):
        x = 62 + k * 162
        s += box(x, y, 146, 146, f'background:{IG};border-radius:73px;', box(6, 6, 134, 134, 'background:#0d0d10;border-radius:67px;',
                 f'<img src="img/{img}" style="position:absolute;left:6px;top:6px;width:122px;height:122px;object-fit:cover;border-radius:61px;">'))
        s += t(x - 20, y + 160, 186, nom, 20, SANS, 'rgba(255,255,255,.85)', 500, 0, 1.1, 'center')
    return s
def couverture():
    s = box(0, 0, W, H, 'background:#0d0d10;')
    s += box(-300, -260, 900, 900, 'background:radial-gradient(circle,rgba(214,41,118,.35),rgba(214,41,118,0) 70%);')
    s += box(560, 1100, 900, 900, 'background:radial-gradient(circle,rgba(79,91,213,.35),rgba(79,91,213,0) 70%);')
    s += t(60, 96, 960, 'E-DUST SOLUTIONS · PORTFOLIO', 22, SANS, 'rgba(255,255,255,.7)', 700, .3, al='center')
    s += bulles(170)
    s += t(40, 440, 1000, 'STORIES', 196, UB, '#fff', 700, -.04, 1, 'center', f'background:{IG};-webkit-background-clip:text;background-clip:text;color:transparent;')
    s += t(60, 660, 960, 'qui font dire <i>oui.</i>', 96, SER, '#fff', 400, -.01, 1, 'center')
    s += t(60, 800, 960, '6 secteurs · 18 stories · une histoire à chaque fois', 30, SANS, 'rgba(255,255,255,.75)', 500, .02, al='center')
    # éventail des écrans « déclic » de chaque marque
    for k, (n, rot, dx, dy) in enumerate([(2, -15, -330, 60), (8, -9, -198, 20), (14, -3, -66, 0), (5, 3, 66, 0), (11, 9, 198, 20), (17, 15, 330, 60)]):
        s += box(390 + dx, 960 + dy, 300, 533, f'transform:rotate({rot}deg);border-radius:26px;overflow:hidden;box-shadow:0 26px 60px rgba(0,0,0,.6);border:3px solid rgba(255,255,255,.9);',
                 f'<img src="{vign(n)}" style="width:100%;height:100%;object-fit:cover;display:block;">')
    s += box(240, 1640, 600, 2, f'background:{IG};')
    s += t(60, 1676, 960, 'Tarik Belattar — motion designer &amp; créateur de contenu', 30, SANS, '#fff', 700, 0, 1.2, 'center')
    s += t(60, 1724, 960, 'edust-solutions.fr · 06 13 24 96 80', 26, SANS, 'rgba(255,255,255,.75)', 500, .02, 1.2, 'center')
    s += t(60, 1850, 960, 'Marques fictives · démo · photos Adobe Stock', 18, SANS, 'rgba(255,255,255,.5)', 400, 0, 1, 'center')
    return s
def contact():
    s = box(0, 0, W, H, 'background:#0d0d10;') + box(-200, 500, 1480, 1000, 'background:radial-gradient(ellipse,rgba(150,47,191,.3),rgba(150,47,191,0) 70%);')
    s += box(440, 300, 200, 200, f'background:{IG};border-radius:100px;', box(8, 8, 184, 184, 'background:#0d0d10;border-radius:92px;', t(0, 58, 184, 'E', 70, UB, '#fff', 700, 0, 1, 'center')))
    s += t(60, 540, 960, 'E-DUST Solutions', 28, SANS, 'rgba(255,255,255,.8)', 700, .1, al='center')
    s += t(60, 700, 960, 'Et votre commerce,<br>il raconte<br><i>quelle histoire ?</i>', 104, SER, '#fff', 400, -.01, 1.05, 'center')
    s += t(90, 1100, 900, 'Je crée vos stories et vos Reels : une histoire courte, un déclic, une raison de venir. Prêts à publier.', 34, SANS, 'rgba(255,255,255,.8)', 500, 0, 1.35, 'center')
    s += box(190, 1300, 700, 110, f'background:{IG};border-radius:55px;', t(0, 32, 700, 'Écrivez STORY en message', 40, SANS, '#fff', 700, .01, 1.1, 'center'))
    s += t(60, 1490, 960, 'Tarik Belattar', 40, SANS, '#fff', 700, 0, 1.2, 'center')
    s += t(60, 1550, 960, '06 13 24 96 80 · tarikbelatta@gmail.com', 30, SANS, 'rgba(255,255,255,.8)', 500, 0, 1.2, 'center')
    s += t(60, 1600, 960, 'edust-solutions.fr', 30, SANS, 'rgba(255,255,255,.8)', 500, 0, 1.2, 'center')
    s += t(60, 1850, 960, 'Marques fictives · démo · photos Adobe Stock', 18, SANS, 'rgba(255,255,255,.5)', 400, 0, 1, 'center')
    return s

if len(sys.argv) > 1 and sys.argv[1] == 'pdf':
    pages = [f'{L}/cover_01.png'] + sorted(glob.glob(f'{L}/stories_[0-9][0-9].png')) + [f'{L}/cover_02.png']
    ims = [Image.open(p).convert('RGB') for p in pages]
    out = f'{L}/E-DUST_stories_6_secteurs.pdf'
    ims[0].save(out, save_all=True, append_images=ims[1:], resolution=144, quality=88)
    ims[0].save(f'{L}/E-DUST_stories_couverture.jpg', quality=90)
    print(out, len(ims), 'pages', os.path.getsize(out))
else:
    head = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>E-DUST — Stories 6 secteurs (couverture)</title>{KIT}'
            '<style>html,body{margin:0;background:#222}.slide{margin:0 auto 40px}</style></head><body>')
    open(f'{D}/cover.html', 'w').write(head + ''.join(f'<section class="slide" style="position:relative;width:{W}px;height:{H}px;overflow:hidden">{f()}</section>' for f in (couverture, contact)) + '</body></html>')
    print('ok cover.html')
