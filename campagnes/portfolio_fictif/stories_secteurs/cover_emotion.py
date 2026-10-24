"""Couverture « affiche de film » du PDF des stories mini-films (9:16), puis assemblage du PDF.
Prérequis : build_emotion.py (img/e_*) et stories rendues dans livraison/.../v2_emotion/stories_emotion_XX.png.
Usage : python3 cover_emotion.py → cover_emotion.html ; rendu (render_slides.cjs <sortie> cover_emotion.html) ; python3 cover_emotion.py pdf"""
import os, sys, glob
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); W, H = 1080, 1920
L = os.path.abspath(f'{D}/../../../livraison/portfolio_fictif/stories_secteurs')
FONTS = ('<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap">')
SANS, SER, AN, HAND = "'dm-sans',sans-serif", "'dm-serif-display',serif", "'anton',sans-serif", "'Caveat',cursive"
IG = 'linear-gradient(45deg,#feda75,#fa7e1e 30%,#d62976 55%,#962fbf 80%,#4f5bd5)'
def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam=SANS, col='#fff', wt=400, ls=0, lh=1.05, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def vign(n):
    out = f'img/e_vign_{n:02d}.jpg'
    if not os.path.exists(f'{D}/{out}'):
        Image.open(f'{L}/v2_emotion/stories_emotion_{n:02d}.png').convert('RGB').resize((338, 600), Image.LANCZOS).save(f'{D}/{out}', quality=88)
    return out
# personnages : prénom, image ronde (centre du visage en % de l'image)
PERSOS = [('Inès', 'e_cafe_band.jpg', '30% 30%'), ('Rosa', 'e_pates_machine.jpg', '60% 40%'), ('Léa', 'e_route_sourire.jpg', '50% 45%'),
          ('Claire', 'e_spa_nuit.jpg', '50% 40%'), ('Jade', 'e_vue_band.jpg', '62% 40%'), ('Julie &amp; Tom', 'e_bois_couple.jpg', '50% 32%')]
def couverture():
    s = box(0, 0, W, H, 'background:#0b0a09;')
    s += box(-260, -200, 900, 900, 'background:radial-gradient(circle,rgba(250,126,30,.28),rgba(250,126,30,0) 70%);')
    s += box(520, 1200, 900, 900, 'background:radial-gradient(circle,rgba(150,47,191,.3),rgba(150,47,191,0) 70%);')
    s += t(60, 92, 960, 'E-DUST SOLUTIONS PRÉSENTE', 22, SANS, 'rgba(255,255,255,.75)', 700, .42, al='center')
    for k, (nom, im, pos) in enumerate(PERSOS):
        x = 62 + k * 162
        s += box(x, 160, 146, 146, f'background:{IG};border-radius:73px;', box(6, 6, 134, 134, 'background:#0b0a09;border-radius:67px;',
                 f'<img src="img/{im}" style="position:absolute;left:6px;top:6px;width:122px;height:122px;object-fit:cover;object-position:{pos};border-radius:61px;">'))
        s += t(x - 20, 318, 186, nom, 30, HAND, '#fff', 700, 0, 1, 'center')
    s += f'<p style="position:absolute;left:0;right:0;top:420px;margin:0 auto;width:max-content;padding:12px 30px;border-radius:30px;background:{IG};font-family:{SANS};font-size:24px;font-weight:700;color:#fff;letter-spacing:.3em;">STORIES INSTAGRAM</p>'
    s += t(40, 510, 1000, 'Six petites histoires', 108, SER, '#fff', 400, -.015, 1, 'center')
    s += t(40, 630, 1000, 'qui font dire oui.', 150, HAND, '#ffd27a', 700, 0, 1, 'center', 'text-shadow:0 6px 30px rgba(250,126,30,.35);')
    # pellicule : les 6 écrans « déclic »
    s += box(0, 860, W, 440, 'background:#16130f;')
    for y in (874, 1258):
        s += ''.join(box(18 + k * 46, y, 26, 26, 'background:#0b0a09;border-radius:5px;') for k in range(23))
    for k, n in enumerate([2, 5, 8, 11, 14, 17]):
        s += f'<img src="{vign(n)}" style="position:absolute;left:{13 + k * 177}px;top:914px;width:168px;height:298px;object-fit:cover;border-radius:6px;">'
    s += t(80, 1340, 920, 'Un café, une trattoria, une auto-école, un institut, un opticien, un menuisier.', 32, SANS, 'rgba(255,255,255,.82)', 500, 0, 1.4, 'center')
    s += t(80, 1446, 920, 'Pour chacun, un personnage et un court-métrage en 3 stories :', 34, SER, '#fff', 400, 0, 1.2, 'center', 'font-style:italic;')
    s += t(80, 1500, 920, 'le quotidien · le déclic · la nouvelle vie', 52, HAND, '#ffd27a', 700, 0, 1.1, 'center')
    s += box(240, 1600, 600, 2, f'background:{IG};')
    s += t(60, 1636, 960, 'UNE CRÉATION TARIK BELATTAR', 40, AN, '#fff', 400, .12, 1, 'center')
    s += t(60, 1696, 960, 'MOTION DESIGN &amp; STORYTELLING · E-DUST SOLUTIONS', 20, SANS, 'rgba(255,255,255,.7)', 700, .28, 1, 'center')
    s += t(60, 1740, 960, 'edust-solutions.fr · 06 13 24 96 80', 26, SANS, 'rgba(255,255,255,.8)', 500, .02, 1, 'center')
    s += t(60, 1850, 960, 'Marques et personnages fictifs · démo · photos Adobe Stock', 18, SANS, 'rgba(255,255,255,.5)', 400, 0, 1, 'center')
    return s

if len(sys.argv) > 1 and sys.argv[1] == 'pdf':
    V = f'{L}/v2_emotion'
    pages = [f'{V}/cover_emotion_01.png'] + sorted(glob.glob(f'{V}/stories_emotion_[0-9][0-9].png')) + [f'{L}/cover_02.png']
    ims = [Image.open(p).convert('RGB') for p in pages]
    out = f'{V}/E-DUST_stories_mini-films_6_secteurs.pdf'
    ims[0].save(out, save_all=True, append_images=ims[1:], resolution=144, quality=88)
    ims[0].save(f'{V}/E-DUST_stories_mini-films_couverture.jpg', quality=90)
    print(out, len(ims), 'pages', os.path.getsize(out))
else:
    head = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>E-DUST — Stories mini-films (couverture)</title>{FONTS}'
            '<style>html,body{margin:0;background:#222}.slide{margin:0 auto 40px}</style></head><body>')
    open(f'{D}/cover_emotion.html', 'w').write(head + f'<section class="slide" style="position:relative;width:{W}px;height:{H}px;overflow:hidden">{couverture()}</section></body></html>')
    print('ok cover_emotion.html')
