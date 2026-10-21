"""Bruitages du Reel Atelier Bâtir (33,2 s), calés sur reel.html.
Usage : python3 build_audio.py [bruitages] -> audio/reel_batir[_bruitages].wav"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__))
COVER = 2.4; SD = [3.4, 3.4, 3.8, 4.2, 3.4, 4.6, 3.6]
T = [COVER + sum(SD[:i]) for i in range(len(SD))]; END = COVER + sum(SD); DUR = END + 4.6
N = int(DUR * SR); mus, sfx = np.zeros(N), np.zeros(N)
def buzz(L, f=120, cut=2500):  # perceuse / scie : dent de scie filtrée qui monte puis tient
    m = int(L * SR); x = filt(saw(f, m, .01) + .4 * np.random.randn(m), cut)
    return x * env(m, .05, .2) * (0.6 + 0.4 * np.minimum(1, np.arange(m) / SR / .2))
def scratch(L):  # crayon sur le plan
    m = int(L * SR); return filt(np.random.randn(m), 5000, 'high') * env(m, .02, .1) * (.5 + .5 * np.sin(np.arange(m) / SR * 40) ** 2)
# musique (version complète) : pulsation « chantier » légère
BT = 60 / 104; CH = [(0, 4, 7, 11), (-3, 0, 4, 9), (-7, 0, 4, 7), (-5, -1, 2, 7)]
t = 0; k = 0
while t < DUR:
    add(mus, pad(list(CH[k % 4]), BT * 4 + .3, 1700), t, .18); t += BT * 4; k += 1
i = 0
while T[0] + i * BT / 2 < END:
    at = T[0] + i * BT / 2
    if i % 2 == 0: add(mus, kick(.8), at, .42)
    if i % 4 == 2: add(mus, clap(), at, .18)
    add(mus, hat(), at + BT / 4, .05); i += 1
# bruitages
add(sfx, pop(), .35, .2); add(sfx, pop(), .6, .2)
for j in range(5): add(sfx, ding(-5), T[0] + .5 + j * .55, .12)  # gouttes
add(sfx, thud(), T[0] + 1.7, .5); add(sfx, boom(.6), T[0] + 1.7, .25)  # tampon VÉTUSTE
for a in T[1:]: add(sfx, whoosh(.45), a - .1, .28)
add(sfx, scratch(2.2), T[2] + .2, .08); add(sfx, thud(), T[2] + 2.6, .55); add(sfx, boom(.7), T[2] + 2.6, .3)
add(sfx, boom(.9), T[3] + .1, .35); add(sfx, buzz(1.2, 90, 1800), T[3] + 1.45, .22); add(sfx, buzz(1.2, 160, 3500), T[3] + 2.85, .2)
for j in range(3): add(sfx, snap(), T[3] + j * 1.4, .3)
add(sfx, filt(np.random.randn(int(1.8 * SR)), 900) * env(int(1.8 * SR), .2, .4), T[4] + .1, .15)  # rouleau
add(sfx, thud(), T[4] + 2.05, .35)
add(sfx, riser(2.2), T[5] + .7, .25); add(sfx, boom(1.2), T[5] + 3.0, .6)
for j in range(6): add(sfx, ding(24 + [0, 4, 7, 12, 16, 19][j]), T[5] + 3.05 + j * .07, .1)
add(sfx, thud(), T[6] + 1.6, .5); add(sfx, ding(19), T[6] + 1.65, .25)
add(sfx, riser(1.2), END - 1.2, .2); add(sfx, boom(1.0), END, .5)
MODE = sys.argv[1] if len(sys.argv) > 1 else 'complet'
mix = sfx if MODE == 'bruitages' else mus * .85 + sfx
t = np.arange(N) / SR; mix *= np.minimum(1, t / .2) * np.minimum(1, (DUR - t) / 1.5)
os.makedirs(f'{D}/audio', exist_ok=True)
master(mix, f'{D}/audio/reel_batir' + ('_bruitages' if MODE == 'bruitages' else '') + '.wav', DUR, lufs=-16 if MODE == 'bruitages' else -13)
print('ok', DUR)
