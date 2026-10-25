"""« Les mains qui savent » — carrousel LinkedIn 4:5 (1080×1350), 7 pages, storytelling autour de Marc, menuisier (personnage fictif).
Démo de la campagne fictive « Atelier Copeaux ». Photos Adobe Stock (licence gratuite) dans raw/ ; Marc détouré avec Adobe Photoshop
(raw/marc_cut.png) pour glisser le mot SAVOIR-FAIRE derrière lui ; l'affiche est posée en perspective dans une vraie vitrine (raw/vitrine.jpg).
Usage : python3 build.py → affiche.html ; rendu (render.cjs affiche.html img) ; python3 build.py → carrousel.html ; rendu (render.cjs carrousel.html <sortie>)."""
import io, os
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from scipy import ndimage
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/img', exist_ok=True)
FONTS = ('<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap">')
SANS, SER, AN, MO, HAND = "'dm-sans',sans-serif", "'dm-serif-display',serif", "'anton',sans-serif", "'montserrat',sans-serif", "'Caveat',cursive"
NOIR, BOIS, CREME, OR = '#141210', '#c89b6d', '#f2ebe0', '#e2b98c'
W, H = 1080, 1350
RNG = np.random.default_rng(3)

# ---------- images
def crop_img(i, w, h, fx=.5, fy=.5):
    r = w / h; cw, ch = (i.height * r, i.height) if i.width / i.height > r else (i.width, i.width / r)
    x = min(max(fx * i.width - cw / 2, 0), i.width - cw); y = min(max(fy * i.height - ch / 2, 0), i.height - ch)
    return i.crop((int(x), int(y), int(x + cw), int(y + ch))).resize((w, h), Image.LANCZOS)
def cine(a, w, h, vig=.5):
    """Étalonnage chaud « atelier » + vignettage + grain argentique."""
    a = np.clip((a - .5) * 1.08 + .5, 0, 1) * np.array([1.06, 1.0, .88]) + np.array([.015, .005, 0])
    yy, xx = np.mgrid[0:h, 0:w]; d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    return a * (1 - vig * np.clip(d - .5, 0, 1) ** 1.3)[..., None] + RNG.normal(0, .025, (h, w, 1))
def film(src, out, w, h, fx=.5, fy=.5, vig=.5, cut=False):
    if not os.path.exists(f'{D}/img/{out}.jpg'):
        i = crop_img(Image.open(f'{D}/raw/{src}.jpg').convert('RGB'), w, h, fx, fy)
        a = cine(np.asarray(i, dtype=np.float32) / 255, w, h, vig)
        Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).save(f'{D}/img/{out}.jpg', quality=90)
        if cut:
            c = np.asarray(crop_img(Image.open(f'{D}/raw/{src}_cut.png').convert('RGBA'), w, h, fx, fy), dtype=np.float32) / 255
            rgb = cine(c[..., :3], w, h, vig)
            Image.fromarray((np.clip(np.dstack([rgb, c[..., 3:]]), 0, 1) * 255).astype(np.uint8), 'RGBA').save(f'{D}/img/{out}_cut.png')
    return f'img/{out}.jpg'
def vite_fait():
    """La « photo prise vite » : cadrage de travers, flash, couleurs ternes, flou, compression."""
    if not os.path.exists(f'{D}/img/vite_fait.jpg'):
        i = Image.open(f'{D}/raw/marc.jpg').convert('RGB').rotate(4, resample=Image.BICUBIC, expand=False)
        i = crop_img(i, 640, 640, .38, .62).filter(ImageFilter.GaussianBlur(1.6))
        i = ImageEnhance.Color(ImageEnhance.Brightness(ImageEnhance.Contrast(i).enhance(.75)).enhance(1.28)).enhance(.55)
        i = Image.blend(i, Image.new('RGB', i.size, '#cfd9e6'), .14)
        b = io.BytesIO(); i.save(b, 'JPEG', quality=18); Image.open(b).save(f'{D}/img/vite_fait.jpg', quality=90)
    return 'img/vite_fait.jpg'
# mise en situation de l'affiche (même méthode que affiches_situation/build.py)
def zone(photo):
    a = np.asarray(photo).astype(int); m = (a.mean(2) > 200) & (a.max(2) - a.min(2) < 30)
    lab, n = ndimage.label(ndimage.binary_opening(m, iterations=3)); k = int(np.argmax(ndimage.sum(m, lab, range(1, n + 1)))) + 1
    ys, xs = np.nonzero(lab == k); s, d = xs + ys, xs - ys
    return [(xs[s.argmin()], ys[s.argmin()]), (xs[d.argmax()], ys[d.argmax()]), (xs[s.argmax()], ys[s.argmax()]), (xs[d.argmin()], ys[d.argmin()])], lab == k
def coeffs(dst, src):
    M = []; b = []
    for (x, y), (u, v) in zip(dst, src):
        M += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]; b += [u, v]
    return np.linalg.solve(np.array(M, float), np.array(b, float))
def en_vitrine(affiche, out, marge=.03):
    if os.path.exists(f'{D}/img/{out}'): return f'img/{out}'
    photo = Image.open(f'{D}/raw/vitrine.jpg').convert('RGB'); q, masque = zone(photo); q = np.array(q, float)
    wr = (np.linalg.norm(q[1] - q[0]) + np.linalg.norm(q[2] - q[3])) / 2; hr = (np.linalg.norm(q[3] - q[0]) + np.linalg.norm(q[2] - q[1])) / 2
    cw, ch = int(wr * 2), int(hr * 2); aff = Image.open(f'{D}/{affiche}').convert('RGB'); ra = aff.width / aff.height
    pw, ph = (int(cw * (1 - 2 * marge)), int(cw * (1 - 2 * marge) / ra)) if ra > cw / ch else (int(ch * (1 - 2 * marge) * ra), int(ch * (1 - 2 * marge)))
    toile = Image.new('RGBA', (cw, ch), (0, 0, 0, 0)); toile.paste(aff.resize((pw, ph), Image.LANCZOS), ((cw - pw) // 2, (ch - ph) // 2))
    pl = toile.transform(photo.size, Image.PERSPECTIVE, tuple(coeffs([tuple(p) for p in q], [(0, 0), (cw, 0), (cw, ch), (0, ch)])), Image.BICUBIC)
    a = np.asarray(pl).astype(float) / 255; p = np.asarray(photo).astype(float) / 255; g = p.mean(2)
    lum = np.clip(g / np.percentile(g[masque], 92), .55, 1.06)[..., None]
    al = np.asarray(Image.fromarray((a[..., 3] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.8))).astype(float)[..., None] / 255
    Image.fromarray((np.clip(p * (1 - al) + (a[..., :3] * lum * .94 + p * .06) * al, 0, 1) * 255).astype(np.uint8)).save(f'{D}/img/{out}', quality=90)
    return f'img/{out}'

# ---------- mise en page
def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam=SANS, col='#fff', wt=400, ls=0, lh=1.05, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def img(src, x, y, w, h, st=''): return f'<img src="{src}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">'
def fond(col=NOIR): return box(0, 0, W, H, f'background:{col};')
def fondu(y, h, col, rev=False):
    c = col.lstrip('#'); r, g, b = (int(c[k:k + 2], 16) for k in (0, 2, 4))
    return box(0, y, W, h, f'background:linear-gradient(180deg,{"rgba(%d,%d,%d,1)" % (r, g, b) if rev else "rgba(%d,%d,%d,0)" % (r, g, b)},{"rgba(%d,%d,%d,0)" % (r, g, b) if rev else "rgba(%d,%d,%d,1)" % (r, g, b)});')
SH = 'text-shadow:0 3px 20px rgba(0,0,0,.6);'
def pied(n, col='rgba(242,235,224,.45)'):
    return t(60, 1296, 760, 'E-DUST SOLUTIONS · concept de campagne fictive (démo)', 18, SANS, col, 700, .2) + t(820, 1296, 200, f'{n}/7', 18, SANS, col, 700, .2, al='right')
def chapitre(s, y=70, col=OR): return t(60, y, 960, s, 20, SANS, col, 800, .42, al='center')

def p1():
    s = img(film('sculpture', 'p_sculpture', W, H, .62, .5, .6), 0, 0, W, H) + fondu(640, 710, '#0c0a08') + fondu(0, 300, '#0c0a08', True)
    s += chapitre('UNE HISTOIRE DE MAINS')
    s += t(60, 900, 960, 'Un artisan ne vend pas', 76, SER, CREME, 400, -.01, 1.05, 'center', SH)
    s += t(60, 990, 960, 'une prestation.', 150, HAND, OR, 700, 0, 1, 'center', SH)
    s += t(60, 1190, 960, 'Il vend des années d’expérience, des gestes précis, une exigence.', 28, SANS, 'rgba(242,235,224,.85)', 500, .01, 1.35, 'center')
    return s + pied(1)
def p2():
    s = fond() + chapitre('CHAPITRE I · L’ARTISAN')
    s += t(60, 140, 960, 'Voici Marc.', 130, HAND, OR, 700, 0, 1, 'center')
    s += img(film('marc', 'p_marc', W, 720, .5, .5, .35), 0, 330, W, 720) + fondu(330, 90, NOIR, True) + fondu(960, 92, NOIR)
    s += t(80, 1080, 920, 'Menuisier. Ses mains savent des choses<br>qu’aucune machine ne sait.', 46, SER, CREME, 400, -.005, 1.25, 'center')
    s += t(60, 1220, 960, 'personnage fictif', 20, SANS, 'rgba(242,235,224,.45)', 600, .2, al='center')
    return s + pied(2)
def p3():
    s = fond('#1b1d21') + chapitre('CHAPITRE II · LE PROBLÈME', col='#9aa3ad')
    s += t(60, 130, 960, 'Et pourtant, voilà ce qu’il publie :', 54, SER, '#e9edf2', 400, -.01, 1.1, 'center')
    px, py, pw = 250, 250, 580
    post = (box(0, 0, pw, 70, 'background:#fff;', box(20, 15, 40, 40, 'background:#d5d9de;border-radius:20px;') + t(76, 23, 400, 'marc.menuiserie', 22, SANS, '#262626', 700))
            + img(vite_fait(), 0, 70, pw, pw) + box(0, 70 + pw, pw, 150, 'background:#fff;',
            t(20, 14, 400, '♡ &nbsp;💬 &nbsp;➤', 30, SANS, '#262626', 400) + t(20, 66, pw - 40, '<b>marc.menuiserie</b> Nouvelle commande terminée 👍', 22, SANS, '#262626', 400, 0, 1.3)))
    s += box(px - 18, py - 18, pw + 36, 70 + pw + 150 + 36, 'background:#0b0c0e;border-radius:40px;box-shadow:0 30px 70px rgba(0,0,0,.5);', box(18, 18, pw, 70 + pw + 150, 'overflow:hidden;border-radius:24px;', post))
    s += t(60, 1110, 960, 'Une photo prise vite, entre deux chantiers.', 36, SANS, '#c4cad1', 500, 0, 1.3, 'center')
    s += t(60, 1170, 960, 'Et tout ce savoir-faire… disparaît.', 52, SER, '#ffffff', 400, -.01, 1.1, 'center', 'font-style:italic;')
    return s + pied(3, 'rgba(233,237,242,.4)')
def p4():
    by = 430
    s = fond() + chapitre('CHAPITRE III · LE REGARD')
    s += t(60, 140, 960, 'Et si on le racontait', 70, SER, CREME, 400, -.01, 1.05, 'center') + t(60, 225, 960, 'autrement ?', 120, HAND, OR, 700, 0, 1, 'center')
    s += img(film('marc', 'p_marc_depth', W, 720, .5, .5, .45, cut=True), 0, by, W, 720)
    s += t(0, by + 10, W, 'SAVOIR-FAIRE', 196, AN, BOIS, 400, .01, .9, 'center', 'opacity:.96;white-space:nowrap;')
    s += img('img/p_marc_depth_cut.png', 0, by, W, 720) + fondu(by - 2, 80, NOIR, True) + fondu(by + 640, 82, NOIR)
    s += t(80, 1170, 920, '<span style="background:rgba(8,6,5,.6);padding:4px 16px;border-radius:8px;-webkit-box-decoration-break:clone;box-decoration-break:clone;">— Des années d’expérience. Des gestes précis.<br>Une exigence qu’on voit enfin.</span>', 34, SANS, CREME, 500, 0, 1.55, 'center')
    return s + pied(4)
def p5():
    s = fond() + chapitre('CHAPITRE IV · LES GESTES')
    s += t(60, 130, 960, 'Chaque métier a ses gestes.', 64, SER, CREME, 400, -.01, 1.05, 'center') + t(60, 215, 960, 'Et chaque geste mérite d’être vu.', 40, SER, OR, 400, -.01, 1.1, 'center', 'font-style:italic;')
    for k, (src, fx, mot) in enumerate([('argile', .42, 'Façonner.'), ('farine', .33, 'Pétrir.'), ('forge', .58, 'Forger.')]):
        x = 60 + k * 330
        s += img(film(src, f'p_{src}', 300, 760, fx, .5, .3), x, 320, 300, 760, 'border-radius:150px 150px 18px 18px;')
        s += t(x, 1100, 300, mot, 74, HAND, OR, 700, 0, 1, 'center')
    return s + pied(5)
def p6():
    src = en_vitrine('img/affiche_copeaux.png', 'vitrine_copeaux.jpg'); w, h = Image.open(f'{D}/{src}').size; ih = int(W * h / w)
    s = fond() + chapitre('CHAPITRE V · LA CAMPAGNE')
    s += t(60, 130, 960, 'Une image forte. Un message clair.', 58, SER, CREME, 400, -.01, 1.05, 'center')
    s += img(src, 0, 260, W, ih) + fondu(260, 60, NOIR, True) + fondu(260 + ih - 80, 82, NOIR)
    s += t(60, 260 + ih + 30, 960, 'Une histoire qui reste.', 110, HAND, OR, 700, 0, 1, 'center')
    s += t(60, 260 + ih + 170, 960, 'Campagne fictive « Atelier Copeaux » · affiche en vitrine', 24, SANS, 'rgba(242,235,224,.6)', 600, .04, al='center')
    return s + pied(6)
def p7():
    s = fond() + img(film('sculpture', 'p_sculpture_fond', W, H, .62, .5, .7), 0, 0, W, H, 'opacity:.22;filter:blur(2px);')
    s += t(60, 170, 960, 'Votre métier.', 120, SER, CREME, 400, -.02, 1, 'center') + t(60, 300, 960, 'Notre regard créatif.', 120, HAND, OR, 700, 0, 1, 'center')
    s += box(390, 470, 300, 2, f'background:{BOIS};')
    s += t(110, 520, 860, 'Artisans, entrepreneurs :<br>quelle histoire aimeriez-vous raconter<br>à travers votre communication ?', 40, SER, CREME, 400, 0, 1.3, 'center', 'font-style:italic;')
    s += box(140, 760, 800, 110, f'background:{BOIS};border-radius:55px;box-shadow:0 18px 40px rgba(0,0,0,.4);', t(0, 32, 800, 'Écrivez HISTOIRE en commentaire', 38, MO, NOIR, 800, 0, 1.1, 'center'))
    s += t(60, 940, 960, 'Tarik Belattar — E-DUST Solutions', 36, MO, CREME, 800, 0, 1.2, 'center')
    s += t(60, 992, 960, '06 13 24 96 80 · tarikbelatta@gmail.com · edust-solutions.fr', 26, SANS, 'rgba(242,235,224,.8)', 500, 0, 1.2, 'center')
    s += t(60, 1180, 960, 'Concept de campagne fictive — démonstration créative E-DUST.<br>Marc et l’Atelier Copeaux sont fictifs · photos Adobe Stock.', 22, SANS, 'rgba(242,235,224,.55)', 500, 0, 1.4, 'center')
    return s + pied(7)

# ---------- affiche fictive « Atelier Copeaux » (4:5), posée en vitrine page 6
def affiche():
    s = fond('#1d140d') + chapitre('MENUISERIE SUR MESURE', 60, BOIS)
    s += t(60, 100, 960, 'Atelier Copeaux', 74, SER, CREME, 400, 0, 1, 'center')
    s += img(film('marc', 'aff_marc', W, 720, .5, .5, .35), 0, 220, W, 720) + fondu(220, 80, '#1d140d', True) + fondu(860, 82, '#1d140d')
    s += t(60, 960, 960, 'Chaque planche', 92, SER, CREME, 400, -.01, 1, 'center') + t(60, 1060, 960, 'a une histoire.', 120, HAND, OR, 700, 0, 1, 'center')
    s += t(60, 1220, 960, 'Cuisines, escaliers, mobilier · sur rendez-vous', 26, SANS, 'rgba(242,235,224,.8)', 600, .04, al='center')
    return s + t(60, 1300, 960, 'Démo · marque fictive · photo Adobe Stock · E-DUST Solutions', 16, SANS, 'rgba(242,235,224,.45)', 400, 0, 1, 'center')

def page(title, sections):
    return (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide"><meta name="hz:canvas-width" content="{W}"><meta name="hz:canvas-height" content="{H}">'
            f'<title>{title}</title>{FONTS}<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>'
            + ''.join(f'<section class="slide" id="{n}" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden">{f()}</section>' for n, f in sections) + '</body></html>')
open(f'{D}/affiche.html', 'w').write(page('Atelier Copeaux — affiche (démo)', [('affiche_copeaux', affiche)]))
if os.path.exists(f'{D}/img/affiche_copeaux.png'):
    open(f'{D}/carrousel.html', 'w').write(page('E-DUST — Les mains qui savent (démo)', [(f'p{k + 1:02d}', f) for k, f in enumerate([p1, p2, p3, p4, p5, p6, p7])]))
    print('ok affiche.html + carrousel.html')
else:
    print('ok affiche.html (rendre img/affiche_copeaux.png puis relancer)')
