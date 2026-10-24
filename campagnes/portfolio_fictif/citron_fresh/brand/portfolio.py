"""Portfolio réseaux sociaux CITRON FRESH (10 pages 4:5, 1080×1350) : logo, palette, typographies, packaging, posts, stories, Reel,
formats, contact. Prérequis : assets.py, decl.py + rendu (img/decl/), images du Reel v2 (../out/frames_v2).
Sorties : portfolio.html (images liées) et portfolio_express.html (images intégrées, import Adobe Express)."""
import os, base64, shutil
from decl import box, t, logo, pillbtn, bubbles, bg_citron, AN, MO, DS, KIT, CITRON, SOLEIL, LIME, FEUILLE, MENTHE, CREME
B = os.path.dirname(os.path.abspath(__file__)); W, H, N = 1080, 1350, 10; EMB = False
os.makedirs(f'{B}/img/reel', exist_ok=True)
for k, f in [(1, 0), (2, 205), (3, 280), (4, 340), (5, 440)]:
    src = f'{B}/../out/frames_v2/{f:04d}.jpg'
    if os.path.exists(src): shutil.copy(src, f'{B}/img/reel/r{k}.jpg')
def I(n):
    if not EMB: return f'img/{n}'
    from PIL import Image; import io  # version Express : images allégées (900 px max)
    im = Image.open(f'{B}/img/{n}'); im.thumbnail((900, 900)); buf = io.BytesIO()
    if n.endswith('png'): im.save(buf, 'PNG', optimize=True); mime = 'image/png'
    else: im.convert('RGB').save(buf, 'JPEG', quality=85); mime = 'image/jpeg'
    return f'data:{mime};base64,' + base64.b64encode(buf.getvalue()).decode()
def im(n, x, y, w, h=None, st=''): return f'<img src="{I(n)}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;{f"height:{h}px;object-fit:cover;" if h else ""}{st}">'
def card(n, x, y, w, h, r=22): return im(n, x, y, w, h, f'border-radius:{r}px;box-shadow:0 22px 50px rgba(31,94,20,.28);')
def head(k, kicker, title, dark=False):
    c1, c2 = (LIME, CREME) if dark else (FEUILLE, MENTHE)
    return t(70, 70, 900, f'{k:02d} · {kicker}', 24, DS, c1, 800, .22, 1) + t(70, 112, 940, title, 84, AN, c2, 400, .01, 1.0)
def foot(n, dark=False):
    c = 'rgba(255,248,225,.6)' if dark else 'rgba(31,94,20,.6)'
    return t(70, 1290, 760, 'CITRON FRESH · marque fictive (démo) · création E-DUST Solutions · Adobe Stock', 17, DS, c, 500) + t(850, 1290, 160, f'{n:02d} / {N:02d}', 17, DS, c, 700, 0, 1, 'right')
def slide(bg, inner): return f'<section class="slide" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden;background:{bg}">{inner}</section>'
PAL = [('Citron', CITRON, 'Fond principal', 40), ('Soleil', SOLEIL, 'Ombres, dégradés', 18), ('Lime', LIME, 'Accents, boutons', 14),
       ('Feuille', FEUILLE, 'Boutons, aplats', 10), ('Menthe', MENTHE, 'Textes, contours', 12), ('Crème', CREME, 'Titres, fonds clairs', 6)]

def build():
    S = []
    # 1 · couverture
    s = bg_citron(W, H, '50%', '60%') + bubbles(W, H, 30, 11)
    s += t(70, 80, 940, 'PORTFOLIO RÉSEAUX SOCIAUX', 26, DS, MENTHE, 800, .25, 1, 'center') + logo(280, 140, .95)
    s += im('can_hero.png', 330, 470, 420) + im('citron_0.png', 620, 1000, 380) + im('menthe_1.png', 70, 900, 260, st='transform:rotate(18deg);') + im('tranche_0.png', 820, 520, 200, st='transform:rotate(-14deg);')
    s += box(70, 1180, 940, 80, f'background:{MENTHE};border-radius:40px;', t(0, 22, 940, 'Identité · packaging · posts · stories · Reel · formats', 32, MO, CREME, 800, 0, 1, 'center', 'font-style:italic;'))
    S.append(slide(CITRON, s + foot(1)))
    # 2 · logo
    s = head(2, 'LE LOGO', 'UN LOGO, QUATRE USAGES')
    for k, (bg, inv, lab) in enumerate([(CITRON, False, 'Principal · sur Citron'), (MENTHE, 'sombre', 'Inversé · sur Menthe'), (CREME, True, 'Sur fond clair'), (FEUILLE, False, 'Sur Feuille')]):
        x, y = 70 + (k % 2) * 480, 260 + (k // 2) * 420
        s += box(x, y, 460, 380, f'background:{bg};border-radius:26px;' + ('border:2px solid rgba(31,94,20,.15);' if bg == CREME else ''), logo(25, 30, .78, inv))
        s += t(x, y + 330, 460, lab, 22, DS, MENTHE if bg in (CITRON, CREME) else CREME, 700, .04, 1, 'center')
    s += t(70, 1120, 940, 'Le logotype empile CITRON (Anton, crème, ombre menthe) et la pastille FRESH. Zone de protection : la hauteur de la pastille tout autour.', 28, DS, MENTHE, 500, 0, 1.45)
    S.append(slide(CREME, s + foot(2)))
    # 3 · palette
    s = head(3, 'LA PALETTE', '6 COULEURS. POINT.')
    for k, (nm, hx, role, pc) in enumerate(PAL):
        x, y = 70 + (k % 3) * 320, 270 + (k // 3) * 380
        s += box(x, y, 300, 220, f'background:{hx};border-radius:24px;' + ('border:2px solid rgba(31,94,20,.2);' if hx == CREME else ''))
        s += t(x, y + 238, 300, nm.upper(), 40, AN, MENTHE, 400, .03) + t(x, y + 286, 300, f'{hx} · {role}', 22, DS, MENTHE, 600, 0, 1.3)
    x = 70
    for nm, hx, _, pc in PAL:
        w = int(940 * pc / 100); s += box(x, 1040, w, 70, f'background:{hx};' + ('border:2px solid rgba(31,94,20,.2);' if hx == CREME else '')); x += w
    s += t(70, 1130, 940, 'Proportions conseillées : beaucoup de Citron, des accents Lime et Feuille, le texte en Menthe ou Crème.', 26, DS, MENTHE, 500, 0, 1.4)
    S.append(slide(CREME, s + foot(3)))
    # 4 · typographies
    s = head(4, 'TYPOGRAPHIES', 'TROIS POLICES ADOBE FONTS', True)
    for k, (fam, nm, role, sample, sz, st) in enumerate([(AN, 'Anton', 'Titres, logo, boutons', 'LA FRAÎCHEUR À L’ÉTAT PUR', 80, ''),
                                                        (MO, 'Montserrat Bold Italic', 'Accroches, sous-titres', 'Pétillant au citron et au citron vert', 50, 'font-weight:800;font-style:italic;'),
                                                        (DS, 'DM Sans', 'Textes, mentions', 'Boisson rafraîchissante · 330 ml · démo', 40, 'font-weight:500;')]):
        y = 280 + k * 320; s += box(70, y, 940, 290, f'background:rgba(255,248,225,.08);border-radius:24px;border:2px solid rgba(168,224,58,.35);')
        s += t(110, y + 30, 860, f'{nm.upper()} · {role}', 22, DS, LIME, 800, .12) + t(110, y + 90, 860, sample, sz, fam, CREME, 400, 0, 1.05, st=st)
    S.append(slide(MENTHE, s + foot(4, True)))
    # 5 · packaging
    s = bg_citron(W, H, '50%', '55%') + head(5, 'PACKAGING', 'LA CANETTE 33 CL')
    for x, n, lab in [(40, 'can_34.png', 'Trois-quarts'), (370, 'can_face.png', 'Face'), (700, 'can_dos.png', 'Dos')]:
        s += im(n, x + 10, 300, 320) + t(x, 990, 340, lab.upper(), 34, AN, MENTHE, 400, .05, 1, 'center')
    s += t(70, 1070, 940, 'Étiquette dans la charte : dégradé Citron → Soleil, vague Lime et Feuille, logo au centre. Condensation et reflets pour donner soif.', 28, DS, MENTHE, 600, 0, 1.4)
    S.append(slide(CITRON, s + foot(5)))
    # 6 · posts
    s = head(6, 'POSTS INSTAGRAM 4:5', 'TROIS POSTS, UNE MÊME VOIX')
    for k, (n, lab) in enumerate([('post_hero', 'Produit héros'), ('post_plongeon', 'Photo + accroche'), ('post_ingredients', 'Pédagogique')]):
        x = 70 + k * 320; s += card(f'decl/{n}.jpg', x, 300, 300, 375) + t(x, 700, 300, lab.upper(), 30, AN, MENTHE, 400, .04, 1, 'center')
    s += box(70, 800, 940, 330, f'background:{CITRON};border-radius:26px;',
             t(40, 40, 860, 'Le principe', 40, AN, MENTHE, 400, .03) + t(40, 100, 860, '1 visuel = 1 idée. Le produit est toujours visible, le texte tient en une ligne, et les couleurs restent dans la charte : on reconnaît la marque avant même de lire son nom.', 30, DS, MENTHE, 500, 0, 1.45))
    S.append(slide(CREME, s + foot(6)))
    # 7 · stories
    s = head(7, 'STORIES 9:16', 'SON, SONDAGE, ACTION', True)
    for k, (n, lab) in enumerate([('story_pshht', 'Accroche sonore'), ('story_sondage', 'Sondage'), ('story_cta', 'Appel à l’action')]):
        x = 70 + k * 320; s += card(f'decl/{n}.jpg', x, 280, 300, 533) + t(x, 840, 300, lab.upper(), 30, AN, LIME, 400, .04, 1, 'center')
    s += t(70, 930, 940, 'Les stories font participer : un son qu’on entend, une question à laquelle on répond, un bouton qui mène au produit.', 30, DS, CREME, 500, 0, 1.45)
    S.append(slide(MENTHE, s + foot(7, True)))
    # 8 · Reel
    s = head(8, 'REEL 15 S · 9:16', 'LA PUB EN MOUVEMENT')
    for k in range(5):
        x = 70 + k * 190; s += card(f'reel/r{k + 1}.jpg', x, 280, 175, 311, 16)
    s += box(70, 640, 940, 470, f'background:{MENTHE};border-radius:26px;',
             t(40, 36, 860, '5 TEMPS, 15 SECONDES', 44, AN, LIME, 400, .03)
             + t(40, 105, 860, 'Le citron plonge · la canette apparaît · PSHHHT ! à l’ouverture · le slogan · la canette héroïque et « Goûte la fraîcheur ! ».<br><br>Sous-titres animés pour la lecture sans le son, transitions calées sur la musique, ralentis Adobe Stock et canette en 3D.', 30, DS, CREME, 500, 0, 1.45))
    S.append(slide(CREME, s + foot(8)))
    # 9 · formats
    s = bg_citron(W, H, '50%', '40%') + head(9, 'FORMATS', 'PARTOUT, LA MÊME MARQUE')
    s += card('decl/banniere.jpg', 70, 270, 940, 529, 20) + t(70, 815, 940, 'BANNIÈRE 16:9 · LinkedIn, YouTube, site', 26, DS, MENTHE, 800, .04)
    s += card('decl/carre_nouveau.jpg', 70, 880, 360, 360, 20) + t(450, 900, 260, 'CARRÉ 1:1', 30, AN, MENTHE, 400, .04) + t(450, 945, 260, 'Annonce « Nouveau », publicité, Facebook', 24, DS, MENTHE, 500, 0, 1.35)
    s += im('decl/avatar.png', 740, 900, 280, 280, 'border-radius:50%;object-fit:cover;box-shadow:0 18px 40px rgba(31,94,20,.3);') + t(720, 1195, 320, 'PHOTO DE PROFIL', 26, AN, MENTHE, 400, .04, 1, 'center')
    S.append(slide(CITRON, s + foot(9)))
    # 10 · contact
    s = box(0, 0, W, H, f'background:radial-gradient(circle at 50% 30%,#2b7a1f 0%,{MENTHE} 65%);') + bubbles(W, H, 24, 5, 'rgba(168,224,58,.35)')
    s += t(70, 150, 940, 'ET SI LA PROCHAINE, C’ÉTAIT VOTRE MARQUE ?', 28, DS, LIME, 800, .18, 1.3, 'center')
    s += t(70, 260, 940, 'UNE MARQUE.<br>UNE CHARTE.<br>TOUS LES FORMATS.', 110, AN, CREME, 400, .01, .98, 'center')
    s += t(120, 690, 840, 'Logo, couleurs, packaging, posts, stories et Reels : je construis une communication digitale cohérente, prête à publier.', 32, DS, CREME, 500, 0, 1.45, 'center')
    s += pillbtn(240, 900, 600, 'ÉCRIVEZ « AVIS » EN COMMENTAIRE', 36, LIME, MENTHE)
    s += t(70, 1060, 940, 'Tarik Belattar — E-DUST Solutions', 36, AN, CREME, 400, .03, 1, 'center') + t(70, 1110, 940, '06 13 24 96 80 · tarikbelatta@gmail.com · edust-solutions.fr', 26, DS, LIME, 600, 0, 1, 'center')
    S.append(slide(MENTHE, s + foot(10, True)))
    hd = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide"><meta name="hz:canvas-width" content="{W}"><meta name="hz:canvas-height" content="{H}">'
          f'<title>CITRON FRESH — Portfolio réseaux sociaux</title>{KIT}<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>')
    return hd + ''.join(S) + '</body></html>'
for e in (False, True):
    EMB = e; open(f'{B}/portfolio{"_express" if e else ""}.html', 'w').write(build())
print('ok', os.path.getsize(f'{B}/portfolio_express.html'))
