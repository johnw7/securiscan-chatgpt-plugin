import sys, json, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
P = sys.argv[1]; OUT = P + '/rig'
def load(p): return np.array(Image.open(p).convert('RGBA')).astype(np.float32)
def save(a, name):
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(f'{OUT}/{name}.webp', quality=92, method=6, lossless=False)
def ramp(y, y0, y1):  # 1 above y0, 0 below y1
    return np.clip((y1 - y) / (y1 - y0), 0, 1)
def inpaint(rgb, mask, r=9):
    return cv2.inpaint(rgb.astype(np.uint8), mask.astype(np.uint8), r, cv2.INPAINT_TELEA).astype(np.float32)

def lid_overlay(rgba, eyes, name, color=(70, 40, 30)):
    """Paupières fermées : yeux remplacés par la peau (inpainting) + trait de cils courbé."""
    h, w = rgba.shape[:2]
    m = np.zeros((h, w), np.uint8)
    for (x0, y0, x1, y1, _) in eyes:
        cv2.ellipse(m, ((x0 + x1) // 2, (y0 + y1) // 2), ((x1 - x0) // 2 + 3, (y1 - y0) // 2 + 3), 0, 0, 360, 255, -1)
    rgb = rgba[..., :3].copy()
    yy_, xx_ = np.mgrid[0:h, 0:w]
    for (x0, y0, x1, y1, _) in eyes:
        cx, cy, rx, ry = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 + 3, (y1 - y0) / 2 + 3
        dist = ((xx_ - cx) / rx) ** 2 + ((yy_ - cy) / ry) ** 2
        ring = (dist > 1.3) & (dist < 2.6)
        px = rgba[..., :3][ring]; lum = px.mean(1)
        skin = px[(lum > np.percentile(lum, 55))]
        col = np.median(skin, 0)
        inside = dist <= 1.15
        # paupière : couleur de peau, légèrement plus sombre en haut (pli de la paupière)
        shade = 0.86 + 0.14 * np.clip((yy_ - (cy - ry)) / (2 * ry), 0, 1)
        rgb[inside] = (col[None, :] * shade[inside][:, None])
    soft = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 2.5) / 255
    img = Image.fromarray(np.dstack([rgb, soft * 255]).astype(np.uint8))
    d = ImageDraw.Draw(img)
    for (x0, y0, x1, y1, tilt) in eyes:
        cy = (y0 + y1) / 2 + (y1 - y0) * 0.12
        pts = []
        for i in range(21):
            u = i / 20
            x = x0 + 2 + (x1 - x0 - 4) * u
            y = cy + tilt * (u - 0.5) + np.sin(np.pi * u) * (y1 - y0) * 0.22
            pts.append((x, y))
        d.line(pts, fill=color + (255,), width=max(3, int((x1 - x0) / 14)), joint='curve')
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    a = np.array(img).astype(np.float32)
    ys, xs = np.where(m > 0); pad = 6
    box = (int(xs.min()) - pad, int(ys.min()) - pad, int(xs.max()) + pad, int(ys.max()) + pad)
    crop = a[box[1]:box[3], box[0]:box[2]]
    save(crop, name)
    return box

def mouth_sprite(rgba, cx, cy, rx, ry, name):
    h, w = rgba.shape[:2]
    m = np.zeros((h, w), np.float32)
    cv2.ellipse(m, (cx, cy), (rx, ry), -12, 0, 360, 1.0, -1)
    m = cv2.GaussianBlur(m, (0, 0), 2.2)
    a = rgba.copy(); a[..., 3] = 255 * m
    box = (cx - rx - 8, cy - ry - 8, cx + rx + 8, cy + ry + 8)
    save(a[box[1]:box[3], box[0]:box[2]], name)
    return box

meta = {}
yy = None
# ---------------- Enfant ----------------
c = load(P + '/enfant/enfant-detoure.webp'); H, W = c.shape[:2]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
CUT_C = 400  # menton / col de la capuche
head_w = ramp(yy, CUT_C, CUT_C + 22)
head = c.copy(); head[..., 3] *= head_w
# bouche d'origine (ouverte) -> sprite animable ; tête avec bouche « effacée »
mbox = mouth_sprite(c, 321, 328, 44, 21, 'enfant-bouche')
mm = np.zeros((H, W), np.uint8); cv2.ellipse(mm, (321, 328), (48, 25), -12, 0, 360, 255, -1)
head[..., :3] = inpaint(c[..., :3], mm, 12)
# main (geste) : à droite du poignet
HAND_X = 572
hand_w = np.clip((xx - (HAND_X - 18)) / 18, 0, 1) * (yy < 640)
hand = c.copy(); hand[..., 3] *= hand_w
body = c.copy(); body[..., 3] *= (1 - (yy < CUT_C)) * (1 - ((xx > HAND_X) & (yy < 640)))
save(body, 'enfant-corps'); save(head, 'enfant-tete'); save(hand, 'enfant-main')
lbox = lid_overlay(c, [(218, 222, 282, 284, -6), (318, 196, 364, 252, -6)], 'enfant-paupieres')
meta['enfant'] = dict(w=W, h=H, neck=[270, 418], wrist=[566, 566], mouth=mbox, lids=lbox)

# ---------------- Policier ----------------
# Buste « bras décroisés » produit par pose_masks.py + torso.py + pose_arms.py (dossier de travail WORK)
WORK = sys.argv[2] if len(sys.argv) > 2 else 'pose-work'
c = load(P + '/policier/policier-detoure.webp'); H, W = c.shape[:2]
buste = load(WORK + '/torso.png')
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
CUT_P = 262
head = c.copy()
# le sourire en coin d'origine est effacé : seule la bouche animée reste visible (pas de « double bouche »)
mm = np.zeros((H, W), np.uint8)
cv2.polylines(mm, [np.array([(222, 203), (240, 208), (260, 207), (280, 200), (298, 190), (306, 183)], np.int32)], False, 255, 13)
cv2.circle(mm, (295, 185), 11, 255, -1)  # fossette sombre du sourire en coin
fill = cv2.inpaint(c[..., :3].astype(np.uint8), mm, 4, cv2.INPAINT_NS).astype(np.float32)
fm = cv2.GaussianBlur(mm.astype(np.float32) / 255, (0, 0), 2.0)[..., None]
head[..., :3] = c[..., :3] * (1 - fm) + fill * fm
head[..., 3] *= ramp(yy, CUT_P, CUT_P + 18)
body = buste.copy(); body[..., 3] *= (1 - (yy < CUT_P))
save(body, 'policier-corps'); save(head, 'policier-tete')
lbox = lid_overlay(c, [(204, 136, 242, 164, -4), (263, 121, 303, 151, -5)], 'policier-paupieres', color=(55, 32, 25))
arms = json.load(open(WORK + '/arms.json'))
for name in ('geste', 'ceinture'):
    save(np.array(Image.open(f'{WORK}/policier-avantbras-{name}.png').convert('RGBA')).astype(np.float32), f'policier-avantbras-{name}')
meta['policier'] = dict(w=W, h=H, neck=[262, 268], lids=lbox, arms=arms)
json.dump(meta, open(OUT + '/rig.json', 'w'), indent=1)
print(json.dumps(meta))
