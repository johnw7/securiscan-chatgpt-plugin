import sys, json, numpy as np, cv2
from PIL import Image
P, OUT = sys.argv[1], sys.argv[2]
pol = np.array(Image.open(P + '/policier/policier-detoure.webp').convert('RGBA')).astype(np.float32)
kid = np.array(Image.open(P + '/enfant/enfant-detoure.webp').convert('RGBA')).astype(np.float32)
H, W = pol.shape[:2]
def poly(shape, pts):
    m = np.zeros(shape, np.uint8); cv2.fillPoly(m, [np.array(pts, np.int32)], 255); return m
# --- manche (avant-bras) nette, sans doigts ni main glissée ---
sleeve = poly((H, W), [(141,474),(200,469),(300,466),(333,455),(373,447),(392,470),(396,520),(392,548),(380,562),
                       (340,575),(300,582),(233,568),(190,550),(167,535),(140,522),(136,500)])
fingers_m = cv2.dilate(poly((H, W), [(292,440),(305,425),(325,424),(345,430),(352,446),(340,466),(318,474),(298,470)]), np.ones((11, 11), np.uint8))
sleeve = cv2.subtract(sleeve, fingers_m)
sleeve = cv2.GaussianBlur(sleeve.astype(np.float32) / 255, (0, 0), 1.0)
sl = pol.copy(); sl[..., 3] *= sleeve
x0, y0, x1, y1 = 128, 440, 402, 590
sl = sl[y0:y1, x0:x1][:, ::-1]           # miroir : coude à gauche, poignet à droite
sw = x1 - x0
elbow = (x1 - 1 - 378, 515 - y0)         # pivot du coude dans la pièce
wrist = (x1 - 1 - 142, 498 - y0)         # centre du poignet (manchette)
# --- teinte de peau du policier ---
face = pol[150:240, 215:300, :3].reshape(-1, 3); skin_p = np.median(face, 0)
# --- main ouverte (paume vers le haut) : main de l'enfant, recolorée et réduite ---
hand = kid[405:610, 556:735].copy()
hy, hx = np.mgrid[0:hand.shape[0], 0:hand.shape[1]]
skinmask = (hand[..., 0] > hand[..., 2] + 40) & (hand[..., 3] > 10)
kid_skin = np.median(hand[..., :3][skinmask], 0)
hand[..., :3][skinmask] = np.clip(hand[..., :3][skinmask] * (skin_p / kid_skin), 0, 255)
# garder la main seule (sans la manche de l'enfant) : pixels de peau + contour proche
keep = cv2.dilate(skinmask.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32)
keep = cv2.GaussianBlur(keep, (0, 0), 1.0)
hand[..., 3] *= keep
hand_img = Image.fromarray(hand.astype(np.uint8))
k_wrist = np.array([575 - 556, 572 - 405], float)  # poignet de l'enfant dans le crop
def compose(base, base_wrist, part, part_wrist, angle, scale, extra=(0, 0)):
    """Colle `part` (tourné de angle°, mis à l'échelle) pour que son poignet tombe sur base_wrist."""
    pw, ph = part.size
    part = part.resize((int(pw * scale), int(ph * scale)), Image.LANCZOS)
    pwr = np.array(part_wrist) * scale
    cx, cy = part.size[0] / 2, part.size[1] / 2
    rot = part.rotate(angle, resample=Image.BICUBIC, expand=True)
    a = np.deg2rad(angle); v = pwr - [cx, cy]
    vr = np.array([v[0] * np.cos(a) + v[1] * np.sin(a), -v[0] * np.sin(a) + v[1] * np.cos(a)])
    wr = vr + [rot.size[0] / 2, rot.size[1] / 2]
    pad = 260
    canvas = Image.new('RGBA', (base.size[0] + 2 * pad, base.size[1] + 2 * pad), (0, 0, 0, 0))
    pos = (int(base_wrist[0] + pad - wr[0] + extra[0]), int(base_wrist[1] + pad - wr[1] + extra[1]))
    canvas.alpha_composite(base, (pad, pad))
    layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0)); layer.paste(rot, pos, rot)
    return canvas, layer, pad
slv = Image.fromarray(sl.astype(np.uint8))
# avant-bras « geste » : main ouverte dans le prolongement (doigts vers l'extérieur)
c1, hl, pad = compose(slv, wrist, hand_img, k_wrist, -36, 0.78, extra=(-6, 2))
geste = Image.alpha_composite(hl, c1)  # la main passe sous la manchette
bb = geste.getbbox(); geste = geste.crop(bb)
geste_pivot = (elbow[0] + pad - bb[0], elbow[1] + pad - bb[1])
# avant-bras « ceinture » : manche un peu raccourcie (raccourci perspectif) + doigts du policier
fing = pol[420:478, 288:356].copy()
fm = poly((H, W), [(292,440),(305,425),(325,424),(345,430),(352,446),(340,466),(318,474),(298,470)])[420:478, 288:356]
fm = cv2.GaussianBlur(fm.astype(np.float32) / 255, (0, 0), 1.0); fing[..., 3] *= fm
fing_img = Image.fromarray(fing.astype(np.uint8))
short = slv.resize((int(sw * 0.8), slv.size[1]), Image.LANCZOS)
w2 = (wrist[0] * 0.8, wrist[1]); e2 = (elbow[0] * 0.8, elbow[1])
c2, fl, pad = compose(short, w2, fing_img, (8, 25), -55, 1.0, extra=(2, 4))
ceint = Image.alpha_composite(c2, fl)
bb2 = ceint.getbbox(); ceint = ceint.crop(bb2)
ceint_pivot = (e2[0] + pad - bb2[0], e2[1] + pad - bb2[1])
geste.save(OUT + '/policier-avantbras-geste.png'); ceint.save(OUT + '/policier-avantbras-ceinture.png')
json.dump({'geste': {'size': geste.size, 'pivot': geste_pivot}, 'ceinture': {'size': ceint.size, 'pivot': ceint_pivot}},
          open(OUT + '/arms.json', 'w'))
print(json.load(open(OUT + '/arms.json')))
