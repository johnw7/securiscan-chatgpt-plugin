"""NOIR ABSOLU — pub parfum 20 s (marque fictive) : influenceuse animée (marionnette 2,5D pilotée par la voix) + caméra, lumière, particules, texte.
Usage : python3 build.py video   -> out/noir_absolu_video.mp4 (sans son)   |   python3 build.py audio -> audio/noir_absolu_<mode>.wav"""
import os, sys, json, subprocess, numpy as np, cv2, soundfile as sf
from PIL import Image, ImageDraw, ImageFont
D = os.path.dirname(os.path.abspath(__file__)); FPS = 30; DUR = 20.0; OW, OH = 1080, 1920
START = {'l1': .7, 'l2': 4.4, 'l3': 8.0, 'l4': 15.7}
PL = json.load(open(f'{D}/audio/plan.json'))
def voice_track(sr=44100):
    v = np.zeros(int(DUR * sr))
    for k, t0 in START.items():
        y, s = sf.read(f'{D}/audio/vo_{k}.wav'); y = y.mean(axis=1) if y.ndim > 1 else y
        if s != sr:
            import scipy.signal as ss; y = ss.resample_poly(y, sr, s)
        y = y / np.abs(y).max() * .9; i = int(t0 * sr); v[i:i + len(y)] += y
    return v
def speech_drive():
    sr = 44100; v = voice_track(sr); n = int(DUR * FPS); win = int(sr / FPS)
    rms = np.array([np.sqrt(np.mean(v[int(i * sr / FPS):int(i * sr / FPS) + win * 2] ** 2) + 1e-9) for i in range(n)])
    cen = np.zeros(n)
    for i in range(n):
        seg = v[int(i * sr / FPS):int(i * sr / FPS) + 1024]
        if len(seg) == 1024 and rms[i] > .01:
            sp = np.abs(np.fft.rfft(seg * np.hanning(1024))); f = np.fft.rfftfreq(1024, 1 / sr); cen[i] = (sp * f).sum() / (sp.sum() + 1e-9)
    e = np.clip(rms / np.percentile(rms[rms > .02], 90), 0, 1.15)
    ee = np.zeros(n); s = 0
    for i in range(n): s = s + (e[i] - s) * (.75 if e[i] > s else .45); ee[i] = s          # attaque rapide, relâchement doux
    cw = np.clip((cen - 1400) / 1600, -1, 1) * (rms > .02)
    return ee, cw
EE, CW = speech_drive()
def ease(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)
def seg(t, a, b): return float(np.clip((t - a) / (b - a), 0, 1))
rng = np.random.RandomState(7)
BLINKS = [1.9, 4.9, 6.2, 9.6, 12.1, 12.35, 14.2, 17.3, 19.0]
def blink(t):
    b = 0
    for t0 in BLINKS:
        d = t - t0
        if 0 <= d < .26: b = max(b, np.sin(np.pi * d / .26) ** 1.5)
    return b
def params(t, i):
    e = EE[min(i, len(EE) - 1)]; w = CW[min(i, len(CW) - 1)]
    speaking = e > .06
    o = -.88 + 1.05 * e ** .8 if speaking else -.88 + .06 * np.sin(t * 2)       # silence : sourire fermé
    o = float(np.clip(o + .04 * np.sin(t * 23), -.95, .28))
    p = dict(o=o, w=float(.7 * w * (1 if speaking else 0) + (.25 if not speaking else 0)), b=float(blink(t)))
    # regard : vers le flacon quand elle le présente
    g = ease(seg(t, 4.3, 4.7)) * (1 - ease(seg(t, 5.6, 6.0))) + .8 * ease(seg(t, 9.8, 10.0)) * (1 - ease(seg(t, 10.9, 11.2))) + ease(seg(t, 15.0, 15.3))
    p['gaze'] = (-1.0 * g, .7 * g)
    sp = np.convolve(EE, np.ones(15) / 15, 'same')[min(i, len(EE) - 1)]
    p['head_r'] = 1.1 * np.sin(.9 * t) + .8 * np.sin(1.9 * t + 1) + 1.6 * sp * np.sin(3.1 * t)
    p['head_t'] = (4 * np.sin(.7 * t + .5) + 3 * sp * np.sin(2.6 * t), 3 * np.sin(1.1 * t) - 5 * sp)
    p['breath'] = np.sin(2 * np.pi * t / 3.7)
    gs = .6 + 1.6 * ease(seg(t, 3.8, 5)) if t < 15 else .5
    p['hand_r'] = (gs * (-12 * np.sin(1.3 * t) * sp * 3 - 4 * np.sin(.8 * t)), gs * (-10 * np.sin(1.9 * t + 1) * sp * 3 - 4 * np.sin(.6 * t)))
    up = ease(seg(t, 3.9, 4.7)); turn = ease(seg(t, 5.0, 5.6)) * (1 - ease(seg(t, 8.3, 9.0)))
    p['bottle'] = (6 * up + 4 * turn * np.sin(2.1 * (t - 5)), -34 * up + 14 * ease(seg(t, 9, 10)) + 5 * np.sin(1.4 * t) * up + (-14 if t >= 15 else 0), 5 * turn * np.sin(1.7 * (t - 5)) - 3 * up)
    return p
KEYS = [(0, 480, 545, 1.50), (3.6, 480, 540, 1.70), (4.0, 480, 548, 1.70), (5.4, 470, 745, 1.12), (9.0, 470, 735, 1.06), (14.95, 492, 722, 1.22)]
KEYS2 = [(15.0, 250, 745, 2.45), (20.0, 262, 738, 2.8)]
def camera(t):
    K = KEYS2 if t >= 15 else KEYS
    for a, b in zip(K[:-1], K[1:]):
        if a[0] <= t <= b[0]:
            q = ease(seg(t, a[0], b[0])) if (b[0] - a[0]) < 3 else seg(t, a[0], b[0]) * 1.0
            q = ease(seg(t, a[0], b[0])) if b[0] - a[0] < 1.6 or a[0] in (4.0,) else (np.sin(seg(t, a[0], b[0]) * np.pi / 2))
            return [a[i] + (b[i] - a[i]) * q for i in (1, 2, 3)]
    return list(K[-1][1:])
def view(t, h, w):
    cx, cy, z = camera(t); vh = h / z; vw = vh * OW / OH; return cx, cy, z, vw, vh
# ---------- calques lumière
from puppet import H as SH, W as SW
DUST = [dict(x=rng.rand(), y=rng.rand(), r=3 + rng.rand() * 14, v=.012 + .03 * rng.rand(), ph=rng.rand() * 6.28, a=.12 + .3 * rng.rand()) for _ in range(70)]
_gr = np.random.RandomState(3); GRAIN = _gr.randn(OH, OW).astype(np.float32)
yy, xx = np.mgrid[0:OH, 0:OW].astype(np.float32)
VIG = np.clip(1 - .55 * (((xx - OW / 2) / (OW * .75)) ** 2 + ((yy - OH * .48) / (OH * .75)) ** 2), .25, 1)[..., None]
BOTQ = np.array([[168, 566], [265, 566], [268, 645], [322, 655], [330, 880], [150, 884], [145, 700], [170, 650]], np.float32)
def dust_layer(t, k):
    ov = np.zeros((OH, OW, 3), np.float32)
    for d in DUST:
        x = (d['x'] + .03 * np.sin(t * .4 + d['ph'])) * OW; y = ((d['y'] - d['v'] * t * 6) % 1.15 - .05) * OH
        a = d['a'] * k * (.6 + .4 * np.sin(t * 1.3 + d['ph'])); cv2.circle(ov, (int(x), int(y)), int(d['r']), (255 * a, 200 * a, 120 * a), -1, cv2.LINE_AA)
    return cv2.GaussianBlur(ov, (0, 0), 5)
def overlay_text(img, t):
    if t < 15.6: return img
    pil = Image.fromarray(img); dr = ImageDraw.Draw(pil, 'RGBA')
    f1 = ImageFont.truetype(f'{D}/assets/cormorant.ttf', 118); f2 = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Medium.otf', 38) if os.path.exists('/usr/share/fonts/opentype/inter/Inter-Medium.otf') else ImageFont.load_default(); f3 = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Regular.otf', 24)
    def tracked(txt, y, f, sp, a, col=(244, 224, 186)):
        wd = sum(dr.textlength(c, font=f) + sp for c in txt) - sp; x = (OW - wd) / 2
        for c in txt:
            dr.text((x + 2, y + 3), c, font=f, fill=(0, 0, 0, int(a * .55))); dr.text((x, y), c, font=f, fill=col + (int(a),)); x += dr.textlength(c, font=f) + sp
    a1 = int(255 * ease(seg(t, 15.9, 16.7))); a2 = int(255 * ease(seg(t, 17.2, 18.0))); a3 = int(150 * ease(seg(t, 18.4, 19.0)))
    yy_ = 1330 + int(14 * (1 - ease(seg(t, 15.9, 16.9))))
    tracked('NOIR ABSOLU', yy_, f1, 14, a1)
    L = int(500 * ease(seg(t, 16.6, 17.6))); dr.rectangle([OW / 2 - L / 2, yy_ + 150, OW / 2 + L / 2, yy_ + 152], fill=(222, 184, 120, 220))
    tracked('LAISSEZ VOTRE EMPREINTE.', yy_ + 185, f2, 9, a2, (255, 250, 240))
    tracked('Démo conceptuelle · NOIR ABSOLU est un parfum fictif', 1822, f3, 1.5, a3, (255, 255, 255)); tracked('Image générée par IA · création E-DUST Solutions', 1858, f3, 1.5, a3, (255, 255, 255))
    return np.array(pil)
def finish(frame_src, t, i):
    cx, cy, z, vw, vh = view(t, SH, SW)
    M = np.array([[OW / vw, 0, -(cx - vw / 2) * OW / vw], [0, OH / vh, -(cy - vh / 2) * OH / vh]], np.float32)
    # léger tremblé caméra "main"
    M[0, 2] += 3.0 * np.sin(t * 1.7) + 1.5 * np.sin(t * 4.3); M[1, 2] += 2.5 * np.sin(t * 1.3 + 1)
    out = cv2.warpAffine(frame_src, M, (OW, OH), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT).astype(np.float32)
    macro = t >= 15
    if macro:  # profondeur de champ : flou hors du flacon
        q = cv2.transform(BOTQ[None], M)[0]; m = np.zeros((OH, OW), np.float32); cv2.fillPoly(m, [q.astype(np.int32)], 1.0); m = cv2.GaussianBlur(m, (0, 0), 55); m = np.clip(m * 1.6, 0, 1)[..., None]
        bl = cv2.GaussianBlur(out, (0, 0), 16); out = out * m + bl * (1 - m)
        # reflets qui balayent le verre
        mk = np.zeros((OH, OW), np.float32); cv2.fillPoly(mk, [q.astype(np.int32)], 1.0); mk = cv2.GaussianBlur(mk, (0, 0), 3)
        for k0, sp in ((15.4, 1.0), (17.4, 1.2)):
            s = ease(seg(t, k0, k0 + 1.1)); 
            if 0 < s < 1:
                cxg = q[:, 0].min() - 200 + s * (q[:, 0].max() - q[:, 0].min() + 400); band = np.exp(-((xx - cxg - (yy - q[:, 1].mean()) * .45) / 38) ** 2)[..., None]
                out += band * mk[..., None] * 190
    # lumière dorée / bloom
    hi = np.clip(out - 175, 0, 255); out += cv2.GaussianBlur(hi, (0, 0), 28) * (.9 if macro else .55)
    leak = np.exp(-(((xx - OW * 1.0) / (OW * .6)) ** 2 + ((yy - OH * .05) / (OH * .35)) ** 2))[..., None] * np.array([40, 22, 5], np.float32) * (1.0 + .3 * np.sin(t * .8)) * (1.4 if macro else 1)
    out += leak
    out *= np.array([1.03, 1.0, .94], np.float32)                                    # champagne
    out += dust_layer(t, 1.5 if macro else .8)
    if macro: out *= (1 - .55 * np.clip((yy - 1150) / 600, 0, 1) * min(1, (t - 15) / .8))[..., None]
    out *= VIG; out += GRAIN[..., None] * 3.2
    # fondu / éclair doré à la coupe
    fl = max(0, 1 - abs(t - 15.0) / .18) * .55; out = out * (1 - fl) + np.array([255, 230, 180], np.float32) * fl
    out *= min(1, t / .25) * min(1, (DUR - t) / .8) if t > DUR - .8 or t < .25 else 1
    out = np.clip(out, 0, 255).astype(np.uint8)
    return overlay_text(out, t)
def video():
    import puppet
    os.makedirs(f'{D}/out', exist_ok=True)
    pr = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OW}x{OH}', '-r', str(FPS), '-i', '-', '-an', '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', f'{D}/out/noir_absolu_video.mp4'], stdin=subprocess.PIPE)
    N = int(DUR * FPS)
    for i in range(N):
        t = i / FPS; src = puppet.render(params(t, i)); pr.stdin.write(finish(src, t, i).tobytes())
        if i % 60 == 0: print(i, flush=True)
    pr.stdin.close(); pr.wait()
def stills(ts):
    import puppet
    for t in ts:
        i = int(t * FPS); Image.fromarray(finish(puppet.render(params(t, i)), t, i)).save(f'{D}/out/still_{t:05.2f}.jpg', quality=92)
def audio(mode):
    sys.path.insert(0, f'{D}/../../demos_portfolio'); from audiolib import add, whoosh, ding, pop, tick, boom, riser, pad, hz, sine, kick, hat, snap, master, SR
    N = int(DUR * SR); sfx, mus = np.zeros(N), np.zeros(N); v = voice_track(SR)
    def shimmer(t0, n=7, k=.1):
        for j in range(n): add(sfx, ding(24 + [0, 4, 7, 12, 16, 19, 24][j % 7]), t0 + j * .09, k)
    add(sfx, whoosh(.9), 3.7, .22); add(sfx, riser(.6), 3.5, .1); shimmer(4.1, 7, .1); add(sfx, pop(), 4.15, .1)
    for t0 in (5.1, 6.0, 7.0, 8.1): add(sfx, tick(), t0, .09)
    add(sfx, ding(31), 5.4, .1)
    add(sfx, riser(.9), 14.1, .18); add(sfx, boom(1.6), 15.0, .35); add(sfx, whoosh(.5), 14.85, .2); shimmer(15.4, 9, .12); shimmer(17.4, 9, .12)
    add(sfx, ding(28), 16.3, .16); add(sfx, tick(), 17.3, .12)
    # musique douce 84 bpm : nappe + pluck, basse discrète à partir du plan 2
    BT = 60 / 84; CH = [(-12, -5, 0, 3), (-14, -7, -2, 2), (-16, -9, -4, 0), (-17, -10, -5, -1)]
    for k in range(int(DUR / (BT * 4)) + 1): add(mus, pad(list(CH[k % 4]), BT * 4 + .4, 1500), k * BT * 4, .2)
    for i in range(int(DUR / (BT / 2))):
        n = [12, 15, 19, 22, 19, 15][i % 6]; m = int(1.2 * SR); tt = i * BT / 2
        add(mus, (sine(hz(n), m) + .3 * sine(hz(n) * 2.01, m)) * np.exp(-np.arange(m) / SR * 4.5), tt, .06)
    for i in range(int(DUR / BT)):
        if i * BT > 4: add(mus, kick(.6), i * BT, .12 if i % 2 == 0 else 0.0); add(mus, hat(), i * BT + BT / 2, .025)
    from scipy.ndimage import uniform_filter1d
    mask = (np.abs(v) > .02).astype(float); duck = 1 - .55 * np.clip(uniform_filter1d(mask, int(.3 * SR)) * 3, 0, 1)
    mus = mus * duck; t = np.arange(N) / SR
    mix = v * 1.0 + sfx + (mus * .9 if mode == 'musique' else 0); mix *= np.minimum(1, t / .1) * np.minimum(1, (DUR - t) / 1.2)
    os.makedirs(f'{D}/audio', exist_ok=True); master(mix, f'{D}/audio/noir_absolu_{mode}.wav', DUR, lufs=-15 if mode == 'voix_effets' else -14); print('ok')

if __name__ == '__main__':
    if sys.argv[1] == 'video': video()
    elif sys.argv[1] == 'audio': audio(sys.argv[2] if len(sys.argv)>2 else 'voix_effets')
    elif sys.argv[1] == 'stills': stills([float(x) for x in sys.argv[2:]])
