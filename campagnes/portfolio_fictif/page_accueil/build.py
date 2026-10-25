"""« 22 h 14 » — carrousel LinkedIn 4:5 (1080×1350), 7 pages : les 3 points à vérifier sur sa page d'accueil, racontés à travers Claire
(personnage fictif) qui cherche un paysagiste le soir sur son téléphone. Site fictif « Les Jardins de Léon » (démo), avant / après.
Photos Adobe Stock (licence gratuite) dans raw/ ; Claire détourée avec Adobe Photoshop (raw/claire_cut.png) pour glisser
VOTRE SITE derrière elle. Usage : python3 build.py → carrousel.html ; rendu : NODE_PATH=$(npm root -g) node render.cjs carrousel.html <sortie>."""
import os
import numpy as np
from PIL import Image, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/img', exist_ok=True)
FONTS = ('<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap">')
SANS, SER, AN, MO, HAND = "'dm-sans',sans-serif", "'dm-serif-display',serif", "'anton',sans-serif", "'montserrat',sans-serif", "'Caveat',cursive"
# même charte que « Les mains qui savent » : noir chaud, crème, or, bois
NUIT, BOIS, AMBRE, CREME, VERT, ROUGE = '#141210', '#c89b6d', '#e2b98c', '#f2ebe0', '#2f6b45', '#d0705f'
W, H = 1080, 1350
RNG = np.random.default_rng(5)

# ---------- images
def crop_img(i, w, h, fx=.5, fy=.5):
    r = w / h; cw, ch = (i.height * r, i.height) if i.width / i.height > r else (i.width, i.width / r)
    x = min(max(fx * i.width - cw / 2, 0), i.width - cw); y = min(max(fy * i.height - ch / 2, 0), i.height - ch)
    return i.crop((int(x), int(y), int(x + cw), int(y + ch))).resize((w, h), Image.LANCZOS)
def nuit(a, w, h, vig=.5, chaud=False):
    """Étalonnage chaud « atelier » (comme « Les mains qui savent ») ou nuit bleue + vignettage + grain."""
    a = np.clip((a - .5) * 1.08 + .5, 0, 1) * (np.array([1.06, 1.0, .88]) if chaud else np.array([.92, .98, 1.08])) + (np.array([.015, .005, 0]) if chaud else 0)
    yy, xx = np.mgrid[0:h, 0:w]; d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    return a * (1 - vig * np.clip(d - .5, 0, 1) ** 1.3)[..., None] + RNG.normal(0, .02, (h, w, 1))
def film(src, out, w, h, fx=.5, fy=.5, vig=.5, cut=False, chaud=True, flou=0):
    out += '_or'
    if not os.path.exists(f'{D}/img/{out}.jpg'):
        i = crop_img(Image.open(f'{D}/raw/{src}.jpg').convert('RGB'), w, h, fx, fy)
        if flou: i = i.filter(ImageFilter.GaussianBlur(flou))
        a = nuit(np.asarray(i, dtype=np.float32) / 255, w, h, vig, chaud)
        Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).save(f'{D}/img/{out}.jpg', quality=90)
        if cut:
            c = np.asarray(crop_img(Image.open(f'{D}/raw/{src}_cut.png').convert('RGBA'), w, h, fx, fy), dtype=np.float32) / 255
            rgb = nuit(c[..., :3], w, h, vig, chaud)
            Image.fromarray((np.clip(np.dstack([rgb, c[..., 3:]]), 0, 1) * 255).astype(np.uint8), 'RGBA').save(f'{D}/img/{out}_cut.png')
    return f'img/{out}.jpg'

# ---------- mise en page
def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam=SANS, col='#fff', wt=400, ls=0, lh=1.05, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def img(src, x, y, w, h, st=''): return f'<img src="{src}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">'
def fond(col=NUIT): return box(0, 0, W, H, f'background:{col};')
def fondu(y, h, col, rev=False, x=0, w=W):
    c = col.lstrip('#'); r, g, b = (int(c[k:k + 2], 16) for k in (0, 2, 4)); a, z = f'rgba({r},{g},{b},0)', f'rgba({r},{g},{b},1)'
    return box(x, y, w, h, f'background:linear-gradient(180deg,{z if rev else a},{a if rev else z});')
SH = 'text-shadow:0 3px 22px rgba(0,0,0,.7);'
NB = '&nbsp;'
def pied(n, col='rgba(242,235,224,.45)'):
    return t(60, 1296, 760, 'E-DUST SOLUTIONS · site fictif (démo)', 18, SANS, col, 700, .2) + t(820, 1296, 200, f'{n}/7', 18, SANS, col, 700, .2, al='right')
def chapitre(s, y=64, col=AMBRE): return t(60, y, 960, s, 20, SANS, col, 800, .42, al='center')
def note(x, y, w, s, size=46, col=AMBRE, rot=-3, al='left'):
    return t(x, y, w, s, size, HAND, col, 700, 0, 1, al, f'transform:rotate({rot}deg);')
def numero(n, y=120):
    return box(W // 2 - 60, y, 120, 120, f'border:3px solid {AMBRE};border-radius:60px;', t(0, 18, 120, str(n), 76, SER, AMBRE, 400, 0, 1, 'center'))

# ---------- le site fictif, à l'écran d'un téléphone (390 × 780)
SW, SHT = 390, 780
LOGO = t(22, 22, 300, 'Les Jardins de Léon', 24, SER, VERT, 400, 0, 1)
def burger(): return ''.join(box(338, 26 + k * 9, 30, 3, 'background:#33413a;border-radius:2px;') for k in range(3))
def ecran_flou():
    s = box(0, 0, SW, SHT, 'background:#fbfaf6;') + LOGO + burger()
    s += img(film('leon', 's_leon', SW, 280, .55, .45, .15, chaud=True), 0, 70, SW, 280)
    s += t(22, 372, 346, 'L’excellence au service de vos projets', 31, SER, '#1f2a24', 400, 0, 1.12)
    s += t(22, 480, 346, 'Passion · Qualité · Savoir-faire', 18, SANS, '#7c857f', 500, .02, 1.3)
    s += box(22, 528, 150, 46, 'border:1.5px solid #9aa39d;border-radius:23px;', t(0, 13, 150, 'Découvrir', 17, SANS, '#56605a', 600, 0, 1, 'center'))
    s += t(22, 606, 346, 'Bienvenue dans notre univers, où chaque projet est unique et mérite le meilleur. Depuis toujours, nous mettons notre passion à votre service…', 16, SANS, '#a0a7a2', 400, 0, 1.5)
    return s + t(22, 700, 346, 'Mentions légales · Contact · Plan du site', 12, SANS, '#c3c8c4', 400, 0, 1)
def ecran_clair():
    s = box(0, 0, SW, SHT, 'background:#fbfaf6;') + LOGO + box(286, 16, 84, 38, f'background:{VERT};border-radius:19px;', t(0, 10, 84, '✆ Appeler', 15, SANS, '#fff', 700, 0, 1, 'center'))
    s += img(film('leon', 's_leon', SW, 280, .55, .45, .15, chaud=True), 0, 70, SW, 280)
    s += t(22, 368, 346, 'PAYSAGISTE · YVELINES', 14, SANS, VERT, 800, .2, 1)
    s += t(22, 394, 346, 'Nous créons et entretenons votre jardin.', 31, SER, '#1f2a24', 400, 0, 1.1)
    s += t(22, 470, 346, 'Pour les particuliers et les copropriétés.', 18, SANS, '#46524b', 500, 0, 1.3)
    for k, (ic, lb) in enumerate([('🌿', 'Création'), ('✂️', 'Entretien'), ('🌳', 'Élagage')]):
        s += box(22 + k * 118, 514, 108, 82, 'background:#eef3ec;border-radius:14px;', t(0, 10, 108, ic, 26, SANS, '#000', 400, 1, 1, 'center') + t(0, 50, 108, lb, 15, SANS, '#1f2a24', 700, 0, 1, 'center'))
    s += box(22, 616, 346, 58, f'background:{VERT};border-radius:29px;box-shadow:0 8px 20px rgba(47,107,69,.35);', t(0, 17, 346, 'Demander un devis', 20, SANS, '#fff', 800, 0, 1, 'center'))
    return s + t(22, 690, 346, 'ou appelez le 06 00 00 00 00', 16, SANS, '#46524b', 600, 0, 1, 'center')
def telephone(x, y, ecran, heure, lueur=False):
    halo = 'box-shadow:0 0 0 2px #3a3029,0 40px 90px rgba(0,0,0,.6)' + (f',0 0 120px rgba(226,185,140,.25)' if lueur else '') + ';'
    return box(x, y, SW + 28, SHT + 28, f'background:#0a0806;border-radius:58px;{halo}',
               box(14, 14, SW, SHT, 'overflow:hidden;border-radius:46px;background:#fbfaf6;', box(0, 36, SW, SHT - 36, '', ecran) + t(40, 14, 100, heure, 16, SANS, '#1f2a24', 700, 0, 1)
               + t(SW - 110, 13, 80, '▂▄▆ ▮', 13, SANS, '#1f2a24', 700, 0, 1, 'right')) + box(14 + SW // 2 - 50, 24, 100, 26, 'background:#0a0806;border-radius:13px;'))

# ---------- pages
def p1():
    s = img(film('claire', 'p_claire', W, H, .6, .5, .55, cut=True), 0, 0, W, H)
    s += t(560, 262, 480, 'VOTRE<br>SITE', 196, AN, BOIS, 400, .01, .9, 'left', 'opacity:.95;white-space:nowrap;')
    s += img('img/p_claire_or_cut.png', 0, 0, W, H) + fondu(820, 530, NUIT) + fondu(0, 260, NUIT, True)
    s += chapitre('UNE HISTOIRE DE SITE · LA PRATIQUE')
    s += note(60, 130, 400, '22 h 14.', 84, CREME, -4)
    s += t(60, 960, 960, f'Claire cherche un paysagiste.<br>Elle tombe sur votre site.', 58, SER, CREME, 400, -.01, 1.12, 'center', SH)
    s += t(60, 1110, 960, f'3 points à vérifier sur votre page d’accueil', 40, HAND, AMBRE, 700, 0, 1.1, 'center', 'font-size:58px;' + SH)
    s += t(60, 1200, 960, 'personnage fictif · photo Adobe Stock', 18, SANS, 'rgba(242,235,224,.5)', 600, .18, al='center')
    return s + pied(1)
def p2():
    s = fond() + chapitre('CHAPITRE I · CE QU’ELLE VOIT')
    s += t(60, 110, 960, 'Une jolie photo. Et puis…', 56, SER, CREME, 400, -.01, 1.1, 'center')
    s += telephone(80, 210, ecran_flou(), '22:14', True)
    s += note(540, 330, 500, f'←{NB}«{NB}C’est quoi, au juste{NB}?{NB}»', 46, AMBRE, -4)
    s += note(540, 560, 500, f'←{NB}«{NB}C’est pour moi{NB}?{NB}»', 46, AMBRE, 2)
    s += note(540, 800, 500, f'←{NB}«{NB}Je les appelle<br>{NB}{NB}{NB}{NB}comment{NB}?{NB}»', 46, AMBRE, -3)
    s += t(60, 1150, 960, 'Elle hésite… et ferme l’onglet.', 52, SER, '#ffffff', 400, -.01, 1.1, 'center', 'font-style:italic;')
    return s + pied(2)
def avant_apres(n, titre, question, avant, apres, legende_av, legende_ap):
    s = fond() + chapitre(f'CHAPITRE {["II", "III", "IV"][n - 1]} · POINT {n} SUR 3') + numero(n)
    s += t(60, 270, 960, titre, 66, SER, CREME, 400, -.01, 1.05, 'center')
    s += t(60, 365, 960, question, 31, SANS, 'rgba(242,235,224,.82)', 500, 0, 1.4, 'center')
    s += box(60, 520, 460, 600, 'background:#221c17;border-radius:28px;opacity:.9;', avant)
    s += box(560, 520, 460, 600, f'background:#fbfaf6;border-radius:28px;box-shadow:0 0 0 3px {AMBRE},0 30px 70px rgba(0,0,0,.5);', apres)
    s += t(60, 1140, 460, legende_av, 30, HAND, '#a3927f', 700, 0, 1.1, 'center', 'font-size:40px;')
    s += t(560, 1140, 460, legende_ap, 30, HAND, AMBRE, 700, 0, 1.1, 'center', 'font-size:40px;')
    return s
def etiquette(s, col, fg): return box(30, 28, 400, 40, '', box(0, 0, 160 if len(s) < 7 else 140, 40, f'background:{col};border-radius:20px;', t(0, 10, 160 if len(s) < 7 else 140, s, 16, SANS, fg, 800, .2, 1, 'center')))
def p3():
    av = etiquette('AVANT', '#3a3029', '#b3a594') + t(36, 140, 388, 'L’excellence au service de vos projets', 46, SER, '#cfc3b4', 400, 0, 1.12) + t(36, 360, 388, 'Une formule… qui pourrait vendre n’importe quoi.', 26, SANS, '#998b7a', 500, 0, 1.4, st='font-style:italic;')
    av += t(36, 500, 388, '✕', 64, SANS, ROUGE, 700, 0, 1)
    ap = etiquette('APRÈS', VERT, '#fff') + t(36, 112, 388, 'PAYSAGISTE · YVELINES', 18, SANS, VERT, 800, .2, 1) + t(36, 150, 388, 'Nous créons et entretenons votre jardin.', 46, SER, '#1f2a24', 400, 0, 1.1)
    ap += t(36, 360, 388, 'Le métier et le lieu, compris en un coup d’œil.', 26, SANS, '#46524b', 500, 0, 1.4) + t(36, 500, 388, '✓', 64, SANS, VERT, 800, 0, 1)
    s = avant_apres(1, 'Votre titre principal.', 'Explique-t-il clairement votre activité,<br>ou se contente-t-il d’une formule vague&nbsp;?', av, ap, 'joli… mais flou', 'clair dès la 1re ligne')
    return s + pied(3)
def p4():
    av = etiquette('AVANT', '#3a3029', '#b3a594') + t(36, 120, 388, 'Nos prestations', 40, SER, '#cfc3b4', 400, 0, 1.1)
    av += t(36, 190, 388, 'Des solutions sur mesure pour tous vos besoins, avec une approche globale et personnalisée.', 26, SANS, '#998b7a', 400, 0, 1.45)
    av += t(36, 500, 388, '✕', 64, SANS, ROUGE, 700, 0, 1)
    ap = etiquette('APRÈS', VERT, '#fff') + t(36, 112, 388, 'Pour les particuliers et les copropriétés', 24, SANS, VERT, 800, 0, 1.3)
    for k, (ic, lb, d) in enumerate([('🌿', 'Création de jardin', 'plans, plantations, gazon'), ('✂️', 'Entretien régulier', 'tonte, taille, saisons'), ('🌳', 'Élagage', 'arbres et haies')]):
        ap += box(36, 200 + k * 102, 388, 88, 'background:#eef3ec;border-radius:16px;', t(18, 22, 50, ic, 36, SANS, '#000', 400, 0, 1) + t(80, 16, 300, lb, 25, SANS, '#1f2a24', 800, 0, 1.1) + t(80, 50, 300, d, 19, SANS, '#5b6760', 500, 0, 1.1))
    ap += t(36, 520, 388, '✓', 64, SANS, VERT, 800, 0, 1)
    s = avant_apres(2, 'La présentation de vos services.', 'Un visiteur comprend-il rapidement ce que vous proposez,<br>et à qui cela s’adresse&nbsp;?', av, ap, 'il faut deviner', 'quoi, et pour qui')
    return s + pied(4)
def p5():
    av = etiquette('AVANT', '#3a3029', '#b3a594') + t(36, 130, 388, 'Pour nous joindre…', 36, SER, '#cfc3b4', 400, 0, 1.1)
    av += ''.join(box(36, 200 + k * 34, 388 - (k % 3) * 60, 14, 'background:#3a3029;border-radius:7px;') for k in range(7))
    av += t(36, 460, 388, 'Mentions légales · <u>Contact</u> · Plan du site', 18, SANS, '#85776a', 400, 0, 1.3) + note(36, 420, 388, 'tout en bas, en tout petit ↓', 30, '#a3927f', -2)
    av += t(36, 510, 388, '✕', 64, SANS, ROUGE, 700, 0, 1)
    ap = etiquette('APRÈS', VERT, '#fff') + box(36, 110, 388, 70, f'background:{VERT};border-radius:35px;box-shadow:0 10px 24px rgba(47,107,69,.35);', t(0, 21, 388, 'Demander un devis', 26, SANS, '#fff', 800, 0, 1, 'center'))
    ap += box(36, 200, 388, 70, f'border:2.5px solid {VERT};border-radius:35px;', t(0, 20, 388, '✆ 06 00 00 00 00', 26, SANS, VERT, 800, 0, 1, 'center'))
    ap += t(36, 300, 388, 'Visible dès l’arrivée, en haut de page, à portée de pouce.', 26, SANS, '#46524b', 500, 0, 1.4)
    ap += t(36, 510, 388, '✓', 64, SANS, VERT, 800, 0, 1)
    s = avant_apres(3, 'Le moyen de vous contacter.', 'Est-il facile de trouver un bouton,<br>un formulaire ou vos coordonnées&nbsp;?', av, ap, 'introuvable', 'un geste, un appel')
    return s + pied(5)
def p6():
    s = img(film('claire', 'p_claire_flou', W, H, .6, .5, .7, flou=7), 0, 0, W, H, 'opacity:.55;') + fondu(0, 300, NUIT, True) + fondu(900, 450, NUIT)
    s += chapitre('CHAPITRE V · LE MÊME SOIR')
    s += note(60, 110, 500, '22 h 16.', 84, CREME, -4)
    s += telephone(531, 140, ecran_clair(), '22:16', True)
    s += t(60, 330, 450, 'Elle comprend.<br>Elle se reconnaît.<br>Elle appelle.', 54, SER, CREME, 400, -.01, 1.25, st=SH)
    s += note(60, 600, 440, 'Le même jardin, la même photo. Seuls les mots ont changé.', 42, AMBRE, -2)
    s += t(60, 1000, 960, 'Un beau site attire.', 60, SER, CREME, 400, -.01, 1.1, 'center', SH)
    s += t(60, 1080, 960, 'Un site compréhensible aide à convaincre.', 66, HAND, AMBRE, 700, 0, 1.1, 'center', SH)
    s += t(60, 1210, 960, 'Claire et Les Jardins de Léon sont fictifs · photos Adobe Stock', 18, SANS, 'rgba(242,235,224,.5)', 600, .1, al='center')
    return s + pied(6)
def p7():
    s = fond() + img(film('claire', 'p_claire_fond', W, H, .6, .5, .7, flou=3), 0, 0, W, H, 'opacity:.18;')
    s += t(60, 120, 960, 'Et votre page d’accueil,', 70, SER, CREME, 400, -.01, 1.05, 'center') + t(60, 205, 960, f'elle passe le test{NB}?', 104, HAND, AMBRE, 700, 0, 1, 'center')
    for k, lb in enumerate(['Un titre qui dit votre métier', 'Des services compris en un coup d’œil', 'Un contact visible tout de suite']):
        y = 380 + k * 96
        s += box(170, y, 52, 52, f'border:3px solid {AMBRE};border-radius:12px;') + t(240, y + 8, 700, lb, 34, SANS, CREME, 600, 0, 1.1)
    s += box(140, 720, 800, 110, f'background:{BOIS};border-radius:55px;box-shadow:0 18px 40px rgba(0,0,0,.4);', t(0, 22, 800, 'Un regard extérieur&nbsp;? Envoyez-moi<br>son adresse en message privé', 30, MO, NUIT, 800, 0, 1.15, 'center'))
    s += t(60, 900, 960, 'Tarik Belattar — E-DUST Solutions', 36, MO, CREME, 800, 0, 1.2, 'center')
    s += t(60, 952, 960, '06 13 24 96 80 · tarikbelatta@gmail.com · edust-solutions.fr', 26, SANS, 'rgba(242,235,224,.8)', 500, 0, 1.2, 'center')
    s += t(60, 1040, 960, 'Sites vitrines : image professionnelle, structure claire, parcours de contact cohérent.', 26, SER, 'rgba(242,235,224,.75)', 400, 0, 1.4, 'center', 'font-style:italic;')
    s += t(60, 1190, 960, 'Démonstration E-DUST · site et personnage fictifs · photos Adobe Stock.', 22, SANS, 'rgba(242,235,224,.55)', 500, 0, 1.4, 'center')
    return s + pied(7)

def page(title, sections):
    return (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide"><meta name="hz:canvas-width" content="{W}"><meta name="hz:canvas-height" content="{H}">'
            f'<title>{title}</title>{FONTS}<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>'
            + ''.join(f'<section class="slide" id="{n}" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden">{f()}</section>' for n, f in sections) + '</body></html>')
open(f'{D}/carrousel.html', 'w').write(page('E-DUST — 22 h 14, votre page d’accueil (démo)', [(f'p{k + 1:02d}', f) for k, f in enumerate([p1, p2, p3, p4, p5, p6, p7])]))
print('ok carrousel.html')
