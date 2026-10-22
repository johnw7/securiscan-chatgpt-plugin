"""Bande-son d'Envol : voix féminine + effets sonores calés sur chaque mot (+ musique en option).
Usage : python3 build_audio.py [voix_effets|complet]  -> audio/envol_<mode>.wav
Prérequis : python3 tts_voix.py <modele.onnx> puis python3 -I cues.py (vo/plan.json)."""
import os, sys, json
import numpy as np
import soundfile as sf
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__))
PL = json.load(open(f'{D}/vo/plan.json')); LN = PL['lines']; WD = PL['words']
COVER = 2.4; mid = lambda i: (LN[i]['b'] + LN[i + 1]['a']) / 2
B = [0] + [mid(i) for i in range(1, 10)]; ENDT = PL['end'] + 2.0; DUR = COVER + ENDT
N = int(DUR * SR); voice, sfx, mus = np.zeros(N), np.zeros(N), np.zeros(N)
def cue(k, sub, d=0):
    w = next((x for x in WD[k] if sub in x[0]), None)
    return (w[1] if w else next(l['a'] for l in LN if l['k'] == k)) + d + COVER
def at(tc): return tc + COVER
def swell(L=2.0):
    m = int(L * SR); t = np.arange(m) / SR
    return (sine(hz(-5), m) + .6 * sine(hz(0), m) + .5 * sine(hz(4), m) + .35 * sine(hz(7), m)) * np.minimum(1, t / (L * .8)) * np.minimum(1, (L - t) / .5)
def buzz(t0, k=.2):
    for j in range(2): add(sfx, thud(), t0 + j * .16, k)
def shimmer(t0, n=6, k=.12):
    for j in range(n): add(sfx, ding(24 + [0, 4, 7, 12, 16, 19][j % 6]), t0 + j * .07, k)
def ticks(t0, t1, k=.07, step=.12):
    x = t0
    while x < t1: add(sfx, tick(), x, k); x += step
# ---- voix (placée à l'instant exact du plan)
mask = np.zeros(N)
for L in LN:
    y, sr = sf.read(f"{D}/vo/{L['k']}.wav"); y = y.mean(axis=1) if y.ndim > 1 else y
    if sr != SR:
        import subprocess; subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f"{D}/vo/{L['k']}.wav", '-ar', str(SR), '-ac', '1', '/tmp/_v.wav'], check=True); y, sr = sf.read('/tmp/_v.wav')
    y = y / max(1e-6, np.abs(y).max()) * .9; i0 = int((L['a'] + COVER) * SR); add(voice, y, L['a'] + COVER, 1.0)
    mask[i0:i0 + len(y)] = 1
# ---- effets sonores calés sur la parole
add(sfx, riser(1.7), COVER - 1.7, .2); add(sfx, pop(), .4, .12)
for i in range(1, 10): add(sfx, whoosh(.45), at(B[i]) - .14, .24)                       # changements de scène
# 1 · le quotidien
ticks(cue('v1', 'n47'), cue('v1', 'n47', 1.3), .06, .13); add(sfx, thud(), cue('v1', 'n47', 1.35), .3)
buzz(cue('v1', 'aucune', -.05)); add(sfx, pop(), cue('v1', 'aucune'), .2)
add(sfx, boom(1.0), cue('v1', 'reponse', -.1), .35)
add(sfx, boom(1.2), cue('v2', 'mois', -.2), .3); add(sfx, tick(), cue('v2', 'chaque'), .15)
# 2 · le déclic : message de l'amie, puis le logo
add(sfx, pop(), cue('v3', 'amie', -.5), .25); add(sfx, ding(19), cue('v3', 'amie', -.5), .2)
add(sfx, riser(.9), cue('v3', 'envol', -.9), .22); add(sfx, boom(1.3), cue('v3', 'envol', .1), .5); shimmer(cue('v3', 'envol', .15), 7, .14)
# 3 · mode d'emploi
for j in range(2): add(sfx, pop(), at(B[2]) + .5 + j * .15, .1)
add(sfx, tick(), cue('v4', 'deposes', -.05), .25); ticks(cue('v4', 'deposes'), cue('v4', 'deposes', 1.35), .06, .1)
add(sfx, ding(24), cue('v4', 'deposes', 1.4), .25); add(sfx, pop(), cue('v4', 'deposes', 1.4), .2)
for j in range(3): add(sfx, pop(), cue('v4', 'reste', j * .34 - .05), .14)
for j in range(3): add(sfx, pop(), cue('v4', 'tout', -.55 + j * .2), .1)
for j in range(4): add(sfx, tick(), at(B[3]) + .5 + j * .15, .06)
for sub, d in (('metier', 0), ('ville', 0)): add(sfx, ding(24), cue('v5', sub, d + .1), .2); add(sfx, pop(), cue('v5', sub, d), .14)
add(sfx, snap(), cue('v5', 'teletravail', .1), .25); add(sfx, ding(28), cue('v5', 'teletravail', .15), .2)
for j in range(3): add(sfx, pop(), cue('v5', 'valeurs', -.1 + j * .22), .12)
add(sfx, whoosh(.6), cue('v6', 'propose', -.1), .18)
for j in range(3): add(sfx, pop(), cue('v6', 'propose', .1 + j * .18), .12)
add(sfx, whoosh(.4), cue('v6', 'droite', .05), .3); add(sfx, ding(28), cue('v6', 'droite', .2), .28)
add(sfx, whoosh(.4), cue('v6', 'gauche', .05), .26); add(sfx, thud(), cue('v6', 'gauche', .35), .2)
add(sfx, pop(), cue('v7', 'offre', -.1), .15); add(sfx, pop(), cue('v7', 'plait', .1), .12)
add(sfx, tick(), cue('v7', 'geste', .05), .3); add(sfx, ding(24), cue('v7', 'geste', .2), .3); add(sfx, pop(), cue('v7', 'geste', .2), .25)
add(sfx, pop(), cue('v7', 'ecris', .3), .18); buzz(cue('v7', 'ecris', .3), .15); add(sfx, pop(), cue('v7', 'recruteur', .1), .2)
ticks(cue('v8', 'envoyee'), cue('v8', 'envoyee', .35), .1, .12); add(sfx, ding(19), cue('v8', 'envoyee', .1), .15)
ticks(cue('v8', 'vue'), cue('v8', 'vue', .2), .1, .1); add(sfx, ding(24), cue('v8', 'vue', .05), .18)
add(sfx, ding(28), cue('v8', 'entretien', .05), .3); add(sfx, pop(), cue('v8', 'entretien', .05), .22)
add(sfx, swell(2.4), cue('v8', 'noir', -.4), .2); shimmer(cue('v8', 'noir', .1), 6, .12)
# 4 · le moment fort
add(sfx, swell(1.6), cue('v9', 'soir', -.2), .22)
buzz(cue('v9', 'message', -.1), .3); add(sfx, boom(1.0), cue('v9', 'message', 0), .45); shimmer(cue('v9', 'message', .05), 8, .16)
# 5 · la nouvelle vie
add(sfx, thud(), cue('v10', 'premier'), .35); add(sfx, boom(.8), cue('v10', 'premier'), .3)
add(sfx, whoosh(.5), cue('v10', 'bienvenue', -.2), .25)
for j in range(14): add(sfx, pop(), cue('v10', 'equipe', -.1 + j * .06), .12)
# 6 · l'appel à l'action
add(sfx, riser(1.0), cue('v11', 'en', -1.0), .2); add(sfx, boom(1.4), cue('v11', 'en', 0), .5); add(sfx, thud(), cue('v11', 'en', 0), .35)
add(sfx, ding(24), cue('v11', 'commence'), .2); shimmer(cue('v11', 'ici'), 6, .14)
# ---- musique douce (version complète) : sombre au début, s'ouvre au déclic, chaleureuse au moment fort ; baisse sous la voix
BT = 60 / 76; MIN = [(-12, -5, 0, 3), (-16, -9, -4, 0), (-14, -7, -2, 2), (-17, -10, -5, -1)]; MAJ = [(-12, -5, 0, 4), (-17, -10, -5, 0), (-14, -7, 0, 4), (-19, -12, -7, 0)]
t = 0; k = 0
while t < DUR:
    ch = (MAJ if t >= at(B[2]) else MIN)[k % 4]; add(mus, pad(list(ch), BT * 4 + .3, 1200 if t < at(B[2]) else 2200), t, .22); t += BT * 4; k += 1
for i in range(int(DUR / (BT / 2))):
    tt = i * BT / 2; n = ([12, 15, 19, 22, 19, 15] if tt < at(B[2]) else [12, 16, 19, 24, 19, 16])[i % 6]; mm = int(1.8 * SR)
    add(mus, (sine(hz(n), mm) + .3 * sine(hz(n) * 2.01, mm)) * env(mm, .004, .5), tt, .07 if tt < at(B[2]) else .1)
j = 0
while at(B[2]) + j * BT / 2 < DUR - 2:
    add(mus, kick(.8), at(B[2]) + j * BT / 2, .22) if j % 4 == 0 else None; add(mus, hat(), at(B[2]) + j * BT / 2 + BT / 4, .03); j += 1
from scipy.ndimage import uniform_filter1d
duck = 1 - .6 * uniform_filter1d(mask, int(.25 * SR))
mus = mus * duck
MODE = sys.argv[1] if len(sys.argv) > 1 else 'voix_effets'
mix = voice * 1.0 + sfx + (mus * .9 if MODE == 'complet' else 0)
t = np.arange(N) / SR; mix *= np.minimum(1, t / .15) * np.minimum(1, (DUR - t) / 1.5)
os.makedirs(f'{D}/audio', exist_ok=True)
master(mix, f'{D}/audio/envol_{MODE}.wav', DUR, lufs=-15 if MODE == 'voix_effets' else -14)
print('ok', round(DUR, 2))
