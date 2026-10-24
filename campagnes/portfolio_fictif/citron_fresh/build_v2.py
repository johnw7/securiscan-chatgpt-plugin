"""CITRON FRESH v2 « agence » — même histoire en 5 temps, montage plus graphique :
sous-titres cinétiques (lisibles en muet), zoom à travers une tranche de citron, fond typographique qui défile,
panoramique filé, « PSHHHT ! » animé, reflet qui balaie la canette, éléments qui volent vers la caméra, tourbillon de citrons, couronne d'eau.
Réutilise build.py (outils, rushes) et can3d.py. Étapes : python3 build_v2.py clips · frames [a b] · stills <dossier> t1 t2 …"""
import os, sys, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B
from build import (W, H, FPS, N, OUT, FONTS, clip, ease, ease_io, back, over, blend, el, zoom, grade, radial, rays, vignette,
                   text_img, pill, scaled, can, can_img, shadow_glow, XX, YY)
FR = f'{OUT}/frames_v2'
NEW = {  # rushes supplémentaires (Adobe Stock)
    'n3b': ('s3_citrons_noir.mov', 4.6, 1.2, 1.0, 'scale=1080:1920'),
    'n4': ('s4_vortex.mov', 2.0, 3.0, 3.0, 'scale=1080:1920'),
    'ncr': ('fx_couronne.mov', 2.6, 2.0, 2.0, 'crop=900:1080:510:0,scale=1080:1296,pad=1080:1920:0:312'),
    'nsp': ('fx_splash_ligne.mov', 2.0, 1.6, 1.6, 'crop=1080:1080:484:0,scale=1080:1080,pad=1080:1920:0:420'),
}
def clips():
    B.CLIPS.clear(); B.CLIPS.update(NEW); B.clips()

F = lambda n, s: ImageFont.truetype(f'{FONTS}/{n}', s)
GREEN, LIME, DARK = (31, 94, 20), (168, 224, 58), (31, 94, 20)  # charte : Menthe, Lime
def caption(words, hi=None, size=96):
    """Sous-titre : mots blancs contour vert, mot clé (hi) sur pavé citron vert incliné."""
    f = F('anton.ttf', size); d0 = ImageDraw.Draw(Image.new('RGB', (1, 1))); sp = size * .28
    ws = [d0.textlength(w, font=f) for w in words]; tw = sum(ws) + sp * (len(words) - 1)
    im = Image.new('RGBA', (int(tw + 120), int(size * 1.9)), (0, 0, 0, 0)); d = ImageDraw.Draw(im); x = 60
    for w, lw in zip(words, ws):
        if hi and w in hi:
            box = Image.new('RGBA', (int(lw + 40), int(size * 1.25)), (0, 0, 0, 0)); ImageDraw.Draw(box).rounded_rectangle((0, 0, box.width - 1, box.height - 1), 18, fill=LIME + (255,))
            box = box.rotate(-3, Image.BICUBIC, expand=True); im.paste(box, (int(x - 20), int(size * .22)), box)
            d.text((x, size * .2), w, font=f, fill=DARK)
        else:
            d.text((x + 5, size * .26), w, font=f, fill=GREEN + (200,), stroke_width=6, stroke_fill=GREEN + (200,))
            d.text((x, size * .2), w, font=f, fill=(255, 255, 255), stroke_width=6, stroke_fill=GREEN)
        x += lw + sp
    return np.asarray(im, np.float32) / 255
CAPS = [  # (début, fin, mots, mot(s) clé(s)) — calés sur la voix off
    (.35, 1.3, ['UN', 'PLONGEON…'], ['PLONGEON…']), (1.3, 2.55, ['ET', 'TOUT', 'PÉTILLE', '!'], ['PÉTILLE']),
    (3.25, 4.35, ['VOICI', 'CITRON', 'FRESH'], ['FRESH']), (4.35, 5.75, ['GLACÉE…', 'ET', 'PÉTILLANTE', '!'], ['PÉTILLANTE']),
    (7.65, 8.6, ['DES', 'BULLES', 'VIVES…'], ['BULLES']), (8.6, 9.95, ['UN', 'VRAI', 'COUP', 'DE', 'FRAÎCHEUR', '!'], ['FRAÎCHEUR'])]
_C = {}
def draw_caps(img, t, y=290):
    for k, (a, b, w, hi) in enumerate(CAPS):
        if a <= t < b:
            if k not in _C: _C[k] = caption(w, hi)
            c = _C[k]; s = min(1, 940 / c.shape[1]); p = (t - a) / .22
            over(img, scaled(c, s * (.75 + .25 * back(p))), 540, y, min(1, p * 2) * min(1, (b - t) / .08))
_T = {}
def marquee(row):
    """Bande de texte « CITRON FRESH • » très grande, pleine (row 1) ou en contour (rows 0, 2)."""
    if row not in _T:
        f = F('anton.ttf', 300); s = 'CITRON FRESH • ' * 3; d0 = ImageDraw.Draw(Image.new('RGB', (1, 1))); w = int(d0.textlength(s, font=f))
        im = Image.new('RGBA', (w, 380), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        if row == 1: d.text((0, 0), s, font=f, fill=(150, 205, 40, 255))
        else: d.text((0, 0), s, font=f, fill=(0, 0, 0, 0), stroke_width=4, stroke_fill=(255, 255, 255, 235))
        _T[row] = (np.asarray(im, np.float32) / 255, d0.textlength('CITRON FRESH • ', font=f))
    return _T[row]
def gleam(ci, p):
    """Reflet diagonal qui balaie la canette (p 0→1)."""
    h, w = ci.shape[:2]; yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    pos = (xx / w * .6 + yy / h * .4) - (-.3 + 1.6 * p); band = np.exp(-(pos / .05) ** 2) * .75
    out = ci.copy(); out[..., :3] = np.clip(out[..., :3] + band[..., None] * out[..., 3:4], 0, 1); return out
def burst(size=520):
    if 'burst' not in _T:
        im = Image.new('RGBA', (size, size), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = size / 2
        for k in range(18):
            a = k * 20 * np.pi / 180; r0, r1 = size * .22, size * (.42 + .07 * (k % 2))
            d.line([(c + r0 * np.cos(a), c + r0 * np.sin(a)), (c + r1 * np.cos(a), c + r1 * np.sin(a))], fill=LIME + (255,), width=14)
        _T['burst'] = np.asarray(im, np.float32) / 255
    return _T['burst']
def hblur(img, k):
    if k < 2: return img
    k = int(k); ker = np.ones(k) / k; c = np.cumsum(np.pad(img, ((0, 0), (k, k), (0, 0)), mode='edge'), 1)
    return (c[:, k:-k] - c[:, :-2 * k]) / k if False else np.apply_along_axis(lambda r: np.convolve(r, ker, 'same'), 1, img)
def hblur_fast(img, k):
    k = int(k)
    if k < 2: return img
    p = np.pad(img, ((0, 0), (k, k), (0, 0)), mode='edge'); c = np.cumsum(p, 1, dtype=np.float32)
    return (c[:, 2 * k:2 * k + W] - c[:, k:k + W]) / k
def bump(t):  # petit « coup de caméra » sur les temps forts
    z = 1.0
    for b0 in [3.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0, 13.0]:
        if 0 <= t - b0 < .3: z += .035 * np.exp(-(t - b0) / .08)
    return z

def frame(i):
    t = i / FPS; T = B.texts()
    if t < 3.0:  # 1 · le citron plonge + zoom à travers une tranche
        img = grade(clip('c1', i), 1.35, .05, 1.06); img = zoom(img, 1.0 + .08 * ease_io(t / 3), .5, .45)
        if t > 2.5:
            p = (t - 2.5) / .5; s = .25 + 9 * p ** 2.2
            over(img, el('tranche_0.png', s, 140 * p), 540, 960)
        draw_caps(img, t)
    elif t < 6.0:  # 2 · la canette sur fond typographique
        u = t - 3.0; img = radial((1, .9, .25), (.98, .72, 0), 540, 960, 1250)
        for row, (y, sp) in enumerate([(330, -1), (820, 1), (1310, -1)]):
            m, period = marquee(row); off = (u * 160 * sp) % period
            over(img, m, m.shape[1] / 2 - off - (period if sp < 0 else 0) + 40, y, .9 if row == 1 else .8)
        img = shadow_glow(img, 540, 980, 520, 820, .45, (1, .97, .7))
        blend(img, clip('nsp', i - 90) * 1.2, 540, 960, 'scr', 1.0 if u < 1.6 else 0)
        c = can('a', 1150, 9); e = ease(u / .7); s = .7 + .3 * back(min(1, u / .7), 1.2)
        ci = can_img(c, -.55 + .62 * ease(u / 2.9), s)
        if 1.5 < u < 2.2: ci = gleam(ci, (u - 1.5) / .7)
        for nm, x, y, sc, r, d in [('menthe_1.png', 170, 1460, .6, 20, 1), ('tranche_0.png', 900, 1500, .4, -15, -1), ('menthe_2.png', 920, 560, .45, -30, -1)]:
            over(img, el(nm, sc, r + 30 * u * d, 0), x + 25 * u * d, y - 40 * u, ease(u / .5))
        over(img, ci, 540, 1000 + 900 * (1 - e))
        for nm, x, y, sc, r in [('glacon_0.jpg', 200, 1180, .5, 10), ('glacon_2.jpg', 880, 1080, .42, -12)]:
            blend(img, el(nm, sc, r + 15 * u), x - 10 * u, y - 25 * u, 'mul', ease(u / .5))
        over(img, el('menthe_0.png', .95, 30 + 25 * u, 8), 1150 - 420 * u, 1820 - 60 * u, .95)  # feuille floue au premier plan, en bas
        img = zoom(img, bump(t)); draw_caps(img, t)
        if u < .2: img = img + (1 - img) * (1 - u / .2)
        if u > 2.75: img = hblur_fast(img, 6 + 260 * ((u - 2.75) / .25) ** 2); img = np.roll(img, int(-500 * ((u - 2.75) / .25) ** 2), 1)
    elif t < 7.5:  # 3a · ouverture réelle + PSHHHT !
        u = t - 6.0; img = grade(clip('c3a', i - 180), 1.15, .04, 1.08); img = zoom(img, 1.0 + .06 * ease_io(u / 1.5), .5, .78)
        if u < .2: img = np.roll(hblur_fast(img, 200 * (1 - u / .2) ** 2), int(500 * (1 - u / .2) ** 2), 1)
        if t > 6.72:
            k = np.exp(-(t - 6.72) / .25); img = np.roll(img, (int(14 * k * np.sin(i * 2.1)), int(10 * k * np.cos(i * 1.7))), (0, 1))
            p = (t - 6.72) / .18; a = min(1, p * 2) * min(1, (7.45 - t) / .1)
            over(img, scaled(burst(), .6 + .5 * back(min(p, 1))), 540, 560, a)
            if 'pshht' not in _T: _T['pshht'] = text_img(['PSHHHT !'], 190, (255, 255, 255), GREEN, stroke=8)
            ps = Image.fromarray((_T['pshht'] * 255).astype(np.uint8), 'RGBA').rotate(8 + 3 * np.sin(i), Image.BICUBIC, expand=True)
            over(img, scaled(np.asarray(ps, np.float32) / 255, .55 + .45 * back(min(p, 1))), 540, 560, a)
        if 6.72 < t < 7.1: k = 1 - (t - 6.72) / .38; img = img + (1 - img) * k * .35 * np.clip(1 - np.hypot(XX - 560, YY - 1500)[..., None] / 600, 0, 1)
        if t > 7.38: img = img + (1 - img) * ((t - 7.38) / .12) * .9
    elif t < 8.5:  # 3b · citrons et citrons verts qui tombent dans l'eau (fond noir)
        u = t - 7.5; img = grade(clip('n3b', i - 225), 1.35, .04, 1.15); img = zoom(img, (1.05 + .2 * ease(u)) * bump(t), .5, .5)
        blend(img, clip('fx', i - 225) * 1.2, 540, 960, 'scr', .7)
        if u < .15: img = img + (1 - img) * (1 - u / .15)
        draw_caps(img, t)
    elif t < 10.0:  # 3c · canette ouverte, fraîcheur, éléments vers la caméra
        u = t - 8.5; img = radial((1, .93, .45), (.96, .66, 0), 540, 900, 1300) + rays(u * .9, 540, 900, .22)
        blend(img, clip('fx', i - 225) * 1.3, 540, 960, 'scr', 1.0)
        sp = el('splash_1.jpg', 1.0 + .25 * ease(u / 1.5)); blend(img, sp, 540, 860, 'scr', .9 * min(1, u / .2))
        c = can('a', 1150, 9); s = 1.22 - .22 * ease(u / 1.2)
        ci = can_img(c, .35 - .35 * ease(u / 1.3), s, True)
        if .6 < u < 1.2: ci = gleam(ci, (u - .6) / .6)
        over(img, ci, 540, 1000)
        for k, (ang, t0, nm) in enumerate([(-2.2, 0, 'tranche_0.png'), (-.6, .25, 'menthe_1.png'), (.9, .5, 'tranche_0.png'), (2.6, .7, 'menthe_2.png')]):
            p = (u - t0) / 1.0
            if 0 < p < 1:
                r = 80 + 900 * p ** 1.6; sc = (.15 + 1.4 * p ** 2) * (.5 if 'menthe' in nm else .6)
                over(img, el(nm, sc, 200 * p * (1 if k % 2 else -1), int(10 * p ** 2)), 540 + r * np.cos(ang), 1000 + r * np.sin(ang), min(1, p * 4))
        img = zoom(img, bump(t)); draw_caps(img, t)
        if u < .15: img = img + (1 - img) * (1 - u / .15) * .8
    elif t < 13.0:  # 4 · slogan sur tourbillon de citrons
        u = t - 10.0; bg = grade(clip('n4', i - 300), 1.15, .02, 1.02)
        img = np.asarray(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.5)), np.float32) / 255
        img = shadow_glow(img, 540, 1060, 560, 760, .5, (1, .97, .75))
        c = can('b', 1000, 8); ci = can_img(c, .06 * ease_io(u / 3))
        if 1.4 < u < 2.0: ci = gleam(ci, (u - 1.4) / .6)
        over(img, ci, 540, 1060)
        for nm, x, y, sc, r in [('glacon_1.jpg', 190, 1300, .55, -8), ('glacon_3.jpg', 900, 1460, .5, 14)]:
            blend(img, el(nm, sc, r + 10 * u), x, y - 15 * u, 'mul', 1)
        for k, (key, y0, t0) in enumerate([('s1', 290, .15), ('s2', 450, .55)]):
            p = (u - t0) / .35
            if p > 0: over(img, scaled(T[key], .6 + .4 * back(p)), 540, y0, min(1, p * 2))
        if 'badge' not in _T:
            bd = Image.new('RGBA', (260, 260), (0, 0, 0, 0)); d = ImageDraw.Draw(bd); d.ellipse((0, 0, 259, 259), fill=LIME + (255,))
            d.ellipse((14, 14, 245, 245), outline=DARK + (255,), width=4); f = F('anton.ttf', 56); f2 = F('montserrat_bi.ttf', 26)
            d.text((130, 112), 'NOUVEAU', font=f, fill=DARK, anchor='mm'); d.text((130, 165), 'citron & citron vert', font=f2, fill=DARK, anchor='mm')
            _T['badge'] = np.asarray(bd, np.float32) / 255
        p = (u - .9) / .3
        if p > 0:
            bd = Image.fromarray((_T['badge'] * 255).astype(np.uint8), 'RGBA').rotate(-12 + 6 * np.sin(u * 3), Image.BICUBIC)
            over(img, scaled(np.asarray(bd, np.float32) / 255, .5 + .5 * back(min(p, 1))), 860, 1520, min(1, p * 2))
        img = zoom(img, bump(t))
        if u < .15: img = img + (1 - img) * (1 - u / .15) * .8
        if u > 2.7:  # cercle citron vert qui s'ouvre
            r = 1300 * ((u - 2.7) / .3) ** 1.5; m = (np.hypot(XX - 540, YY - 960) < r)[..., None]
            img = np.where(m, np.array([.72, .9, .2]), img)
    else:  # 5 · plan héroïque : la canette tombe, couronne d'eau, logo, appel à l'action
        u = t - 13.0; img = radial((1, .94, .45), (.62, .78, .08), 540, 960, 1300) + rays(2.5 + u * .4, 540, 960, .24)
        if u < .12: img = np.where((np.hypot(XX - 540, YY - 960) < 1300 * (1 - u / .12) + 1)[..., None], np.array([.72, .9, .2]), img) if u < 0 else img
        blend(img, clip('fx', i - 225) * 1.1, 540, 960, 'scr', .6)
        drop = ease(u / .33); y = -500 + (975 + 500) * drop + (14 * np.sin((u - .33) * 30) * np.exp(-(u - .33) * 8) if u > .33 else 0)
        if u > .25: blend(img, clip('ncr', i - 397) * 1.5, 540, 1180, 'scr', min(1, (u - .25) / .1))
        img = shadow_glow(img, 540, 950, 520, 700, .5, (1, .97, .75))
        c = can('c', 820, 5); ci = can_img(c, .0, 1.0 + .03 * ease_io(u / 2))
        if .7 < u < 1.3: ci = gleam(ci, (u - .7) / .6)
        over(img, ci, 540, y)
        p = (u - .35) / .3; over(img, scaled(T['logo1'], .85 * (.7 + .3 * back(p))), 540, 255, min(1, max(0, p * 2)))
        p = (u - .47) / .3; over(img, scaled(T['logo2'], .85 * (.7 + .3 * back(p))), 540, 385, min(1, max(0, p * 2)))
        p = (u - .75) / .3; pul = 1 + .04 * np.sin(max(0, u - 1.1) * 9) * (u > 1.1)
        over(img, scaled(T['cta'], (.7 + .3 * back(p)) * pul), 540, 1480, min(1, max(0, p * 2)))
        over(img, T['demo'], 540, 1562, min(1, max(0, (u - .9) * 3)) * .8)
        img = zoom(img, bump(t))
    img = vignette(np.clip(img, 0, 1), .12)
    g = np.random.default_rng(i).normal(0, .012, (H // 2, W // 2, 1)).repeat(2, 0).repeat(2, 1); img = np.clip(img + g, 0, 1)
    return (img * 255).astype(np.uint8)

def work(idx):
    for i in idx: Image.fromarray(frame(i)).save(f'{FR}/{i:04d}.jpg', quality=95)
    return len(idx)
if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'clips': clips()
    elif cmd == 'frames':
        a, b = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (0, N)
        os.makedirs(FR, exist_ok=True); idx = list(range(a, b))
        with Pool(4) as p: print(sum(p.map(work, [idx[k::4] for k in range(4)])))
    elif cmd == 'stills':
        S = sys.argv[2]; os.makedirs(S, exist_ok=True)
        for tt in sys.argv[3:]: Image.fromarray(frame(int(round(float(tt) * FPS)))).save(f'{S}/t{float(tt):05.2f}.jpg', quality=90)
