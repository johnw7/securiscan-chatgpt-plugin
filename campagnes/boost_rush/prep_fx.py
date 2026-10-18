"""Gouttes de condensation (même cadrage que les calques de la canette) pour l'effet « canette glacée »."""
import os, numpy as np
from PIL import Image, ImageDraw, ImageFilter
D = os.path.dirname(os.path.abspath(__file__))
can = Image.open(f'{D}/assets/canette_nue.png')
W, H = can.size
rng = np.random.default_rng(4)
layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(layer)
for _ in range(900):
    x, y = rng.uniform(0, W), rng.uniform(H * .07, H * .95)
    r = rng.choice([rng.uniform(3, 7), rng.uniform(7, 16), rng.uniform(16, 26)], p=[.62, .3, .08])
    ry = r * rng.uniform(1.0, 1.35)
    d.ellipse([x - r, y - ry, x + r, y + ry], fill=(190, 200, 210, 70))           # corps de la goutte
    d.ellipse([x - r * .2, y + ry * .25, x + r * .75, y + ry * .9], fill=(0, 0, 0, 90))  # ombre bas
    d.ellipse([x - r * .55, y - ry * .65, x - r * .05, y - ry * .15], fill=(255, 255, 255, 235))  # reflet
layer = layer.filter(ImageFilter.GaussianBlur(1.2))
a = np.array(layer)
mask = np.array(can.getchannel('A')).astype(float) / 255
a[..., 3] = (a[..., 3] * mask).astype(np.uint8)
Image.fromarray(a).save(f'{D}/assets/gouttes.png')
print('ok')

# versions recadrées du tigre et de l'éclair pour les plans plein écran
for n in ('tigre', 'eclair'):
    im = Image.open(f'{D}/assets/{n}.png')
    im.crop(im.getchannel('A').getbbox()).save(f'{D}/assets/{n}_seul.png')
print('crops ok')
