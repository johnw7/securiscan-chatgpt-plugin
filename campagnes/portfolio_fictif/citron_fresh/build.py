"""CITRON FRESH — pub Reels 15 s, 9:16 (1080×1920, 30 i/s). Ralentis Adobe Stock + canette 3D (can3d.py) + éléments détourés (prep.py).
Étapes : python3 build.py clips (conforme les rushes en images) · python3 build.py frames [debut fin] · python3 build.py stills t1 t2 …
Images : out/frames/%04d.jpg ; le montage vidéo + son se fait dans export.sh."""
import os, sys, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from multiprocessing import Pool
D = os.path.dirname(os.path.abspath(__file__)); W, H, FPS, DUR = 1080, 1920, 30, 15.0; N = int(DUR * FPS)
OUT = f'{D}/out'; FONTS = f'{D}/../visuels/fonts'
sys.path.insert(0, D); from can3d import Can

# ---------- rushes conformés (images 1080×1920 à 30 i/s)
CLIPS = {  # nom: (fichier, début, durée source, durée montage, filtre de cadrage)
    'c1': ('s1_citron_plonge.mov', 1.05, 2.45, 3.0, 'crop=1080:1920:0:40'),
    'c2': ('s4_tranches_menthe.mov', 2.0, 3.0, 3.0, 'scale=1080:1920'),
    'c3a': ('s3_ouverture.mov', 7.3, 1.6, 1.5, 'crop=1100:1956:1450:204,scale=1080:1920'),
    'c3b': ('s3_soda_glace.mov', 3.0, 1.2, 1.0, 'scale=1080:1920'),
    'c5': ('s4_tranches_menthe.mov', 8.0, 2.0, 2.0, 'scale=1080:1920'),
    'fx': ('fx_bulles.mov', 2.0, 7.0, 7.0, 'scale=1080:1920'),
}
def clips():
    for k, (f, ss, ls, lm, vf) in CLIPS.items():
        o = f'{OUT}/clip_{k}'; os.makedirs(o, exist_ok=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(ss), '-t', str(ls), '-i', f'{D}/raw/{f}', '-vf',
                        f'{vf},setpts=PTS*{lm / ls:.5f},fps={FPS}', '-frames:v', str(int(round(lm * FPS))), '-q:v', '2', f'{o}/%04d.jpg'], check=True)
        print(k, len(os.listdir(o)))
def clip(k, i):
    n = len(os.listdir(f'{OUT}/clip_{k}')); i = int(min(max(i, 0), n - 1))
    return np.asarray(Image.open(f'{OUT}/clip_{k}/{i + 1:04d}.jpg').convert('RGB'), np.float32) / 255

# ---------- outils
def ease(x): x = min(max(x, 0), 1); return 1 - (1 - x) ** 3
def ease_io(x): x = min(max(x, 0), 1); return 3 * x * x - 2 * x ** 3
def back(x, s=1.7): x = min(max(x, 0), 1) - 1; return 1 + (s + 1) * x ** 3 + s * x ** 2
def over(dst, rgba, cx, cy, alpha=1.0):
    """Colle une image RGBA (float) centrée en (cx, cy)."""
    h, w = rgba.shape[:2]; x0, y0 = int(round(cx - w / 2)), int(round(cy - h / 2))
    xa, ya, xb, yb = max(x0, 0), max(y0, 0), min(x0 + w, W), min(y0 + h, H)
    if xa >= xb or ya >= yb: return
    s = rgba[ya - y0:yb - y0, xa - x0:xb - x0]; a = s[..., 3:4] * alpha
    dst[ya:yb, xa:xb] = dst[ya:yb, xa:xb] * (1 - a) + s[..., :3] * a
def blend(dst, rgb, cx, cy, mode, k=1.0):
    h, w = rgb.shape[:2]; x0, y0 = int(round(cx - w / 2)), int(round(cy - h / 2))
    xa, ya, xb, yb = max(x0, 0), max(y0, 0), min(x0 + w, W), min(y0 + h, H)
    if xa >= xb or ya >= yb: return
    s = rgb[ya - y0:yb - y0, xa - x0:xb - x0, :3]; d = dst[ya:yb, xa:xb]
    r = d * s if mode == 'mul' else 1 - (1 - d) * (1 - s)
    dst[ya:yb, xa:xb] = d * (1 - k) + r * k
_IM = {}
def el(name, scale=1.0, rot=0.0, blur=0):
    """Élément (out/el) en float RGBA, mis à l'échelle / tourné."""
    if name not in _IM:
        im = Image.open(f'{OUT}/el/{name}'); _IM[name] = im.convert('RGBA' if name.endswith('png') else 'RGB')
    im = _IM[name]; im = im.resize((max(2, int(im.width * scale)), max(2, int(im.height * scale))), Image.LANCZOS)
    if rot: im = im.rotate(rot, Image.BICUBIC, expand=True, fillcolor=(255, 255, 255) if im.mode == 'RGB' else None)
    if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(im, np.float32) / 255
def zoom(img, z, cx=.5, cy=.5):
    if abs(z - 1) < 1e-3: return img
    h, w = img.shape[:2]; cw, ch = w / z, h / z; x0, y0 = (w - cw) * cx, (h - ch) * cy
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch))
    return np.asarray(im, np.float32) / 255
def grade(img, sat=1.25, warm=.06, con=1.08):
    g = img.mean(2, keepdims=True); img = g + (img - g) * sat
    img = img * np.array([1 + warm, 1 + warm * .5, 1 - warm]); img = (img - .5) * con + .5
    return np.clip(img, 0, 1)
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)
def radial(c0, c1, cx=540, cy=900, r=1250):
    d = np.clip(np.hypot(XX - cx, YY - cy) / r, 0, 1)[..., None]; return np.array(c0) * (1 - d) + np.array(c1) * d
RAYS = None
def rays(a, cx=540, cy=900, k=.18):
    ang = np.arctan2(YY - cy, XX - cx); return (np.clip(np.sin(ang * 9 + a), 0, 1) ** 3 * k * np.clip(1 - np.hypot(XX - cx, YY - cy) / 1300, 0, 1))[..., None]
def vignette(img, k=.18): d = np.hypot((XX - 540) / 540, (YY - 960) / 960)[..., None]; return img * (1 - k * np.clip(d - .6, 0, 1))

def text_img(lines, size, col, shadow=None, font='anton.ttf', pad=30, spacing=.95, emoji=None, stroke=0):
    """Bloc de texte RGBA (float), centré ligne par ligne ; emoji optionnel collé à la fin de la dernière ligne."""
    f = ImageFont.truetype(f'{FONTS}/{font}', size); dd = ImageDraw.Draw(Image.new('RGB', (1, 1)))
    ws = [dd.textlength(l, font=f) for l in lines]; lh = int(size * spacing); em = int(size * 1.0) if emoji else 0
    w = int(max(ws) + em + 2 * pad); h = int(lh * len(lines) + size * .35 + 2 * pad)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for k, (l, lw) in enumerate(zip(lines, ws)):
        x = (w - lw - (em if k == len(lines) - 1 else 0)) / 2; y = pad + k * lh
        if shadow: d.text((x + size * .05, y + size * .06), l, font=f, fill=shadow, stroke_width=stroke, stroke_fill=shadow)
        d.text((x, y), l, font=f, fill=col, stroke_width=stroke, stroke_fill=shadow or col)
        if emoji and k == len(lines) - 1:
            e = Image.new('RGBA', (160, 160)); ImageDraw.Draw(e).text((0, 0), emoji, font=ImageFont.truetype('/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf', 109), embedded_color=True)
            e = e.crop(e.getbbox()).resize((em, em), Image.LANCZOS); im.paste(e, (int(x + lw + size * .14), int(y + size * .14)), e)
    return np.asarray(im, np.float32) / 255
def pill(txt, size, bg, fg, padx=60, pady=26, font='anton.ttf'):
    f = ImageFont.truetype(f'{FONTS}/{font}', size); dd = ImageDraw.Draw(Image.new('RGB', (1, 1))); tw = dd.textlength(txt, font=f)
    w, h = int(tw + 2 * padx), int(size * 1.05 + 2 * pady); im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w - 1, h - 1), h // 2, fill=bg); d.text((padx, pady - size * .1), txt, font=f, fill=fg)
    return np.asarray(im, np.float32) / 255
def scaled(rgba, s):
    if abs(s - 1) < 1e-3: return rgba
    im = Image.fromarray((np.clip(rgba, 0, 1) * 255).astype(np.uint8), 'RGBA'); im = im.resize((max(2, int(im.width * s)), max(2, int(im.height * s))), Image.LANCZOS)
    return np.asarray(im, np.float32) / 255

CANS = {}
def can(key, Hc, tilt):
    if key not in CANS: CANS[key] = Can(Hc, tilt)
    return CANS[key]
def can_img(c, rot, s=1.0, opened=False):
    return scaled(c.render(rot, opened), s)
def shadow_glow(img, cx, cy, w, h, k=.35, col=(0, 0, 0)):
    d = np.clip(((XX - cx) / w) ** 2 + ((YY - cy) / h) ** 2, 0, 1)[..., None]; a = (1 - d) ** 2 * k
    return img * (1 - a) + np.array(col) * a

T = {}  # textes pré-rendus
def texts():
    if T: return T
    T['s1'] = text_img(['LA FRAÎCHEUR'], 150, (255, 255, 255), (31, 94, 20), stroke=5)
    T['s2'] = text_img(['À L’ÉTAT PUR'], 150, (255, 255, 255), (31, 94, 20), emoji='🍋', stroke=5)
    T['logo1'] = text_img(['CITRON'], 170, (255, 255, 255), (31, 94, 20), stroke=6)
    T['logo2'] = pill('FRESH', 150, (255, 248, 225), (31, 94, 20), 50, 12)
    T['cta'] = pill('GOÛTE LA FRAÎCHEUR !', 64, (62, 155, 36), (255, 248, 225), 56, 26)
    T['demo'] = text_img(['Démo · marque fictive · création E-DUST Solutions'], 26, (90, 60, 0), None, 'montserrat_bi.ttf', 6)
    return T

# ---------- scènes
def frame(i):
    t = i / FPS; T = texts()
    if t < 3.0:  # 1 · le citron plonge
        img = grade(clip('c1', i), 1.35, .05, 1.06); img = zoom(img, 1.0 + .08 * ease_io(t / 3), .5, .45)
        if t > 2.8: img = img + (1 - img) * ((t - 2.8) / .2) ** 2 * .9
    elif t < 6.0:  # 2 · la canette apparaît et tourne
        u = t - 3.0; bg = grade(clip('c2', i - 90), 1.2, .04, 1.0)
        bg = np.asarray(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(7)), np.float32) / 255
        img = bg * .82 + .18; img = img * (1 - .3 * rays(0)[..., :1] * 0) ; img = shadow_glow(img, 540, 960, 620, 900, .55, (1, .86, .2))
        if u < .25: img = img + (1 - img) * (1 - u / .25) * .9
        c = can('a', 1150, 9); e = ease(u / .9); s = .82 + .18 * e
        ci = can_img(c, -.55 + .62 * ease(u / 2.9), s)
        for nm, x, y, sc, r, sp in [('menthe_1.png', 170, 420, .55, 20, 1), ('tranche_0.png', 900, 1350, .36, -15, -1), ('menthe_2.png', 930, 520, .4, -30, -1)]:
            over(img, el(nm, sc, r + 25 * u * sp, 3), x + 18 * u * sp, y - 30 * u, ease(u / .6))
        over(img, ci, 540, 980 + 520 * (1 - e), min(1, u / .15))
        for nm, x, y, sc, r in [('glacon_0.jpg', 220, 1330, .55, 10), ('glacon_2.jpg', 860, 760, .45, -12), ('glacon_3.jpg', 260, 760, .38, 25)]:
            blend(img, el(nm, sc, r + 12 * u), x - 10 * u, y - 25 * u, 'mul', ease(u / .5))
        over(img, el('menthe_0.png', .5, 40 + 20 * u, 0), 820 + 30 * u, 1560 - 40 * u, ease((u - .2) / .6))
    elif t < 7.5:  # 3a · ouverture (rush réel) — PSHHT à 6,75 s
        u = t - 6.0; img = grade(clip('c3a', i - 180), 1.15, .04, 1.08); img = zoom(img, 1.0 + .06 * ease_io(u / 1.5), .5, .78)
        if 6.72 < t < 7.1: k = 1 - (t - 6.72) / .38; img = img + (1 - img) * k * .35 * np.clip(1 - np.hypot(XX - 560, YY - 1500)[..., None] / 600, 0, 1)
        if t > 7.38: img = img + (1 - img) * ((t - 7.38) / .12) * .9
    elif t < 8.5:  # 3b · explosion de bulles
        u = t - 7.5; l = clip('c3b', i - 225).mean(2, keepdims=True); lo, hi = np.percentile(l, (2, 99.5)); l = np.clip((l - lo) / (hi - lo), 0, 1)
        l = l * l * (3 - 2 * l); l = l * l * (3 - 2 * l)
        img = np.array([.82, .6, .02]) * (1 - l) ** 2 + np.array([1, .84, .05]) * 2 * l * (1 - l) + np.array([1, .99, .86]) * l ** 2
        img = zoom(img, 1.05 + .25 * ease(u), .5, .5)
        blend(img, clip('fx', i - 225) * 1.4, 540, 960, 'scr', .6)
        if u < .2: img = img + (1 - img) * (1 - u / .2)
    elif t < 10.0:  # 3c · canette ouverte, fraîcheur et lumière
        u = t - 8.5; img = radial((1, .93, .45), (.96, .66, 0), 540, 900, 1300) + rays(u * .9, 540, 900, .22)
        blend(img, clip('fx', i - 225) * 1.3, 540, 960, 'scr', 1.0)
        sp = el('splash_1.jpg', 1.0 + .25 * ease(u / 1.5)); blend(img, sp, 540, 860, 'scr', .9 * min(1, u / .2))
        c = can('a', 1150, 9); s = 1.22 - .22 * ease(u / 1.2)
        ci = can_img(c, .35 - .35 * ease(u / 1.3), s, True); over(img, ci, 540, 1000)
        if u < .15: img = img + (1 - img) * (1 - u / .15) * .8
    elif t < 13.0:  # 4 · slogan
        u = t - 10.0; img = radial((1, .95, .5), (.97, .7, 0), 540, 1050, 1300) + rays(1.2 + u * .5, 540, 1050, .2)
        blend(img, clip('fx', i - 225) * .9, 540, 960, 'scr', .7)
        for nm, x, y, sc, r, sp in [('menthe_1.png', 120, 760, .5, 30, 1), ('menthe_2.png', 980, 1180, .45, -20, -1), ('tranche_0.png', 930, 700, .33, 15, 1)]:
            over(img, el(nm, sc, r + 15 * u * sp, 2), x + 10 * u * sp, y - 20 * u)
        c = can('b', 1000, 8); over(img, can_img(c, .06 * ease_io(u / 3)), 540, 1060)
        for nm, x, y, sc, r in [('glacon_1.jpg', 190, 1300, .55, -8), ('glacon_3.jpg', 900, 1460, .5, 14)]:
            blend(img, el(nm, sc, r + 10 * u), x, y - 15 * u, 'mul', 1)
        over(img, el('citron_0.png', .62, -6 + 3 * u), 230, 1640 - 10 * u); over(img, el('tranche_0.png', .42, 20 * u), 880, 1650 - 15 * u)
        for k, (key, y0, t0) in enumerate([('s1', 290, .15), ('s2', 450, .55)]):
            p = (u - t0) / .35
            if p > 0: over(img, scaled(T[key], .6 + .4 * back(p)), 540, y0, min(1, p * 2))
        if u < .15: img = img + (1 - img) * (1 - u / .15) * .8
    else:  # 5 · plan héroïque + appel à l'action
        u = t - 13.0; img = radial((1, .94, .45), (.62, .78, .08), 540, 960, 1300) + rays(2.5 + u * .4, 540, 960, .24)
        blend(img, clip('fx', i - 225) * 1.1, 540, 960, 'scr', .6)
        blend(img, el('splash_0.jpg', 1.1 + .1 * ease(u / 2)), 540, 900, 'scr', .9)
        img = shadow_glow(img, 540, 950, 520, 700, .5, (1, .97, .75))
        c = can('c', 820, 5); over(img, can_img(c, .0, 1.0 + .03 * ease_io(u / 2)), 540, 975)
        p = u / .3; over(img, scaled(T['logo1'], .85 * (.7 + .3 * back(p))), 540, 255, min(1, p * 2))
        p = (u - .12) / .3; over(img, scaled(T['logo2'], .85 * (.7 + .3 * back(p))), 540, 385, min(1, max(0, p * 2)))
        p = (u - .45) / .3; over(img, scaled(T['cta'], .7 + .3 * back(p)), 540, 1480, min(1, max(0, p * 2)))
        over(img, T['demo'], 540, 1562, min(1, max(0, (u - .6) * 3)) * .8)
        if u < .12: img = img + (1 - img) * (1 - u / .12) * .8
    img = vignette(np.clip(img, 0, 1), .12)
    g = np.random.default_rng(i).normal(0, .012, (H // 2, W // 2, 1)).repeat(2, 0).repeat(2, 1); img = np.clip(img + g, 0, 1)
    return (img * 255).astype(np.uint8)

def work(rng_):
    for i in rng_:
        Image.fromarray(frame(i)).save(f'{OUT}/frames/{i:04d}.jpg', quality=95)
    return len(rng_)
if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'clips': clips()
    elif cmd == 'frames':
        a, b = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (0, N)
        os.makedirs(f'{OUT}/frames', exist_ok=True); idx = list(range(a, b)); P = 4
        with Pool(P) as p: print(sum(p.map(work, [idx[k::P] for k in range(P)])))
    elif cmd == 'stills':
        S = sys.argv[2]; os.makedirs(S, exist_ok=True)
        for tt in sys.argv[3:]:
            Image.fromarray(frame(int(float(tt) * FPS))).save(f'{S}/t{float(tt):05.2f}.jpg', quality=90)
