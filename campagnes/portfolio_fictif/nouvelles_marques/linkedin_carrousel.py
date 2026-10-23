"""Carrousel LinkedIn 4:5 (1080×1350, 8 pages) tiré du portfolio des 6 nouvelles marques — pour Adobe Express et PDF.
Prérequis : img/pf/ (voir portfolio_build.py). Sorties : linkedin.html (images liées) et linkedin_express.html (images intégrées)."""
import os, base64
D = os.path.dirname(os.path.abspath(__file__)); W, H = 1080, 1350; N = 8
KIT = '<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
SANS, UB, SER, CG, AN, MO = "'dm-sans',sans-serif", "'unbounded',sans-serif", "'dm-serif-display',serif", "'cormorant-garamond',serif", "'anton',sans-serif", "'montserrat',sans-serif"
INK, PAPER, LIME = '#0e0f12', '#f3f0ea', '#c8ff2a'
EMB = False
def I(n): return f'img/pf/{n}' if not EMB else 'data:image/jpeg;base64,' + base64.b64encode(open(f'{D}/img/pf/{n}', 'rb').read()).decode()
def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam=SANS, col='#fff', wt=400, ls=0, lh=1.1, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def pic(src, x, y, w, h, r=20, st=''): return f'<img src="{src}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;object-fit:cover;border-radius:{r}px;box-shadow:0 26px 60px rgba(0,0,0,.35);{st}">'
def foot(col, n): return t(70, 1280, 760, 'Tarik Belattar — E-DUST Solutions · marques fictives (démo) · photos Adobe Stock', 17, col=col) + t(850, 1280, 160, f'{n:02d} / {N:02d}', 17, col=col, al='right')
def slide(bg, inner): return f'<section class="slide" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden;background:{bg}">{inner}</section>'

BR = [  # nom, fichier, produit, accroche, palette, typo, fond, encre, accent, font titre
 ('FIZZ.LAB', '01_fizzlab', 'Soda artisanal', '« Bulles sérieuses. »', ['#ff3d9a', '#ff7a3d', '#ffd23d', '#111111'], 'Unbounded · DM Sans', '#1a0d14', '#fff', '#ffd23d', UB),
 ('aura', '02_aura', 'Sérum éclat', '« Ta peau, version lumière. »', ['#ece5f7', '#c8aaff', '#7b5cc4', '#2a2140'], 'DM Serif Display · DM Sans', '#ece5f7', '#2a2140', '#7b5cc4', SER),
 ('SOLARA', '03_solara', 'Lunettes de soleil', '« L’été ne finit jamais. »', ['#0c0907', '#ffb347', '#ff5e62', '#8a2be2'], 'Montserrat · DM Sans', '#0c0907', '#fff', '#ffb347', MO),
 ('GLOU', '04_glou', 'Glacier artisanal', '« Une boule ? Deux ! »', ['#ffd6e8', '#ff4f9a', '#ffe14d', '#2b1030'], 'Unbounded · DM Sans', '#ffd6e8', '#2b1030', '#ff4f9a', UB),
 ('NOMADE', '05_nomade', 'Café de spécialité', '« Le café qui voyage. »', ['#2a1a12', '#7a4b2a', '#d9a86c', '#f3e3c8'], 'Cormorant Garamond · DM Sans', '#2a1a12', '#f3e3c8', '#d9a86c', CG),
 ('ROUGE VIF', '06_rouge_vif', 'Rouge à lèvres', '« Ose le rouge. »', ['#0a0a14', '#e0182d', '#ff8a95', '#ffffff'], 'Anton · DM Serif Display', '#0a0a14', '#fff', '#e0182d', AN)]
DARK = ('#1a0d14', '#0c0907', '#2a1a12', '#0a0a14')

def build():
    S = []
    # 1 · couverture : l'accroche du post
    s = box(0, 0, W, H, f'background:radial-gradient(circle at 70% 75%,#1f2a12 0%,{INK} 62%);')
    s += t(70, 90, 900, 'PORTFOLIO · DÉMO', 22, col=LIME, wt=700, ls=.22)
    s += t(70, 140, 950, '6 marques.<br>6 univers.<br>Aucune<br>n’existe.', 104, UB, PAPER, 700, -.03, 1.02)
    for x, y, f, r in [(70, 760, '04_glou_post.jpg', -6), (390, 720, '01_fizzlab_post.jpg', 0), (710, 760, '06_rouge_vif_post.jpg', 6)]:
        s += pic(I(f), x, y, 300, 375, 18, f'transform:rotate({r}deg);')
    s += t(70, 1200, 940, 'Faites défiler →', 30, col=LIME, wt=700, al='right')
    S.append(slide(INK, s + foot('rgba(243,240,234,.55)', 1)))
    # 2-7 · une marque par page
    for k, (name, f, prod, hook, pal, typo, bg, ink, acc, fam) in enumerate(BR):
        dark = bg in DARK; sub = 'rgba(255,255,255,.72)' if dark else 'rgba(0,0,0,.62)'
        s = t(70, 70, 900, f'{k + 1:02d} / 06 · {prod.upper()}', 22, col=acc, wt=700, ls=.2)
        s += t(70, 112, 940, name, 96, fam, ink, 700 if fam in (UB, MO) else 400, -.02 if fam != CG else .08, 1.0, st='font-style:italic;' if fam == MO else '')
        s += t(70, 230, 940, hook, 42, SER, acc, 400, 0, 1.2, st='font-style:italic;')
        s += pic(I(f'{f}_post.jpg'), 85, 330, 520, 650, 20) + pic(I(f'{f}_story.jpg'), 629, 330, 366, 650, 20)
        s += t(85, 994, 520, 'Post 4:5', 19, col=sub, al='center') + t(629, 994, 366, 'Story 9:16', 19, col=sub, al='center')
        s += t(85, 1052, 400, 'PALETTE', 18, col=sub, wt=700, ls=.2)
        for i, c in enumerate(pal):
            s += box(85 + i * 120, 1088, 96, 96, f'background:{c};border-radius:16px;border:1px solid rgba(128,128,128,.35);') + t(85 + i * 120, 1192, 110, c.upper(), 16, col=sub)
        s += t(600, 1052, 400, 'TYPOGRAPHIES', 18, col=sub, wt=700, ls=.2) + t(600, 1088, 400, typo.replace(' · ', '<br>'), 26, col=ink, wt=500, lh=1.35)
        S.append(slide(bg, s + foot('rgba(255,255,255,.5)' if dark else 'rgba(0,0,0,.5)', k + 2)))
    # 8 · appel à l'action
    s = box(0, 0, W, H, f'background:radial-gradient(circle at 30% 30%,#1f2a12 0%,{INK} 62%);')
    s += t(70, 120, 940, 'ET SI LA PROCHAINE, C’ÉTAIT LA VÔTRE ?', 22, col=LIME, wt=700, ls=.2)
    s += t(70, 180, 940, 'Votre marque mérite d’être vue.', 92, UB, PAPER, 700, -.03, 1.04)
    s += t(70, 600, 900, 'Commerçant, artisan, petite marque : je crée votre première vidéo Reel, à vos couleurs, pour voir ce que ça donne chez vous.', 34, col='#b9bbc2', lh=1.45)
    s += box(70, 850, 940, 130, f'background:{LIME};border-radius:65px;', t(0, 38, 940, 'Écrivez VIDÉO en commentaire', 44, UB, INK, 700, -.01, 1.2, 'center'))
    s += t(70, 1010, 940, '1re vidéo offerte · sans engagement', 26, col=LIME, wt=700, al='center')
    s += t(70, 1110, 940, 'Tarik Belattar — E-DUST Solutions', 30, col=PAPER, wt=700) + t(70, 1155, 940, '06 13 24 96 80 · tarikbelatta@gmail.com · edust-solutions.fr', 24, col='#b9bbc2')
    S.append(slide(INK, s + foot('rgba(243,240,234,.55)', N)))
    head = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide"><meta name="hz:canvas-width" content="{W}"><meta name="hz:canvas-height" content="{H}">'
            f'<title>E-DUST — Carrousel LinkedIn 6 marques</title>{KIT}<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>')
    return head + ''.join(S) + '</body></html>'
for emb in (False, True):
    EMB = emb; open(f'{D}/linkedin{"_express" if emb else ""}.html', 'w').write(build())
print('ok', os.path.getsize(f'{D}/linkedin_express.html'))
