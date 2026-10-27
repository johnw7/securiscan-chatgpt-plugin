"""Étalonnage commun des photos Adobe Stock (raw/ → img/) dans la palette du projet :
noirs relevés vers #100E17, ombres violettes (#191020 / #7938D8), hautes lumières orangées (#FFAA45), vignettage, grain.
Produit aussi une version floue (fond de la version 9:16) et une texture de grain. Usage : python3 prep_img.py"""
import os
import numpy as np
from PIL import Image, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/img', exist_ok=True)
RNG = np.random.default_rng(3)
NOMS = ['porte', 'accueil', 'carton', 'responsable', 'equipe', 'poste', 'espaces', 'outils', 'aide', 'missions', 'carnet', 'soir', 'silhouettes']

def etalonne(a):
    L = (a @ np.array([.299, .587, .114]))[..., None]
    a = L + (a - L) * .82                                         # un peu moins saturé
    a = np.clip((a - .5) * 1.08 + .5, 0, 1)                         # contraste doux
    a = a + (1 - L) ** 2 * np.array([.035, -.01, .07])              # ombres violettes
    a = a + L ** 2 * np.array([.06, .02, -.05])                     # hautes lumières orangées
    a = .062 + a * (1 - .062) * np.array([1, .96, 1.02])            # noirs relevés vers #100E17
    h, w = a.shape[:2]; yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    a = a * (1 - .45 * np.clip(d - .55, 0, 1) ** 1.4)[..., None]
    return np.clip(a + RNG.normal(0, .012, (h, w, 1)), 0, 1)

for n in NOMS:
    if os.path.exists(f'{D}/img/{n}.jpg'): continue
    i = Image.open(f'{D}/raw/{n}.jpg').convert('RGB')
    i = i.resize((2400, round(2400 * i.height / i.width)), Image.LANCZOS)
    a = etalonne(np.asarray(i, dtype=np.float32) / 255)
    o = Image.fromarray((a * 255).astype(np.uint8)); o.save(f'{D}/img/{n}.jpg', quality=90)
    o.resize((480, round(480 * o.height / o.width))).filter(ImageFilter.GaussianBlur(14)).save(f'{D}/img/{n}_flou.jpg', quality=85)
if not os.path.exists(f'{D}/img/grain.png'):
    g = RNG.normal(128, 38, (512, 512)).clip(0, 255).astype(np.uint8)
    Image.fromarray(np.dstack([g, g, g, np.full_like(g, 22)]), 'RGBA').save(f'{D}/img/grain.png')
print('ok', len(NOMS), 'photos')
