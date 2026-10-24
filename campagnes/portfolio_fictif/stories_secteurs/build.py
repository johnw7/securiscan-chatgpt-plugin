"""Stories Instagram 9:16 (1080×1920) pour 6 secteurs, marques fictives (démo) : 3 écrans par marque,
racontés comme une mini-histoire (quotidien → déclic → appel à l'action), avec des « stickers » façon Instagram.
Photos : Adobe Stock (licence gratuite) dans raw/ ; recadrages et étalonnages générés ici dans img/.
Zone utile : textes importants entre y=250 et y=1650 (hors barre de progression et champ de réponse).
Polices : kit Adobe Fonts ark1qxx. Sorties : stories.html (rendu PNG) et stories_express.html (images intégrées, Adobe Express).
Usage : python3 build.py"""
import os, base64
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
D = os.path.dirname(os.path.abspath(__file__)); W, H = 1080, 1920
KIT = '<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
SANS, UB, SER, CG, AN, MO = "'dm-sans',sans-serif", "'unbounded',sans-serif", "'dm-serif-display',serif", "'cormorant-garamond',serif", "'anton',sans-serif", "'montserrat',sans-serif"
EMB = False

def crop(src, out, w, h, fx=.5, fy=.5, zoom=1.0, fx_=None):
    """Recadre raw/src au ratio w/h autour du point (fx, fy), applique fx_ (étalonnage) et enregistre img/out (w×h)."""
    if not os.path.exists(f'{D}/img/{out}'):
        i = Image.open(f'{D}/raw/{src}').convert('RGB'); r = w / h
        cw, ch = (i.height * r, i.height) if i.width / i.height > r else (i.width, i.width / r)
        cw, ch = cw / zoom, ch / zoom
        x = min(max(fx * i.width - cw / 2, 0), i.width - cw); y = min(max(fy * i.height - ch / 2, 0), i.height - ch)
        i = i.crop((int(x), int(y), int(x + cw), int(y + ch))).resize((w, h), Image.LANCZOS)
        (fx_(i) if fx_ else i).save(f'{D}/img/{out}', quality=86, optimize=True, progressive=True)
    return out
def cool(i): return Image.blend(ImageEnhance.Color(i).enhance(.35), Image.new('RGB', i.size, '#1d2b45'), .22)
def warm(i): return Image.blend(ImageEnhance.Color(i).enhance(1.12), Image.new('RGB', i.size, '#e8a35a'), .08)
def flou(i): return ImageEnhance.Brightness(i.filter(ImageFilter.GaussianBlur(22))).enhance(.92)
def nuit(i): return Image.blend(ImageEnhance.Brightness(i).enhance(.8), Image.new('RGB', i.size, '#0c1424'), .25)

def I(n): return f'img/{n}' if not EMB else 'data:image/jpeg;base64,' + base64.b64encode(open(f'{D}/img/{n}', 'rb').read()).decode()
def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam=SANS, col='#fff', wt=400, ls=0, lh=1.05, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def pic(src, x, y, w, h, st=''): return f'<img src="{I(src)}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;object-fit:cover;{st}">'
def full(src, out, fx, fy=.5, fx_=None, zoom=1.0): return pic(crop(src, out, W, H, fx, fy, zoom, fx_), 0, 0, W, H)
def fade(y, h, col, a0=0, a1=.9, rev=False):
    c = col.lstrip('#'); r, g, b = (int(c[k:k + 2], 16) for k in (0, 2, 4)); s0, s1 = f'rgba({r},{g},{b},{a0})', f'rgba({r},{g},{b},{a1})'
    return box(0, y, W, h, f'background:linear-gradient(180deg,{s1 if rev else s0},{s0 if rev else s1});')
def tag(x, y, s, bg, col, size=24, fam=SANS):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;margin:0;padding:14px 26px;border-radius:40px;background:{bg};font-family:{fam};font-size:{size}px;font-weight:700;color:{col};letter-spacing:.14em;white-space:nowrap;">{s}</p>'
def step(n, col):
    """Petit repère « n/3 » pour suivre l'histoire d'un écran à l'autre."""
    return t(900, 268, 120, f'{n}/3', 24, SANS, col, 700, .1, al='right')
def demo(col='rgba(255,255,255,.6)'): return t(60, 1866, 960, 'Démo · marque fictive · photo Adobe Stock · création E-DUST Solutions', 18, col=col, al='center')

# ---------- « stickers » façon Instagram (visuels : à recréer avec les vrais stickers dans l'appli)
def poll(x, y, w, q, a, b, acc):
    s = box(x, y, w, 330, 'background:#fff;border-radius:34px;box-shadow:0 18px 50px rgba(0,0,0,.28);')
    s += box(x, y, w, 120, f'background:{acc};border-radius:34px 34px 0 0;', t(30, 30, w - 60, q, 38, SANS, '#fff', 700, -.01, 1.1, 'center'))
    for k, o in enumerate((a, b)):
        s += box(x + 30, y + 150 + k * 86, w - 60, 70, 'background:#f1f1f1;border-radius:35px;', t(0, 18, w - 60, o, 32, SANS, '#262626', 700, .02, 1.1, 'center'))
    return s
def quiz(x, y, w, q, opts, acc):
    hh = 130 + 88 * len(opts)
    s = box(x, y, w, hh, 'background:#fff;border-radius:34px;box-shadow:0 18px 50px rgba(0,0,0,.28);')
    s += t(x + 30, y + 34, w - 60, q, 36, SANS, '#262626', 700, -.01, 1.15, 'center')
    for k, o in enumerate(opts):
        s += box(x + 30, y + 120 + k * 88, w - 60, 70, 'border:3px solid #e6e6e6;border-radius:35px;',
                 box(14, 11, 42, 42, f'background:{acc};border-radius:21px;', t(0, 8, 42, 'ABC'[k], 24, SANS, '#fff', 700, 0, 1.1, 'center')) + t(76, 16, w - 140, o, 30, SANS, '#262626', 600, 0, 1.15))
    return s
def slider(x, y, w, q, emo, acc, pos=.72):
    s = box(x, y, w, 230, 'background:#fff;border-radius:34px;box-shadow:0 18px 50px rgba(0,0,0,.28);')
    s += t(x + 30, y + 36, w - 60, q, 36, SANS, '#262626', 700, -.01, 1.15, 'center')
    bx, bw = x + 60, w - 120
    s += box(bx, y + 160, bw, 14, 'background:#e9e9e9;border-radius:7px;') + box(bx, y + 160, int(bw * pos), 14, f'background:{acc};border-radius:7px;')
    return s + t(bx + int(bw * pos) - 40, y + 124, 80, emo, 68, SANS, '#000', 400, 0, 1, 'center')
def question(x, y, w, q, ph, acc):
    s = box(x, y, w, 260, f'background:{acc};border-radius:34px;box-shadow:0 18px 50px rgba(0,0,0,.28);')
    s += t(x + 30, y + 36, w - 60, q, 38, SANS, '#fff', 700, -.01, 1.15, 'center')
    return s + box(x + 30, y + 150, w - 60, 80, 'background:rgba(255,255,255,.92);border-radius:22px;', t(0, 22, w - 60, ph, 30, SANS, '#8e8e8e', 500, 0, 1.15, 'center'))
def link(x, y, s, col='#2e6bff'):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;margin:0;padding:22px 40px;border-radius:18px;background:#fff;font-family:{SANS};font-size:34px;font-weight:700;color:{col};white-space:nowrap;box-shadow:0 14px 40px rgba(0,0,0,.25);">🔗 {s}</p>'

# ---------- 1 · GRAIN D'AUBE — coffee shop : la grisaille du matin, puis la chaleur
CA, CC, CE = '#c8873a', '#f3e6d3', '#2b1a12'
def cafe1():
    s = full('cafe_bus.jpg', 'cafe_bus.jpg', .4, .5, cool) + fade(0, 520, '#0e1626', 0, .85, True) + fade(1080, 840, '#0e1626', 0, .95)
    s += t(60, 270, 700, "GRAIN D'AUBE", 30, MO, CC, 700, .3) + step(1, 'rgba(243,230,211,.7)')
    s += t(60, 990, 960, '7 h 42', 200, UB, 'rgba(243,230,211,.28)', 700, -.04, .9)
    s += t(60, 1210, 960, 'Le bus. Les mails.<br>La tête déjà pleine.', 92, SER, CC, 400, -.01, 1.02)
    s += t(60, 1470, 960, 'Tu connais ce matin-là ?', 36, SANS, 'rgba(243,230,211,.75)', 500, .02)
    return s + demo()
def cafe2():
    s = full('cafe_latte.jpg', 'cafe_latte.jpg', .56, .5, warm) + fade(0, 520, CE, 0, .7, True) + fade(1100, 820, CE, 0, .92)
    s += t(60, 270, 700, "GRAIN D'AUBE", 30, MO, CC, 700, .3) + step(2, 'rgba(243,230,211,.7)')
    s += t(60, 1150, 960, 'Et puis…<br><i style="color:#f0b878">cette odeur.</i>', 128, SER, CC, 400, -.01, .98)
    s += slider(150, 1440, 780, 'Ton besoin de café, là, maintenant ?', '☕', CA, .86)
    return s + demo()
def cafe3():
    s = box(0, 0, W, H, f'background:{CC};') + box(-200, 1240, 1480, 1480, f'background:{CA};border-radius:740px;opacity:.18;')
    s += t(60, 270, 960, "GRAIN D'AUBE", 34, MO, CE, 700, .3, al='center') + t(60, 318, 960, 'TORRÉFACTEUR · CAFÉ', 20, SANS, CA, 700, .32, al='center') + step(3, 'rgba(43,26,18,.5)')
    s += pic(crop('cafe_tasse.jpg', 'cafe_tasse_rond.jpg', 760, 760, .46, .5), 160, 410, 760, 760, f'border-radius:380px;border:14px solid #fff;box-shadow:0 30px 70px rgba(43,26,18,.25);')
    s += box(780, 420, 210, 210, f'background:{CE};border-radius:105px;transform:rotate(12deg);', t(0, 62, 210, 'TORRÉFIÉ<br>ICI', 32, UB, CC, 700, 0, 1.1, 'center'))
    s += t(60, 1230, 960, 'Ta pause<br><i>t’attend.</i>', 132, SER, CE, 400, -.01, .95, 'center')
    s += t(60, 1505, 960, 'Grains torréfiés sur place · à deux pas de la gare', 30, SANS, '#7a5236', 500, .02, al='center')
    s += link(330, 1580, 'VOIR LA CARTE', CA)
    return s + demo('rgba(43,26,18,.55)')

# ---------- 2 · NONNA ROSA — trattoria : la pâte du matin, la table du soir
NR, NB, NV = '#c8321f', '#f7efe2', '#2f5d3a'
VICHY = f'background-color:{NB};background-image:linear-gradient(90deg,rgba(200,50,31,.55) 50%,transparent 50%),linear-gradient(rgba(200,50,31,.55) 50%,transparent 50%);background-size:80px 80px;'
def logo_nr(y, col=NB):
    return t(60, y, 960, 'Nonna Rosa', 84, SER, col, 400, -.01, 1, 'center', 'font-style:italic;') + t(60, y + 96, 960, 'TRATTORIA · PÂTES FRAÎCHES', 20, SANS, col, 700, .34, al='center')
def pates1():
    s = full('pates_machine.jpg', 'pates_machine.jpg', .62, .5, warm) + fade(0, 560, '#1a0d08', 0, .8, True) + fade(1000, 920, '#1a0d08', 0, .94)
    s += logo_nr(262) + step(1, 'rgba(247,239,226,.7)')
    s += t(60, 1130, 960, '6 h du matin.', 150, AN, NB, 400, .01, .95)
    s += t(60, 1290, 960, 'La pâte est déjà<br>sur le plan de travail.', 66, SER, NB, 400, -.01, 1.08, st='font-style:italic;')
    s += box(60, 1480, 120, 8, f'background:{NR};')
    return s + demo()
def pates2():
    s = box(0, 0, W, H, VICHY) + box(0, 0, W, H, 'background:rgba(247,239,226,.35);')
    s += box(80, 300, 920, 1180, 'background:#fff;box-shadow:0 30px 80px rgba(60,20,10,.35);transform:rotate(-3deg);',
             pic(crop('pates_table.jpg', 'pates_table.jpg', 840, 900, .5, .5, 1.0, warm), 40, 40, 840, 900)
             + t(40, 985, 840, 'Dimanche, 20 h 30', 64, CG, '#3a2416', 600, 0, 1.1, 'center', 'font-style:italic;'))
    s += box(390, 262, 300, 70, 'background:rgba(255,255,255,.55);transform:rotate(-6deg);')
    s += step(2, NR)
    s += box(60, 1530, 960, 240, f'background:{NR};border-radius:30px;', t(40, 40, 880, 'Le soir, tout le monde<br>se retrouve ici.', 72, SER, NB, 400, -.01, 1.08, 'center'))
    return s + demo('rgba(58,36,22,.7)')
def pates3():
    s = full('pates_farine.jpg', 'pates_farine.jpg', .6, .5) + box(0, 0, W, H, 'background:rgba(26,13,8,.45);') + fade(1300, 620, '#1a0d08', 0, .9)
    s += logo_nr(262) + step(3, 'rgba(247,239,226,.7)')
    s += poll(140, 560, 800, 'Ce soir, tu prends quoi ?', 'CARBONARA 🍝', 'CACIO E PEPE 🧀', NR)
    s += t(60, 1060, 960, 'Il reste des tables<br><i>pour toi.</i>', 104, SER, NB, 400, -.01, 1.0, 'center')
    s += box(290, 1400, 500, 100, f'background:{NB};border-radius:50px;', t(0, 28, 500, 'Réserver ma table →', 38, SANS, NR, 700, .01, 1.1, 'center'))
    return s + demo()

# ---------- 3 · PREMIÈRE ROUTE — auto-école : attendre, puis prendre le volant
PB, PJ = '#0b1630', '#ffcc00'
ROUTE = f'background-image:linear-gradient(180deg,{PJ} 50%,transparent 50%);background-size:16px 90px;'
def logo_pr(col='#fff'):
    return t(60, 262, 700, 'PREMIÈRE<br>ROUTE', 46, UB, col, 700, -.02, .95) + t(60, 362, 700, 'AUTO-ÉCOLE', 20, SANS, PJ, 700, .34)
def route1():
    s = full('route_pluie.jpg', 'route_pluie.jpg', .78, .5, nuit) + fade(1000, 920, PB, 0, .95)
    s += logo_pr() + step(1, 'rgba(255,255,255,.6)')
    s += t(60, 1130, 960, 'Encore attendre<br>qu’on vienne<br>la chercher.', 104, UB, '#fff', 700, -.03, 1.0)
    s += t(60, 1500, 960, 'Le bus. La pluie. Les horaires des autres.', 34, SANS, 'rgba(255,255,255,.75)', 500, .01)
    return s + demo()
def route2():
    s = full('route_sourire.jpg', 'route_sourire.jpg', .6, .5) + fade(0, 480, PB, 0, .75, True) + fade(1150, 770, PB, 0, .95)
    s += logo_pr() + step(2, 'rgba(255,255,255,.7)')
    s += box(800, 420, 200, 200, 'background:#fff;border-radius:100px;transform:rotate(-10deg);box-shadow:0 14px 40px rgba(0,0,0,.3);',
             box(14, 14, 172, 172, 'border:8px solid #d3212c;border-radius:86px;box-sizing:border-box;', t(0, 22, 156, 'A', 112, AN, '#d3212c', 400, 0, 1, 'center')))
    s += t(60, 1210, 960, 'Jusqu’au jour où', 64, SANS, '#fff', 500, -.01)
    s += t(60, 1290, 960, 'c’est elle<br>qui conduit.', 132, UB, PJ, 700, -.04, .95)
    return s + demo()
def route3():
    s = box(0, 0, W, H, f'background:{PB};') + box(532, 0, 16, H, ROUTE + 'opacity:.25;')
    s += logo_pr() + step(3, 'rgba(255,255,255,.6)')
    s += pic(crop('route_volant.jpg', 'route_volant.jpg', 960, 560, .45, .5), 60, 450, 960, 560, f'border-radius:30px;border:6px solid {PJ};')
    s += quiz(90, 1060, 900, 'Le jour du permis, tu vas…', ['Pleurer de joie', 'Appeler toute la famille', 'Rouler juste pour le plaisir'], '#2e6bff')
    s += box(240, 1520, 600, 100, f'background:{PJ};border-radius:50px;', t(0, 28, 600, 'Je réserve mon évaluation', 34, SANS, PB, 700, .01, 1.1, 'center'))
    return s + demo()

# ---------- 4 · SÈVE — institut de soins : 23 h 14, puis une heure pour soi
SS, SA, SV = '#8a9a7b', '#efe7dc', '#2e3b2f'
def logo_se(col):
    return t(60, 262, 960, 'Sève', 96, CG, col, 500, .08, 1, 'center', 'font-style:italic;') + t(60, 370, 960, 'INSTITUT DE SOINS', 20, SANS, col, 700, .4, al='center')
def spa1():
    s = full('spa_nuit.jpg', 'spa_nuit.jpg', .52, .5, nuit) + fade(0, 520, '#0c1424', 0, .8, True) + fade(1050, 870, '#0c1424', 0, .95)
    s += logo_se('rgba(239,231,220,.9)') + step(1, 'rgba(239,231,220,.6)')
    s += t(60, 1150, 960, '23 h 14.', 150, CG, SA, 500, -.01, .95, 'center')
    s += t(60, 1320, 960, 'Encore un mail.<br>Encore « juste cinq minutes ».', 54, SANS, 'rgba(239,231,220,.85)', 500, -.01, 1.2, 'center')
    return s + demo()
def spa2():
    s = box(0, 0, W, H, f'background:{SA};') + logo_se(SV) + step(2, 'rgba(46,59,47,.5)')
    s += pic(crop('spa_massage.jpg', 'spa_massage.jpg', 820, 1000, .52, .5, 1.0, warm), 130, 470, 820, 1000, 'border-radius:410px 410px 0 0;')
    s += box(780, 1300, 230, 230, f'background:{SS};border-radius:115px;transform:rotate(8deg);', t(0, 62, 230, '60 min<br><i>pour toi</i>', 44, CG, '#fff', 600, 0, 1.0, 'center'))
    s += t(60, 1510, 960, 'Et si tu appuyais <i>sur pause</i> ?', 74, CG, SV, 600, -.01, 1.05, 'center')
    return s + demo('rgba(46,59,47,.55)')
def spa3():
    s = full('spa_bougies.jpg', 'spa_bougies.jpg', .5, .5, warm) + box(0, 0, W, H, 'background:rgba(46,59,47,.35);') + fade(0, 520, SV, 0, .7, True)
    s += logo_se(SA) + step(3, 'rgba(239,231,220,.7)')
    s += question(140, 560, 800, 'Ton soin idéal, c’est…', 'Écris ta réponse', SS)
    s += t(60, 1060, 960, 'Une heure.<br><i>Rien que pour toi.</i>', 110, CG, '#fff', 500, -.01, 1.0, 'center')
    s += box(250, 1420, 580, 100, f'background:{SA};border-radius:50px;', t(0, 28, 580, 'Je réserve mon soin', 36, SANS, SV, 700, .02, 1.1, 'center'))
    return s + demo()

# ---------- 5 · CLAIR REGARD — opticien : flou, puis net
OB, OI = '#2340ff', '#111111'
def logo_cr(col):
    return t(60, 262, 960, 'CLAIR REGARD', 44, AN, col, 400, .12, al='center') + t(60, 322, 960, 'OPTICIEN', 20, SANS, col, 700, .5, al='center')
def chart(y, col, flou_px=0):
    st = f'filter:blur({flou_px}px);' if flou_px else ''
    return ''.join(t(60, y + k * (sz + 16), 960, l, sz, SANS, col, 700, .3, 1, 'center', st) for k, (l, sz) in enumerate([('E', 150), ('F P', 104), ('T O Z', 74), ('L P E D', 54)]))
def vue1():
    s = full('vue_rire.jpg', 'vue_flou.jpg', .62, .5, flou) + box(0, 0, W, H, 'background:rgba(255,255,255,.25);')
    s += logo_cr(OI) + step(1, 'rgba(17,17,17,.5)')
    s += chart(480, 'rgba(17,17,17,.55)', 9)
    s += box(60, 1200, 960, 380, 'background:#fff;border-radius:30px;', t(50, 56, 860, 'Tu plisses les yeux<br>depuis combien<br>de temps ?', 78, AN, OI, 400, .01, 1.05, 'center'))
    return s + demo('rgba(17,17,17,.6)')
def vue2():
    s = full('vue_rire.jpg', 'vue_net.jpg', .62, .5) + fade(0, 500, '#ffffff', 0, .7, True) + fade(1150, 770, OB, 0, .95)
    s += logo_cr(OI) + step(2, 'rgba(17,17,17,.5)')
    s += t(60, 1230, 960, 'Et d’un coup,', 70, SANS, '#fff', 500, -.01)
    s += t(60, 1310, 960, 'TOUT EST NET.', 168, AN, '#fff', 400, .01, .95)
    return s + demo()
def vue3():
    s = box(0, 0, W, H, f'background:{OB};') + logo_cr('#fff') + step(3, 'rgba(255,255,255,.6)')
    s += pic(crop('vue_portrait.jpg', 'vue_portrait.jpg', 900, 760, .56, .45), 90, 420, 900, 760, 'border-radius:30px;')
    s += poll(140, 1110, 800, 'Tes prochaines lunettes ?', 'DISCRÈTES 👓', 'AFFIRMÉES 🕶️', OI)
    s += box(240, 1500, 600, 100, 'background:#fff;border-radius:50px;', t(0, 28, 600, 'Essayer nos montures', 36, SANS, OB, 700, .01, 1.1, 'center'))
    return s + demo()

# ---------- 6 · FIL DU BOIS — menuisier : la planche brute, puis la cuisine finie
BN, BC, BL = '#3b2a1e', '#c89b6d', '#f2ebe0'
METRE = 'background-image:repeating-linear-gradient(90deg,#3b2a1e 0 3px,transparent 3px 40px),repeating-linear-gradient(90deg,#3b2a1e 0 2px,transparent 2px 10px);background-size:100% 46px,100% 22px;background-repeat:no-repeat;'
def logo_fb(col, acc):
    return t(60, 262, 960, 'Fil du Bois', 76, CG, col, 600, .02, 1, 'center') + t(60, 350, 960, 'ATELIER DE MENUISERIE', 20, SANS, acc, 700, .36, al='center')
def bois1():
    s = full('bois_rabot.jpg', 'bois_rabot.jpg', .42, .5, warm) + fade(0, 520, '#1d140d', 0, .75, True) + fade(1050, 870, '#1d140d', 0, .95)
    s += logo_fb(BL, BC) + step(1, 'rgba(242,235,224,.6)')
    s += t(60, 1180, 960, 'Ça commence<br>par une <i style="color:#e2b98c">planche brute.</i>', 100, CG, BL, 600, -.01, 1.0)
    s += t(60, 1440, 960, 'Et deux mains qui savent quoi en faire.', 36, SANS, 'rgba(242,235,224,.75)', 500, .01)
    return s + demo()
def bois2():
    s = box(0, 0, W, H, f'background:{BL};') + logo_fb(BN, '#9a6b3f') + step(2, 'rgba(59,42,30,.5)')
    s += pic(crop('bois_cuisine.jpg', 'bois_cuisine.jpg', 960, 1000, .5, .5), 60, 440, 960, 1000, 'border-radius:24px;')
    s += box(60, 1450, 960, 46, f'background:{BC};' + METRE)
    s += t(60, 1530, 960, 'Et ça finit <i>chez vous.</i>', 92, CG, BN, 600, -.01, 1.0, 'center')
    return s + demo('rgba(59,42,30,.55)')
def bois3():
    s = full('bois_atelier.jpg', 'bois_atelier.jpg', .45, .5, warm) + box(0, 0, W, H, 'background:rgba(29,20,13,.5);') + fade(0, 520, '#1d140d', 0, .7, True)
    s += logo_fb(BL, BC) + step(3, 'rgba(242,235,224,.7)')
    s += question(140, 560, 800, 'Votre projet en un mot ?', 'Cuisine, dressing, escalier…', BC)
    s += t(60, 1060, 960, 'Sur mesure.<br><i>Au millimètre.</i>', 112, CG, BL, 600, -.01, 1.0, 'center')
    s += box(240, 1420, 600, 100, f'background:{BL};border-radius:50px;', t(0, 28, 600, 'Demander un devis', 36, SANS, BN, 700, .02, 1.1, 'center'))
    return s + demo()

ALL = [('01_grain_daube_1', cafe1), ('01_grain_daube_2', cafe2), ('01_grain_daube_3', cafe3),
       ('02_nonna_rosa_1', pates1), ('02_nonna_rosa_2', pates2), ('02_nonna_rosa_3', pates3),
       ('03_premiere_route_1', route1), ('03_premiere_route_2', route2), ('03_premiere_route_3', route3),
       ('04_seve_1', spa1), ('04_seve_2', spa2), ('04_seve_3', spa3),
       ('05_clair_regard_1', vue1), ('05_clair_regard_2', vue2), ('05_clair_regard_3', vue3),
       ('06_fil_du_bois_1', bois1), ('06_fil_du_bois_2', bois2), ('06_fil_du_bois_3', bois3)]
def page(title, items):
    head = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide"><meta name="hz:canvas-width" content="{W}"><meta name="hz:canvas-height" content="{H}">'
            f'<title>{title}</title>{KIT}<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>')
    return head + ''.join(f'<section class="slide" id="{n}" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden">{f()}</section>' for n, f in items) + '</body></html>'
os.makedirs(f'{D}/img', exist_ok=True)
for emb in (False, True):
    EMB = emb; x = '_express' if emb else ''
    open(f'{D}/stories{x}.html', 'w').write(page('E-DUST — Stories 6 secteurs (9:16)', ALL))
print('ok', os.path.getsize(f'{D}/stories_express.html'))
