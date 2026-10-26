"""Extrait les vraies réalisations de Tarik depuis son portfolio PDF (pages rendues à 150 dpi dans raw/pages, 3000×1688).
Coordonnées relevées sur une grille 800×450 (×3,75). Sortie : img/<nom>.jpg (ignoré par git), copiées ensuite dans le site. La photo de Tarik vient de photo.py."""
import os
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/img', exist_ok=True)
K = 3000 / 800
# nom : (page, x0, y0, x1, y1) en coordonnées 800×450
C = {
  'site-bestroas': (5, 0, 112, 238, 260), 'site-cehos': (5, 247, 112, 493, 260), 'site-prometheus': (5, 505, 112, 755, 260),
  'site-elvina-beloire': (5, 0, 293, 238, 415), 'site-lixy': (5, 247, 293, 493, 415), 'site-seqino': (5, 505, 293, 755, 415),
  'site-dgpa': (6, 0, 112, 238, 260), 'site-caroline-dubois': (6, 247, 112, 493, 260), 'site-on-my-way': (6, 505, 112, 755, 255),
  'site-ines-massage': (6, 0, 293, 238, 415), 'site-coach-du-bonheur': (6, 247, 293, 493, 405), 'site-ubbik': (6, 505, 293, 755, 412),
  'site-kiffe-les-maths': (7, 0, 112, 238, 260), 'site-culottes-menstruelles': (7, 247, 112, 493, 260), 'site-delicious-trends': (7, 505, 112, 755, 260),
  'site-carline-dubois': (7, 0, 293, 238, 415), 'site-bentow': (7, 247, 293, 493, 415), 'site-manhaj': (7, 505, 293, 755, 410),
  'deck-faireception': (8, 170, 140, 590, 380), 'deck-noula': (9, 120, 135, 585, 372), 'deck-lobbying': (10, 270, 120, 712, 385),
  'plaquette-audiweb': (11, 188, 128, 755, 450),
  'storyboard-instagram': (12, 72, 140, 755, 450), 'storyboard-linkedin': (13, 72, 122, 695, 450),
  'vente-marrakech-luxe': (14, 62, 115, 622, 435), 'vente-or-vert': (15, 62, 115, 625, 435), 'vente-gentlemans-cut': (16, 62, 115, 622, 435),
  'lead-magnet-quiz': (17, 62, 115, 670, 355),
  'visuels-collage': (18, 0, 68, 800, 450), 'visuel-podcast': (18, 0, 68, 147, 252), 'visuel-cannes': (18, 585, 68, 800, 448),
  'visuel-elite': (18, 270, 258, 408, 448), 'visuel-flic': (18, 420, 258, 557, 448),
  'conference-asp-cannes': (19, 22, 105, 410, 450),
  'affiche-proprio': (20, 0, 77, 196, 335), 'affiche-cannes-1': (20, 198, 77, 348, 335), 'affiche-cannes-2': (20, 350, 77, 500, 335), 'affiche-superman': (20, 507, 77, 797, 335),
  'logos-clients': (22, 0, 88, 800, 432),
}
for n, (p, x0, y0, x1, y1) in C.items():
    i = Image.open(f'{D}/raw/pages/p-{p:02d}.png').convert('RGB').crop(tuple(int(v * K) for v in (x0, y0, x1, y1)))
    i.thumbnail((1400, 1400)); i.save(f'{D}/img/{n}.jpg', quality=86, optimize=True, progressive=True)
print(len(C), 'extraits')
