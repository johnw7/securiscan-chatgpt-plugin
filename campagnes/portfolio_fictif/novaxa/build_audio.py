"""Bruitages du Reel Novaxa Conseil (33,6 s), calés sur reel.html.
Usage : python3 build_audio.py [bruitages] -> audio/reel[_bruitages].wav"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__))
COVER = 2.4; SD = [3.0, 2.6, 4.6, 2.4, 4.6, 2.4, 4.6, 2.4]
T = [COVER + sum(SD[:i]) for i in range(len(SD))]; END = COVER + sum(SD); DUR = END + 4.6
N = int(DUR * SR); mus, sfx = np.zeros(N), np.zeros(N)
BT = 60 / 112; i = 0
while i * BT / 2 < DUR:
    at = i * BT / 2
    if i % 4 == 0: add(mus, kick(.9), at, .45)
    if i % 4 == 2: add(mus, snap(), at, .18)
    add(mus, hat(), at + BT / 4, .05); i += 1
for k in range(int(DUR / (BT * 4)) + 1): add(mus, pad([-12, -5, 0, 3] if k % 2 == 0 else [-14, -7, -2, 2], BT * 4 + .2, 1500), k * BT * 4, .14)
# bruitages
for j in range(5): add(sfx, thud(), T[0] + .2 + j * .22, .3)  # mots qui claquent
add(sfx, boom(1.0), T[1] + .15, .55)
for j in range(4): add(sfx, thud(), T[1] + .7 + j * .18, .25)
for a in T[1:]: add(sfx, whoosh(.4), a - .1, .28)
for j in range(3): add(sfx, ding(19), T[2] + .7 + j * .55, .25); add(sfx, ding(24), T[2] + .76 + j * .55, .15)
add(sfx, boom(1.1), T[2] + 3.0, .6); add(sfx, snap(), T[2] + 3.0, .4)
for a in (T[3], T[5], T[7]):
    for j in range(4): add(sfx, tick(), a + .45 + j * .14, .2)
    add(sfx, pop(), a + 1.2, .3); add(sfx, ding(24), a + 1.45, .25)
for j in range(36): add(sfx, tick(), T[4] + .6 + j * .045, .1)  # cellules
for j in range(5): add(sfx, pop(), T[4] + .8 + j * .45, .15)  # onglets
for j in range(3): add(sfx, thud(), T[4] + 3.2 + j * .4, .35)
for j in range(40): add(sfx, tick(), T[6] + .5 + 3.7 * (j / 40) ** .6, .12)  # horloge qui s'emballe
add(sfx, riser(1.2), END - 1.2, .2); add(sfx, boom(1.0), END, .5); add(sfx, pop(), END + 1.6, .3)
MODE = sys.argv[1] if len(sys.argv) > 1 else 'complet'
mix = sfx if MODE == 'bruitages' else mus * .85 + sfx
t = np.arange(N) / SR; mix *= np.minimum(1, t / .2) * np.minimum(1, (DUR - t) / 1.5)
os.makedirs(f'{D}/audio', exist_ok=True)
master(mix, f'{D}/audio/reel' + ('_bruitages' if MODE == 'bruitages' else '') + '.wav', DUR, lufs=-16 if MODE == 'bruitages' else -13)
print('ok', DUR)
