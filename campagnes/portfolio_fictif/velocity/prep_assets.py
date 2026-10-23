"""Extrait de l'affiche VELOCITY (source/poster_velocity.webp) tous les éléments réels utilisés par la pub :
chaussure détourée (rembg), logo, roches, éclaboussures, décor sans la chaussure (inpainting).
Usage : python3 -I prep_assets.py -> assets/*.png"""
import os, cv2, numpy as np
from PIL import Image
from rembg import remove, new_session
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/assets', exist_ok=True); os.makedirs(f'{D}/raw', exist_ok=True)
P = Image.open(f'{D}/source/poster_velocity.webp').convert('RGB'); P.save(f'{D}/raw/poster.png'); W, H = P.size
sess = new_session('isnet-general-use')
# 1 · chaussure : détourage, coupe de l'éclaboussure sous la semelle, cœur opaque
cut = np.array(remove(P, session=sess)); a0 = cut[:, :, 3]
bnd = [(850, 1017), (823, 1066), (770, 1087), (709, 1078), (655, 1036), (549, 971), (442, 929), (342, 887), (289, 857), (190, 811), (117, 750), (100, 700)]
poly = np.array([(0, 0), (W, 0), (W, 1027)] + [(x, y + 10) for x, y in bnd] + [(0, 710)], np.int32)
m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [poly], 255); m = cv2.GaussianBlur(m, (0, 0), 1.6)
a = (a0.astype(np.float32) * m / 255).astype(np.uint8)
lab = cv2.connectedComponentsWithStats((a > 20).astype(np.uint8), 8); k = 1 + np.argmax(lab[2][1:, cv2.CC_STAT_AREA]); a[lab[1] != k] = 0
solid = (a > 30).astype(np.uint8); ff = solid.copy(); msk = np.zeros((H + 2, W + 2), np.uint8); cv2.floodFill(ff, msk, (0, 0), 2); solid = np.maximum(solid, (ff != 2).astype(np.uint8))
core = cv2.erode(solid, np.ones((7, 7), np.uint8)); a = np.maximum(a, core * 255).astype(np.uint8)
cut[:, :, 3] = a; ys, xs = np.where(a > 30); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
Image.fromarray(cut[y0:y1 + 1, x0:x1 + 1]).save(f'{D}/assets/shoe.png'); print('shoe', x1 - x0 + 1, y1 - y0 + 1)
# 2 · décor sans chaussure (inpainting à 1/3 de résolution, puis adouci)
mk = cv2.dilate((a > 8).astype(np.uint8) * 255, np.ones((31, 31), np.uint8))
for bx in ((110, 90, 815, 310), (140, 1370, 800, 1545)): mk[bx[1]:bx[3], bx[0]:bx[2]] = 255
sm = cv2.resize(np.array(P), (W // 3, H // 3), interpolation=cv2.INTER_AREA); mks = cv2.resize(mk, (W // 3, H // 3), interpolation=cv2.INTER_NEAREST)
inp = cv2.inpaint(cv2.cvtColor(sm, cv2.COLOR_RGB2BGR), mks, 9, cv2.INPAINT_TELEA)
up = cv2.GaussianBlur(cv2.resize(inp, (W, H), interpolation=cv2.INTER_CUBIC), (0, 0), 3)
base = cv2.cvtColor(np.array(P), cv2.COLOR_RGB2BGR); soft = cv2.GaussianBlur(mk, (0, 0), 14).astype(np.float32)[:, :, None] / 255
plate = (base * (1 - soft) + up * soft).astype(np.uint8); cv2.imwrite(f'{D}/assets/plate.jpg', plate, [cv2.IMWRITE_JPEG_QUALITY, 92])
# 3 · logo (clé de luminance : le fond sombre devient transparent)
def lumakey(box, lo=70, hi=190, out='x'):
    c = np.array(P.crop(box)).astype(np.float32); l = c.max(axis=2); al = np.clip((l - lo) / (hi - lo), 0, 1)
    rgba = np.dstack([c, al * 255]).astype(np.uint8); Image.fromarray(rgba).save(f'{D}/assets/{out}.png'); return rgba.shape
print('logo', lumakey((118, 160, 790, 255), 80, 200, 'logo'))
print('tag', lumakey((250, 262, 700, 305), 60, 150, 'tagline'))
# 4 · éclaboussures réelles (clé de luminance, mélange « screen » à l'usage)
def below(box, name, lo=40, hi=170):
    x0_, y0_, x1_, y1_ = box; c = np.array(P.crop(box)).astype(np.float32); al = np.clip((c.max(axis=2) - lo) / (hi - lo), 0, 1)
    mm = np.zeros((H, W), np.uint8); pl = np.array([(0, 716)] + [(x, y + 55) for x, y in reversed(bnd)] + [(W, 1130), (W, H), (0, H)], np.int32); cv2.fillPoly(mm, [pl], 255)
    mm = cv2.GaussianBlur(mm, (0, 0), 3)[y0_:y1_, x0_:x1_].astype(np.float32) / 255
    Image.fromarray(np.dstack([c, al * mm * 255]).astype(np.uint8)).save(f'{D}/assets/{name}.png')
below((0, 640, 420, 1010), 'splash1'); below((620, 1096, 900, 1270), 'splash2'); print('splashes ok')
# 5 · roches (détourage sur recadrage)
for nm, box in (('rock1', (60, 330, 175, 460)), ('rock2', (25, 470, 125, 590)), ('rock3', (440, 1040, 580, 1190)), ('rock4', (585, 1105, 650, 1175))):
    c = P.crop(box); r = remove(c, session=sess); r.save(f'{D}/assets/{nm}.png'); print(nm, r.size)
