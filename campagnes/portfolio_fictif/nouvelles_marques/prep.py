"""Prépare les photos Adobe Stock (licence gratuite, dans raw/) : détourage canette + glace, versions web légères dans img/."""
import os, numpy as np
from PIL import Image
from rembg import remove, new_session
D = os.path.dirname(os.path.abspath(__file__)); S = new_session('isnet-general-use')
def jpg(n, w=1200, crop=None):
    i = Image.open(f'{D}/raw/{n}.jpg').convert('RGB'); i = i.crop(crop) if crop else i
    i.resize((w, int(w * i.height / i.width)), Image.LANCZOS).save(f'{D}/img/{n}.jpg', quality=84, optimize=True, progressive=True)
def cut(n, w=900):
    i = Image.open(f'{D}/raw/{n}.jpg').convert('RGB'); o = remove(i, session=S); bb = o.getbbox(); o = o.crop(bb)
    o.resize((w, int(w * o.height / o.width)), Image.LANCZOS).save(f'{D}/img/{n}_cut.png', optimize=True)
for n in ['aura', 'solara', 'nomade', 'rouge']: jpg(n)
cut('fizz', 700); cut('glou', 640)
print('ok')
