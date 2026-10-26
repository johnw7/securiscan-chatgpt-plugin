"""Visuel « Pack Création » 4:5 (1080×1350) : « CHAQUE TABLE A UNE HISTOIRE. » — chef dressant une assiette gastronomique.
Photo Adobe Stock 297265104 (raw/chef.jpg), décor étendu vers le haut et sur les côtés avec Adobe Firefly (generative expand,
raw/chef_etendu.png 3760×5500), puis vers le bas (raw/chef_etendu2.png 3760×6300) pour libérer le titre en haut et l'accroche sous l'assiette. Étalonnage bleu nuit dramatique (demande de Tarik)
avec reflets contenus, vapeur légère, vignettage et grain ; habillage dans la charte E-DUST (crème, or, bois).
Usage : python3 build.py → visuel.html ; rendu : NODE_PATH=$(npm root -g) node render.cjs visuel.html <sortie>."""
import os
import numpy as np
from PIL import Image, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/img', exist_ok=True)
FONTS = ('<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap">')
SANS, SER, MO, HAND = "'dm-sans',sans-serif", "'dm-serif-display',serif", "'montserrat',sans-serif", "'Caveat',cursive"
NOIR, CREME, OR, BOIS = '#141210', '#f2ebe0', '#e2b98c', '#c89b6d'
W, H = 1080, 1350
RNG = np.random.default_rng(7)

def photo():
    if os.path.exists(f'{D}/img/chef_nuit.jpg'): return 'img/chef_nuit.jpg'
    i = Image.open(f'{D}/raw/chef_etendu2.png').convert('RGB').crop((0, 600, 3760, 5300)).resize((W, H), Image.LANCZOS)
    a = np.asarray(i, dtype=np.float32) / 255
    l = (a @ np.array([.2126, .7152, .0722]))[..., None]
    # bleu nuit : virage progressif selon la luminance (sans seuil, donc sans aplat sur la peau),
    # hautes lumières adoucies (reflets contrôlés de l'assiette et de la veste)
    froid = a * np.array([.80, .92, 1.10])
    m = .85 * (1 - l) ** 1.1
    a = a * (1 - m) + froid * m + np.array([.004, .018, .055]) * (1 - l) ** 2
    a = a * (1 - .18 * l ** 3)
    a = np.clip((a - .5) * 1.08 + .5, 0, 1)
    # vapeur légère au-dessus de l'assiette (bruit étiré, flouté, en mode écran)
    v = Image.fromarray((RNG.random((H // 6, W // 6)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(26))
    v = (np.asarray(v, dtype=np.float32) / 255 - .5) * 2.2
    yy, xx = np.mgrid[0:H, 0:W]
    zone = np.exp(-(((xx - 540) / 250) ** 2 + ((yy - 930) / 190) ** 2))
    v = np.clip(v, 0, 1) * zone * .32
    a = 1 - (1 - a) * (1 - v[..., None] * np.array([.80, .88, 1.0]))
    # halo bleu derrière le titre + vignettage + grain
    halo = np.exp(-(((xx - 260) / 520) ** 2 + ((yy - 260) / 360) ** 2))[..., None] * np.array([.02, .05, .11])
    d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    a = (a + halo) * (1 - .55 * np.clip(d - .45, 0, 1) ** 1.3)[..., None] + RNG.normal(0, .022, (H, W, 1))
    Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).save(f'{D}/img/chef_nuit.jpg', quality=92)
    return 'img/chef_nuit.jpg'

def box(x, y, w, h, st=''): return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{st}"></div>'
def t(x, y, w, s, size, fam=SANS, col=CREME, wt=400, ls=0, lh=1.05, al='left', st=''):
    return f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;margin:0;font-family:{fam};font-size:{size}px;font-weight:{wt};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{al};{st}">{s}</p>'
def fondu(y, h, rev=False):
    a, z = 'rgba(8,12,20,0)', 'rgba(8,12,20,.92)'
    return box(0, y, W, h, f'background:linear-gradient(180deg,{z if rev else a},{a if rev else z});')
SH = 'text-shadow:0 4px 30px rgba(0,0,0,.65);'

def visuel():
    s = f'<img src="{photo()}" style="position:absolute;left:0;top:0;width:{W}px;height:{H}px;">'
    s += fondu(0, 300, True) + fondu(1150, 200)
    s += t(70, 78, 600, 'OFFRE · PACK CRÉATION', 20, SANS, OR, 800, .38)
    s += t(66, 128, 640, 'CHAQUE<br>TABLE', 108, SER, CREME, 400, .01, .98, st=SH)
    s += t(72, 344, 640, 'a une histoire.', 102, HAND, OR, 700, 0, 1, st=SH + 'transform:rotate(-3deg);transform-origin:left;')
    s += box(74, 478, 130, 2, f'background:{BOIS};')
    s += t(70, 1222, 940, 'Photos, affiches, réseaux sociaux&nbsp;: votre restaurant raconté avec la même exigence que vos assiettes.', 18.5, SANS, 'rgba(242,235,224,.9)', 500, 0, 1.4)
    s += t(70, 1272, 600, 'E-DUST SOLUTIONS · edust-solutions.fr', 16, SANS, OR, 800, .2)
    s += t(560, 1274, 450, 'visuel démo · photo Adobe Stock, décor étendu Adobe Firefly', 13, SANS, 'rgba(242,235,224,.5)', 500, .02, 1.3, 'right')
    return s

open(f'{D}/visuel.html', 'w').write(
    f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide"><meta name="hz:canvas-width" content="{W}"><meta name="hz:canvas-height" content="{H}">'
    f'<title>E-DUST — Pack Création (démo)</title>{FONTS}<style>html,body{{margin:0;background:#222}}</style></head><body>'
    f'<section class="slide" id="pack_creation_4x5" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden;background:{NOIR}">{visuel()}</section></body></html>')
print('ok visuel.html')
