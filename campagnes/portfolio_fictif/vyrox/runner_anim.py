"""Anime la sportive (photo unique) : respiration, clignements, bouche qui souffle, tête, queue de cheval au vent,
bras en mouvement de course, écouteur ajusté (clic). Sortie : assets/run/NNNN.jpg (index d'image global, 30 i/s)."""
import os, sys, numpy as np, cv2
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); FPS = 30
IMG = np.array(Image.open(f'{D}/assets/clean_x2.jpg'))[0:1610, 0:1640].copy(); H, W = IMG.shape[:2]
LM = np.load(f'{D}/assets/runner_lm.npy'); P = lambda i: LM[i]
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)
def frame_of(a, b):
    u = b - a; n = np.linalg.norm(u); u = u / n; v = np.array([-u[1], u[0]]); v = -v if v[1] < 0 else v; return u, v, n
def gauss(c, u, v, su, sv):
    dx, dy = XX - c[0], YY - c[1]; a = dx * u[0] + dy * u[1]; b = dx * v[0] + dy * v[1]; return np.exp(-(a / su) ** 2 - (b / sv) ** 2).astype(np.float32)
I2 = (np.array([1., 0]), np.array([0, 1.]))
mu, mv, mw = frame_of(P(61), P(291)); mc = (P(13) + P(14)) / 2
G_lo = gauss(mc + mv * mw * .16, mu, mv, mw * .6, mw * .32); G_up = gauss(mc - mv * mw * .12, mu, mv, mw * .55, mw * .2); G_jaw = gauss(mc + mv * mw * .7, mu, mv, mw * 1.1, mw * .8)
def eye(a, b, up, lo):
    u, v, w = frame_of(P(a), P(b)) if P(a)[0] < P(b)[0] else frame_of(P(b), P(a)); c = (P(a) + P(b)) / 2
    h = np.linalg.norm((P(up[0]) + P(up[1])) / 2 - (P(lo[0]) + P(lo[1])) / 2); return c, v, h, gauss(c - v * w * .16, u, v, w * .62, w * .42)
EYES = [eye(33, 133, (159, 158), (145, 153)), eye(362, 263, (386, 385), (374, 380))]
def sm(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)
NECK = np.array([1050., 980.]); W_HEAD = sm((980 - YY) / 300) * sm((XX - 380) / 300)
W_CHEST = sm((YY - 850) / 250)
HAIR = sm((900 - XX) / 350) * sm((1150 - YY) / 300) + .5 * sm((260 - YY) / 200)
EAR = np.array([736., 455.]); G_EAR = gauss(EAR, *I2, 70, 60)
FIST = np.array([1420., 1475.]); G_FIST = gauss(FIST, *I2, 190, 170)
ARM_L = np.array([150., 1150.]); G_ARM = gauss(ARM_L, *I2, 260, 280)
def render(t):
    run = sm((t - 5) / .4) * (1 - sm((t - 25.2) / 1.2)); dx = np.zeros((H, W), np.float32); dy = np.zeros((H, W), np.float32)
    def push(Wt, v): dx.__iadd__(Wt * v[0]); dy.__iadd__(Wt * v[1])
    step = 2 * np.pi * 1.4 * t
    # respiration (profonde au départ, rapide en course / à l'arrivée)
    bp = np.sin(2 * np.pi * t / 2.4) if run < .5 and t < 20 else np.sin(2 * np.pi * t / 1.05)
    push(W_CHEST, np.array([0, -(5 + 4 * run) * bp])); push(W_CHEST * (XX - 800) / 800, np.array([3 * bp, 0]))
    o = -.35 + .35 * max(0, bp) + .25 * run * np.sin(step * 2) * .5; A = mw * .22
    push(G_lo, mv * o * A); push(G_up, -mv * o * A * .3); push(G_jaw, mv * o * A * .5)
    b = 0
    for t0 in (0.9, 3.7, 6.8, 9.5, 25.7):
        d = t - t0
        if 0 <= d < .24: b = max(b, np.sin(np.pi * d / .24) ** 1.5)
    for c, v, h, G in EYES: push(G, v * b * h * 1.15)
    th = (.9 * np.sin(.8 * t) + 1.3 * run * np.sin(step)) * np.pi / 180; rx, ry = XX - NECK[0], YY - NECK[1]
    dx += W_HEAD * ((np.cos(th) - 1) * rx - np.sin(th) * ry); dy += W_HEAD * (np.sin(th) * rx + (np.cos(th) - 1) * ry - 4 * run * np.sin(step * 2))
    wv = (4 + 26 * run); push(HAIR, np.array([wv * np.sin(step * 1.0 - YY / 140), .4 * wv * np.cos(step - XX / 160)]) if False else np.array([0, 0]))
    dx += HAIR * wv * np.sin(step - YY / 140 + XX / 300); dy += HAIR * .35 * wv * np.cos(step * 1.1 - XX / 160)
    push(G_FIST, np.array([10 * run * np.sin(step + 1), -38 * run * np.sin(step)])); push(G_ARM, np.array([0, 30 * run * np.sin(step)]))
    ck = sm((t - 1.55) / .3) * (1 - sm((t - 2.05) / .25)); push(G_EAR, np.array([7 * ck, -3 * ck]))
    return cv2.remap(IMG, XX - dx, YY - dy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
if __name__ == '__main__':
    os.makedirs(f'{D}/assets/run', exist_ok=True)
    idx = list(range(0, int(11.2 * FPS))) + list(range(int(24.8 * FPS), int(27.0 * FPS)))
    if len(sys.argv) > 1: idx = [int(float(x) * FPS) for x in sys.argv[1:]]
    for i in idx:
        cv2.imwrite(f'{D}/assets/run/{i:04d}.jpg', cv2.cvtColor(render(i / FPS), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print('ok', len(idx))
