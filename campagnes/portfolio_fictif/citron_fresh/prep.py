"""Prépare les éléments Adobe Stock (raw/ -> out/el/) : citrons, tranche et menthe détourés (rembg, un fichier par élément),
glaçons recadrés sur fond blanc (incrustés en mode « produit » pour garder leur transparence), éclaboussures sur noir (mode « écran »)."""
import os, numpy as np
from PIL import Image
from scipy import ndimage
from rembg import remove, new_session
D = os.path.dirname(os.path.abspath(__file__)); R, O = f'{D}/raw', f'{D}/out/el'; os.makedirs(O, exist_ok=True)
S = new_session('isnet-general-use')

def pieces(name, out, min_area=.01, maxw=900):
    im = Image.open(f'{R}/{name}').convert('RGB'); cut = np.asarray(remove(im, session=S))
    a = cut[..., 3] > 40; lab, n = ndimage.label(ndimage.binary_closing(a, iterations=4))
    k = 0
    for i, sl in enumerate(ndimage.find_objects(lab)):
        if (lab[sl] == i + 1).sum() < min_area * a.size: continue
        p = Image.fromarray(cut[sl]).copy(); m = (lab[sl] == i + 1)
        arr = np.asarray(p).copy(); arr[..., 3] = np.where(m, arr[..., 3], 0); p = Image.fromarray(arr)
        if p.width > maxw: p = p.resize((maxw, int(maxw * p.height / p.width)), Image.LANCZOS)
        p.save(f'{O}/{out}_{k}.png'); k += 1
    print(name, k)
pieces('p_citron.jpg', 'citron', .02)
pieces('p_tranche.jpg', 'tranche', .05)
pieces('p_menthe.jpg', 'menthe', .008, 500)
g = Image.open(f'{R}/p_glacons.jpg').convert('RGB'); w = g.width / 4
for k in range(4): g.crop((int(k * w), 0, int((k + 1) * w), g.height)).resize((420, int(420 * g.height / w)), Image.LANCZOS).save(f'{O}/glacon_{k}.jpg', quality=92)
for k, n in enumerate(['p_splash1.jpg', 'p_splash2.jpg']):
    s = Image.open(f'{R}/{n}').convert('RGB'); s.thumbnail((1600, 1600)); s.save(f'{O}/splash_{k}.jpg', quality=92)
print('ok')
