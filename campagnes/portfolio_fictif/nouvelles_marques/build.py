"""6 nouvelles marques fictives — visuels Instagram prêts à publier : post 4:5 (1080×1350) et story 9:16 (1080×1920).
Photos : Adobe Stock (licence gratuite) via prep.py. Polices : kit Adobe Fonts ark1qxx.
Sorties : posts.html / stories.html (aperçu, export PNG) et *_express.html (images intégrées, import Adobe Express)."""
import os, base64
D = os.path.dirname(os.path.abspath(__file__)); W = 1080
KIT = '<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
SANS, UB, SER, CG, AN, MO = "'dm-sans',sans-serif", "'unbounded',sans-serif", "'dm-serif-display',serif", "'cormorant-garamond',serif", "'anton',sans-serif", "'montserrat',sans-serif"
EMB = False
def I(n):
    if not EMB: return f'img/{n}'
    return ('data:image/png;base64,' if n.endswith('png') else 'data:image/jpeg;base64,') + base64.b64encode(open(f'{D}/img/{n}', 'rb').read()).decode()
def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam=SANS, col='#fff', wt=400, ls=0, lh=1.05, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def pic(src, x, y, w, h, st='', fit='cover'): return f'<img src="{src}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;object-fit:{fit};{st}">'
def star(x, y, s, c):  # étincelle 4 branches
    return (f'<svg width="{s}" height="{s}" viewBox="0 0 100 100" style="position:absolute;left:{x}px;top:{y}px"><path d="M50 0 C55 38 62 45 100 50 C62 55 55 62 50 100 C45 62 38 55 0 50 C38 45 45 38 50 0Z" fill="{c}"/></svg>')
def demo(H, col='rgba(255,255,255,.6)'): return t(60, H - 58, 960, 'Démo · marque fictive · photo Adobe Stock · création E-DUST Solutions', 18, col=col, al='center')

# ---------- 1 · FIZZ.LAB — soda artisanal, pop Y2K chromé
def fizz(H):
    s = box(0, 0, W, H, 'background:linear-gradient(160deg,#ff3d9a 0%,#ff7a3d 45%,#ffd23d 100%);')
    for i in range(4): s += t(-60, 60 + i * (H / 4.3), 1300, 'FIZZ FIZZ FIZZ', 210, UB, 'rgba(255,255,255,.16)', 700, -.02, 1, st='white-space:nowrap;')
    for (x, y, r) in [(120, .30, 70), (860, .22, 46), (930, .55, 90), (90, .62, 40), (780, .72, 30), (200, .80, 60)]:
        s += box(x, int(H * y), r, r, f'border:4px solid rgba(255,255,255,.75);border-radius:{r}px;')
    cw = 520 if H < 1500 else 600; ch = int(cw * 2070 / 1787 * 1.0)
    s += box(W / 2 - cw * .45, int(H * .5) + ch * .38, cw * .9, 60, 'background:rgba(120,20,60,.35);border-radius:50%;filter:blur(14px);')
    s += pic(I('fizz_cut.png'), W / 2 - cw / 2, int(H * .5) - ch / 2 + 40, cw, ch, 'transform:rotate(-8deg);', 'contain')
    s += box(W / 2 - 200, int(H * .5) + 10, 400, 140, 'background:#111;border-radius:70px;transform:rotate(-8deg);', t(0, 28, 400, 'FIZZ.LAB', 64, UB, '#ffd23d', 700, -.02, 1, 'center'))
    s += star(150, int(H * .38), 90, '#fff') + star(840, int(H * .62), 120, '#111') + star(800, int(H * .34), 60, '#fff')
    s += t(60, 70, 960, 'NOUVEAU · ÉDITION YUZU', 26, SANS, '#111', 700, .25, al='center')
    s += t(60, int(H * .80), 960, 'Bulles<br>sérieuses.', 120 if H < 1500 else 140, UB, '#fff', 700, -.03, .95, 'center', 'text-shadow:0 6px 0 #111;')
    s += box(W - 300, 140, 220, 220, 'background:#111;border-radius:110px;transform:rotate(12deg);', t(0, 58, 220, 'SANS<br>SUCRE<br>AJOUTÉ', 30, UB, '#ffd23d', 700, 0, 1.05, 'center'))
    return s + demo(H, 'rgba(17,17,17,.6)')
# ---------- 2 · AURA — sérum éclat, minimal lumineux
def aura(H):
    s = pic(I('aura.jpg'), 0, 0, W, H) + box(0, 0, W, H, 'background:linear-gradient(180deg,rgba(236,229,247,.0) 35%,rgba(236,229,247,.85) 75%,#ece5f7 100%);')
    s += box(-200, int(H * .58), 700, 700, 'background:radial-gradient(circle,rgba(200,170,255,.55),rgba(200,170,255,0) 70%);border-radius:350px;')
    s += t(60, 80, 960, 'a u r a', 64, SER, '#3b2e5a', 400, .3, al='center')
    s += t(60, int(H * .66), 960, 'Ta peau,<br><i>version lumière.</i>', 108 if H < 1500 else 124, SER, '#2a2140', 400, -.01, 1.0, 'center')
    s += box(390, int(H * .66) + (260 if H < 1500 else 290), 300, 2, 'background:#7b5cc4;')
    s += t(60, int(H * .66) + (290 if H < 1500 else 320), 960, 'SÉRUM ÉCLAT · VITAMINE C · 30 ML', 24, SANS, '#3b2e5a', 700, .22, al='center')
    s += box(W - 250, int(H * .12), 180, 180, 'background:rgba(255,255,255,.75);border-radius:90px;border:1px solid rgba(123,92,196,.4);', t(0, 52, 180, 'clean<br>beauty', 34, SER, '#7b5cc4', 400, 0, 1.0, 'center', 'font-style:italic;'))
    return s + demo(H, 'rgba(42,33,64,.55)')
# ---------- 3 · SOLARA — lunettes de soleil, cinéma coucher de soleil
def solara(H):
    ph = int(W * 2356 / 1571)
    s = box(0, 0, W, H, 'background:#0c0907;') + pic(I('solara.jpg'), 0, min(0, int(H * .38) - int(ph * .3)), W, ph)
    s += box(0, 0, W, H, 'background:radial-gradient(circle at 50% 30%,rgba(255,140,60,.55) 0%,rgba(255,80,100,.35) 30%,rgba(120,40,200,.15) 50%,rgba(12,9,7,0) 70%);')
    s += box(0, int(H * .6), W, int(H * .4), 'background:linear-gradient(180deg,rgba(12,9,7,0),#0c0907 40%);')
    s += t(60, 80, 960, 'S O L A R A', 40, MO, '#ffb347', 600, .4, al='center')
    s += t(60, int(H * .62), 960, 'L\'été ne<br>finit jamais.', 116 if H < 1500 else 134, MO, '#fff', 800, -.02, .98, 'center', 'font-style:italic;')
    s += t(60, int(H * .62) + (270 if H < 1500 else 310), 960, 'Collection Golden Hour · verres polarisés', 28, SANS, 'rgba(255,255,255,.75)', 400, .04, al='center')
    s += box(330, int(H * .62) + (340 if H < 1500 else 390), 420, 80, 'background:linear-gradient(90deg,#ffb347,#ff5e62,#8a2be2);border-radius:40px;', t(0, 22, 420, 'DÉCOUVRIR LA COLLECTION', 24, SANS, '#fff', 700, .12, al='center'))
    return s + demo(H)
# ---------- 4 · GLOU — glacier artisanal, ultra pop
def glou(H):
    s = box(0, 0, W, H, 'background:#ffd6e8;')
    s += box(0, int(H * .58), W, int(H * .42), 'background:#ff4f9a;') + (f'<svg width="{W}" height="140" viewBox="0 0 1080 140" preserveAspectRatio="none" style="position:absolute;left:0;top:{int(H * .58) - 70}px"><path d="M0 70 Q 90 0 180 70 T 360 70 T 540 70 T 720 70 T 900 70 T 1080 70 V140 H0Z" fill="#ff4f9a"/></svg>')
    s += t(0, int(H * .06), W, 'GLOU', 270 if H < 1500 else 290, UB, '#ff4f9a', 700, -.05, .9, 'center')
    cw = 520 if H < 1500 else 600; ch = int(cw * 1.95)
    s += pic(I('glou_cut.png'), W / 2 - cw / 2 + 30, int(H * .2), cw, ch, 'transform:rotate(-12deg);filter:drop-shadow(0 30px 30px rgba(120,0,60,.35));', 'contain')
    s += box(80, int(H * .38), 300, 150, 'background:#fff;border-radius:40px 40px 40px 6px;box-shadow:0 12px 0 #2b1030;', t(0, 36, 300, 'Une boule ?<br><b>Deux !</b>', 34, SANS, '#2b1030', 500, 0, 1.1, 'center'))
    s += box(W - 330, int(H * .62), 250, 250, 'background:#ffe14d;border-radius:125px;transform:rotate(14deg);box-shadow:0 10px 0 #2b1030;', t(0, 62, 250, 'GIVRÉ<br>MAISON', 38, UB, '#2b1030', 700, 0, 1.0, 'center'))
    s += star(860, int(H * .3), 80, '#ffe14d') + star(120, int(H * .66), 60, '#fff') + star(800, int(H * .16) + 200, 46, '#fff')
    s += t(60, int(H * .84), 960, 'Glacier artisanal · sorbets &amp; soft · Paris 11e', 30, SANS, '#fff', 700, .04, al='center')
    return s + demo(H)
# ---------- 5 · NOMADE — café de spécialité, éditorial chaleureux
def nomade(H):
    s = box(0, 0, W, H, 'background:#2a1a12;') + pic(I('nomade.jpg'), -int(H * .35), 0, int(H * 1.5), H)
    s += box(0, 0, W, H, 'background:linear-gradient(180deg,rgba(42,26,18,.75) 0%,rgba(42,26,18,.1) 30%,rgba(42,26,18,.2) 60%,rgba(42,26,18,.92) 85%);')
    s += t(60, 80, 960, 'NOMADE', 96, CG, '#f3e3c8', 500, .35, al='center') + t(60, 190, 960, 'CAFÉ DE SPÉCIALITÉ · TORRÉFIÉ À PARIS', 22, SANS, '#d9a86c', 700, .3, al='center')
    s += t(60, int(H * .7), 960, 'Le café<br><i>qui voyage.</i>', 120 if H < 1500 else 140, CG, '#fff', 500, -.01, .95, 'center')
    s += box(W - 330, int(H * .36), 250, 340, 'background:#f3e3c8;border-radius:10px;transform:rotate(6deg);box-shadow:0 20px 40px rgba(0,0,0,.4);',
             t(0, 30, 250, 'ORIGINE', 18, SANS, '#7a4b2a', 700, .3, al='center') + t(0, 66, 250, 'Éthiopie', 46, CG, '#2a1a12', 500, al='center') + box(60, 130, 130, 1, 'background:#7a4b2a;')
             + t(0, 150, 250, 'Notes de fleurs<br>blanches &amp; d\'agrumes', 20, SANS, '#2a1a12', 400, 0, 1.4, 'center') + t(0, 250, 250, 'N° 07', 40, CG, '#d9a86c', 500, .1, al='center'))
    return s + demo(H)
# ---------- 6 · ROUGE VIF — rouge à lèvres, couverture de magazine
def rouge(H):
    s = box(0, 0, W, H, 'background:#0a0a14;') + pic(I('rouge.jpg'), -int(H * .35), 0, int(H * 1.5), H)
    s += box(0, 0, W, H, 'background:linear-gradient(180deg,rgba(10,10,20,.1) 40%,rgba(10,10,20,.88) 80%);')
    s += box(0, 0, W, 230, 'background:#e0182d;') + t(0, 34, W, 'ROUGE VIF', 150, AN, '#fff', 400, .04, 1, 'center')
    s += t(60, int(H * .66), 960, 'Ose<br><i>le rouge.</i>', 150 if H < 1500 else 170, SER, '#fff', 400, -.02, .9, 'center')
    s += t(60, int(H * .66) + (300 if H < 1500 else 340), 960, 'NOUVELLE COLLECTION · 12 TEINTES · TENUE 12 H', 24, SANS, '#ff8a95', 700, .2, al='center')
    s += box(70, 270, 200, 200, 'background:#e0182d;border-radius:100px;', t(0, 58, 200, 'N°1<br>de ta<br>trousse', 26, SANS, '#fff', 700, 0, 1.1, 'center'))
    return s + demo(H)

BR = [('FIZZ.LAB', fizz), ('AURA', aura), ('SOLARA', solara), ('GLOU', glou), ('NOMADE', nomade), ('ROUGE VIF', rouge)]
def doc(H, title):
    head = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide"><meta name="hz:canvas-width" content="{W}"><meta name="hz:canvas-height" content="{H}">'
            f'<title>{title}</title>{KIT}<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>')
    return head + ''.join(f'<section class="slide" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden">{f(H)}</section>' for _, f in BR) + '</body></html>'
for emb in (False, True):
    EMB = emb; suf = '_express' if emb else ''
    open(f'{D}/posts{suf}.html', 'w').write(doc(1350, 'E-DUST — 6 marques · posts 4:5'))
    open(f'{D}/stories{suf}.html', 'w').write(doc(1920, 'E-DUST — 6 marques · stories 9:16'))
print('ok')
