"""Bruitages du Reel Forge Club style série (34,6 s), calés sur reel_serie.html.
Usage : python3 build_audio.py [bruitages] -> audio/reel_serie[_bruitages].wav"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__))
COVER = 2.4; SD = [2.8, 3.6, 3.4, 3.6, 3.8, 4.6, 4.4]
T = [COVER + sum(SD[:i]) for i in range(len(SD))]; END = COVER + sum(SD); DUR = END + 4.6
N = int(DUR * SR); mus, sfx = np.zeros(N), np.zeros(N)
def slowdown(L=1.0):
    m = int(L * SR); t = np.arange(m) / SR; f = 380 * np.exp(-t * 3.2) + 40
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(m, .01, .6)
# musique (version complète) : nappe sombre + pulsation
BT = 60 / 100; CH = [(-12, -5, 0, 3), (-16, -9, -4, 0), (-14, -7, -2, 2), (-17, -10, -5, -1)]
t = 0; k = 0
while t < DUR:
    add(mus, pad(list(CH[k % 4]), BT * 4 + .3, 1200), t, .22); t += BT * 4; k += 1
i = 0
while T[1] + i * BT / 2 < END:
    at = T[1] + i * BT / 2
    if i % 2 == 0: add(mus, kick(1.0), at, .5)
    if i % 4 == 2: add(mus, clap(), at, .2)
    add(mus, hat(), at + BT / 4, .05); i += 1
# bruitages
add(sfx, pop(), .3, .15); add(sfx, riser(1.4), T[0] - .2, .25)
add(sfx, whoosh(.6), T[0] + 1.0, .3); add(sfx, boom(1.3), T[0] + 1.28, .7); add(sfx, thud(), T[0] + 1.28, .5)
for j in range(10): add(sfx, tick(), T[0] + 1.35 + j * .06, .08)
for a in T[1:5]: add(sfx, whoosh(.45), a - .12, .3); add(sfx, thud(), a + .02, .45); add(sfx, boom(.6), a + .02, .25)
add(sfx, slowdown(1.2), T[4] + .05, .5)
for j in range(5): add(sfx, pop(), T[5] + .5 + j * .2, .16)
add(sfx, ding(19), T[5] + 1.8, .2)
add(sfx, whoosh(.5), T[6] - .12, .3)
for j in range(5): add(sfx, tick(), T[6] + .7 + j * .5, .3)
add(sfx, pop(), T[6] + 3.2, .35); add(sfx, boom(1.0), T[6] + 3.25, .5)
add(sfx, riser(1.2), END - 1.2, .2); add(sfx, boom(1.2), END, .6); add(sfx, thud(), END, .4)
MODE = sys.argv[1] if len(sys.argv) > 1 else 'complet'
mix = sfx if MODE == 'bruitages' else mus * .85 + sfx
t = np.arange(N) / SR; mix *= np.minimum(1, t / .2) * np.minimum(1, (DUR - t) / 1.5)
os.makedirs(f'{D}/audio', exist_ok=True)
master(mix, f'{D}/audio/reel_serie' + ('_bruitages' if MODE == 'bruitages' else '') + '.wav', DUR, lufs=-16 if MODE == 'bruitages' else -13)
print('ok', DUR)
