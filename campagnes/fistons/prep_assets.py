"""Télécharge les photos du site restaurant-lesfistons.fr (propriété du restaurant, photographes
J. Célice / C. Sautet) et prépare : version HD allégée + fond flou chaud. Non versionnées (assets/ ignoré).
Usage : python3 prep_assets.py"""
import os, io, urllib.request
from PIL import Image, ImageFilter, ImageEnhance
D = os.path.dirname(os.path.abspath(__file__))
os.makedirs(f'{D}/assets', exist_ok=True)
B = 'https://restaurant-lesfistons.fr/wp-content/uploads/'
P = 'BISTROTS_DES_FAMILLES_FELICITA_DIAPORAMA_'
# uniquement des photos des Fistons (les visuels d'autres bistrots du groupe sont écartés)
M = {'facade': f'2022/11/20250604-{P}950x634px-4.jpg', 'terrasse': f'2022/11/20250604-{P}1800x750px-1.jpg',
     'chateau': f'2022/11/20250604-{P}950x634px-3.jpg', 'entrecote': f'2022/10/20250604-{P}600x600px-3.jpg',
     'confit': f'2022/11/20250604-{P}950x634px-1.jpg', 'burger': f'2023/12/20250604-{P}1800x750px-6.jpg',
     'vins': f'2022/11/20250604-{P}950x634px-5.jpg', 'vins2': f'2022/11/20250604-{P}950x634px-6.jpg',
     'salle': f'2022/10/20250604-{P}600x600px-1.jpg', 'salle2': f'2023/12/20250604-{P}1800x750px-3.jpg',
     'amis': f'2022/11/20250604-{P}950x634px-2.jpg', 'tataki': f'2022/11/20250604-{P}950x634px-7.jpg'}
for k, u in M.items():
    req = urllib.request.Request(B + u, headers={'User-Agent': 'Mozilla/5.0'})
    im = Image.open(io.BytesIO(urllib.request.urlopen(req).read())).convert('RGB')
    im.thumbnail((2200, 2200), Image.LANCZOS); im.save(f'{D}/assets/{k}.jpg', quality=90)
    b = im.copy(); b.thumbnail((240, 240)); b = b.filter(ImageFilter.GaussianBlur(8))
    b = ImageEnhance.Brightness(ImageEnhance.Color(b).enhance(1.25)).enhance(.82); b.save(f'{D}/assets/{k}_bg.jpg', quality=85)
    print(k, im.size)
