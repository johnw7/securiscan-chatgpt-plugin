"""Planche de présentation du logo E-DUST (5 pages 1920×1080) : logo, concept, déclinaisons, mises en situation, couleurs.
Les logos sont insérés en SVG vectoriel (out/*.svg, produits par build.py). Usage : python3 planche.py → planche.html,
puis NODE_PATH=$(npm root -g) node rendu_planche.cjs → out/planche_pXX.png et PDF dans livraison/logo_edust/."""
import os, re
D = os.path.dirname(os.path.abspath(__file__))
NOIR, CREME, OR, BOIS = '#141210', '#F2EBE0', '#E2B98C', '#C89B6D'
FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=DM+Sans:wght@500;800&family=DM+Serif+Display&display=swap">'
W, H = 1920, 1080
def lsvg(n, w):
    s = open(f'{D}/out/{n}.svg').read()
    return re.sub(r'width="\d+" height="\d+"', f'width="{w}" style="display:block;height:auto"', s, count=1)
def box(x, y, w, h, st='', inner=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}">{inner}</div>'
def t(x, y, w, s, size, fam="'DM Sans'", col=CREME, wt=500, ls=0, lh=1.3, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
SER, MAIN = "'DM Serif Display'", "'Caveat'"
def kicker(s, y=90, col=OR): return t(120, y, 1200, s, 20, wt=800, col=col, ls=.34)
def pied(n): return t(120, 1010, 1200, 'E-DUST SOLUTIONS · IDENTITÉ DE MARQUE', 15, wt=800, col='rgba(242,235,224,.4)', ls=.3) + t(1500, 1010, 300, f'{n}/5', 15, wt=800, col='rgba(242,235,224,.4)', ls=.3, al='right')
def lueur(): return box(1000, -300, 1300, 1300, 'background:radial-gradient(closest-side,rgba(200,155,109,.16),transparent);')

def p1():
    return (box(0, 0, W, H, f'background:{NOIR}') + lueur() + kicker('LOGO · IDENTITÉ DE MARQUE')
            + box(W // 2 - 620, 330, 1240, 430, '', lsvg('logo_horizontal_transparent_clair', 1240))
            + t(0, 820, W, 'Votre marque mérite plus qu’une image. <span style="font-family:Caveat;color:#E2B98C;font-weight:700;font-size:1.35em">Elle mérite une histoire.</span>', 34, SER, CREME, 400, 0, 1.3, 'center') + pied(1))
def p2():
    s = box(0, 0, W, H, f'background:{NOIR}') + lueur() + kicker('LE CONCEPT')
    s += t(120, 150, 900, 'Un « E » qui prend vie.', 76, SER, CREME, 400, -.01, 1.05)
    s += t(120, 250, 900, 'la poussière qui s’envole', 70, MAIN, OR, 700, 0, 1)
    s += t(120, 380, 760, 'Le « E » d’E-DUST est construit en trois barres&nbsp;: <b>ce que vous êtes</b>, <b>ce que vous dites</b>, <b>ce que vous montrez</b>. La barre médiane, en or, c’est le message clé.<br><br>La barre du bas se défait en particules qui s’élèvent&nbsp;: la «&nbsp;dust&nbsp;» du nom, les pixels de la création numérique, une marque qui ne reste pas figée et qui prend son envol.<br><br>Le trait d’union devient un pixel or&nbsp;: le lien entre la marque et son public.', 25, col='rgba(242,235,224,.85)', lh=1.55)
    s += box(1080, 200, 700, 700, f'background:#1c1916;border-radius:40px;border:1px solid rgba(200,155,109,.28);display:flex;align-items:center;justify-content:center', lsvg('icone_fond_noir', 600))
    return s + pied(2)
def p3():
    s = box(0, 0, W, H, f'background:{NOIR}') + kicker('DÉCLINAISONS')
    s += box(120, 170, 820, 330, f'background:{NOIR};border:1px solid rgba(200,155,109,.28);border-radius:26px;display:flex;align-items:center;justify-content:center', lsvg('logo_horizontal_transparent_clair', 700))
    s += box(980, 170, 820, 330, f'background:{CREME};border-radius:26px;display:flex;align-items:center;justify-content:center', lsvg('logo_horizontal_transparent_fonce', 700))
    s += box(120, 540, 820, 330, 'background:#ffffff;border-radius:26px;display:flex;align-items:center;justify-content:center', lsvg('logo_monochrome_noir', 700))
    s += box(980, 540, 390, 330, f'background:{BOIS};border-radius:26px;display:flex;align-items:center;justify-content:center', lsvg('logo_vertical_transparent_fonce', 250))
    s += box(1410, 540, 390, 330, f'background:#1c1916;border:1px solid rgba(200,155,109,.28);border-radius:26px;display:flex;align-items:center;justify-content:center;gap:28px', lsvg('icone_fond_noir', 150) + lsvg('icone_fond_creme', 150))
    for x, y, l in [(140, 470, 'Principal · fond foncé'), (1000, 470, 'Principal · fond clair'), (140, 840, 'Monochrome'), (1000, 840, 'Vertical'), (1430, 840, 'Icône · favicon · avatar')]:
        s += t(x, y, 600, l, 15, wt=800, col='rgba(242,235,224,.55)' if l not in ('Principal · fond clair', 'Monochrome', 'Vertical') else 'rgba(20,18,16,.55)', ls=.16)
    return s + pied(3)
def p4():
    s = box(0, 0, W, H, f'background:#1c1916') + kicker('EN SITUATION')
    # carte de visite recto / verso
    s += box(120, 190, 720, 410, f'background:{NOIR};border-radius:22px;box-shadow:0 40px 80px rgba(0,0,0,.55);transform:rotate(-4deg);display:flex;align-items:center;justify-content:center', lsvg('logo_horizontal_transparent_clair', 560))
    s += box(260, 470, 720, 410, f'background:{CREME};border-radius:22px;box-shadow:0 40px 80px rgba(0,0,0,.55);transform:rotate(3deg)',
             t(60, 70, 600, 'Tarik Belattar', 54, MAIN, BOIS, 700, 0, 1) + t(60, 140, 600, 'FONDATEUR · DIRECTEUR DE CRÉATION', 15, wt=800, col='rgba(20,18,16,.6)', ls=.2)
             + t(60, 230, 600, '06 13 24 96 80<br>tarikbelatta@gmail.com<br>edust-solutions.fr', 22, wt=500, col=NOIR, lh=1.6)
             + box(560, 250, 110, 110, '', lsvg('icone_fond_noir', 110)))
    # avatar LinkedIn + onglet navigateur
    s += box(1130, 190, 640, 300, f'background:#ffffff;border-radius:20px;box-shadow:0 30px 60px rgba(0,0,0,.4);overflow:hidden',
             box(0, 0, 640, 110, f'background:{NOIR}', box(0, 0, 640, 110, '', '')) + box(36, 50, 130, 130, 'border-radius:50%;overflow:hidden;border:5px solid #fff', lsvg('icone_fond_noir', 120).replace('rx="112"', 'rx="0"'))
             + t(36, 192, 560, '<b>E-DUST Solutions</b>', 26, col='#1d1d1d') + t(36, 230, 580, 'Agence de communication digitale pour les marques', 18, col='#555'))
    s += box(1130, 540, 640, 120, 'background:#dcd6cc;border-radius:16px 16px 0 0;box-shadow:0 30px 60px rgba(0,0,0,.4)',
             box(24, 40, 330, 60, 'background:#fff;border-radius:12px 12px 0 0;display:flex;align-items:center;gap:12px;padding-left:14px', lsvg('icone_fond_noir', 30) + '<span style="font-family:DM Sans;font-size:16px;color:#333">E-DUST Solutions</span>'))
    s += box(1130, 660, 640, 220, f'background:{NOIR};border-radius:0 0 16px 16px;box-shadow:0 30px 60px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center', lsvg('logo_horizontal_transparent_clair', 460))
    return s + pied(4)
def p5():
    s = box(0, 0, W, H, f'background:{NOIR}') + kicker('COULEURS & TYPOGRAPHIES')
    for k, (c, n, txt) in enumerate([(NOIR, 'Noir chaud', CREME), (CREME, 'Crème', NOIR), (OR, 'Or', NOIR), (BOIS, 'Bois', NOIR)]):
        x = 120 + k * 430
        s += box(x, 180, 400, 360, f'background:{c};border-radius:24px;border:1px solid rgba(242,235,224,.15)',
                 t(30, 260, 340, f'<b>{n}</b><br>{c}', 24, col=txt, lh=1.4))
    s += t(120, 620, 800, 'DM Serif Display', 64, SER, CREME, 400) + t(120, 710, 800, 'Logotype « E-DUST » et titres', 20, col='rgba(242,235,224,.6)')
    s += t(1000, 620, 800, 'S O L U T I O N S', 46, wt=800, col=OR, ls=.1) + t(1000, 710, 800, 'DM Sans 800 · signature et textes', 20, col='rgba(242,235,224,.6)')
    s += t(120, 790, 1600, 'Elle mérite une histoire.', 64, MAIN, OR, 700) + t(120, 880, 800, 'Caveat · la touche manuscrite des messages', 20, col='rgba(242,235,224,.6)')
    return s + pied(5)

pages = ''.join(f'<section class="slide" id="planche_p{k + 1:02d}" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden">{f()}</section>'
                for k, f in enumerate([p1, p2, p3, p4, p5]))
open(f'{D}/planche.html', 'w').write(f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide"><title>E-DUST — logo</title>{FONTS}'
                                     f'<style>html,body{{margin:0;background:#222}}.slide{{margin:0 auto 40px}}</style></head><body>{pages}</body></html>')
print('ok planche.html')
