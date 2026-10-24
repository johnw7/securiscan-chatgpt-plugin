"""Avant / après de communication — BASTIEN, plombier chauffagiste (marque et personnage fictifs, démo).
1) supports.html : les supports AVANT (flyer « fait maison ») et APRÈS (flyer, post 4:5, story 9:16, carte de visite recto/verso)
2) carrousel.html : carrousel 4:5 (1080×1350) de 10 pages qui raconte la transformation (utilise les rendus PNG des supports dans img/).
Photos Adobe Stock (licence gratuite) dans raw/ ; plombier détouré avec Adobe Photoshop (raw/plombier_cut.png).
Usage : python3 build.py ; rendu supports : node render.cjs supports.html img ; python3 build.py ; rendu carrousel : node render.cjs carrousel.html <sortie>"""
import os, base64
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/img', exist_ok=True)
FONTS = ('<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Lobster&family=Caveat:wght@700&display=swap">')
SANS, MO, AN, SER, UB = "'dm-sans',sans-serif", "'montserrat',sans-serif", "'anton',sans-serif", "'dm-serif-display',serif", "'unbounded',sans-serif"
COMIC, LOB, HAND = "'Comic Neue',cursive", "'Lobster',cursive", "'Caveat',cursive"
# charte APRÈS
NAVY, BLEU, AQUA, ORANGE, BLANC, ENCRE = '#0e2a47', '#2f7df6', '#8fd3ff', '#ff7a3d', '#f5f7fa', '#0b1a2c'
TEL = '06 00 00 00 00'  # numéro factice (démo)

def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam=SANS, col='#fff', wt=400, ls=0, lh=1.05, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def img(src, x, y, w, h, st=''): return f'<img src="{src}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">'
def crop(src, out, w, h, fx=.5, fy=.5):
    if not os.path.exists(f'{D}/img/{out}'):
        i = Image.open(f'{D}/raw/{src}').convert('RGB'); r = w / h
        cw, ch = (i.height * r, i.height) if i.width / i.height > r else (i.width, i.width / r)
        x = min(max(fx * i.width - cw / 2, 0), i.width - cw); y = min(max(fy * i.height - ch / 2, 0), i.height - ch)
        i.crop((int(x), int(y), int(x + cw), int(y + ch))).resize((w, h), Image.LANCZOS).save(f'{D}/img/{out}', quality=88)
    return f'img/{out}'
def plombier():
    """Détourage recadré sur le personnage entier (tête et pieds compris, avec marge)."""
    if not os.path.exists(f'{D}/img/plombier.png'):
        c = Image.open(f'{D}/raw/plombier_cut.png').convert('RGBA'); x0, y0, x1, y1 = c.split()[3].getbbox()
        c.crop((x0 - 20, y0 - 20, x1 + 20, y1 + 20)).save(f'{D}/img/plombier.png', optimize=True)
    w, h = Image.open(f'{D}/img/plombier.png').size
    return 'img/plombier.png', w / h

# ---------- logo APRÈS : goutte + monogramme + nom
def goutte(x, y, s, fond=BLEU, lettre='#fff'):
    return box(x, y, s, s, f'background:linear-gradient(135deg,{AQUA},{fond});border-radius:50% 0 50% 50%;transform:rotate(-45deg);',
               t(0, int(s * .16), s, 'B', int(s * .62), MO, lettre, 800, 0, 1, 'center', 'transform:rotate(45deg);'))
def logo(x, y, s=1.0, col='#fff', sous=AQUA):
    return goutte(x, y + int(6 * s), int(96 * s)) + t(x + int(122 * s), y, 600, 'Bastien', int(74 * s), MO, col, 800, -.02, 1) + t(x + int(126 * s), y + int(80 * s), 600, 'PLOMBERIE · CHAUFFAGE', int(18 * s), SANS, sous, 700, .3, 1)
DEMO = 'Démo · marque et personnage fictifs · numéro factice · photos Adobe Stock · création E-DUST Solutions'

# ================= SUPPORTS =================
FW, FH = 1240, 1754  # flyer A5
def flyer_avant():
    s = box(0, 0, FW, FH, 'background:linear-gradient(180deg,#fff200,#ffb000);')
    s += t(40, 40, FW - 80, 'PLOMBERIE BASTIEN !!!', 132, LOB, '#e60000', 400, 0, 1.05, 'center', '-webkit-text-stroke:4px #1d3cff;text-shadow:6px 6px 0 #00c853,12px 12px 0 #7c4dff;')
    s += t(60, 330, FW - 120, 'Plomberie - Chauffage - Sanitaire - Dépannage - Débouchage - Installation - Rénovation - Salle de bain - Cuisine - Chauffe-eau - Fuite - WC - Robinetterie', 40, COMIC, '#1d3cff', 700, 0, 1.25, 'center')
    s += img(crop('evier.jpg', 'evier_avant.jpg', 1100, 640), 70, 530, 1100, 380, 'object-fit:fill;border:8px dashed #e60000;')
    s += box(830, 470, 340, 340, 'background:#e60000;clip-path:polygon(50% 0,61% 32%,95% 20%,72% 47%,100% 62%,66% 68%,72% 100%,50% 78%,28% 100%,34% 68%,0 62%,28% 47%,5% 20%,39% 32%);transform:rotate(14deg);',
             t(30, 120, 280, 'PRIX<br>IMBATTABLE !!', 44, COMIC, '#fff200', 700, 0, 1.0, 'center'))
    items = [('✔ DEVIS GRATUIT', '#e60000'), ('✔ Travail soigné et de qualité', '#1d3cff'), ('✔ Toutes marques', '#00a152'), ('✔ Particuliers et professionnels', '#7c4dff'),
             ('✔ Rapide et efficace', '#e60000'), ('✔ Prix sympa !!!', '#1d3cff'), ('✔ 7j/7 24h/24 (sauf dimanche)', '#00a152'), ('✔ Plus de 1000 clients satisfaits ???', '#7c4dff')]
    for k, (it, c) in enumerate(items):
        s += t(90 + (k % 2) * 560, 960 + (k // 2) * 88, 540, it, 38, COMIC, c, 700, 0, 1.15)
    for k, (e, x, y, r) in enumerate([('🔧', 60, 1330, -20), ('🚿', 1050, 1320, 15), ('💧', 520, 1340, 0), ('🔥', 300, 1360, 10), ('🛁', 830, 1360, -12)]):
        s += t(x, y, 160, e, 110, SANS, '#000', 400, 0, 1, 'left', f'transform:rotate({r}deg);')
    s += t(60, 1500, FW - 120, 'N’hésitez pas à nous contacter pour tous vos travaux de plomberie et autres !!!', 40, COMIC, '#7c4dff', 700, 0, 1.2, 'center')
    s += t(60, 1620, FW - 120, f'Tél : {TEL}', 30, 'Times New Roman,serif', '#333', 400, 0, 1, 'center')
    return s + t(40, 1712, FW - 80, 'Exemple fictif reconstitué pour la démo — E-DUST Solutions', 18, SANS, 'rgba(0,0,0,.45)', 400, 0, 1, 'center')
def flyer_apres():
    pl, r = plombier()
    s = box(0, 0, FW, FH, f'background:{NAVY};')
    s += box(0, 0, FW, 1120, 'background-image:linear-gradient(rgba(143,211,255,.07) 2px,transparent 2px),linear-gradient(90deg,rgba(143,211,255,.07) 2px,transparent 2px);background-size:62px 62px;')
    s += box(560, 160, 760, 760, 'background:radial-gradient(circle,rgba(47,125,246,.55),rgba(47,125,246,0) 68%);')
    s += logo(70, 70)
    s += t(70, 330, 780, 'Une fuite&nbsp;?', 132, MO, '#fff', 800, -.03, 1, st='white-space:nowrap;')
    s += t(70, 480, 640, 'J’arrive.', 132, MO, AQUA, 800, -.03, 1)
    s += t(74, 660, 520, 'Dépannage, salle de bain, chauffage :<br>un seul numéro, un artisan qui explique avant de réparer.', 34, SANS, 'rgba(255,255,255,.85)', 500, 0, 1.35)
    ph = 1060; pw = int(ph * r)
    s += img(pl, 1240 - pw - 30, 70, pw, ph, 'filter:drop-shadow(0 30px 40px rgba(0,0,0,.45));')
    s += box(0, 1120, FW, FH - 1120, f'background:{BLANC};')
    for k, (tit, txt) in enumerate([('Dépannage', 'Fuites, débouchage,<br>robinetterie'), ('Salle de bain', 'Rénovation<br>de A à Z'), ('Chauffage', 'Chaudière,<br>chauffe-eau')]):
        x = 70 + k * 380
        s += box(x, 1180, 76, 76, f'background:{BLEU};border-radius:38px;', t(0, 18, 76, str(k + 1), 36, MO, '#fff', 800, 0, 1, 'center'))
        s += t(x, 1280, 340, tit, 40, MO, NAVY, 800, -.01, 1.1) + t(x, 1336, 340, txt, 28, SANS, '#46607d', 500, 0, 1.3)
    s += box(70, 1470, FW - 140, 140, f'background:{ORANGE};border-radius:70px;box-shadow:0 18px 40px rgba(255,122,61,.35);',
             t(0, 22, FW - 140, TEL, 76, MO, '#fff', 800, .02, 1.2, 'center'))
    s += t(70, 1636, FW - 140, 'Devis gratuit · Yvelines et alentours', 30, SANS, NAVY, 700, .04, 1, 'center')
    return s + t(40, 1712, FW - 80, DEMO, 18, SANS, 'rgba(14,42,71,.5)', 400, 0, 1, 'center')
def post_apres():
    s = box(0, 0, 1080, 1350, f'background:{NAVY};')
    s += img(crop('evier.jpg', 'evier_post.jpg', 1080, 720), 0, 0, 1080, 720)
    s += box(0, 560, 1080, 162, f'background:linear-gradient(180deg,rgba(14,42,71,0),{NAVY});')
    s += t(70, 760, 940, 'Votre évier fait<br>de la résistance&nbsp;?', 84, MO, '#fff', 800, -.02, 1.05)
    s += t(70, 960, 940, 'On trouve la fuite, on vous explique, on répare.', 34, SANS, AQUA, 500, 0, 1.3)
    s += box(70, 1060, 460, 100, f'background:{ORANGE};border-radius:50px;', t(0, 28, 460, 'Appeler Bastien', 38, MO, '#fff', 800, 0, 1.1, 'center'))
    s += logo(600, 1060, .62)
    return s + t(40, 1300, 1000, DEMO, 16, SANS, 'rgba(255,255,255,.45)', 400, 0, 1, 'center')
def story_apres():
    s = img(crop('salle_de_bain.jpg', 'sdb_story.jpg', 1080, 1920, .5, .5), 0, 0, 1080, 1920)
    s += box(0, 0, 1080, 700, f'background:linear-gradient(180deg,rgba(14,42,71,.92),rgba(14,42,71,0));') + box(0, 1180, 1080, 740, f'background:linear-gradient(180deg,rgba(14,42,71,0),rgba(14,42,71,.95));')
    s += logo(70, 260, .7)
    s += t(70, 1270, 940, 'Votre future salle de bain', 70, MO, '#fff', 800, -.02, 1.05) + t(70, 1350, 940, 'commence par un appel.', 70, MO, AQUA, 800, -.02, 1.05)
    s += f'<p style="position:absolute;left:0;right:0;top:1500px;margin:0 auto;width:max-content;padding:24px 44px;border-radius:18px;background:#fff;font-family:{SANS};font-size:36px;font-weight:700;color:{BLEU};box-shadow:0 14px 40px rgba(0,0,0,.3);">🔗 DEMANDER UN DEVIS</p>'
    return s + t(40, 1866, 1000, DEMO, 16, SANS, 'rgba(255,255,255,.5)', 400, 0, 1, 'center')
CW, CH = 1050, 600
def carte_recto():
    s = box(0, 0, CW, CH, f'background:{NAVY};') + box(560, -200, 700, 700, 'background:radial-gradient(circle,rgba(47,125,246,.5),rgba(47,125,246,0) 68%);')
    return s + logo(230, 220, 1.0)
def carte_verso():
    s = box(0, 0, CW, CH, f'background:{BLANC};') + box(0, 0, 18, CH, f'background:{BLEU};')
    s += goutte(860, 70, 110) + t(80, 90, 700, 'Bastien', 70, MO, NAVY, 800, -.02, 1) + t(82, 180, 700, 'Plombier chauffagiste', 32, SANS, BLEU, 700, .02, 1)
    s += t(82, 300, 800, TEL, 44, MO, NAVY, 800, .02, 1) + t(82, 370, 800, 'bastien@exemple-plomberie.fr', 30, SANS, '#46607d', 500, 0, 1)
    s += t(82, 420, 800, 'Yvelines et alentours · devis gratuit', 30, SANS, '#46607d', 500, 0, 1)
    return s + t(40, 556, CW - 80, 'Démo · marque fictive · coordonnées factices', 16, SANS, 'rgba(14,42,71,.45)', 400, 0, 1, 'center')
SUPPORTS = [('flyer_avant', FW, FH, flyer_avant), ('flyer_apres', FW, FH, flyer_apres), ('post_apres', 1080, 1350, post_apres),
            ('story_apres', 1080, 1920, story_apres), ('carte_recto', CW, CH, carte_recto), ('carte_verso', CW, CH, carte_verso)]

# ================= CARROUSEL 4:5 =================
W, H = 1080, 1350; FOND, RO = '#101216', '#ff4d4d'
def R(n): return f'img/{n}.png'
def pill(x, y, s, bg, col='#fff'): return f'<p style="position:absolute;left:{x}px;top:{y}px;margin:0;padding:12px 30px;border-radius:30px;background:{bg};font-family:{SANS};font-size:26px;font-weight:800;color:{col};letter-spacing:.24em;">{s}</p>'
def pied(n): return t(60, 1290, 700, 'E-DUST SOLUTIONS · avant / après (démo)', 18, SANS, 'rgba(255,255,255,.45)', 700, .2) + t(780, 1290, 240, f'{n}/10', 18, SANS, 'rgba(255,255,255,.45)', 700, .2, al='right')
def ombre(): return 'box-shadow:0 40px 80px rgba(0,0,0,.55);border-radius:10px;'
def c1():
    s = box(0, 0, W, H, f'background:{FOND};') + box(380, 380, 900, 900, 'background:radial-gradient(circle,rgba(47,125,246,.35),rgba(47,125,246,0) 68%);')
    s += t(60, 90, 960, 'Même plombier.', 112, MO, '#fff', 800, -.03, 1, 'center') + t(60, 210, 960, 'Nouvelle image.', 112, SER, AQUA, 400, -.01, 1, 'center', 'font-style:italic;')
    s += t(60, 350, 960, 'L’avant / après d’une communication d’artisan', 32, SANS, 'rgba(255,255,255,.75)', 500, 0, 1.3, 'center')
    s += img(R('flyer_avant'), 90, 480, 430, 608, f'transform:rotate(-8deg);{ombre()}filter:saturate(.85);') + pill(120, 450, 'AVANT', RO)
    s += img(R('flyer_apres'), 540, 470, 460, 651, f'transform:rotate(5deg);{ombre()}') + pill(800, 440, 'APRÈS', AQUA, NAVY)
    return s + t(60, 1200, 960, 'Marque fictive · démo', 22, SANS, 'rgba(255,255,255,.55)', 500, .1, 1, 'center') + pied(1)
def c2():
    pl, r = plombier()
    s = box(0, 0, W, H, f'background:{FOND};')
    ph = 1060; pw = int(ph * r)
    s += img(pl, W - pw - 40, 140, pw, ph, 'filter:grayscale(1) brightness(.85);opacity:.9;')
    s += t(70, 220, 600, 'Voici Bastien.', 64, HAND, AQUA, 700, 0, 1)
    s += t(70, 310, 620, 'Un très bon plombier.<br>Ponctuel, soigneux,<br>il explique avant<br>de réparer.', 56, SER, '#fff', 400, -.01, 1.15)
    s += t(70, 700, 600, 'Mais sur son flyer,', 56, SER, '#fff', 400, -.01, 1.15) + t(70, 770, 600, 'personne ne le voyait.', 56, SER, RO, 400, -.01, 1.15, st='font-style:italic;')
    return s + t(70, 1180, 600, 'Mini-histoire · personnage fictif', 22, SANS, 'rgba(255,255,255,.5)', 500, .06) + pied(2)
def c3():
    s = box(0, 0, W, H, f'background:#2a2d33;') + pill(70, 70, 'AVANT', RO)
    s += img(R('flyer_avant'), 200, 160, 680, 962, f'transform:rotate(-2deg);{ombre()}')
    return s + t(60, 1160, 960, 'Le flyer qu’on a tous reçu<br>dans sa boîte aux lettres…', 40, SER, '#fff', 400, 0, 1.2, 'center', 'font-style:italic;') + pied(3)
def puce(x, y, n): return box(x, y, 64, 64, f'background:{RO};border-radius:32px;border:4px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,.4);', t(0, 10, 56, str(n), 34, MO, '#fff', 800, 0, 1.1, 'center'))
def c4():
    s = box(0, 0, W, H, f'background:{FOND};') + pill(70, 70, 'LE DIAGNOSTIC', RO)
    fx, fy, fw = 70, 170, 440; k = fw / FW
    s += img(R('flyer_avant'), fx, fy, fw, int(FH * k), ombre())
    for n, (px, py) in enumerate([(600, 90), (250, 280), (400, 640), (600, 1640)], 1):
        s += puce(fx + int(px * k) - 32, fy + int(py * k) - 32, n)
    pts = [('Trop de messages', '13 services, 8 promesses : on ne retient rien.'), ('Aucune hiérarchie', 'Tout crie en même temps. L’œil ne sait pas où aller.'),
           ('Image d’amateur', 'Photo déformée, cliparts, étoile « prix imbattable ».'), ('Numéro introuvable', 'L’info la plus importante est la plus petite.')]
    for n, (a, b) in enumerate(pts):
        y = 190 + n * 250
        s += puce(560, y, n + 1) + t(650, y + 2, 410, a, 36, MO, '#fff', 800, -.01, 1.1) + t(650, y + 56, 380, b, 28, SANS, 'rgba(255,255,255,.75)', 500, 0, 1.3)
    return s + t(560, 1190, 460, '5 polices · 7 couleurs · 0 identité', 26, SANS, RO, 700, .02) + pied(4)
def c5():
    s = box(0, 0, W, H, f'background:{NAVY};') + pill(70, 70, 'APRÈS · L’IDENTITÉ', AQUA, NAVY)
    s += box(140, 180, 800, 400, 'background:rgba(255,255,255,.04);border-radius:30px;') + logo(250, 330, 1.25)
    for k, (c, n) in enumerate([(NAVY, 'Nuit'), (BLEU, 'Eau'), (AQUA, 'Ciel'), (ORANGE, 'Urgence'), (BLANC, 'Clair')]):
        x = 70 + k * 192
        s += box(x, 660, 172, 172, f'background:{c};border-radius:24px;border:2px solid rgba(255,255,255,.25);') + t(x, 850, 172, n, 26, MO, '#fff', 800, 0, 1, 'center') + t(x, 886, 172, c.upper(), 20, SANS, 'rgba(255,255,255,.65)', 500, .05, 1, 'center')
    s += t(70, 980, 940, 'Montserrat pour la force · DM Sans pour la clarté', 32, SANS, 'rgba(255,255,255,.85)', 500, 0, 1.3, 'center')
    s += t(70, 1060, 940, 'Une goutte, une lettre : on reconnaît Bastien en une seconde, même de loin.', 32, SER, AQUA, 400, 0, 1.3, 'center', 'font-style:italic;')
    return s + pied(5)
def c6():
    s = box(0, 0, W, H, f'background:#e9eef4;') + pill(70, 70, 'APRÈS · LE FLYER', NAVY)
    s += img(R('flyer_apres'), 200, 160, 680, 962, f'transform:rotate(2deg);{ombre()}')
    return s + t(60, 1160, 960, 'Un message. Un visage.<br>Un numéro qu’on voit de loin.', 40, SER, NAVY, 400, 0, 1.2, 'center', 'font-style:italic;') + pied(6).replace('rgba(255,255,255,.45)', 'rgba(14,42,71,.5)')
def tel(x, y, w, h, src, ih):
    """Cadre de téléphone autour d'un support (sans rogner l'image : elle est posée en entier)."""
    return box(x, y, w, h, 'background:#0b0d10;border-radius:46px;box-shadow:0 30px 70px rgba(0,0,0,.5);',
               img(src, 14, (h - ih) // 2, w - 28, ih, 'border-radius:30px;'))
def c7():
    s = box(0, 0, W, H, f'background:{FOND};') + pill(70, 70, 'APRÈS · LES RÉSEAUX', AQUA, NAVY)
    s += tel(80, 200, 440, 770, R('post_apres'), int((440 - 28) * 1350 / 1080))
    s += tel(570, 170, 440, 810, R('story_apres'), int((440 - 28) * 1920 / 1080))
    s += t(80, 990, 440, 'Post 4:5', 30, MO, '#fff', 800, 0, 1, 'center') + t(570, 1000, 440, 'Story 9:16', 30, MO, '#fff', 800, 0, 1, 'center')
    return s + t(60, 1090, 960, 'La même voix partout : on reconnaît Bastien<br>avant même de lire son nom.', 38, SER, '#fff', 400, 0, 1.25, 'center', 'font-style:italic;') + pied(7)
def c8():
    s = box(0, 0, W, H, f'background:#e9eef4;') + pill(70, 70, 'APRÈS · LA CARTE DE VISITE', NAVY)
    s += img(R('carte_recto'), 110, 210, 735, 420, f'transform:rotate(-5deg);{ombre()}')
    s += img(R('carte_verso'), 240, 600, 735, 420, f'transform:rotate(4deg);{ombre()}')
    return s + t(60, 1130, 960, 'Le petit objet qu’on garde dans le portefeuille…<br>et qu’on retrouve le jour de la fuite.', 38, SER, NAVY, 400, 0, 1.25, 'center', 'font-style:italic;') + pied(8).replace('rgba(255,255,255,.45)', 'rgba(14,42,71,.5)')
def c9():
    s = box(0, 0, W, H, f'background:{FOND};')
    fw, fh = 480, int(480 * FH / FW)
    s += img(R('flyer_avant'), 40, 230, fw, fh, ombre()) + img(R('flyer_apres'), 560, 230, fw, fh, ombre())
    s += pill(60, 140, 'AVANT', RO) + pill(820, 140, 'APRÈS', AQUA, NAVY)
    s += box(536, 200, 8, fh + 60, 'background:#fff;border-radius:4px;') + box(500, 200 + (fh + 60) // 2 - 40, 80, 80, 'background:#fff;border-radius:40px;', t(0, 18, 80, '◀▶', 30, SANS, NAVY, 800, 0, 1, 'center'))
    return s + t(60, 1170, 960, 'Même artisan. Même métier. Une autre image.', 36, SER, '#fff', 400, 0, 1.2, 'center', 'font-style:italic;') + pied(9)
def c10():
    s = box(0, 0, W, H, f'background:{NAVY};') + box(-200, 300, 1480, 900, 'background:radial-gradient(ellipse,rgba(47,125,246,.35),rgba(47,125,246,0) 70%);')
    s += t(60, 220, 960, 'Votre communication', 84, MO, '#fff', 800, -.02, 1.05, 'center') + t(60, 320, 960, 'mérite aussi son « après ».', 84, SER, AQUA, 400, -.01, 1.05, 'center', 'font-style:italic;')
    s += t(110, 520, 860, 'Envoyez-moi votre flyer, votre carte ou votre page Instagram. Je vous montre gratuitement ce que je changerais en priorité.', 36, SANS, 'rgba(255,255,255,.85)', 500, 0, 1.4, 'center')
    s += box(240, 760, 600, 110, f'background:{ORANGE};border-radius:55px;', t(0, 32, 600, 'Écrivez AVIS en commentaire', 38, MO, '#fff', 800, 0, 1.1, 'center'))
    s += t(60, 960, 960, 'Tarik Belattar — E-DUST Solutions', 36, MO, '#fff', 800, 0, 1.2, 'center')
    s += t(60, 1015, 960, '06 13 24 96 80 · tarikbelatta@gmail.com · edust-solutions.fr', 28, SANS, 'rgba(255,255,255,.8)', 500, 0, 1.2, 'center')
    return s + t(60, 1200, 960, 'Bastien est un personnage fictif : marque, numéro et coordonnées sont des exemples (démo).', 22, SANS, 'rgba(255,255,255,.55)', 500, 0, 1.3, 'center') + pied(10)
CARROUSEL = [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10]

def page(title, sections, w=None, h=None):
    meta = f'<meta name="hz:slide-selector" content=".slide"><meta name="hz:canvas-width" content="{w}"><meta name="hz:canvas-height" content="{h}">' if w else ''
    return (f'<!doctype html><html lang="fr"><head><meta charset="utf-8">{meta}<title>{title}</title>{FONTS}'
            '<style>html,body{margin:0;background:#222}.slide{margin:0 auto 40px}</style></head><body>' + ''.join(sections) + '</body></html>')
sec = lambda n, w, h, inner: f'<section class="slide" id="{n}" data-canvas-width="{w}" data-canvas-height="{h}" style="position:relative;width:{w}px;height:{h}px;overflow:hidden">{inner}</section>'
open(f'{D}/supports.html', 'w').write(page('Bastien — supports avant / après (démo)', [sec(n, w, h, f()) for n, w, h, f in SUPPORTS]))
if all(os.path.exists(f'{D}/img/{n}.png') for n, *_ in SUPPORTS):
    open(f'{D}/carrousel.html', 'w').write(page('Bastien — carrousel avant / après (démo)', [sec(f'c{k + 1:02d}', W, H, f()) for k, f in enumerate(CARROUSEL)], W, H))
    print('ok supports.html + carrousel.html')
else:
    print('ok supports.html (rendre les supports dans img/ puis relancer pour le carrousel)')
