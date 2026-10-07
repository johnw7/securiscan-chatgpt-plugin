import sys, numpy as np, cv2
from PIL import Image
P, OUT = sys.argv[1], sys.argv[2]
c = np.array(Image.open(P + '/policier/policier-detoure.webp').convert('RGBA'))
H, W = c.shape[:2]
def poly(pts):
    m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.array(pts, np.int32)], 255); return m
# avant-bras supérieur (bras gauche du policier, à droite de l'image) + main glissée sous le bras opposé
fore = poly([(112,478),(128,468),(150,466),(190,462),(240,460),(300,458),(345,450),(372,446),(392,470),(398,520),
             (392,560),(370,578),(330,590),(290,588),(240,575),(200,560),(165,540),(140,530),(118,518)])
# doigts de l'autre main posés sur l'avant-bras (en haut à droite)
fingers = poly([(292,440),(305,425),(325,424),(345,430),(352,446),(340,466),(318,474),(298,470)])
cv2.imwrite(OUT + '/fore.png', fore); cv2.imwrite(OUT + '/fingers.png', fingers)
vis = c[..., :3].copy()
vis[fore > 0] = (vis[fore > 0] * 0.4 + np.array([255, 0, 0]) * 0.6).astype(np.uint8)
vis[fingers > 0] = (vis[fingers > 0] * 0.4 + np.array([0, 255, 0]) * 0.6).astype(np.uint8)
Image.fromarray(vis[380:720, 0:545]).resize((1090, 680)).save(OUT + '/masks_vis.jpg')
