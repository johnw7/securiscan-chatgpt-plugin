"""Prépare les calques de la pub VYROX à partir de assets/ref_x2.png (voir upscale.py) :
logos d'origine effacés -> marque fictive VYROX, sportive détourée + fond reconstitué, écouteurs/boîtier détourés, 4 vignettes."""
import os, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
from rembg import remove, new_session
D = os.path.dirname(os.path.abspath(__file__)); A = f'{D}/assets'; S = 2
im = np.array(Image.open(f'{A}/ref_x2.png').convert('RGB'))
SES = new_session('isnet-general-use')
def cut(a): return np.array(remove(Image.fromarray(a), session=SES, only_mask=True)).astype(np.float32) / 255
# 1) logos d'origine -> effacés (inpainting), puis marque VYROX
LOGOS = [(368, 236, 13, -10, .9), (400, 775, 30, -8, 1.0), (930, 686, 32, -28, 1.0), (1274, 696, 36, 40, 1.0), (1362, 657, 34, 0, 1.0)]
m = np.zeros(im.shape[:2], np.uint8)
for x, y, r, *_ in LOGOS: cv2.ellipse(m, (x * S, y * S), (int(r * S * 1.3), int(r * S * 1.0)), 0, 0, 360, 255, -1)
bright = (im.max(axis=2) > 75).astype(np.uint8) * 255; m = cv2.dilate(cv2.bitwise_and(m, bright), np.ones((5, 5), np.uint8), iterations=2)
im = cv2.inpaint(im, m, 9, cv2.INPAINT_TELEA)
def mark(img, x, y, size, rot, alpha=1.0):
    """Marque VYROX : chevron « V » blanc + trait vert électrique."""
    s = int(size * 4); L = Image.new('RGBA', (s, s), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    w = max(2, s // 9); d.line([(s * .2, s * .28), (s * .5, s * .74), (s * .8, s * .28)], fill=(245, 245, 245, int(235 * alpha)), width=w, joint='curve')
    d.line([(s * .58, s * .28), (s * .86, s * .28)], fill=(200, 255, 40, int(235 * alpha)), width=max(2, w // 2))
    L = L.rotate(rot, resample=Image.BICUBIC).resize((s // 2, s // 2), Image.LANCZOS)
    P = Image.fromarray(img); P.alpha_composite if False else None
    base = P.convert('RGBA'); base.alpha_composite(L, (int(x - s / 4), int(y - s / 4))); return np.array(base.convert('RGB'))
for x, y, r, rot, k in LOGOS[:4]: im = mark(im, x * S, y * S, r * S * k * .55, rot, .9)
Image.fromarray(im).save(f'{A}/clean_x2.jpg', quality=95)
# 2) sportive : détourage + fond reconstitué
R = im[0:1610, 0:1640].copy(); pm = cut(R); pm[1600:, 880:] = 0
rgba = np.dstack([R, (pm * 255).astype(np.uint8)]); Image.fromarray(rgba).save(f'{A}/runner.png')
sm = cv2.resize(R, None, fx=.25, fy=.25); mm = cv2.dilate((cv2.resize(pm, None, fx=.25, fy=.25) > .2).astype(np.uint8) * 255, np.ones((9, 9), np.uint8), iterations=3)
bg = cv2.inpaint(sm, mm, 15, cv2.INPAINT_TELEA); bg = cv2.GaussianBlur(cv2.resize(bg, (R.shape[1], R.shape[0]), interpolation=cv2.INTER_CUBIC), (0, 0), 6)
Image.fromarray(bg).save(f'{A}/runner_bg.jpg', quality=92)
# 3) écouteurs + boîtier
B = im[960:1620, 1640:3072].copy(); bm = cut(B); XX = np.arange(B.shape[1])[None, :]
for name, (xa, xb) in {'bud_L': (0, 548), 'bud_R': (548, 962)}.items():
    a = bm * ((XX >= xa) & (XX < xb)) * (np.clip((xb - XX) / 110., 0, 1) ** 1.5 if name == 'bud_R' else 1); a[a < .35] = 0; ys, xs = np.nonzero(a > .5); x, y, w, h = xs.min(), ys.min(), xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
    Image.fromarray(np.dstack([B, (a * 255).astype(np.uint8)])[y:y + h, x:x + w]).save(f'{A}/{name}.png'); print(name, w, h)
    e = (a[y:y + h, x:x + w] > .5).astype(np.uint8); fade = (np.arange(w)[None, :] + x) > (xb - 120) if name == 'bud_R' else np.zeros((1, w), bool); e = cv2.GaussianBlur((cv2.dilate(e, np.ones((3, 3), np.uint8), iterations=3) - e).astype(np.float32), (0, 0), 1.5)
    ed = np.zeros((h, w, 4), np.uint8); ed[..., 0], ed[..., 1], ed[..., 2] = 190, 255, 40; ed[..., 3] = np.clip(e * 380 * (1 - fade), 0, 255).astype(np.uint8); Image.fromarray(ed).save(f'{A}/{name}_edge.png')
# 4) vignettes (sans les titres) + détourage
for name, (x0, y0, x1, y1) in {'muscu': (470, 812, 700, 976), 'running': (742, 818, 965, 976), 'yoga': (1006, 822, 1236, 976), 'cyclisme': (1258, 820, 1536, 976)}.items():
    V = im[y0 * S:y1 * S, x0 * S:x1 * S].copy(); Image.fromarray(V).save(f'{A}/v_{name}.jpg', quality=95)
    vm = cut(V); Image.fromarray(np.dstack([V, (vm * 255).astype(np.uint8)])).save(f'{A}/v_{name}_p.png')
print('ok')
