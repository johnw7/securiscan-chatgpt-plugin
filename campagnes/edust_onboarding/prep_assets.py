"""Découpe les poses d'Alex dans la planche de référence (assets/alex_reference_sheet.webp)."""
import os, cv2, numpy as np
D = os.path.dirname(os.path.abspath(__file__))
A = f'{D}/assets'
src = cv2.imread(f'{A}/alex_reference_sheet.webp', cv2.IMREAD_COLOR)

def up(img, k=2):
    img = cv2.resize(img, None, fx=k, fy=k, interpolation=cv2.INTER_LANCZOS4)
    blur = cv2.GaussianBlur(img, (0, 0), 1.2)
    return cv2.addWeighted(img, 1.35, blur, -0.35, 0)

# héros (main tendue) : on efface le texte de la planche par inpainting
hero = src[0:690, 0:480].copy()
mask = np.zeros(hero.shape[:2], np.uint8)
gray = cv2.cvtColor(hero[20:285, 20:195], cv2.COLOR_BGR2GRAY)
txt = ((gray > 185) | ((hero[20:285, 20:195, 0] > 180) & (hero[20:285, 20:195, 2] < 120))).astype(np.uint8) * 255
mask[20:285, 20:195] = cv2.dilate(txt, np.ones((7, 7), np.uint8))
hero = cv2.inpaint(hero, mask, 9, cv2.INPAINT_TELEA)
cv2.imwrite(f'{A}/alex_hero.png', up(hero))

def cutout(x0, y0, x1, y1, name):
    c = src[y0:y1, x0:x1].copy()
    h, w = c.shape[:2]
    # détourage GrabCut (le fond gris clair est proche du blanc des baskets)
    m = np.zeros((h, w), np.uint8)
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(c, m, (4, 4, w - 8, h - 8), bgd, fgd, 8, cv2.GC_INIT_WITH_RECT)
    alpha = np.where((m == 1) | (m == 3), 255, 0).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(alpha)
    keep = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
    alpha = np.where(lab == keep, 255, 0).astype(np.uint8)
    c, alpha = up(c), cv2.resize(alpha, None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR)
    alpha = cv2.GaussianBlur(cv2.erode(alpha, np.ones((3, 3), np.uint8)), (0, 0), 1.0)
    cv2.imwrite(f'{A}/{name}.png', np.dstack([c, alpha]))

cutout(485, 28, 668, 612, 'alex_face')     # vue de face, pied

for name, x0, x1 in [('souriant', 20, 164), ('clin', 173, 318), ('surpris', 327, 469),
                     ('reflechi', 478, 621), ('confiant', 629, 770), ('bienveillant', 778, 918)]:
    cv2.imwrite(f'{A}/expr_{name}.png', up(src[748:941, x0:x1]))
for name, x0, x1 in [('accueil', 20, 289), ('outils', 302, 570), ('equipe', 582, 857), ('conclusion', 869, 1128)]:
    cv2.imwrite(f'{A}/scene_{name}.png', up(src[1049:1320, x0:x1]))
print('ok')
