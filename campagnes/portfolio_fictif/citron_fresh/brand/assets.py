"""Images de la charte CITRON FRESH (brand/img/) : canette 3D sous plusieurs angles (couleurs de la charte),
images extraites des ralentis Adobe Stock, éléments détourés. Usage : python3 brand/assets.py"""
import os, sys, subprocess, shutil, numpy as np
from PIL import Image
B = os.path.dirname(os.path.abspath(__file__)); C = os.path.dirname(B); sys.path.insert(0, C)
from can3d import Can
O = f'{B}/img'; os.makedirs(O, exist_ok=True)
def save(rgba, n): Image.fromarray((np.clip(rgba, 0, 1) * 255).astype(np.uint8), 'RGBA').save(f'{O}/{n}.png', optimize=True)
c = Can(1400, 9)
for n, r, op in [('can_face', 0, False), ('can_34', .1, False), ('can_profil', .25, False), ('can_dos', .5, False), ('can_ouverte', 0, True)]:
    save(c.render(r, op), n)
save(Can(1500, 4).render(0), 'can_hero'); save(Can(1400, 24).render(.04), 'can_dessus')
for n, f, t, vf in [('plongeon', 's1_citron_plonge.mov', 1.35, 'crop=1080:1920:0:40'),
                    ('ouverture', 's3_ouverture.mov', 8.35, 'crop=1100:1956:1450:204,scale=1080:1920'),
                    ('noir', 's3_citrons_noir.mov', 5.6, 'scale=1080:1920'), ('vortex', 's4_vortex.mov', 3.0, 'scale=1080:1920'),
                    ('menthe_eau', 's4_tranches_menthe.mov', 5.0, 'scale=1080:1920')]:
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', f'{C}/raw/{f}', '-vf', vf, '-frames:v', '1', '-q:v', '2', f'{O}/{n}.jpg'], check=True)
for n in ['citron_0.png', 'tranche_0.png', 'menthe_0.png', 'menthe_1.png', 'menthe_2.png', 'glacon_0.jpg', 'glacon_2.jpg', 'splash_0.jpg', 'splash_1.jpg']:
    shutil.copy(f'{C}/out/el/{n}', f'{O}/{n}')
print(sorted(os.listdir(O)))
