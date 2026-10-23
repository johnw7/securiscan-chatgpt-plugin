"""Planches de présentation (3840×2160) du kit social media : une par marque + une couverture.
Usage : python3 planches.py <dossier des visuels rendus par render_kit.sh> <dossier sortie>"""
import sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
W, H = 3840, 2160
INTER = '/usr/share/fonts/opentype/inter/Inter-%s.otf'
def F(name, size): return ImageFont.truetype(name, size)
STY = {
 'vyrox': dict(bg=(8, 10, 9), acc=(200, 255, 42), fg=(255, 255, 255), n='01', style='SPORT · ÉNERGIE', brand='VYROX', font=f'{D}/fonts/montserrat_bi.ttf', sub='Écouteurs de sport — marque fictive'),
 'noir': dict(bg=(13, 11, 9), acc=(216, 180, 122), fg=(239, 226, 200), n='02', style='LUXE · ÉDITORIAL', brand='NOIR ABSOLU', font=f'{D}/fonts/cormorant.ttf', sub='Parfum — marque fictive'),
 'velocity': dict(bg=(242, 238, 230), acc=(255, 90, 31), fg=(17, 17, 17), n='03', style='STREET · AUDACIEUX', brand='VELOCITY', font=f'{D}/fonts/anton.ttf', sub='Sneakers — marque fictive')}
def shadow(base, box, r=40, off=(0, 30), a=150):
    sh = Image.new('RGBA', base.size, (0, 0, 0, 0)); d = ImageDraw.Draw(sh); x0, y0, x1, y1 = box
    d.rounded_rectangle((x0 + off[0], y0 + off[1], x1 + off[0], y1 + off[1]), r, fill=(0, 0, 0, a)); base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(45)))
def place(base, im, x, y, w, r=24, sh=True):
    im = im.convert('RGBA'); h = int(w * im.height / im.width); im = im.resize((w, h), Image.LANCZOS)
    if sh: shadow(base, (x, y, x + w, y + h), r)
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=255); base.paste(im, (x, y), m); return h
def phone(base, im, x, y, w):
    pad = int(w * .045); h = int((w - 2 * pad) * 1920 / 1080) + 2 * pad; shadow(base, (x, y, x + w, y + h), int(w * .14), (0, 40), 170)
    d = ImageDraw.Draw(base); d.rounded_rectangle((x, y, x + w, y + h), int(w * .14), fill=(18, 18, 20)); d.rounded_rectangle((x + 4, y + 4, x + w - 4, y + h - 4), int(w * .13), outline=(70, 70, 76), width=3)
    sw = w - 2 * pad; sh_ = h - 2 * pad; scr = im.convert('RGBA').resize((sw, int(sw * im.height / im.width)), Image.LANCZOS).crop((0, 0, sw, sh_))
    m = Image.new('L', (sw, sh_), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, sw - 1, sh_ - 1), int(w * .1), fill=255); base.paste(scr, (x + pad, y + pad), m)
    d.rounded_rectangle((x + w * .36, y + pad + 14, x + w * .64, y + pad + 14 + w * .07), int(w * .035), fill=(0, 0, 0)); return h
def label(d, x, y, t, c, size=34): d.text((x, y), t, font=F(INTER % 'SemiBold', size), fill=c)
def board_full(b):
    s = STY[b]; base = Image.new('RGBA', (W, H), s['bg'] + (255,)); d = ImageDraw.Draw(base); sub = tuple(int(v * .62 + s['bg'][i] * .38) for i, v in enumerate(s['fg']))
    I = {f: Image.open(f'{SRC}/{b}_{f}.png') for f in ['post', 'story', 'carre', 'banner', 'c1', 'c2', 'c3']}
    d.text((150, 110), f"STYLE {s['n']}  ·  KIT SOCIAL MEDIA", font=F(INTER % 'SemiBold', 40), fill=s['acc'])
    d.text((150, 160), s['style'], font=F(s['font'], 150), fill=s['fg'])
    d.text((150, 360), f"{s['brand']} — {s['sub']} · 7 formats prêts à publier", font=F(INTER % 'Regular', 44), fill=sub)
    d.rectangle((150, 440, 450, 448), fill=s['acc'])
    phone(base, I['story'], 150, 540, 690); d.text((150, 2000), 'STORY · REEL  9:16', font=F(INTER % 'SemiBold', 34), fill=sub)
    place(base, I['post'], 960, 540, 760); d.text((960, 1520), 'POST  4:5', font=F(INTER % 'SemiBold', 34), fill=sub)
    place(base, I['carre'], 960, 1610, 420, 16); d.text((1410, 1640), 'POST CARRÉ\n1:1', font=F(INTER % 'SemiBold', 34), fill=sub, spacing=10)
    place(base, I['banner'], 1840, 540, 1850); d.text((1840, 1600), 'BANNIÈRE  16:9 · LinkedIn · YouTube · site', font=F(INTER % 'SemiBold', 34), fill=sub)
    cw = 420
    for i, f in enumerate(['c1', 'c2', 'c3']): place(base, I[f], 1840 + i * (cw + 30), 1670 - 0, cw, 16) if False else None
    # carrousel en bas à droite (3 slides, se chevauchent légèrement)
    x0 = 2560; cw = 340
    for i, f in enumerate(['c1', 'c2', 'c3']): place(base, I[f], x0 + 40 + i * (cw + 24), 1630, cw, 14)
    d.text((1840, 1700), 'CARROUSEL\n3 slides  4:5', font=F(INTER % 'SemiBold', 34), fill=sub, spacing=10)
    d.text((1840, 1880), 'Concept · direction artistique\n· déclinaisons multi-formats', font=F(INTER % 'Regular', 30), fill=sub, spacing=10)
    d.text((W - 150, H - 28), 'Démo conceptuelle · marque fictive · E-DUST Solutions — edust-solutions.fr', font=F(INTER % 'Regular', 28), fill=sub, anchor='rs')
    base.convert('RGB').save(f'{OUT}/planche_{s["n"]}_{b}.jpg', quality=92); print('ok', b)
def cover():
    base = Image.new('RGBA', (W, H), (10, 10, 12, 255)); d = ImageDraw.Draw(base)
    d.text((W / 2, 230), 'KIT SOCIAL MEDIA', font=F(INTER % 'SemiBold', 54), fill=(200, 200, 205), anchor='mm')
    d.text((W / 2, 380), '3 marques. 3 styles. Tous les formats.', font=F(f'{D}/fonts/anton.ttf', 150), fill=(255, 255, 255), anchor='mm')
    cols = [('vyrox', 'SPORT · ÉNERGIE'), ('noir', 'LUXE · ÉDITORIAL'), ('velocity', 'STREET · AUDACIEUX')]; w = 860; gap = (W - 3 * w) // 4
    for i, (b, st) in enumerate(cols):
        x = gap + i * (w + gap); place(base, Image.open(f'{SRC}/{b}_post.png'), x, 560, w, 28); s = STY[b]
        d.rectangle((x, 1680, x + 120, 1688), fill=s['acc']); d.text((x, 1710), f"STYLE {s['n']}", font=F(INTER % 'SemiBold', 34), fill=s['acc']); d.text((x, 1760), st, font=F(INTER % 'Bold', 52), fill=(255, 255, 255))
        d.text((x, 1840), s['brand'] + ' · ' + s['sub'].split(' — ')[0], font=F(INTER % 'Regular', 34), fill=(170, 170, 176))
    d.text((W / 2, 2010), 'Tarik Belattar — E-DUST Solutions · 06 13 24 96 80 · tarikbelatta@gmail.com · edust-solutions.fr', font=F(INTER % 'Regular', 34), fill=(200, 200, 205), anchor='mm')
    d.text((W / 2, 2075), 'Marques fictives créées pour la démonstration', font=F(INTER % 'Regular', 26), fill=(130, 130, 136), anchor='mm')
    base.convert('RGB').save(f'{OUT}/planche_00_couverture.jpg', quality=92); print('ok cover')
for b in STY: board_full(b)
cover()
