"""Photo de Tarik pour le site : retire l'écusson du polo (raw/photo_tarik_polo.jpg) → img/photo-tarik.jpg.
Zone de l'écusson remplacée par un morceau de polo voisin (même tissu, même lumière), fondu progressif, puis léger grain."""
import os
import cv2, numpy as np
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/img', exist_ok=True)
im = cv2.imread(f'{D}/raw/photo_tarik_polo.jpg').astype(np.float32)
H, W = im.shape[:2]
cx, cy, rx, ry = 501, 663, 44, 41                     # écusson (avec marge)
yy, xx = np.mgrid[0:H, 0:W]
d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
masque = np.clip((1.35 - d) / .35, 0, 1)[..., None]   # 1 au centre, fondu sur le bord
# source : tissu juste en dessous, décalé verticalement (même pli, même éclairage)
dy = 92
src = np.roll(im, -dy, axis=0)
# ajuste la luminosité moyenne de la source sur celle de l'anneau autour de l'écusson
anneau = (d > 1.15) & (d < 1.6)
src = src * (im[anneau].mean(0) / src[anneau].mean(0))
out = im * (1 - masque) + src * masque
# lisse la transition puis remet un grain discret
lisse = cv2.GaussianBlur(out, (0, 0), 1.2)
bord = ((d > .8) & (d < 1.5))[..., None]
out = np.where(bord, lisse, out) + np.random.default_rng(1).normal(0, 1.6, out.shape) * masque
cv2.imwrite(f'{D}/img/photo-tarik.jpg', np.clip(out, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
print('ok img/photo-tarik.jpg')
