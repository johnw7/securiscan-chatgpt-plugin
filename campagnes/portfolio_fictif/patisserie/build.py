"""« Même marque, autre histoire » · épisode 1 — carrousel Instagram / LinkedIn 4:5 (1080×1350), 6 pages.
Margaux (personnage fictif) fait les plus belles pâtisseries du quartier ; son Instagram (fictif, démo) ne le montre pas :
photos floues, styles disparates, bio vide. Après : le feed « Gourmandise du jour », une même lumière chaude et une histoire
par jour. Charte E-DUST autour ; à l'intérieur des téléphones, l'Instagram fictif de la pâtisserie.
Photos Adobe Stock (licence gratuite) dans raw/. Éléments posés à plat (import Adobe Express).
Usage : python3 build.py → carrousel.html (rendu PNG) + carrousel_express.html (images intégrées) ;
rendu : NODE_PATH=$(npm root -g) node render.cjs carrousel.html <sortie>."""
import os, re, base64
import numpy as np
from PIL import Image, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/img', exist_ok=True)
LOGO = f'{D}/../../logo_edust/out/ref/horizontal_transparent_clair.svg'
FONTS = ('<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap">')
SANS, SER, AN, MO, HAND = "'dm-sans',sans-serif", "'dm-serif-display',serif", "'anton',sans-serif", "'montserrat',sans-serif", "'Caveat',cursive"
NUIT, BOIS, OR, CREME = '#141210', '#c89b6d', '#e2b98c', '#f2ebe0'
W, H = 1080, 1350
RNG = np.random.default_rng(11)
EMB = False

# ---------- images
def crop_img(i, w, h, fx=.5, fy=.5, zoom=1.0):
    r = w / h; cw, ch = (i.height * r, i.height) if i.width / i.height > r else (i.width, i.width / r)
    cw, ch = cw / zoom, ch / zoom
    x = min(max(fx * i.width - cw / 2, 0), i.width - cw); y = min(max(fy * i.height - ch / 2, 0), i.height - ch)
    return i.crop((int(x), int(y), int(x + cw), int(y + ch))).resize((w, h), Image.LANCZOS)
def cine(a, w, h, vig=.5):
    """Étalonnage chaud « atelier » + vignettage + grain."""
    a = np.clip((a - .5) * 1.1 + .5, 0, 1) * np.array([1.06, 1.0, .86]) + np.array([.015, .005, 0])
    yy, xx = np.mgrid[0:h, 0:w]; d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    return a * (1 - vig * np.clip(d - .5, 0, 1) ** 1.3)[..., None] + RNG.normal(0, .018, (h, w, 1))
def sauve(a, out): Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).save(f'{D}/img/{out}.jpg', quality=90); return f'{out}.jpg'
def film(src, out, w, h, fx=.5, fy=.5, vig=.5, zoom=1.0, flou=0):
    if os.path.exists(f'{D}/img/{out}.jpg'): return f'{out}.jpg'
    i = crop_img(Image.open(f'{D}/raw/{src}.jpg').convert('RGB'), w, h, fx, fy, zoom)
    if flou: i = i.filter(ImageFilter.GaussianBlur(flou))
    return sauve(cine(np.asarray(i, dtype=np.float32) / 255, w, h, vig), out)
def terne(src, out, w, h, fx=.5, fy=.5, flou=4, zoom=1.0, sombre=.82):
    """Photo « avant » : floue, ternie, dominante froide, cadrage approximatif."""
    if os.path.exists(f'{D}/img/{out}.jpg'): return f'{out}.jpg'
    i = crop_img(Image.open(f'{D}/raw/{src}.jpg').convert('RGB'), w, h, fx, fy, zoom).filter(ImageFilter.GaussianBlur(flou))
    a = np.asarray(i, dtype=np.float32) / 255; g = a.mean(axis=2, keepdims=True)
    a = (a * .45 + g * .55) * sombre * np.array([.96, 1.0, .97]) + .04
    return sauve(a + RNG.normal(0, .025, (h, w, 1)), out)
def I(n):
    if not EMB: return f'img/{n}'
    return 'data:image/jpeg;base64,' + base64.b64encode(open(f'{D}/img/{n}', 'rb').read()).decode()
LW, LH = (int(v) for v in re.search(r'viewBox="0 0 (\d+) (\d+)"', open(LOGO).read()).groups())
def logo(x, y, w):
    src = 'data:image/svg+xml;base64,' + base64.b64encode(open(LOGO).read().encode()).decode() if EMB else '../../logo_edust/out/ref/horizontal_transparent_clair.svg'
    return f'<img src="{src}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{w * LH / LW:.0f}px">'

# ---------- mise en page (tout à plat : pas d'élément positionné dans un autre)
def box(x, y, w, h, st=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}"></div>'
def t(x, y, w, s, size, fam=SANS, col=CREME, wt=400, ls=0, lh=1.05, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def img(src, x, y, w, h, st=''): return f'<img src="{I(src)}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">'
def fond(col=NUIT): return box(0, 0, W, H, f'background:{col};')
def fondu(y, h, rev=False):
    a, z = 'rgba(20,18,16,0)', 'rgba(20,18,16,1)'
    return box(0, y, W, h, f'background:linear-gradient(180deg,{z if rev else a},{a if rev else z});')
SH = 'text-shadow:0 3px 22px rgba(0,0,0,.7);'
NB = '&nbsp;'
MUET = 'rgba(242,235,224,.5)'
def pied(n):
    c = 'rgba(242,235,224,.45)'
    return t(60, 1296, 760, 'E-DUST SOLUTIONS · même marque, autre histoire (démo)', 18, SANS, c, 700, .2) + t(820, 1296, 200, f'{n}/6', 18, SANS, c, 700, .2, al='right')
def chapitre(s, y=64): return t(60, y, 960, s, 20, SANS, OR, 800, .42, al='center')
def main(x, y, w, s, size=46, col=OR, al='left', st=''): return t(x, y, w, s, size, HAND, col, 700, 0, 1.05, al, st)

# ---------- l'Instagram fictif de la pâtisserie, dans un téléphone (écran 492 × 972)
PX, PY = 80, 236                       # coin du téléphone
SX, SY, SW = PX + 14, PY + 14, 492     # coin et largeur de l'écran
ENCRE, GRIS = '#1d1a17', '#7d766f'
def telephone(avant):
    s = box(PX, PY, SW + 28, 1000, 'background:#0a0806;border-radius:52px;box-shadow:0 0 0 2px #3a3029,0 40px 90px rgba(0,0,0,.6)' + ('' if avant else ',0 0 120px rgba(226,185,140,.22)') + ';')
    s += box(SX, SY, SW, 972, 'background:#fbfaf7;border-radius:40px;')
    s += box(SX + SW // 2 - 50, SY + 12, 100, 26, 'background:#0a0806;border-radius:13px;')
    s += t(SX + 24, SY + 58, 300, 'patisserie.margaux', 21, SANS, ENCRE, 800, 0, 1) + t(SX + SW - 64, SY + 54, 40, '≡', 28, SANS, ENCRE, 400, 0, 1, 'right')
    if avant:
        s += img(terne('croissants_blanc', 'av_avatar', 96, 96, .5, .5, 3), SX + 24, SY + 104, 96, 96, 'border-radius:48px;')
    else:
        s += box(SX + 20, SY + 100, 104, 104, f'background:linear-gradient(135deg,{OR},{BOIS});border-radius:52px;')
        s += img(film('atelier', 'ap_avatar', 96, 96, .5, .3, .2, 1.6), SX + 24, SY + 104, 96, 96, 'border-radius:48px;')
    s += t(SX + 140, SY + 120, 330, 'Pâtisserie Margaux', 22, SANS, ENCRE, 800, 0, 1.1) + t(SX + 140, SY + 152, 330, 'Boulangerie-pâtisserie', 17, SANS, GRIS, 500, 0, 1.1)
    if avant:
        s += t(SX + 24, SY + 222, 444, 'Pâtisserie artisanale 🍰🍰<br>Ouvert du mardi au dimanche<br>Venez nous voir !!', 18, SANS, ENCRE, 500, 0, 1.45)
        for k, lb in enumerate(['Suivre', 'Message']):
            s += box(SX + 24 + k * 226, SY + 320, 218, 40, 'background:#ecebe8;border-radius:10px;') + t(SX + 24 + k * 226, SY + 331, 218, lb, 16, SANS, ENCRE, 700, 0, 1, 'center')
        s += box(SX, SY + 900, SW, 1, 'background:#e2e0dc;') + t(SX, SY + 916, SW, '⌂ &nbsp;&nbsp;&nbsp; ⌕ &nbsp;&nbsp;&nbsp; ⊕ &nbsp;&nbsp;&nbsp; ▷ &nbsp;&nbsp;&nbsp; ◯', 26, SANS, ENCRE, 400, 0, 1, 'center')
    else:
        s += t(SX + 24, SY + 222, 444, f'Chaque matin, une gourmandise et son histoire. 🥐<br>📍 Le Vésinet (démo){NB}· ⏰ commandez avant 11{NB}h', 18, SANS, ENCRE, 500, 0, 1.45)
        s += box(SX + 24, SY + 300, 444, 44, f'background:{BOIS};border-radius:10px;') + t(SX + 24, SY + 312, 444, 'Commander la gourmandise du jour', 17, SANS, NUIT, 800, 0, 1, 'center')
        for k, (src, fx, fy, lb) in enumerate([('tartelette', .5, .5, 'Du jour'), ('farine', .55, .4, 'L’atelier'), ('opera', .5, .5, 'Commandes'), ('atelier', .5, .3, 'L’équipe')]):
            x = SX + 30 + k * 112
            s += box(x - 3, SY + 360, 70, 70, f'border:2px solid {BOIS};border-radius:35px;')
            s += img(film(src, f'ap_hl_{k}', 62, 62, fx, fy, .1, 1.4), x + 1, SY + 364, 62, 62, 'border-radius:31px;')
            s += t(x - 20, SY + 438, 104, lb, 13, SANS, ENCRE, 600, 0, 1, 'center')
    gy = SY + (384 if avant else 470); c = 162
    tuiles = TUILES_AVANT if avant else TUILES_APRES
    for k, tu in enumerate(tuiles):
        x, y = SX + (k % 3) * (c + 3), gy + (k // 3) * (c + 3)
        s += img(tu[0], x, y, c, c)
        if len(tu) > 1: s += tu[1](x, y, c)
    return s
def sur_tuile(texte, col, fond_='', size=20, fam=SANS, wt=900, dy=60):
    return lambda x, y, c: (box(x + 10, y + dy - 6, c - 20, size + 12, fond_) if fond_ else '') + t(x, y + dy, c, texte, size, fam, col, wt, 0, 1, 'center')
def jour(j): return lambda x, y, c: box(x, y + c - 46, c, 46, 'background:linear-gradient(180deg,rgba(20,18,16,0),rgba(20,18,16,.75));') + t(x + 10, y + c - 34, c - 12, j, 22, HAND, CREME, 700, 0, 1)

def prepare():
    global TUILES_AVANT, TUILES_APRES
    TUILES_AVANT = [(terne('vitrine', 'av_1', 162, 162, .2, .7, 5),), (terne('fraisiers', 'av_2', 162, 162, .85, .2, 3, 1.0, .9), sur_tuile('PROMO -20%', '#ffffff', 'background:#d23b3b;', 18)),
                    (terne('croissants_blanc', 'av_3', 162, 162, .3, .5, 2, 1.0, .95),), (terne('etalage', 'av_4', 162, 162, .5, .5, 6),),
                    (terne('choux', 'av_5', 162, 162, .9, .9, 4), sur_tuile('NOUVEAU !!!', '#ffe14d', '', 22, SANS, 900, 64)), (terne('fruits', 'av_6', 162, 162, .5, .5, 3),),
                    (terne('eclairs', 'av_7', 162, 162, .1, .3, 5),), (terne('danish', 'av_8', 162, 162, .5, .5, 7, 1.0, .7),), (terne('entremets', 'av_9', 162, 162, .5, .5, 4, 1.0, .75),)]
    TUILES_APRES = [(film('tartelette', 'ap_1', 162, 162, .55, .5, .25, 1.5), jour('Lundi')), (film('atelier', 'ap_2', 162, 162, .5, .35, .25, 1.3), jour('4 h 30')),
                    (film('croissants', 'ap_3', 162, 162, .5, .65, .25, 1.2), jour('Mardi')), (film('opera', 'ap_4', 162, 162, .45, .5, .25, 1.5), jour('Mercredi')),
                    (film('farine', 'ap_5', 162, 162, .55, .45, .25, 1.3), jour('L’atelier')), (film('parisbrest', 'ap_6', 162, 162, .55, .5, .25, 1.4), jour('Jeudi')),
                    (film('danish', 'ap_7', 162, 162, .5, .5, .25, 1.3), jour('Vendredi')), (film('entremets', 'ap_8', 162, 162, .5, .5, .25, 1.5), jour('Samedi')),
                    (film('eclairs', 'ap_9', 162, 162, .45, .55, .25, 1.6), jour('Dimanche'))]

def note(y, s, size=38): return main(650, y, 400, f'←{NB}{s}', size, OR)

# ---------- pages
def p1():
    s = img(film('atelier', 'p_atelier', W, H, .5, .45, .55), 0, 0, W, H) + fondu(760, 590) + fondu(0, 260, True)
    s += chapitre('MÊME MARQUE, AUTRE HISTOIRE · ÉPISODE 1')
    s += main(60, 120, 600, '4 h 30, Le Vésinet.', 72, CREME, st='transform:rotate(-4deg);')
    s += t(70, 900, 940, 'Margaux fait les plus belles pâtisseries du quartier.', 60, SER, CREME, 400, -.01, 1.12, 'center', SH)
    s += main(60, 1066, 960, 'Son Instagram ne le montre pas.', 68, OR, 'center', SH)
    s += t(60, 1210, 960, 'pâtisserie et personnage fictifs (démo) · photo Adobe Stock', 18, SANS, MUET, 600, .18, al='center')
    return s + pied(1)
def p2():
    s = fond() + chapitre('AVANT · SA VITRINE INSTAGRAM')
    s += t(60, 118, 960, 'Le compte de Margaux, aujourd’hui.', 52, SER, CREME, 400, -.01, 1.1, 'center')
    s += telephone(True)
    s += note(470, 'une bio qui ne dit<br>ni quoi, ni où, ni quand')
    s += note(640, 'des photos floues<br>et sombres')
    s += note(800, 'chaque post dans<br>un style différent')
    s += note(960, 'aucun moyen<br>de commander')
    s += t(650, 1130, 400, 'Les clients passent…<br>et scrollent.', 38, SER, '#ffffff', 400, -.01, 1.15, st='font-style:italic;')
    s += t(60, 1252, 960, 'compte fictif (démo) · photos Adobe Stock', 16, SANS, MUET, 600, .12, al='center')
    return s + pied(2)
def p3():
    s = fond() + chapitre('LE DÉCLIC · 3 CHANGEMENTS')
    s += t(60, 118, 960, 'Le problème n’est pas la pâtisserie.', 54, SER, CREME, 400, -.01, 1.1, 'center')
    s += main(60, 190, 960, 'C’est la vitrine.', 72, OR, 'center')
    s += img(terne('tartelette', 'p3_avant', 420, 420, .3, .4, 6, 1.0, .8), 80, 330, 420, 420, 'border-radius:22px;')
    s += box(576, 326, 428, 428, f'border:3px solid {OR};border-radius:25px;')
    s += img(film('tartelette', 'p3_apres', 420, 420, .55, .5, .3, 1.3), 580, 330, 420, 420, 'border-radius:22px;')
    s += t(80, 768, 420, 'AVANT', 20, SANS, 'rgba(242,235,224,.55)', 800, .3, 1, 'center') + t(580, 768, 420, 'APRÈS', 20, SANS, OR, 800, .3, 1, 'center')
    s += t(503, 520, 74, '→', 46, SANS, BOIS, 700, 0, 1, 'center')
    for k, (titre, txt) in enumerate([('LA LUMIÈRE', 'Une même lumière chaude, des cadrages serrés.'), ('LE RÉCIT', 'Chaque jour, une gourmandise et son histoire.'), ('L’ACTION', 'On sait quoi commander, et comment.')]):
        y = 840 + k * 128
        s += box(80, y, 72, 72, f'border:2.5px solid {OR};border-radius:36px;') + t(80, y + 12, 72, str(k + 1), 44, SER, OR, 400, 0, 1, 'center')
        s += t(180, y + 2, 820, titre, 20, SANS, OR, 800, .3, 1.2) + t(180, y + 32, 820, txt, 34, SER, CREME, 400, 0, 1.15)
    return s + pied(3)
def p4():
    s = fond() + chapitre('APRÈS · « GOURMANDISE DU JOUR »')
    s += t(60, 118, 960, 'Le même savoir-faire. Une autre histoire.', 50, SER, CREME, 400, -.01, 1.1, 'center')
    s += telephone(False)
    s += note(440, 'une bio qui dit quoi,<br>où et comment commander')
    s += note(600, 'des stories à la une<br>pour les coulisses')
    s += note(800, 'une même lumière<br>chaude, partout')
    s += note(980, 'un rendez-vous<br>chaque matin')
    s += t(650, 1130, 400, 'On a envie de passer…<br>et de revenir.', 38, SER, '#ffffff', 400, -.01, 1.15, st='font-style:italic;')
    s += t(60, 1252, 960, 'compte fictif (démo) · photos Adobe Stock', 16, SANS, MUET, 600, .12, al='center')
    return s + pied(4)
def p5():
    s = fond() + chapitre('ZOOM · LA GOURMANDISE DU JOUR')
    X, Y, CW = 150, 120, 780
    s += box(X, Y, CW, 1010, 'background:#fbfaf7;border-radius:28px;box-shadow:0 40px 90px rgba(0,0,0,.55),0 0 110px rgba(226,185,140,.18);')
    s += box(X + 22, Y + 18, 58, 58, f'background:linear-gradient(135deg,{OR},{BOIS});border-radius:29px;')
    s += img(film('atelier', 'p5_avatar', 52, 52, .5, .3, .2, 1.6), X + 25, Y + 21, 52, 52, 'border-radius:26px;')
    s += t(X + 96, Y + 26, 500, 'patisserie.margaux', 21, SANS, ENCRE, 800, 0, 1) + t(X + 96, Y + 52, 500, 'Le Vésinet', 16, SANS, GRIS, 500, 0, 1)
    s += img(film('tartelette', 'p5_tartelette', CW, 640, .55, .5, .35, 1.1), X, Y + 94, CW, 640)
    s += box(X + 24, Y + 118, 380, 40, f'background:{NUIT};border-radius:20px;opacity:.88;') + t(X + 24, Y + 129, 380, 'GOURMANDISE DU JOUR · JEUDI', 15, SANS, OR, 800, .2, 1, 'center')
    s += box(X, Y + 574, CW, 160, 'background:linear-gradient(180deg,rgba(20,18,16,0),rgba(20,18,16,.8));')
    s += main(X + 30, Y + 660, CW - 60, 'La tartelette de Mme Lefèvre', 52, CREME, st=SH)
    s += t(X + 24, Y + 752, 400, '♡ &nbsp; 💬 &nbsp; ➤', 28, SANS, ENCRE, 400, 0, 1) + t(X + CW - 70, Y + 752, 46, '⌑', 30, SANS, ENCRE, 400, 0, 1, 'right')
    s += t(X + 24, Y + 806, CW - 48, f'<b>patisserie.margaux</b> Jeudi, 6{NB}h{NB}40. Mme Lefèvre passe chaque jeudi depuis notre ouverture. Ce matin, on a baptisé sa tartelette préférée en son honneur. 🍓 Commandez-la avant 11{NB}h, lien en bio.', 20, SANS, ENCRE, 500, 0, 1.45)
    s += t(X + 24, Y + 950, CW - 48, '#gourmandisedujour #patisserie #levesinet', 18, SANS, '#9a6f45', 600, 0, 1.3)
    s += main(60, 1168, 960, 'Un gâteau se goûte. Une histoire se partage.', 56, OR, 'center')
    s += t(60, 1246, 960, 'post fictif (démo) · photos Adobe Stock', 16, SANS, MUET, 600, .12, al='center')
    return s + pied(5)
def p6():
    s = fond() + img(film('farine', 'p6_farine', W, H, .55, .5, .7, 1.0, 5), 0, 0, W, H, 'opacity:.16;')
    s += t(30, 110, 1020, 'Même pâtisserie. Même savoir-faire.', 40, SER, 'rgba(242,235,224,.85)', 400, 0, 1.15, 'center')
    s += main(30, 168, 1020, 'Une vitrine qui donne faim.', 64, OR, 'center')
    s += box(480, 280, 120, 2, f'background:{BOIS};')
    s += t(30, 330, 1020, 'Et votre Instagram,', 58, SER, CREME, 400, -.01, 1.1, 'center')
    s += main(30, 404, 1020, f'raconte-t-il votre savoir-faire{NB}?', 80, OR, 'center')
    s += box(190, 570, 700, 96, f'background:{BOIS};border-radius:48px;box-shadow:0 18px 40px rgba(0,0,0,.4);')
    s += t(190, 601, 700, 'Je veux mon avant / après →', 30, MO, NUIT, 800, 0, 1.15, 'center')
    s += t(140, 690, 800, 'Envoyez-moi votre compte en message privé : je vous montre ce que je changerais.', 24, SANS, 'rgba(242,235,224,.75)', 500, 0, 1.4, 'center')
    s += logo(330, 800, 420)
    s += t(60, 1000, 960, 'Tarik Belattar — E-DUST Solutions', 34, MO, CREME, 800, 0, 1.2, 'center')
    s += t(60, 1050, 960, '06 13 24 96 80 · tarikbelatta@gmail.com · edust-solutions.fr', 25, SANS, 'rgba(242,235,224,.8)', 500, 0, 1.2, 'center')
    s += t(90, 1150, 900, 'Démonstration créative : la Pâtisserie Margaux, son compte et ses publications sont fictifs · photos Adobe Stock.', 20, SANS, 'rgba(242,235,224,.55)', 500, 0, 1.45, 'center')
    return s + pied(6)

def page(title, sections):
    return (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide"><meta name="hz:canvas-width" content="{W}"><meta name="hz:canvas-height" content="{H}">'
            f'<title>{title}</title>{FONTS}<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>'
            + ''.join(f'<section class="slide" id="{n}" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden">{f()}</section>' for n, f in sections) + '</body></html>')
PAGES = [(f'p{k + 1:02d}', f) for k, f in enumerate([p1, p2, p3, p4, p5, p6])]
for emb, nom in [(False, 'carrousel.html'), (True, 'carrousel_express.html')]:
    EMB = emb; prepare()
    open(f'{D}/{nom}', 'w').write(page('E-DUST — Même marque, autre histoire · la pâtisserie (démo)', PAGES))
print('ok', os.path.getsize(f'{D}/carrousel_express.html') // 1000, 'Ko (express)')
