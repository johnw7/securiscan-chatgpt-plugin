"""Canette CITRON FRESH en 3D (rendu numpy) : étiquette enroulée sur un cylindre à profil réel (épaule, fond bombé),
éclairage studio (2 boîtes à lumière + contre-jour), reflets métal, gouttes de condensation qui tournent avec la canette.
Usage : Can(H_px, tilt_deg).render(rot) -> image RGBA (numpy float 0-1)."""
import os, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); F = f'{D}/../visuels/fonts'
LW, LH = 2600, 1300  # texture étiquette (tour complet × hauteur du corps)
# palette de marque harmonisée (charte CITRON FRESH)
CITRON, SOLEIL, LIME, FEUILLE, MENTHE, CREME = (255, 210, 26), (247, 181, 0), (168, 224, 58), (62, 155, 36), (31, 94, 20), (255, 248, 225)

def font(n, s): return ImageFont.truetype(f'{F}/{n}', s)
def lemon_slice(sz):
    """Tranche de citron vectorielle (zeste, peau blanche, 10 quartiers)."""
    im = Image.new('RGBA', (sz, sz), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = sz / 2
    d.ellipse((0, 0, sz, sz), fill=SOLEIL); d.ellipse((sz * .05, sz * .05, sz * .95, sz * .95), fill=CREME)
    d.ellipse((sz * .09, sz * .09, sz * .91, sz * .91), fill=(255, 226, 92))
    for k in range(10):
        a0, a1 = k * 36 + 3, (k + 1) * 36 - 3
        d.pieslice((sz * .13, sz * .13, sz * .87, sz * .87), a0, a1, fill=(255, 214, 40))
    d.ellipse((c - sz * .05, c - sz * .05, c + sz * .05, c + sz * .05), fill=CREME)
    return im

def label():
    p = f'{D}/out/v3_label.png'
    if os.path.exists(p): return np.asarray(Image.open(p).convert('RGB'), np.float32) / 255
    os.makedirs(f'{D}/out', exist_ok=True)
    y = np.linspace(0, 1, LH)[:, None]; base = np.array(CITRON) * (1 - y[..., None] * .35) + np.array(SOLEIL) * (y[..., None] * .35)
    im = Image.fromarray(np.repeat(base, LW, 1).astype(np.uint8)); d = ImageDraw.Draw(im, 'RGBA')
    # vague citron vert en bas + liseré blanc
    pts = [(x, LH * .80 + 28 * np.sin(x / LW * 2 * np.pi * 3)) for x in range(0, LW + 1, 10)]
    d.polygon(pts + [(LW, LH), (0, LH)], fill=LIME); d.line(pts, fill=CREME, width=10)
    pts2 = [(x, LH * .87 + 22 * np.sin(x / LW * 2 * np.pi * 3 + 1.4)) for x in range(0, LW + 1, 10)]
    d.polygon(pts2 + [(LW, LH), (0, LH)], fill=FEUILLE)
    rng = np.random.default_rng(3)  # bulles décoratives
    for _ in range(140):
        x, yy, r = rng.uniform(0, LW), rng.uniform(LH * .05, LH * .78), rng.uniform(5, 26)
        d.ellipse((x - r, yy - r, x + r, yy + r), outline=CREME + (150,), width=4)
    # face avant centrée sur u=0.5
    cx = LW // 2
    sl = lemon_slice(520); im.paste(sl, (cx + 230, int(LH * .02)), sl)
    sl2 = lemon_slice(300).rotate(25); im.paste(sl2, (cx - 650, int(LH * .52)), sl2)
    fA = font('anton.ttf', 300); fB = font('montserrat_bi.ttf', 70); fS = font('montserrat_bi.ttf', 44)
    for txt, yy, f, col in [('CITRON', LH * .20, fA, CREME), ('FRESH', LH * .46, fA, MENTHE)]:
        w = d.textlength(txt, font=f)
        d.text((cx - w / 2 + 10, yy + 12), txt, font=f, fill=(170, 110, 0, 120))
        if txt == 'FRESH':
            d.rounded_rectangle((cx - w / 2 - 50, yy + 40, cx + w / 2 + 50, yy + 330), 60, fill=CREME)
        d.text((cx - w / 2, yy), txt, font=f, fill=col)
    for txt, yy, f in [('PÉTILLANT · CITRON & CITRON VERT', LH * .72, fS)]:
        w = d.textlength(txt, font=f); d.text((cx - w / 2, yy), txt, font=f, fill=CREME)
    # dos : texte réglementaire factice signalé démo
    im = Image.fromarray(np.roll(np.asarray(im), LW // 2, 1)); d = ImageDraw.Draw(im)
    for k, txt in enumerate(['Boisson rafraîchissante', 'aux extraits de citron', '330 ml', 'DÉMO · MARQUE FICTIVE']):
        f = fB if k < 3 else fS; w = d.textlength(txt, font=f); d.text((cx - w / 2, LH * (.25 + k * .09)), txt, font=f, fill=CREME)
    im = Image.fromarray(np.roll(np.asarray(im), -LW // 2, 1)); im.save(p); return np.asarray(im, np.float32) / 255

def droplets(seed=7):
    """Carte de condensation dans l'espace étiquette : (ombre, reflet, voile)."""
    p = f'{D}/out/v2_drops_{seed}.npz'
    if os.path.exists(p): z = np.load(p); return z['a'], z['b'], z['c']
    rng = np.random.default_rng(seed); sh = np.zeros((LH, LW), np.float32); hl = np.zeros_like(sh)
    yy, xx = np.mgrid[-40:41, -40:41].astype(np.float32)
    for _ in range(9000):
        r = rng.choice([rng.uniform(1.6, 4), rng.uniform(4, 9), rng.uniform(9, 17)], p=[.7, .26, .04])
        x, y = int(rng.uniform(0, LW)), int(rng.uniform(0, LH)); ry = r * rng.uniform(1.0, 1.35)
        m = ((xx / r) ** 2 + (yy / ry) ** 2) <= 1
        ring = m & (((xx / r) ** 2 + ((yy - ry * .25) / ry) ** 2) > .45)
        spec = ((xx + r * .35) / (r * .28)) ** 2 + ((yy + ry * .4) / (ry * .22)) ** 2 <= 1
        y0, y1, x0, x1 = y - 40, y + 41, x - 40, x + 41
        if y0 < 0 or y1 > LH: continue
        xs = np.arange(x0, x1) % LW
        sh[y0:y1][:, xs] = np.maximum(sh[y0:y1][:, xs], ring * .38 + m * .08)
        hl[y0:y1][:, xs] = np.maximum(hl[y0:y1][:, xs], spec * 1.0)
    veil = np.asarray(Image.fromarray((rng.random((LH // 4, LW // 4)) * 255).astype(np.uint8)).resize((LW, LH), Image.BICUBIC).filter(ImageFilter.GaussianBlur(3)), np.float32) / 255
    np.savez_compressed(p, a=sh, b=hl, c=veil); return sh, hl, veil

class Can:
    def __init__(self, H, tilt=10, cond=1.0):
        self.H = H; R = H / 3.75; self.R = R; s, c = np.sin(np.radians(tilt)), np.cos(np.radians(tilt)); self.s, self.c = s, c
        hs = np.linspace(0, 1, 1600)  # profil (hauteur normalisée -> rayon relatif)
        prof = np.ones_like(hs); prof[hs < .04] = .86 + .14 * np.sin(np.clip(hs[hs < .04] / .04, 0, 1) * np.pi / 2)
        sh = hs > .88; prof[sh] = 1 - .13 * np.sin(np.clip((hs[sh] - .88) / .1, 0, 1) * np.pi / 2)
        Htot = H * c; W = int(2 * R + 8); Hpx = int(Htot + 2 * R * s + 8); self.W, self.Hpx = W, Hpx
        X = np.arange(W) - W / 2 + .5; Y = np.arange(Hpx) + .5; Ybase = Htot + R * s + 4
        hmap = np.full((Hpx, W), -1.0, np.float32); th = np.zeros((Hpx, W), np.float32)
        for j, x in enumerate(X):
            r = prof * R; ok = np.abs(x) < r
            if not ok.any(): continue
            yh = Ybase - hs * Htot + np.sqrt(np.clip(r ** 2 - x ** 2, 0, None)) * s  # décroissant avec h
            yv, hv, rv = yh[ok][::-1], hs[ok][::-1], r[ok][::-1]
            inside = (Y >= yv[0]) & (Y <= yv[-1])
            hh = np.interp(Y[inside], yv, hv); rr = np.interp(Y[inside], yv, rv)
            hmap[inside, j] = hh; th[inside, j] = np.arcsin(np.clip(x / rr, -1, 1))
        self.mask = hmap >= 0; self.h = hmap; self.th = th
        # couvercle (ellipse au sommet)
        rt = R * prof[-1]; yc = Ybase - Htot; XX, YY = np.meshgrid(X, Y)
        q = (XX / rt) ** 2 + ((YY - yc) / (rt * s + 1e-6)) ** 2; self.lid = q <= 1; self.q = q; self.XX, self.YY, self.rt, self.yc = XX, YY, rt, yc
        self.lab = label(); self.sh, self.hl, self.veil = droplets(); self.cond = cond
        # alpha anti-crénelage
        m = (self.mask | self.lid).astype(np.float32)
        self.alpha = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.7)), np.float32) / 255

    def render(self, rot, opened=False):
        th, h, m = self.th, self.h, self.mask
        u = ((th / (2 * np.pi) + .5 + rot) % 1) * (LW - 1); v = np.clip((1 - (h - .05) / .82), 0, 1) * (LH - 1)
        body_lab = (h > .05) & (h < .87)
        ui, vi = u.astype(int), v.astype(int)
        col = self.lab[vi, ui]
        # zones métal nu (fond et épaule)
        metal = ~body_lab
        n_x = np.sin(th); n_z = np.cos(th); n_y = np.where(h > .87, .35, np.where(h < .05, -.4, 0))
        key = np.clip(.62 * n_x * -.55 + .8 * n_z + .3 * n_y, 0, 1)  # lumière principale avant-gauche
        diff = .38 + .72 * key
        ang = 2 * th  # direction réfléchie (vue orthographique)
        env = (np.exp(-((ang + .95) / .16) ** 2) * 1.0 + np.exp(-((ang - 1.15) / .1) ** 2) * .75
               + np.exp(-((np.abs(ang) - 2.75) / .18) ** 2) * .9)  # 2 boîtes à lumière + contre-jour sur les bords
        vert = 1 - .25 * np.abs(h - .5)
        rgb = col * diff[..., None] * vert[..., None]
        rgb = rgb * .9 + env[..., None] * np.array([1, 1, .96]) * .55
        al = np.array([.80, .81, .83]); mrgb = al * (.35 + .5 * key)[..., None] + env[..., None] * 1.1
        rgb = np.where(metal[..., None], mrgb, rgb)
        # condensation
        if self.cond > 0:
            sh, hl, ve = self.sh[vi, ui], self.hl[vi, ui], self.veil[vi, ui]
            k = self.cond
            rgb = rgb * (1 - k * (.12 + .1 * ve))[..., None] + k * (.10 + .08 * ve)[..., None]  # voile givré
            rgb = rgb * (1 - k * sh * .55)[..., None] + (k * hl * (.55 + .45 * key))[..., None]
        edge = np.clip(np.cos(th), 0, 1) ** .35; rgb = rgb * (.55 + .45 * edge)[..., None] + (1 - edge)[..., None] * .18
        # couvercle
        q = self.q; L = self.lid; rr = np.sqrt(q)
        lid = np.where(rr > .9, .92 - (rr - .9) * 2.5, np.where(rr > .82, .5 + (rr - .82) * 4, .68 + .12 * (self.XX / self.rt) * -1))
        lid = lid + .012 * np.sin(np.arctan2((self.YY - self.yc) / max(self.s, 1e-3), self.XX) * 90)
        lrgb = lid[..., None] * np.array([.88, .89, .9])
        tx, ty = self.XX / self.rt, (self.YY - self.yc) / (self.rt * self.s + 1e-6)
        tab = (np.abs(tx) < .17) & (ty > -.05) & (ty < .62); hole = ((tx / .25) ** 2 + ((ty + .48) / .17) ** 2) < 1
        lrgb = np.where(tab[..., None], np.array([.95, .95, .96]) * (.8 + .2 * (1 - ty))[..., None], lrgb)
        lrgb = np.where((hole if opened else ((tx / .25) ** 2 + ((ty + .48) / .17) ** 2 > .92) & ((tx / .25) ** 2 + ((ty + .48) / .17) ** 2 < 1.05))[..., None], np.array([.12, .1, .06]) if opened else np.array([.55, .55, .56]), lrgb)
        rgb = np.where(L[..., None], lrgb, rgb)
        return np.dstack([np.clip(rgb, 0, 1), self.alpha])

if __name__ == '__main__':
    import sys; S = sys.argv[1]; os.makedirs(S, exist_ok=True)
    can = Can(1100, 9)
    for k, r in enumerate([0, .08, .16, .5]):
        Image.fromarray((can.render(r) * 255).astype(np.uint8), 'RGBA').save(f'{S}/can_{k}.png')
    print(can.W, can.Hpx)
