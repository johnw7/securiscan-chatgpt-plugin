"""Portfolio « OUI. » — étude de cas CITRON FRESH, 9 pages 4:5 pensées pour convaincre (défi → idée → preuves → appel).
Décors étendus avec Adobe Firefly (Generative Expand) : img/ff/ff_billboard.jpg, ff_noir_carre.jpg, ff_vortex_carre.jpg.
Sorties : oui.html et oui_express.html (images intégrées, Adobe Express)."""
import os, base64, io
from PIL import Image
from decl import box, t, logo, pillbtn, bubbles, bg_citron, AN, MO, DS, KIT, CITRON, SOLEIL, LIME, FEUILLE, MENTHE, CREME
B = os.path.dirname(os.path.abspath(__file__)); W, H, N = 1080, 1350, 9; EMB = False
def I(n):
    if not EMB: return f'img/{n}'
    im = Image.open(f'{B}/img/{n}'); im.thumbnail((1100, 1100)); buf = io.BytesIO()
    if n.endswith('png'): im.save(buf, 'PNG', optimize=True); m = 'png'
    else: im.convert('RGB').save(buf, 'JPEG', quality=85); m = 'jpeg'
    return f'data:image/{m};base64,' + base64.b64encode(buf.getvalue()).decode()
def im(n, x, y, w, h=None, st=''): return f'<img src="{I(n)}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;{f"height:{h}px;object-fit:cover;" if h else ""}{st}">'
def card(n, x, y, w, h, rot=0, r=18): return im(n, x, y, w, h, f'border-radius:{r}px;transform:rotate({rot}deg);box-shadow:0 26px 60px rgba(31,94,20,.35);border:8px solid {CREME};')
def kick(s, col=MENTHE, y=70): return t(70, y, 940, s, 24, DS, col, 800, .24, 1)
def foot(n, dark=False):
    c = 'rgba(255,248,225,.6)' if dark else 'rgba(31,94,20,.6)'
    return t(70, 1292, 760, 'CITRON FRESH · marque fictive (démo) · E-DUST Solutions · Adobe Stock & Firefly', 17, DS, c, 500) + t(850, 1292, 160, f'{n:02d} / {N:02d}', 17, DS, c, 700, 0, 1, 'right')
def slide(bg, inner): return f'<section class="slide" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden;background:{bg}">{inner}</section>'
def lemon_swatch(x, y, d, col, light):
    """Pastille couleur dessinée comme une tranche de citron (zeste, peau, quartiers)."""
    s = box(x, y, d, d, f'border-radius:50%;background:{col};box-shadow:0 18px 40px rgba(31,94,20,.25);')
    s += box(x + d * .06, y + d * .06, d * .88, d * .88, f'border-radius:50%;background:{light};')
    s += box(x + d * .1, y + d * .1, d * .8, d * .8, f'border-radius:50%;background:repeating-conic-gradient({col} 0deg 32deg,{light} 32deg 36deg);')
    return s + box(x + d * .44, y + d * .44, d * .12, d * .12, f'border-radius:50%;background:{light};')

def build():
    S = []
    # 0 · couverture (décor Firefly : tourbillon de citrons étendu)
    s = im('ff/ff_vortex_carre.jpg', -135, -60, 1350, 1350) + box(0, 0, W, H, 'background:radial-gradient(circle at 50% 42%,rgba(255,240,150,.75) 0%,rgba(255,210,26,.35) 38%,rgba(255,210,26,0) 65%);')
    s += box(70, 60, 940, 64, f'background:{MENTHE};border-radius:32px;', t(0, 17, 940, 'ÉTUDE DE CAS · PORTFOLIO', 28, DS, LIME, 800, .28, 1, 'center'))
    s += im('menthe_1.png', -30, 820, 300, st='transform:rotate(-24deg);filter:blur(3px);') + im('tranche_0.png', 860, 150, 260, st='transform:rotate(18deg);filter:blur(2px);')
    s += im('can_hero.png', 330, 170, 420, st='transform:rotate(-6deg);filter:drop-shadow(0 40px 34px rgba(31,94,20,.5));')
    s += im('citron_0.png', 700, 760, 330) + im('menthe_2.png', 120, 230, 170, st='transform:rotate(-30deg);')
    s += box(0, 1010, W, 340, f'background:{MENTHE};')
    s += t(0, 1040, W, 'CITRON FRESH', 120, AN, CREME, 400, .02, 1, 'center', f'text-shadow:0 6px 0 {FEUILLE};')
    s += t(0, 1178, W, 'Identité · packaging · réseaux sociaux · Reel', 34, MO, LIME, 800, 0, 1, 'center', 'font-style:italic;')
    s += t(0, 1240, W, 'Tarik Belattar — E-DUST Solutions · marque fictive (démo) · Adobe Stock & Firefly', 20, DS, 'rgba(255,248,225,.75)', 600, .02, 1, 'center')
    S.append(slide(CITRON, s))
    # 1 · OUI.
    s = bg_citron(W, H, '50%', '50%') + bubbles(W, H, 34, 21)
    s += kick('ÉTUDE DE CAS · CAMPAGNE CITRON FRESH', MENTHE, 80)
    # « OUI. » : la canette remplace le I
    s += t(60, 250, 640, 'OU', 560, AN, CREME, 400, -.01, .9, 'left', f'text-shadow:0 18px 0 {MENTHE};')
    s += t(850, 250, 200, '.', 560, AN, CREME, 400, 0, .9, 'left', f'text-shadow:0 18px 0 {MENTHE};')
    s += im('menthe_1.png', 20, 760, 230, st='transform:rotate(-20deg);') + im('tranche_0.png', 860, 170, 190, st='transform:rotate(14deg);')
    s += im('can_hero.png', 640, 290, 225, st='transform:rotate(6deg);filter:drop-shadow(0 26px 24px rgba(31,94,20,.45));')
    s += im('citron_0.png', 830, 1050, 230)
    s += t(70, 960, 940, 'Comment faire dire « oui »<br>en une seconde de scroll.', 64, AN, MENTHE, 400, .01, 1.05, 'center')
    s += box(290, 1150, 500, 70, f'background:{MENTHE};border-radius:35px;', t(0, 19, 500, 'Faites défiler →', 30, MO, LIME, 800, 0, 1, 'center', 'font-style:italic;'))
    S.append(slide(CITRON, s + foot(1)))
    # 2 · le défi (décor Firefly : citrons sur fond noir, étendu)
    s = im('ff/ff_noir_carre.jpg', -285, 0, 1350, 1350) + box(0, 0, W, H, 'background:linear-gradient(180deg,rgba(10,25,8,.85) 0%,rgba(10,25,8,.45) 45%,rgba(10,25,8,.9) 100%);')
    s += kick('01 · LE DÉFI', LIME, 90) + t(70, 150, 940, 'UNE SECONDE<br>POUR ARRÊTER<br>LE POUCE.', 140, AN, CREME, 400, .01, .95)
    s += box(70, 640, 140, 10, f'background:{LIME};border-radius:5px;')
    s += t(70, 690, 900, 'Une boisson inconnue, un fil d’actualité qui défile vite, des centaines de marques qui crient en même temps.<br><br>Il fallait une image et un son qu’on reconnaît <span style="color:' + LIME + '">avant même de lire le nom</span>.', 36, DS, CREME, 500, 0, 1.45)
    S.append(slide('#0e1a0b', s + foot(2, True)))
    # 3 · l'idée
    s = im('ouverture.jpg', 0, 0, W, H) + box(0, 0, W, H, 'background:linear-gradient(180deg,rgba(31,94,20,.75) 0%,rgba(31,94,20,0) 40%,rgba(31,94,20,0) 60%,rgba(31,94,20,.85) 100%);')
    s += kick('02 · L’IDÉE', LIME, 90) + t(70, 150, 940, 'VENDRE UN SON.', 120, AN, CREME, 400, .01, 1)
    s += box(150, 470, 780, 360, f'background:{LIME};border-radius:44px;transform:rotate(-7deg);box-shadow:0 18px 0 {MENTHE};', t(0, 85, 780, 'PSHHHT !', 190, AN, MENTHE, 400, .02, 1, 'center'))
    s += t(70, 1080, 940, 'Celui qu’on entend juste avant de goûter. Il devient la signature de la marque : dans le Reel, en story, sur les visuels.', 34, DS, CREME, 600, 0, 1.4)
    S.append(slide(MENTHE, s + foot(3, True)))
    # 4 · affichage (décor étendu avec Firefly)
    s = box(0, 0, W, H, f'background:linear-gradient(180deg,#bfe6ff 0%,#e9f6ff 55%,{CREME} 56%,#efe6c8 100%);')
    s += kick('03 · AFFICHAGE · DÉCOR ÉTENDU AVEC ADOBE FIREFLY', MENTHE, 80) + t(70, 125, 940, 'EN GRAND, ÇA DONNE ÇA.', 84, AN, MENTHE, 400, .01, 1)
    s += box(150, 760, 26, 420, f'background:#5d6a63;') + box(904, 760, 26, 420, f'background:#5d6a63;')
    s += box(30, 300, 1020, 520, f'background:#2b2f2c;border-radius:8px;box-shadow:0 30px 60px rgba(0,0,0,.35);')
    s += im('ff/ff_billboard.jpg', 46, 316, 988, 488, 'object-position:50% 50%;border-radius:4px;')
    s += t(70, 400, 330, 'LA<br>FRAÎCHEUR<br>À L’ÉTAT PUR', 66, AN, CREME, 400, .01, .95, st=f'text-shadow:0 5px 0 {MENTHE};')
    s += box(720, 690, 270, 70, f'background:{FEUILLE};border-radius:35px;', t(0, 18, 270, 'GOÛTE-LA !', 34, AN, CREME, 400, .04, 1, 'center'))
    s += t(70, 1200, 940, 'Le visuel carré a été prolongé sur les côtés par l’IA d’Adobe Firefly pour tenir dans un panneau très large.', 26, DS, MENTHE, 600, 0, 1.4)
    S.append(slide(CREME, s + foot(4)))
    # 5 · collage des formats
    s = bg_citron(W, H, '50%', '50%') + kick('04 · LES DÉCLINAISONS', MENTHE, 80) + t(70, 125, 940, 'UNE MARQUE,<br>TOUS LES ÉCRANS.', 96, AN, MENTHE, 400, .01, .98)
    for n, x, y, w, h, r in [('decl/story_sondage.jpg', 40, 360, 270, 480, -9), ('decl/post_hero.jpg', 300, 330, 340, 425, 4), ('decl/story_cta.jpg', 700, 350, 300, 533, 8),
                             ('decl/post_ingredients.jpg', 70, 830, 300, 375, 6), ('decl/banniere.jpg', 330, 800, 500, 281, -4), ('decl/carre_nouveau.jpg', 760, 900, 280, 280, -7)]:
        s += card(n, x, y, w, h, r)
    s += im('decl/avatar.png', 420, 1080, 180, 180, 'border-radius:50%;box-shadow:0 18px 40px rgba(31,94,20,.4);')
    S.append(slide(CITRON, s + foot(5)))
    # 6 · le Reel en pellicule
    s = box(0, 0, W, H, f'background:{MENTHE};') + kick('05 · LE REEL', LIME, 80) + t(70, 125, 940, '15 SECONDES<br>QUI DONNENT SOIF.', 96, AN, CREME, 400, .01, .98)
    s += box(-20, 400, W + 40, 560, 'background:#0b0f0a;transform:rotate(-4deg);box-shadow:0 30px 60px rgba(0,0,0,.4);')
    for k in range(5):
        x = 30 + k * 210; s += im(f'reel/r{k + 1}.jpg', x, 470 - k * 14, 190, 338, 'border-radius:6px;transform:rotate(-4deg);')
    for k in range(13):
        s += box(15 + k * 84, 418 - k * 5.9, 34, 24, 'background:#f3f0ea;border-radius:5px;transform:rotate(-4deg);opacity:.85;') + box(15 + k * 84, 900 - k * 5.9, 34, 24, 'background:#f3f0ea;border-radius:5px;transform:rotate(-4deg);opacity:.85;')
    s += t(70, 1040, 940, 'Plongeon, « PSHHHT ! », slogan, canette héroïque. Sous-titres animés pour les vidéos qui démarrent en muet, transitions calées sur la musique.', 32, DS, CREME, 500, 0, 1.45)
    S.append(slide(MENTHE, s + foot(6, True)))
    # 7 · palette en citrons
    s = kick('06 · LA PALETTE', FEUILLE, 80) + t(70, 125, 940, 'SIX COULEURS,<br>PRESSÉES À FROID.', 96, AN, MENTHE, 400, .01, .98)
    for k, (nm, c, l) in enumerate([('Citron', CITRON, '#FFF1A8'), ('Soleil', SOLEIL, '#FFDF8A'), ('Lime', LIME, '#E3F7B5'), ('Feuille', FEUILLE, '#9ED487'), ('Menthe', MENTHE, '#6FA862'), ('Crème', '#E9DDB3', CREME)]):
        x, y = 70 + (k % 3) * 330, 380 + (k // 3) * 430
        s += lemon_swatch(x + 20, y, 260, c, l) + t(x, y + 280, 300, nm.upper(), 44, AN, MENTHE, 400, .04, 1, 'center')
        s += t(x, y + 332, 300, {0: '#FFD21A', 1: '#F7B500', 2: '#A8E03A', 3: '#3E9B24', 4: '#1F5E14', 5: '#FFF8E1'}[k], 26, DS, FEUILLE, 700, .04, 1, 'center')
    S.append(slide(CREME, s + foot(7)))
    # 8 · avant / après
    s = box(0, 0, 540, H, 'background:#e9e7e2;') + box(540, 0, 540, H, f'background:{CITRON};')
    s += kick('07 · AVANT / APRÈS', MENTHE, 80) + t(70, 125, 940, 'LE MÊME PRODUIT.', 96, AN, MENTHE, 400, .01, 1, 'center')
    s += t(0, 270, 540, 'AVANT', 44, AN, '#8b8f8a', 400, .2, 1, 'center') + t(540, 270, 540, 'APRÈS', 44, AN, MENTHE, 400, .2, 1, 'center')
    s += box(110, 360, 320, 400, 'background:#fff;border-radius:6px;box-shadow:0 10px 24px rgba(0,0,0,.08);') + im('can_face.png', 190, 390, 160, st='filter:grayscale(.85) brightness(1.05);')
    s += card('decl/post_hero.jpg', 610, 330, 400, 500, 3)
    s += t(40, 880, 460, 'Une photo produit<br>sur fond blanc.', 38, DS, '#6b6f6a', 600, 0, 1.3, 'center') + t(580, 880, 460, 'Une marque qu’on<br>reconnaît au premier coup d’œil.', 38, DS, MENTHE, 800, 0, 1.3, 'center')
    s += box(0, 1040, W, 200, f'background:{MENTHE};', t(70, 56, 940, 'La différence ? Une idée, une charte, et le soin du détail.', 40, AN, LIME, 400, .02, 1.2, 'center'))
    S.append(slide(CITRON, s + foot(8)))
    # 9 · OUI (décor Firefly : tourbillon de citrons étendu)
    s = im('ff/ff_vortex_carre.jpg', -135, 0, 1350, 1350) + box(0, 0, W, H, 'background:rgba(255,210,26,.35);')
    s += box(70, 230, 940, 860, f'background:{MENTHE};border-radius:48px;box-shadow:0 30px 70px rgba(31,94,20,.45);',
             t(0, 60, 940, 'ET VOUS,', 54, AN, LIME, 400, .2, 1, 'center') + t(0, 130, 940, 'VOUS DITES<br>OUI ?', 170, AN, CREME, 400, .01, .92, 'center')
             + t(80, 480, 780, 'Logo, charte, packaging, posts, stories, Reels : je construis la communication de votre marque, prête à publier.', 32, DS, CREME, 500, 0, 1.45, 'center')
             + box(140, 640, 660, 100, f'background:{LIME};border-radius:50px;box-shadow:0 10px 0 {FEUILLE};', t(0, 28, 660, 'ÉCRIVEZ « AVIS » EN COMMENTAIRE', 40, AN, MENTHE, 400, .03, 1, 'center')))
    s += box(170, 1130, 740, 130, f'background:{CREME};border-radius:30px;',
             t(0, 22, 740, 'Tarik Belattar — E-DUST Solutions', 36, AN, MENTHE, 400, .03, 1, 'center') + t(0, 76, 740, '06 13 24 96 80 · tarikbelatta@gmail.com · edust-solutions.fr', 24, DS, FEUILLE, 700, 0, 1, 'center'))
    S.append(slide(CITRON, s + foot(9)))
    hd = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide"><meta name="hz:canvas-width" content="{W}"><meta name="hz:canvas-height" content="{H}">'
          f'<title>CITRON FRESH — Portfolio OUI</title>{KIT}<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>')
    return hd + ''.join(S) + '</body></html>'
for e in (False, True):
    EMB = e; open(f'{B}/oui{"_express" if e else ""}.html', 'w').write(build())
print('ok', os.path.getsize(f'{B}/oui_express.html'))
