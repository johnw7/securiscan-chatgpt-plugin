"""Stories 9:16 « mini-films » : 6 marques fictives (démo), 3 chapitres chacune — le quotidien, le déclic, la nouvelle vie.
Un personnage par marque (prénom manuscrit), sa voix intérieure en sous-titres de cinéma, étalonnage + grain argentique,
et au chapitre II un mot géant glissé DERRIÈRE le personnage (détourage Adobe Photoshop : raw/*_cut.png).
Photos : Adobe Stock (licence gratuite) dans raw/. Sorties : stories_emotion.html (rendu PNG via render_slides.cjs).
Usage : python3 build_emotion.py"""
import os
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); W, H = 1080, 1920
FONTS = ('<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap">')
SANS, UB, SER, AN, MO, HAND = "'dm-sans',sans-serif", "'unbounded',sans-serif", "'dm-serif-display',serif", "'anton',sans-serif", "'montserrat',sans-serif", "'Caveat',cursive"
os.makedirs(f'{D}/img', exist_ok=True)

# ---------- étalonnage (appliqué à l'identique au fond et au détourage pour qu'ils se raccordent)
def g_froid(a): return np.clip((a - .5) * 1.08 + .5, 0, 1) * .55 + np.mean(a, 2, keepdims=True) * .35 + np.array([.03, .05, .1])
def g_chaud(a): return np.clip((a - .5) * 1.06 + .5, 0, 1) * np.array([1.06, 1.0, .9]) + np.array([.02, .01, 0])
def g_doux(a): return np.clip((a - .5) * .96 + .5, 0, 1) * np.array([1.03, 1.0, .95]) + .015
GRADES = {'froid': g_froid, 'chaud': g_chaud, 'doux': g_doux}
RNG = np.random.default_rng(7)
def crop_img(i, w, h, fx, fy):
    r = w / h; cw, ch = (i.height * r, i.height) if i.width / i.height > r else (i.width, i.width / r)
    x = min(max(fx * i.width - cw / 2, 0), i.width - cw); y = min(max(fy * i.height - ch / 2, 0), i.height - ch)
    return i.crop((int(x), int(y), int(x + cw), int(y + ch))).resize((w, h), Image.LANCZOS)
def film(src, out, w, h, fx=.5, fy=.5, grade='chaud', blur=0, vignette=.45, cut=False):
    """Recadre raw/src en w×h, étalonne, ajoute grain + vignettage → img/out.jpg ; si cut, fait de même pour raw/src_cut.png → img/out_cut.png."""
    if not os.path.exists(f'{D}/img/{out}.jpg'):
        i = crop_img(Image.open(f'{D}/raw/{src}.jpg').convert('RGB'), w, h, fx, fy)
        if blur: i = i.filter(ImageFilter.GaussianBlur(blur))
        a = GRADES[grade](np.asarray(i, dtype=np.float32) / 255)
        yy, xx = np.mgrid[0:h, 0:w]; d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
        a = a * (1 - vignette * np.clip(d - .55, 0, 1) ** 1.4)[..., None]
        a = a + RNG.normal(0, .028, (h, w, 1))
        Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).save(f'{D}/img/{out}.jpg', quality=90, optimize=True, progressive=True)
        if cut:
            c = crop_img(Image.open(f'{D}/raw/{src}_cut.png').convert('RGBA'), w, h, fx, fy)
            ca = np.asarray(c, dtype=np.float32) / 255; rgb = GRADES[grade](ca[..., :3])
            rgb = rgb * (1 - vignette * np.clip(d - .55, 0, 1) ** 1.4)[..., None] + RNG.normal(0, .028, (h, w, 1))
            Image.fromarray((np.clip(np.dstack([rgb, ca[..., 3:]]), 0, 1) * 255).astype(np.uint8), 'RGBA').save(f'{D}/img/{out}_cut.png', optimize=True)
    return f'img/{out}.jpg'

# ---------- briques de mise en page
def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam=SANS, col='#fff', wt=400, ls=0, lh=1.05, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def img(src, x, y, w, h, st=''): return f'<img src="{src}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">'
def fade(y, h, col, a0=0, a1=.9, rev=False):
    c = col.lstrip('#'); r, g, b = (int(c[k:k + 2], 16) for k in (0, 2, 4)); s0, s1 = f'rgba({r},{g},{b},{a0})', f'rgba({r},{g},{b},{a1})'
    return box(0, y, W, h, f'background:linear-gradient(180deg,{s1 if rev else s0},{s0 if rev else s1});')
SH = 'text-shadow:0 2px 18px rgba(0,0,0,.55);'
def chapitre(n, titre, col='#fff', marque=''):
    """En-tête de chapitre façon générique de film + nom de la marque."""
    s = t(60, 250, 600, f'CHAPITRE {n}', 20, SANS, col, 700, .4, st='opacity:.85;') + box(60, 284, 54, 2, f'background:{col};opacity:.7;')
    s += t(60, 298, 700, titre, 34, SER, col, 400, 0, 1.1, st='font-style:italic;' + SH)
    return s + t(560, 252, 460, marque, 20, MO, col, 700, .32, al='right', st='opacity:.85;')
def prenom(y, nom, sous, col='#fff', acc='#ffd27a'):
    return t(60, y, 960, nom, 150, HAND, acc, 700, 0, .9, st=SH) + t(64, y + 150, 900, sous, 38, SER, col, 400, 0, 1.2, st='font-style:italic;' + SH)
def soustitre(y, s, col='#fff'):
    """Sous-titre de film : centré, voix intérieure du personnage."""
    return t(80, y, 920, f'<span style="background:rgba(8,6,5,.58);padding:4px 18px;border-radius:10px;-webkit-box-decoration-break:clone;box-decoration-break:clone;">{s}</span>', 44, SANS, col, 500, .005, 1.5, 'center')
def mot(y, s, size, col, x=0, ls=-.01, op=1): return t(x, y, W, s, size, AN, col, 400, ls, .86, 'center', f'opacity:{op};white-space:nowrap;')
def bouton(y, s, bg, col, w=620): return box((W - w) // 2, y, w, 104, f'background:{bg};border-radius:52px;box-shadow:0 16px 40px rgba(0,0,0,.35);', t(0, 30, w, s, 36, SANS, col, 700, .01, 1.1, 'center'))
def demo(col='rgba(255,255,255,.55)'): return t(60, 1866, 960, 'Démo · marque fictive · personnage fictif · photo Adobe Stock · E-DUST Solutions', 18, col=col, al='center')
# stickers façon Instagram (à recréer avec les vrais stickers dans l'appli)
def poll(x, y, w, q, a, b, acc):
    s = box(x, y, w, 330, 'background:#fff;border-radius:34px;box-shadow:0 18px 50px rgba(0,0,0,.35);')
    s += box(x, y, w, 120, f'background:{acc};border-radius:34px 34px 0 0;', t(30, 32, w - 60, q, 36, SANS, '#fff', 700, -.01, 1.1, 'center'))
    for k, o in enumerate((a, b)):
        s += box(x + 30, y + 150 + k * 86, w - 60, 70, 'background:#f1f1f1;border-radius:35px;', t(0, 18, w - 60, o, 32, SANS, '#262626', 700, .02, 1.1, 'center'))
    return s
def slider(x, y, w, q, emo, acc, pos=.8):
    s = box(x, y, w, 230, 'background:#fff;border-radius:34px;box-shadow:0 18px 50px rgba(0,0,0,.35);') + t(x + 30, y + 36, w - 60, q, 36, SANS, '#262626', 700, -.01, 1.15, 'center')
    bx, bw = x + 60, w - 120
    s += box(bx, y + 160, bw, 14, 'background:#e9e9e9;border-radius:7px;') + box(bx, y + 160, int(bw * pos), 14, f'background:{acc};border-radius:7px;')
    return s + t(bx + int(bw * pos) - 40, y + 124, 80, emo, 68, SANS, '#000', 400, 0, 1, 'center')
def question(x, y, w, q, ph, acc):
    s = box(x, y, w, 260, f'background:{acc};border-radius:34px;box-shadow:0 18px 50px rgba(0,0,0,.35);') + t(x + 30, y + 36, w - 60, q, 38, SANS, '#fff', 700, -.01, 1.15, 'center')
    return s + box(x + 30, y + 150, w - 60, 80, 'background:rgba(255,255,255,.92);border-radius:22px;', t(0, 22, w - 60, ph, 30, SANS, '#8e8e8e', 500, 0, 1.15, 'center'))
def link(y, s, col):
    return f'<p style="position:absolute;left:0;right:0;top:{y}px;margin:0 auto;width:max-content;padding:22px 40px;border-radius:18px;background:#fff;font-family:{SANS};font-size:34px;font-weight:700;color:{col};white-space:nowrap;box-shadow:0 14px 40px rgba(0,0,0,.3);">🔗 {s}</p>'
def plein(src, out, fx, fy=.5, grade='chaud', blur=0, cut=False): return img(film(src, out, W, H, fx, fy, grade, blur, cut=cut), 0, 0, W, H)
def detour(out, x=0, y=0, w=W, h=H): return img(f'img/{out}_cut.png', x, y, w, h)

# ---------- 1 · GRAIN D'AUBE — Inès, 29 ans
CA = '#e9a35a'
def cafe1():
    s = plein('cafe_bus', 'e_cafe_bus', .4, grade='froid') + fade(0, 560, '#0b1220', 0, .8, True) + fade(1000, 920, '#0b1220', 0, .92)
    s += chapitre('I', 'Le quotidien', '#e8eef7', "GRAIN D'AUBE") + prenom(1060, 'Inès, 29 ans.', 'Open space, métro, mails. Toujours en retard sur sa propre vie.', '#e8eef7', '#cfe0ff')
    return s + soustitre(1480, '— Chaque matin, le même bus.<br>La même boule au ventre.', '#e8eef7') + demo()
def cafe2():
    s = box(0, 0, W, H, 'background:#2a160b;')
    by, bh = 500, 1040
    s += img(film('cafe_yeux', 'e_cafe_band', W, bh, .42, .5, cut=True, vignette=.3), 0, by, W, bh)
    s += mot(by + 30, 'PAUSE', 330, CA, ls=.02) + detour('e_cafe_band', 0, by, W, bh)
    s += box(0, by - 2, W, 160, 'background:linear-gradient(180deg,#2a160b,rgba(42,22,11,0));') + box(0, by + bh - 260, W, 262, 'background:linear-gradient(180deg,rgba(42,22,11,0),#2a160b);')
    s += t(60, 390, 960, '8 h 03.', 66, HAND, '#ffd6a8', 700, 0, 1, 'center')
    s += chapitre('II', 'Le déclic', '#fff3e4', "GRAIN D'AUBE")
    return s + soustitre(1520, '— Et puis il y a ce café.<br>Cinq minutes où le monde attend.', '#fff3e4') + demo()
def cafe3():
    s = plein('cafe_latte', 'e_cafe_latte', .56) + fade(0, 560, '#2a160b', 0, .75, True) + fade(900, 1020, '#2a160b', 0, .95)
    s += chapitre('III', 'La nouvelle vie', '#fff3e4', "GRAIN D'AUBE")
    s += t(60, 1040, 960, 'Depuis, elle part<br>plus tôt le matin.', 92, SER, '#fff3e4', 400, -.01, 1.02, 'center', SH)
    s += t(60, 1250, 960, 'Pour elle.', 130, HAND, CA, 700, 0, 1, 'center', SH)
    s += link(1450, 'TA PAUSE T’ATTEND', '#a8642a')
    return s + t(60, 1610, 960, "Grain d'Aube · torréfacteur &amp; café", 28, SANS, 'rgba(255,243,228,.8)', 500, .06, al='center') + demo()

# ---------- 2 · NONNA ROSA — Rosa, 74 ans
NR, NB = '#d23b24', '#f7efe2'
def pates1():
    s = plein('pates_machine', 'e_pates_machine', .62) + fade(0, 560, '#1a0d08', 0, .8, True) + fade(980, 940, '#1a0d08', 0, .94)
    s += chapitre('I', 'Le quotidien', NB, 'NONNA ROSA') + prenom(1060, 'Rosa, 74 ans.', 'Elle roule la pâte avant que la ville se réveille.', NB, '#ffb59e')
    return s + soustitre(1480, '— Les pâtes, ça ne se presse pas.<br>Elle le répète depuis toujours.', NB) + demo()
def pates2():
    s = box(0, 0, W, H, 'background:#2a0f09;')
    by, bh = 520, 1000
    s += img(film('pates_famille', 'e_pates_famille', W, bh, .5, .5, cut=True, vignette=.3), 0, by, W, bh)
    s += mot(by + 40, 'FAMIGLIA', 250, NR, ls=.01) + detour('e_pates_famille', 0, by, W, bh)
    s += box(0, by - 2, W, 160, 'background:linear-gradient(180deg,#2a0f09,rgba(42,15,9,0));') + box(0, by + bh - 260, W, 262, 'background:linear-gradient(180deg,rgba(42,15,9,0),#2a0f09);')
    s += chapitre('II', 'Le déclic', NB, 'NONNA ROSA')
    s += t(60, 390, 960, 'Dimanche, 20 h 30.', 66, HAND, '#ffb59e', 700, 0, 1, 'center')
    return s + soustitre(1500, '— À la première bouchée,<br>toute la tablée se tait.', NB) + demo()
def pates3():
    s = plein('pates_farine', 'e_pates_farine', .6) + box(0, 0, W, H, 'background:rgba(26,13,8,.45);') + fade(1200, 720, '#1a0d08', 0, .9)
    s += chapitre('III', 'La nouvelle vie', NB, 'NONNA ROSA')
    s += t(60, 470, 960, 'Il reste une chaise', 92, SER, NB, 400, -.01, 1.0, 'center', SH) + t(60, 570, 960, 'pour toi.', 140, HAND, '#ffb59e', 700, 0, 1, 'center', SH)
    s += poll(140, 830, 800, 'Ce soir, tu prends quoi ?', 'CARBONARA 🍝', 'CACIO E PEPE 🧀', NR)
    return s + bouton(1300, 'Réserver ma table', NB, NR) + t(60, 1450, 960, 'Nonna Rosa · trattoria · pâtes fraîches', 28, SANS, 'rgba(247,239,226,.8)', 500, .06, al='center') + demo()

# ---------- 3 · PREMIÈRE ROUTE — Léa, 18 ans
PJ = '#ffcc00'
def route1():
    s = plein('route_pluie', 'e_route_pluie', .78, grade='froid') + fade(1000, 920, '#070d1d', 0, .94)
    s += chapitre('I', 'Le quotidien', '#e8eef7', 'PREMIÈRE ROUTE') + prenom(1060, 'Léa, 18 ans.', 'Le bus, la pluie, les horaires des autres.', '#e8eef7', '#cfe0ff')
    return s + soustitre(1480, '— Toujours à attendre<br>qu’on vienne la chercher.', '#e8eef7') + demo()
def route2():
    s = plein('route_sourire', 'e_route_sourire', .56, .5, cut=True) + fade(1150, 770, '#070d1d', 0, .92)
    s += mot(270, 'LIBRE', 440, PJ) + detour('e_route_sourire')
    s += chapitre('II', 'Le déclic', '#fff', 'PREMIÈRE ROUTE')
    return s + soustitre(1460, '— Le jour où elle a tourné la clé,<br>la ville est devenue à elle.') + demo()
def route3():
    s = plein('route_cles', 'e_route_cles', .3) + fade(0, 560, '#070d1d', 0, .7, True) + fade(1000, 920, '#070d1d', 0, .95)
    s += chapitre('III', 'La nouvelle vie', '#fff', 'PREMIÈRE ROUTE')
    s += t(60, 1030, 960, 'Maintenant, c’est elle<br>qui passe prendre', 84, SER, '#fff', 400, -.01, 1.05, 'center', SH) + t(60, 1210, 960, 'les autres.', 130, HAND, PJ, 700, 0, 1, 'center', SH)
    s += slider(140, 1370, 800, 'Ton envie de prendre la route ?', '🚗', PJ, .85)
    return s + t(60, 1640, 960, 'Première Route · auto-école', 28, SANS, 'rgba(255,255,255,.8)', 500, .06, al='center') + demo()

# ---------- 4 · SÈVE — Claire, 41 ans
SS, SA = '#9fb08e', '#efe7dc'
def spa1():
    s = plein('spa_nuit', 'e_spa_nuit', .52, grade='froid') + fade(0, 560, '#0b1220', 0, .8, True) + fade(1000, 920, '#0b1220', 0, .94)
    s += chapitre('I', 'Le quotidien', '#e8eef7', 'SÈVE · INSTITUT') + prenom(1060, 'Claire, 41 ans.', 'Deux enfants, un poste à responsabilités, zéro minute à elle.', '#e8eef7', '#cfe0ff')
    return s + soustitre(1480, '— 23 h 14. Elle ne se souvient plus<br>de la dernière fois qu’elle a respiré.', '#e8eef7') + demo()
def spa2():
    s = box(0, 0, W, H, f'background:{SA};')
    by, bh = 500, 1100
    s += img(film('spa_massage', 'e_spa_massage', W, bh, .55, .5, 'doux', cut=True, vignette=.25), 0, by, W, bh)
    s += mot(by + 70, 'RESPIRE', 300, '#fff', op=.95) + detour('e_spa_massage', 0, by, W, bh)
    s += box(0, by - 2, W, 160, f'background:linear-gradient(180deg,{SA},rgba(239,231,220,0));') + box(0, by + bh - 300, W, 302, 'background:linear-gradient(180deg,rgba(239,231,220,0),#efe7dc);')
    s += chapitre('II', 'Le déclic', '#2e3b2f', 'SÈVE · INSTITUT')
    return s + t(80, 1560, 920, '— Une heure.<br>Personne pour l’appeler.', 46, SANS, '#2e3b2f', 500, 0, 1.3, 'center') + demo('rgba(46,59,47,.55)')
def spa3():
    s = plein('spa_the', 'e_spa_the', .5, .45) + fade(0, 560, '#1f2a20', 0, .7, True) + fade(640, 1280, '#1f2a20', 0, .96)
    s += chapitre('III', 'La nouvelle vie', SA, 'SÈVE · INSTITUT')
    s += t(60, 1010, 960, 'Elle est rentrée', 92, SER, SA, 400, -.01, 1.0, 'center', SH) + t(60, 1110, 960, 'plus légère.', 140, HAND, '#d6e5c6', 700, 0, 1, 'center', SH)
    s += question(140, 1290, 800, 'Ton moment pour toi, c’est quand ?', 'Écris ta réponse', SS)
    return s + t(60, 1610, 960, 'Sève · institut de soins', 28, SANS, 'rgba(239,231,220,.85)', 500, .06, al='center') + demo()

# ---------- 5 · CLAIR REGARD — Jade, 7 ans
OB = '#3d5bff'
def vue1():
    s = plein('vue_essai', 'e_vue_flou', .62, .45, 'doux', blur=24) + fade(0, 560, '#0d1230', 0, .6, True) + fade(1000, 920, '#0d1230', 0, .9)
    s += chapitre('I', 'Le quotidien', '#fff', 'CLAIR REGARD')
    s += t(60, 520, 960, 'E<br>F P<br>T O Z', 120, AN, 'rgba(255,255,255,.75)', 400, .3, 1.15, 'center', 'filter:blur(7px);')
    s += prenom(1060, 'Jade, 7 ans.', 'Elle plisse les yeux devant le tableau. Tous les jours.', '#fff', '#c9d3ff')
    return s + soustitre(1480, '— Au tableau, tout était flou.<br>Elle n’osait pas le dire.') + demo()
def vue2():
    s = box(0, 0, W, H, 'background:#0d1230;')
    by, bh = 700, 1040
    s += img(film('vue_essai', 'e_vue_band', W, bh, .55, .45, 'chaud', cut=True, vignette=.3), 0, by, W, bh)
    s += mot(470, 'WOUAH', 300, '#7f95ff', ls=.02) + detour('e_vue_band', 0, by, W, bh)
    s += box(0, by - 2, W, 160, 'background:linear-gradient(180deg,#0d1230,rgba(13,18,48,0));') + box(0, by + bh - 260, W, 262, 'background:linear-gradient(180deg,rgba(13,18,48,0),#0d1230);')
    s += t(60, 390, 960, 'Le jour J, chez l’opticien.', 60, HAND, '#c9d3ff', 700, 0, 1, 'center')
    s += chapitre('II', 'Le déclic', '#fff', 'CLAIR REGARD')
    return s + soustitre(1520, '— Les premières lunettes.<br>Le premier « wouah ».') + demo()
def vue3():
    s = box(0, 0, W, H, f'background:{OB};')
    s += img(film('vue_essai', 'e_vue_portrait', 920, 900, .66, .4, 'chaud', vignette=.2), 80, 400, 920, 900, 'border-radius:30px;box-shadow:0 30px 70px rgba(0,0,0,.35);')
    s += chapitre('III', 'La nouvelle vie', '#fff', 'CLAIR REGARD')
    s += t(60, 1350, 960, 'Ce soir, elle a lu son histoire', 64, SER, '#fff', 400, -.01, 1.05, 'center') + t(60, 1430, 960, 'toute seule.', 130, HAND, '#ffe27a', 700, 0, 1, 'center')
    return s + link(1610, 'PRENDRE RENDEZ-VOUS', OB) + demo()

# ---------- 6 · FIL DU BOIS — Julie & Tom
BC, BL = '#e2b98c', '#f2ebe0'
def bois1():
    s = plein('bois_rabot', 'e_bois_rabot', .42) + fade(0, 560, '#1d140d', 0, .75, True) + fade(980, 940, '#1d140d', 0, .94)
    s += chapitre('I', 'Le quotidien', BL, 'FIL DU BOIS') + prenom(1060, 'Julie &amp; Tom.', 'Un appartement trop petit, une cuisine où l’on ne reste jamais.', BL, BC)
    return s + soustitre(1480, '— Ils rêvaient d’une table<br>où l’on reste après le dîner.', BL) + demo()
def bois2():
    s = plein('bois_couple', 'e_bois_couple', .68, .5, cut=True) + fade(1150, 770, '#1d140d', 0, .92)
    s += mot(250, 'CHEZ', 360, BC) + mot(560, 'NOUS', 360, BC) + detour('e_bois_couple')
    s += chapitre('II', 'Le déclic', BL, 'FIL DU BOIS')
    return s + soustitre(1460, '— Le premier soir,<br>ils n’ont même pas allumé la télé.', BL) + demo()
def bois3():
    s = plein('bois_cuisine', 'e_bois_cuisine', .5, grade='doux') + fade(0, 560, '#1d140d', 0, .7, True) + fade(900, 1020, '#1d140d', 0, .93)
    s += chapitre('III', 'La nouvelle vie', BL, 'FIL DU BOIS')
    s += t(60, 960, 960, 'Une cuisine,', 92, SER, BL, 400, -.01, 1.0, 'center', SH) + t(60, 1060, 960, 'une histoire.', 140, HAND, BC, 700, 0, 1, 'center', SH)
    s += question(140, 1250, 800, 'Et la vôtre, elle raconte quoi ?', 'Cuisine, dressing, escalier…', '#9a6b3f')
    return s + t(60, 1560, 960, 'Fil du Bois · atelier de menuiserie', 28, SANS, 'rgba(242,235,224,.85)', 500, .06, al='center') + demo()

ALL = [cafe1, cafe2, cafe3, pates1, pates2, pates3, route1, route2, route3, spa1, spa2, spa3, vue1, vue2, vue3, bois1, bois2, bois3]
head = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>E-DUST — Stories mini-films (9:16)</title>{FONTS}'
        '<style>html,body{margin:0;background:#222}.slide{margin:0 auto 40px}</style></head><body>')
open(f'{D}/stories_emotion.html', 'w').write(head + ''.join(f'<section class="slide" style="position:relative;width:{W}px;height:{H}px;overflow:hidden">{f()}</section>' for f in ALL) + '</body></html>')
print('ok stories_emotion.html', len(ALL))
