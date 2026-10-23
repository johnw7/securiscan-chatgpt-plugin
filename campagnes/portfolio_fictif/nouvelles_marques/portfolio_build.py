"""Portfolio de présentation 16:9 (1920×1080) des 6 nouvelles marques — pour Adobe Express, PNG et PDF.
Prérequis : build.py + rendu des visuels (livraison/…/nouvelles_marques_instagram), copies légères dans img/pf/.
Sorties : portfolio.html (images liées) et portfolio_express.html (images intégrées)."""
import os, base64
D = os.path.dirname(os.path.abspath(__file__)); W, H = 1920, 1080
KIT = '<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
SANS, UB, SER, CG, AN, MO = "'dm-sans',sans-serif", "'unbounded',sans-serif", "'dm-serif-display',serif", "'cormorant-garamond',serif", "'anton',sans-serif", "'montserrat',sans-serif"
INK, PAPER, LIME, GREY = '#0e0f12', '#f3f0ea', '#c8ff2a', '#9a9ca3'
EMB = False
def I(n): return f'img/pf/{n}' if not EMB else 'data:image/jpeg;base64,' + base64.b64encode(open(f'{D}/img/pf/{n}', 'rb').read()).decode()
def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam=SANS, col='#fff', wt=400, ls=0, lh=1.1, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def pic(src, x, y, w, h, r=24, st=''): return f'<img src="{src}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;object-fit:cover;border-radius:{r}px;box-shadow:0 30px 70px rgba(0,0,0,.35);{st}">'
def foot(col, n): return t(120, 1010, 1200, 'Tarik Belattar — E-DUST Solutions · marques fictives · photos Adobe Stock', 20, col=col) + t(1500, 1010, 300, f'{n:02d} / 09', 20, col=col, al='right')
def slide(bg, inner): return f'<section class="slide" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden;background:{bg}">{inner}</section>'

BR = [  # nom, fichier, produit, accroche, concept, palette, typo (famille, nom affiché), fond, encre, accent, font titre
 ('FIZZ.LAB', '01_fizzlab', 'Soda artisanal', '« Bulles sérieuses. »', 'Pop années 2000 : dégradé vitaminé, canette chromée détourée, étincelles et pastille « sans sucre ajouté ».', ['#ff3d9a', '#ff7a3d', '#ffd23d', '#111111'], 'Unbounded · DM Sans', '#1a0d14', '#fff', '#ffd23d', UB),
 ('aura', '02_aura', 'Sérum éclat', '« Ta peau, version lumière. »', 'Minimal et lumineux : lilas poudré, typographie à empattements, beaucoup d’air autour du produit.', ['#ece5f7', '#c8aaff', '#7b5cc4', '#2a2140'], 'DM Serif Display · DM Sans', '#ece5f7', '#2a2140', '#7b5cc4', SER),
 ('SOLARA', '03_solara', 'Lunettes de soleil', '« L’été ne finit jamais. »', 'Cinéma au coucher de soleil : halo orange-violet, noir profond, titre italique très gras.', ['#0c0907', '#ffb347', '#ff5e62', '#8a2be2'], 'Montserrat · DM Sans', '#0c0907', '#fff', '#ffb347', MO),
 ('GLOU', '04_glou', 'Glacier artisanal', '« Une boule ? Deux ! »', 'Ultra pop : rose bonbon, vague, bulle de dialogue et pastille « givré maison » pour un ton complice.', ['#ffd6e8', '#ff4f9a', '#ffe14d', '#2b1030'], 'Unbounded · DM Sans', '#ffd6e8', '#2b1030', '#ff4f9a', UB),
 ('NOMADE', '05_nomade', 'Café de spécialité', '« Le café qui voyage. »', 'Éditorial chaleureux : bruns profonds, étiquette d’origine façon carnet de voyage, capitales espacées.', ['#2a1a12', '#7a4b2a', '#d9a86c', '#f3e3c8'], 'Cormorant Garamond · DM Sans', '#2a1a12', '#f3e3c8', '#d9a86c', CG),
 ('ROUGE VIF', '06_rouge_vif', 'Rouge à lèvres', '« Ose le rouge. »', 'Couverture de magazine : bandeau rouge, motif de rouges à lèvres, contraste noir et rouge franc.', ['#0a0a14', '#e0182d', '#ff8a95', '#ffffff'], 'Anton · DM Serif Display', '#0a0a14', '#fff', '#e0182d', AN)]

def build():
    S = []
    # 1 · couverture
    s = box(0, 0, W, H, f'background:radial-gradient(circle at 75% 45%,#1f2a12 0%,{INK} 60%);')
    s += t(120, 140, 900, 'PORTFOLIO · DERNIÈRES CRÉATIONS', 24, col=LIME, wt=700, ls=.2)
    s += t(120, 200, 900, '6 marques.<br>6 univers.<br>Prêts à publier.', 104, UB, PAPER, 700, -.03, 1.02)
    s += t(120, 620, 820, 'Posts et stories Instagram imaginés pour six produits fictifs, du soda pop au rouge à lèvres. Conçus et modifiables dans Adobe Express.', 28, col='#b9bbc2', lh=1.45)
    for k, (x, y, f) in enumerate([(1000, 170, '04_glou_post.jpg'), (1330, 110, '01_fizzlab_post.jpg'), (1180, 520, '06_rouge_vif_post.jpg')]):
        s += pic(I(f), x, y, 380, 475, 22)
    S.append(slide(INK, s + foot('rgba(243,240,234,.55)', 1)))
    # 2 · vue d'ensemble
    s = t(120, 110, 1200, 'Vue d’ensemble', 64, UB, INK, 700, -.02) + t(1300, 130, 500, 'POSTS INSTAGRAM 4:5', 22, col='#5b6b12', wt=700, ls=.2, al='right')
    for k, b in enumerate(BR):
        x = 120 + k * 283; s += pic(I(f'{b[1]}_post.jpg'), x, 250, 260, 325, 16) + t(x, 600, 260, b[0], 30, b[10], INK, 700 if b[10] in (UB, MO) else 400, 0) + t(x, 645, 260, b[2], 22, col='#4a4c55')
    s += t(120, 760, 1680, 'Chaque marque a sa direction artistique : palette, typographies, ton et accroche. Chaque visuel existe en post 4:5 et en story 9:16.', 30, col='#4a4c55', lh=1.4)
    S.append(slide(PAPER, s + foot('#6e7079', 2)))
    # 3-8 · une marque par slide
    for k, (name, f, prod, hook, concept, pal, typo, bg, ink, acc, fam) in enumerate(BR):
        dark = bg in ('#1a0d14', '#0c0907', '#2a1a12', '#0a0a14'); sub = 'rgba(255,255,255,.72)' if dark else 'rgba(0,0,0,.65)'
        s = t(120, 110, 700, f'{k + 1:02d} · {prod.upper()}', 22, col=acc, wt=700, ls=.2)
        s += t(120, 160, 760, name, 110 if len(name) < 8 else 92, fam, ink, 700 if fam in (UB, MO) else 400, -.02 if fam != CG else .08, 1.0, st='font-style:italic;' if fam == MO else '')
        s += t(120, 310, 740, hook, 40, SER if fam != SER else SER, acc, 400, 0, 1.2, st='font-style:italic;')
        s += t(120, 390, 720, concept, 28, col=sub, lh=1.45)
        s += t(120, 590, 400, 'PALETTE', 20, col=sub, wt=700, ls=.2)
        for i, c in enumerate(pal):
            s += box(120 + i * 150, 630, 130, 130, f'background:{c};border-radius:18px;border:1px solid rgba(128,128,128,.35);') + t(120 + i * 150, 772, 130, c.upper(), 18, col=sub)
        s += t(120, 830, 720, 'TYPOGRAPHIES', 20, col=sub, wt=700, ls=.2) + t(120, 866, 720, typo, 28, col=ink, wt=500)
        s += pic(I(f'{f}_post.jpg'), 900, 120, 560, 700, 22) + pic(I(f'{f}_story.jpg'), 1500, 120, 394 - 0, 700, 22)
        s += t(900, 840, 560, 'Post 4:5', 22, col=sub, al='center') + t(1500, 840, 394, 'Story 9:16', 22, col=sub, al='center')
        S.append(slide(bg, s + foot('rgba(255,255,255,.5)' if dark else 'rgba(0,0,0,.5)', k + 3)))
    # 9 · contact
    s = box(0, 0, W, H, f'background:radial-gradient(circle at 30% 40%,#1f2a12 0%,{INK} 60%);')
    s += t(120, 170, 1600, 'ET SI LA PROCHAINE, C’ÉTAIT LA VÔTRE ?', 24, col=LIME, wt=700, ls=.2)
    s += t(120, 230, 1500, 'Votre marque mérite<br>d’être vue.', 120, UB, PAPER, 700, -.03, 1.0)
    s += t(120, 540, 1100, 'Visuels réseaux sociaux, identité de marque et pubs vidéo storytellées : je crée des contenus qui arrêtent le scroll.', 32, col='#b9bbc2', lh=1.45)
    s += box(120, 720, 640, 100, f'background:{LIME};border-radius:50px;', t(0, 32, 640, 'Une vidéo découverte offerte', 32, col=INK, wt=700, al='center'))
    s += t(860, 720, 900, 'Tarik Belattar — E-DUST Solutions', 34, col=PAPER, wt=700) + t(860, 772, 900, '06 13 24 96 80 · tarikbelatta@gmail.com', 28, col='#b9bbc2') + t(860, 815, 900, 'edust-solutions.fr', 28, col=LIME, wt=700)
    S.append(slide(INK, s + foot('rgba(243,240,234,.55)', 9)))
    head = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide"><meta name="hz:canvas-width" content="{W}"><meta name="hz:canvas-height" content="{H}">'
            f'<title>E-DUST — Portfolio dernières créations</title>{KIT}<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>')
    return head + ''.join(S) + '</body></html>'
for emb in (False, True):
    EMB = emb; open(f'{D}/portfolio{"_express" if emb else ""}.html', 'w').write(build())
print('ok', os.path.getsize(f'{D}/portfolio_express.html'))
