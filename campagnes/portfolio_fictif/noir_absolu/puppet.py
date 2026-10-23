"""Marionnette 2,5D à partir d'une seule photo : déformations locales pilotées par les points du visage (mediapipe).
Bouche (synchro audio), clignements, regard, tête, respiration, mains, flacon."""
import numpy as np, cv2
from PIL import Image
D = __import__('os').path.dirname(__import__('os').path.abspath(__file__))
IMG = np.array(Image.open(f'{D}/source/reference.webp').convert('RGB')); H, W = IMG.shape[:2]
LM = np.load(f'{D}/assets/lm.npy')
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)
def P(i): return LM[i]
def frame_of(a, b):
    u = (b - a); n = np.linalg.norm(u); u = u / n; v = np.array([-u[1], u[0]]);
    if v[1] < 0: v = -v
    return u, v, n
def gauss(c, u, v, su, sv):
    dx = XX - c[0]; dy = YY - c[1]; a = dx * u[0] + dy * u[1]; b = dx * v[0] + dy * v[1]
    return np.exp(-(a / su) ** 2 - (b / sv) ** 2).astype(np.float32)
# --- bouche
mc = (P(61) + P(291)) / 2; mu, mv, mw = frame_of(P(61), P(291)); mc = (P(13) + P(14)) / 2 * .5 + mc * .5
h0 = np.linalg.norm(P(13) - P(14))
G_lo = gauss(mc + mv * mw * .14, mu, mv, mw * .55, mw * .30); G_up = gauss(mc - mv * mw * .12, mu, mv, mw * .55, mw * .20)
G_jaw = gauss(mc + mv * mw * .6, mu, mv, mw * 1.0, mw * .75); G_w = gauss(mc, mu, mv, mw * .85, mw * .5)
# --- yeux
def eye(ci, co, up, lo):
    c = (P(ci) + P(co)) / 2; u, v, w = frame_of(P(ci), P(co)) if P(ci)[0] < P(co)[0] else frame_of(P(co), P(ci))
    top = (P(up[0]) + P(up[1])) / 2; bot = (P(lo[0]) + P(lo[1])) / 2; hh = np.linalg.norm(top - bot)
    return dict(c=c, u=u, v=v, w=w, h=hh, G=gauss(c - v * w * .16, u, v, w * .62, w * .42))
EYES = [eye(33, 133, (159, 158), (145, 153)), eye(362, 263, (386, 385), (374, 380))]
IRIS = [P(468), P(473)]; IRR = [np.linalg.norm(P(469) - P(471)) / 2, np.linalg.norm(P(474) - P(476)) / 2]
# --- masque de la personne (pour la tête et le corps)
MASK = cv2.GaussianBlur(np.load(f'{D}/assets/person.npy').astype(np.float32), (0, 0), 5)
NECK = np.array([470., 820.])
def smooth(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)
W_HEAD = smooth((820 - YY) / 220) * MASK
W_BODY = smooth((YY - 700) / 250) * MASK
HAND_R = np.array([600., 1000.]); G_HR = gauss(HAND_R, np.array([1., 0]), np.array([0, 1.]), 150, 170) * MASK
BOT = np.array([235., 730.]); G_BOT = gauss(BOT, np.array([1., 0]), np.array([0, 1.]), 150, 210)
def render(p):
    """p : dict de paramètres (voir clés ci‑dessous) -> image RGB uint8 de la taille de la photo"""
    dx = np.zeros((H, W), np.float32); dy = np.zeros((H, W), np.float32)
    def push(Wt, vec):  # déplacement direct (la source est lue à p - déplacement)
        nonlocal dx, dy; dx += Wt * vec[0]; dy += Wt * vec[1]
    # bouche : o (ouverture -1..1), w (largeur -1..1)
    o = p.get('o', 0); wd = p.get('w', 0); A = mw * .26
    push(G_lo, mv * (o * A)); push(G_up, -mv * (o * A * .30)); push(G_jaw, mv * (o * A * .55))
    push(G_w, mu * (wd * mw * .05)) if False else None
    sx = 1 + wd * .06 * G_w  # largeur : étirement le long de u
    dxm = (XX - mc[0]) * mu[0] + (YY - mc[1]) * mu[1]; push(G_w * dxm * (-wd * .08), mu)
    # paupières
    for e, b in zip(EYES, (p.get('b', 0), p.get('b', 0))):
        push(e['G'], e['v'] * (b * e['h'] * 1.15))
    # regard (déplacement de l'iris)
    gz = p.get('gaze', (0, 0))
    for c, r in zip(IRIS, IRR):
        Gi = gauss(c, np.array([1., 0]), np.array([0, 1.]), r * 1.15, r * 1.15); push(Gi, np.array([gz[0], gz[1]]) * r * .55)
    # tête : rotation autour du cou + petit déplacement
    th = p.get('head_r', 0) * np.pi / 180; tx, ty = p.get('head_t', (0, 0))
    rx, ry = XX - NECK[0], YY - NECK[1]
    hx = (np.cos(th) - 1) * rx - np.sin(th) * ry + tx; hy = np.sin(th) * rx + (np.cos(th) - 1) * ry + ty
    dx += -W_HEAD * hx * -1; dy += -W_HEAD * hy * -1  # (src = p - d) => d = -(shift)
    # corps : respiration
    br = p.get('breath', 0); push(W_BODY, np.array([0, -br * 5.0])); push(W_BODY * (XX - W / 2) / W, np.array([br * 3.0, 0]))
    # main droite (spectateur) : geste
    hr = p.get('hand_r', (0, 0)); push(G_HR, np.array(hr, np.float32))
    # flacon + main gauche
    bt = p.get('bottle', (0, 0, 0))  # dx, dy, rotation (deg)
    brot = bt[2] * np.pi / 180; rbx, rby = XX - BOT[0], YY - BOT[1]
    push(G_BOT, np.array([bt[0], bt[1]], np.float32))
    dx += G_BOT * ((np.cos(brot) - 1) * rbx - np.sin(brot) * rby) * -1; dy += G_BOT * (np.sin(brot) * rbx + (np.cos(brot) - 1) * rby) * -1
    out = cv2.remap(IMG, XX + dx * 0 - dx, YY - dy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    return out
