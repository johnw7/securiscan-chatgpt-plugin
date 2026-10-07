import sys, numpy as np, cv2
from PIL import Image
P, OUT = sys.argv[1], sys.argv[2]
c = np.array(Image.open(P + '/policier/policier-detoure.webp').convert('RGBA')).astype(np.float32)
H, W = c.shape[:2]
fore = cv2.imread(OUT + '/fore.png', 0)
def poly(pts):
    m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.array(pts, np.int32)], 255); return m
leftfore = poly([(72,522),(120,516),(180,530),(240,556),(252,598),(232,616),(150,617),(95,614),(70,600)])
hole = cv2.dilate(fore | cv2.imread(OUT + '/fingers.png', 0) | leftfore, np.ones((7, 7), np.uint8)) > 0
fingers = cv2.dilate(cv2.imread(OUT + '/fingers.png', 0), np.ones((7, 7), np.uint8)) > 0
rgb = c[..., :3].copy()
yy, xx = np.mgrid[0:H, 0:W]
# 1) bandes bleues sous les doigts : recopie horizontale depuis la gauche
band = fingers & (yy >= 392) & (yy <= 458) & (xx <= 333)  # les bandes s'arrêtent sous le bras
# les bandes montent légèrement vers la droite : on cherche le décalage vertical qui raccorde le mieux
ref = rgb[396:456, 286].copy()
best = min(range(-10, 11), key=lambda d: np.abs(rgb[396 + d:456 + d, 286 - 52] - ref).sum())
rgb[band] = rgb[yy[band] + best, xx[band] - 52]
rest = hole & ~band
# 2) champ d'ombrage lisse (inpainting basse résolution depuis les bords)
s = 6
small = cv2.resize(rgb.astype(np.uint8), (W // s, H // s), interpolation=cv2.INTER_AREA)
ms = cv2.resize(cv2.dilate(rest.astype(np.uint8) * 255, np.ones((9, 9), np.uint8)), (W // s, H // s), interpolation=cv2.INTER_NEAREST)
base = cv2.inpaint(small, ms, 6, cv2.INPAINT_TELEA)
base = cv2.GaussianBlur(cv2.resize(base, (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32), (0, 0), 6)
# assombrit un peu (le ventre est dans l'ombre des bras disparus -> tissu navy moyen)
navy = np.array([24, 32, 66], np.float32)
base = base * 0.55 + navy * 0.45
# 3) grain du tissu + plis très doux (pas de motif répété)
rng = np.random.default_rng(7)
grain = cv2.GaussianBlur(rng.normal(0, 1, (H, W)).astype(np.float32), (0, 0), 0.8) * 5
folds = (np.sin((xx - 0.35 * yy) / 23.0) * 0.5 + np.sin((xx + 0.25 * yy) / 41.0) * 0.5) * 6
light = (1 - xx / W) * 10 - 4  # lumière venant de la gauche
detail = (grain + folds + light).astype(np.float32)[..., None]
fill = np.clip(base + detail, 0, 255)
# légère ombre sous la ligne de poitrine et près des bras
m = rest.astype(np.float32)
mf = cv2.GaussianBlur(m, (0, 0), 2.0)[..., None]
rgb = rgb * (1 - mf) + fill * mf
img = Image.fromarray(np.dstack([rgb, c[..., 3]]).astype(np.uint8))
a = np.array(img); a[..., 3][hole] = 255
img = Image.fromarray(a)
# 4) fermeture éclair prolongée (antialiasée)
a = np.array(img)
pts = np.array([[(210 - 0.2 * (y - 455)) * 4, y * 4] for y in range(452, 622, 2)], np.int32)
cv2.polylines(a, [pts], False, (8, 12, 28, 255), 4, cv2.LINE_AA, shift=2)
cv2.polylines(a, [pts + [12, 0]], False, (58, 70, 112, 255), 1, cv2.LINE_AA, shift=2)
img = Image.fromarray(a)
img.save(OUT + '/torso.png')
Image.fromarray(np.array(img)[380:720, :, :3]).resize((1090, 680)).save(OUT + '/torso_vis2.jpg')
