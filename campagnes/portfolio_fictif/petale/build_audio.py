"""Bruitages du Reel Maison Pétale (32 s), calés sur reel.html.
Usage : python3 build_audio.py [bruitages] -> audio/reel[_bruitages].wav"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__))
COVER = 2.4; SD = [3.0, 3.6, 3.8, 3.6, 3.6, 3.8, 3.6]
T = [COVER + sum(SD[:i]) for i in range(len(SD))]; END = COVER + sum(SD); DUR = END + 4.6
N = int(DUR * SR); mus, sfx = np.zeros(N), np.zeros(N)
rng = np.random.default_rng(7)
def paper(L=.35):  # froissement / page qui tourne : bruit filtré par grains
    m = int(L * SR); n = rng.standard_normal(m) * (rng.random(m) < .35)
    return filt(n, 3500) * env(m, .02, .6)
def snip():  # coup de ciseaux
    m = int(.07 * SR); return filt(rng.standard_normal(m), 6000) * env(m, .001, .05)
# musique douce (version complète)
BT = 60 / 84; CH = [(0, 4, 7, 11), (-3, 0, 4, 7), (-7, -3, 0, 4), (-5, -1, 2, 7)]
t = 0; k = 0
while t < DUR:
    add(mus, pad(list(CH[k % 4]), BT * 4 + .3, 2000), t, .16); t += BT * 4; k += 1
for i in range(int(DUR / (BT / 2))):
    mm = int(1.2 * SR); add(mus, sine(hz([19, 23, 26, 24, 19, 16, 14, 16][i % 8]), mm) * env(mm, .004, .35), i * BT / 2, .06)
# bruitages
add(sfx, paper(.3), .3, .25); add(sfx, ding(24), 1.0, .12)
for a in T: add(sfx, paper(.45), a, .35)
for j in range(3): add(sfx, pop(), T[0] + 1.3 + j * .18, .12)
add(sfx, ding(28), T[0] + 1.9, .1)
for j in range(4): add(sfx, snip(), T[2] + 1.0 + j * .5, .5)
for j in range(4): add(sfx, paper(.25), T[3] + .9 + j * .3, .22)
add(sfx, ding(24), T[3] + 2.3, .16)
add(sfx, ding(19), T[4] + .1, .12); add(sfx, ding(26), T[4] + .2, .08)
add(sfx, paper(.5), T[6] + 1.1, .35); add(sfx, ding(24), T[6] + 1.9, .14)
add(sfx, paper(.4), END - .1, .25); add(sfx, ding(19), END + .3, .16); add(sfx, ding(26), END + .4, .1)
MODE = sys.argv[1] if len(sys.argv) > 1 else 'complet'
mix = sfx if MODE == 'bruitages' else mus * .85 + sfx
t = np.arange(N) / SR; mix *= np.minimum(1, t / .2) * np.minimum(1, (DUR - t) / 1.5)
os.makedirs(f'{D}/audio', exist_ok=True)
master(mix, f'{D}/audio/reel' + ('_bruitages' if MODE == 'bruitages' else '') + '.wav', DUR, lufs=-16 if MODE == 'bruitages' else -13)
print('ok', DUR)
