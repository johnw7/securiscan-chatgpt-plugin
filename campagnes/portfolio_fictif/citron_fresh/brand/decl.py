"""Déclinaisons réseaux sociaux CITRON FRESH, toutes dans la charte (6 couleurs, 3 polices Adobe Fonts) :
3 posts 4:5, 3 stories 9:16, 1 carré 1:1, 1 bannière 16:9, 1 avatar. Sortie : brand/decl.html (une <section class="slide"> par visuel).
Rendu PNG : VW=1950 VH=2000 node ../../nouvelles_marques/render_slides.cjs <dossier> decl.html (servi depuis brand/)."""
import os
B = os.path.dirname(os.path.abspath(__file__))
KIT = '<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
AN, MO, DS = "'anton',sans-serif", "'montserrat',sans-serif", "'dm-sans',sans-serif"
CITRON, SOLEIL, LIME, FEUILLE, MENTHE, CREME = '#FFD21A', '#F7B500', '#A8E03A', '#3E9B24', '#1F5E14', '#FFF8E1'
def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam=AN, col=CREME, wt=400, ls=0, lh=1.0, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def img(n, x, y, w, h=None, st=''): return f'<img src="img/{n}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;{f"height:{h}px;object-fit:cover;" if h else ""}{st}">'
OUT = f'-webkit-text-stroke:0;text-shadow:0 6px 0 {MENTHE},0 0 0 {MENTHE};'
def logo(x, y, s=1.0, inv=False):
    """Logotype : CITRON (crème, ombre menthe) + pastille FRESH (menthe sur crème) — version inversée possible."""
    c1, sh, pb, pf = {False: (CREME, MENTHE, CREME, MENTHE), True: (MENTHE, LIME, MENTHE, CREME), 'sombre': (CREME, FEUILLE, LIME, MENTHE)}[inv]
    return (t(x, y, int(520 * s), 'CITRON', int(150 * s), AN, c1, 400, .01, 1, 'center', f'text-shadow:0 {int(7 * s)}px 0 {sh};')
            + box(int(x + 85 * s), int(y + 160 * s), int(350 * s), int(130 * s), f'background:{pb};border-radius:{int(65 * s)}px;',
                  t(0, int(4 * s), int(350 * s), 'FRESH', int(118 * s), AN, pf, 400, .02, 1.05, 'center')))
def pillbtn(x, y, w, txt, size=44, bg=FEUILLE, fg=CREME):
    return box(x, y, w, int(size * 2.1), f'background:{bg};border-radius:{size}px;box-shadow:0 10px 0 {MENTHE};', t(0, int(size * .5), w, txt, size, AN, fg, 400, .03, 1.1, 'center'))
def demo(W, H, col='rgba(31,94,20,.65)'): return t(40, H - 46, W - 80, 'Démo · marque fictive · création E-DUST Solutions', 18, DS, col, 500, 0, 1, 'center')
def bg_citron(W, H, cx='50%', cy='45%'): return box(0, 0, W, H, f'background:radial-gradient(circle at {cx} {cy},#FFE45C 0%,{CITRON} 45%,{SOLEIL} 100%);')
def bubbles(W, H, n=26, seed=3, col='rgba(255,248,225,.55)'):
    import random; r = random.Random(seed); s = ''
    for _ in range(n):
        d = r.randint(12, 54); s += box(r.randint(0, W - d), r.randint(0, H - d), d, d, f'border:3px solid {col};border-radius:50%;')
    return s

def post_hero(W=1080, H=1350):
    s = bg_citron(W, H) + bubbles(W, H)
    s += t(-40, 360, W + 80, 'FRESH', 520, AN, 'transparent', 400, .02, 1, 'center', f'-webkit-text-stroke:4px {CREME};opacity:.55;')
    s += img('menthe_1.png', 40, 900, 260, st='transform:rotate(18deg);') + img('tranche_0.png', 800, 820, 250, st='transform:rotate(-12deg);')
    s += img('can_hero.png', 330, 380, 420) + img('citron_0.png', 650, 1010, 380) + img('menthe_2.png', 780, 360, 180, st='transform:rotate(-25deg);')
    s += t(60, 70, W - 120, 'LA FRAÎCHEUR<br>À L’ÉTAT PUR', 118, AN, CREME, 400, .01, .95, 'center', f'text-shadow:0 7px 0 {MENTHE};')
    return s + pillbtn(330, 1180, 420, 'GOÛTE-LA !', 46) + demo(W, H)
def post_plongeon(W=1080, H=1350):
    s = img('plongeon.jpg', 0, -120, W, 1920, 'object-position:50% 30%;') + box(0, 0, W, H, f'background:linear-gradient(180deg,rgba(255,210,26,0) 55%,{CITRON} 78%);')
    s += t(60, 70, W - 120, 'UN PLONGEON…', 96, AN, MENTHE, 400, .01, 1, 'left') + box(50, 172, 640, 118, f'background:{LIME};border-radius:18px;transform:rotate(-2deg);', t(20, 8, 620, 'ET TOUT PÉTILLE.', 96, AN, MENTHE, 400, .01, 1, 'left'))
    s += img('can_34.png', 760, 860, 230) + box(60, 1080, 600, 6, f'background:{MENTHE};border-radius:3px;')
    s += t(60, 1110, 640, 'CITRON FRESH · pétillant au citron et au citron vert', 34, MO, MENTHE, 800, 0, 1.25, 'left', 'font-style:italic;')
    return s + demo(W, H)
def post_ingredients(W=1080, H=1350):
    s = box(0, 0, W, H, f'background:{CREME};') + box(0, 940, W, 410, f'background:{LIME};') + box(0, 1090, W, 260, f'background:{FEUILLE};')
    s += t(60, 80, W - 120, 'CE QU’IL Y A<br><span style="color:' + FEUILLE + '">DEDANS</span>', 120, AN, MENTHE, 400, .01, .95)
    for k, (n, lab) in enumerate([('tranche_0.png', 'CITRON'), ('noir.jpg', 'CITRON VERT'), ('menthe_eau.jpg', 'BULLES')]):
        x = 60 + k * 330; s += box(x, 400, 300, 300, f'border-radius:50%;overflow:hidden;background:{CITRON};border:8px solid {CREME};box-shadow:0 0 0 6px {SOLEIL};',
                                     f'<img src="img/{n}" style="width:100%;height:100%;object-fit:cover;{"transform:scale(1.25);" if n == "tranche_0.png" else ""}">')
        s += t(x, 730, 300, lab, 46, AN, MENTHE, 400, .04, 1, 'center')
    s += img('can_face.png', 790, 860, 230) + t(60, 1150, 620, 'Rien de compliqué :<br>juste de la fraîcheur.', 44, MO, CREME, 800, 0, 1.15, 'left', 'font-style:italic;')
    return s + demo(W, H, 'rgba(255,248,225,.7)')
def story_pshht(W=1080, H=1920):
    s = img('ouverture.jpg', 0, 0, W, H) + box(0, 0, W, H, 'background:linear-gradient(180deg,rgba(31,94,20,.55) 0%,rgba(31,94,20,0) 35%);')
    s += box(170, 360, 740, 400, f'background:{LIME};border-radius:40px;transform:rotate(-6deg);box-shadow:0 14px 0 {MENTHE};', t(0, 100, 740, 'PSHHHT !', 175, AN, MENTHE, 400, .02, 1, 'center'))
    s += t(60, 160, W - 120, 'LE SON DE L’ÉTÉ', 64, AN, CREME, 400, .12, 1, 'center')
    return s + logo(280, 1480, .9) + demo(W, H, 'rgba(255,248,225,.75)')
def story_sondage(W=1080, H=1920):
    s = img('vortex.jpg', 0, 0, W, H, 'filter:saturate(1.05);') + box(0, 0, W, H, 'background:rgba(255,210,26,.25);')
    s += t(60, 230, W - 120, 'TEAM CITRON<br>OU TEAM<br>CITRON VERT ?', 120, AN, CREME, 400, .01, .95, 'center', f'text-shadow:0 7px 0 {MENTHE};')
    s += img('can_face.png', 360, 720, 360)
    s += box(140, 1480, 800, 230, f'background:{CREME};border-radius:36px;box-shadow:0 14px 30px rgba(31,94,20,.3);',
             box(30, 30, 355, 170, f'background:{CITRON};border-radius:24px;', t(0, 52, 355, 'CITRON 🍋', 56, AN, MENTHE, 400, .02, 1, 'center'))
             + box(415, 30, 355, 170, f'background:{LIME};border-radius:24px;', t(0, 52, 355, 'CITRON VERT', 56, AN, MENTHE, 400, .02, 1, 'center')))
    s += t(140, 1740, 800, 'Sondage · réponds en un tap', 30, DS, MENTHE, 700, .02, 1, 'center')
    return s + demo(W, H)
def story_cta(W=1080, H=1920):
    s = img('noir.jpg', 0, 0, W, H) + box(0, 0, W, H, 'background:linear-gradient(180deg,rgba(15,30,10,.2) 0%,rgba(15,30,10,.85) 75%);')
    s += logo(280, 170, .9, 'sombre') + img('can_ouverte.png', 300, 520, 480)
    s += t(60, 1420, W - 120, 'GOÛTE<br>LA FRAÎCHEUR', 130, AN, CITRON, 400, .01, .95, 'center')
    s += pillbtn(290, 1700, 500, 'EN SAVOIR PLUS ↑', 40, LIME, MENTHE)
    return s + demo(W, H, 'rgba(255,248,225,.7)')
def carre(W=1080, H=1080):
    s = bg_citron(W, H, '50%', '55%') + bubbles(W, H, 20, 7) + img('can_hero.png', 560, 170, 360) + img('tranche_0.png', 780, 760, 240, st='transform:rotate(15deg);')
    s += logo(40, 260, .95) + box(90, 640, 420, 110, f'background:{MENTHE};border-radius:55px;', t(0, 26, 420, 'NOUVEAU', 64, AN, LIME, 400, .1, 1, 'center'))
    s += img('menthe_0.png', 60, 800, 220, st='transform:rotate(-20deg);')
    return s + demo(W, H)
def banniere(W=1920, H=1080):
    s = bg_citron(W, H, '30%', '50%') + bubbles(W, H, 34, 9)
    s += box(1080, 0, 840, H, f'background:{MENTHE};clip-path:polygon(18% 0,100% 0,100% 100%,0 100%);')
    s += img('citron_0.png', 40, 700, 460) + img('can_hero.png', 400, 110, 470) + img('menthe_1.png', 820, 120, 220, st='transform:rotate(30deg);')
    s += t(1290, 250, 600, 'LA FRAÎCHEUR<br>À L’ÉTAT PUR', 100, AN, CREME, 400, .01, .98) + box(1290, 490, 120, 8, f'background:{LIME};border-radius:4px;')
    s += t(1290, 530, 600, 'Pétillant au citron<br>et au citron vert.', 42, MO, LIME, 800, 0, 1.2, st='font-style:italic;')
    return s + pillbtn(1290, 700, 440, 'GOÛTE-LA !', 46, LIME, MENTHE) + demo(W, H, 'rgba(255,248,225,.7)')
def avatar(W=1080, H=1080):
    return box(0, 0, W, H, 'background:transparent;') + box(40, 40, 1000, 1000, f'border-radius:50%;background:radial-gradient(circle at 50% 40%,#FFE45C,{CITRON} 55%,{SOLEIL});box-shadow:inset 0 0 0 18px {CREME};') + logo(280, 330, .95)

ALL = [('post_hero', post_hero, 1080, 1350), ('post_plongeon', post_plongeon, 1080, 1350), ('post_ingredients', post_ingredients, 1080, 1350),
       ('story_pshht', story_pshht, 1080, 1920), ('story_sondage', story_sondage, 1080, 1920), ('story_cta', story_cta, 1080, 1920),
       ('carre_nouveau', carre, 1080, 1080), ('banniere', banniere, 1920, 1080), ('avatar', avatar, 1080, 1080)]
if __name__ == '__main__':
    secs = ''.join(f'<section class="slide" id="{n}" style="position:relative;width:{w}px;height:{h}px;overflow:hidden">{f(w, h)}</section>' for n, f, w, h in ALL)
    open(f'{B}/decl.html', 'w').write(f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>CITRON FRESH — déclinaisons</title>{KIT}'
                                      f'<style>html,body{{margin:0;background:#222}}.slide{{margin:0 0 40px}}</style></head><body>{secs}</body></html>')
    print('ok', len(ALL))
