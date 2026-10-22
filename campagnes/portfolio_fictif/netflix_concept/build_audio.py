"""Bruitages du Reel concept « POV : ce soir, t'as rien prévu » (36,4 s), calés sur reel.html. Sons originaux (aucun son de marque).
Usage : python3 build_audio.py [bruitages] -> audio/reel[_bruitages].wav"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__))
COVER = 2.4; SD = [3.0, 3.6, 3.8, 3.8, 3.6, 3.8, 3.6, 4.2]
T = [COVER + sum(SD[:i]) for i in range(len(SD))]; END = COVER + sum(SD); DUR = END + 4.6
N = int(DUR * SR); mus, sfx = np.zeros(N), np.zeros(N)
# musique douce de soirée (version complète seulement)
BT = 60 / 84; CH = [(-12, -5, 0, 4), (-16, -9, -4, 0), (-14, -7, -2, 2), (-17, -10, -5, -1)]
t = 0; k = 0
while t < DUR:
    add(mus, pad(list(CH[k % 4]), BT * 4 + .3, 1500), t, .22); t += BT * 4; k += 1
for i in range(int(DUR / BT)):
    mm = int(1.6 * SR); add(mus, sine(hz([12, 16, 19, 23][i % 4]), mm) * env(mm, .004, .5), i * BT, .06)
i = 0
while T[1] + i * BT / 2 < END:
    at = T[1] + i * BT / 2
    if i % 4 == 0: add(mus, kick(.9), at, .4)
    add(mus, hat(), at + BT / 4, .04); i += 1
# bruitages
add(sfx, pop(), .3, .15); add(sfx, riser(1.6), T[0] - .3, .22)
add(sfx, whoosh(.6), T[0] + .9, .3); add(sfx, boom(1.4), T[0] + 1.12, .6)       # « T'AS RIEN PRÉVU » claque
for j in range(8): add(sfx, tick(), T[0] + 1.3 + j * .08, .06)
for a in T[1:]: add(sfx, whoosh(.45), a - .12, .26)
add(sfx, thud(), T[1] + .6, .35)                                                  # il s'écroule
for j in range(6): add(sfx, tick(), T[2] + .6 + j * .22, .09)                     # le catalogue défile
add(sfx, ding(19), T[2] + 1.9, .28); add(sfx, boom(.8), T[2] + 1.9, .3)
for j in range(4): add(sfx, pop(), T[3] + .5 + j * .18, .1)                       # profils
add(sfx, ding(24), T[3] + 2.1, .3); add(sfx, snap(), T[3] + 2.1, .3)
add(sfx, pop(), T[4] + .8, .12)
for j in range(4): add(sfx, pop(), T[5] + 1 + j * .3, .12)                        # appareils
for j in range(3): add(sfx, pop(), T[6] + .6 + j * .25, .12)                      # vignettes
for j in range(5): add(sfx, tick(), T[7] + .9 + j * .46, .22)                     # compte à rebours
add(sfx, pop(), T[7] + 3.25, .35); add(sfx, boom(1.0), T[7] + 3.28, .5)
add(sfx, riser(1.2), END - 1.2, .2); add(sfx, boom(1.3), END, .55); add(sfx, thud(), END, .4)
MODE = sys.argv[1] if len(sys.argv) > 1 else 'complet'
mix = sfx if MODE == 'bruitages' else mus * .85 + sfx
t = np.arange(N) / SR; mix *= np.minimum(1, t / .2) * np.minimum(1, (DUR - t) / 1.5)
os.makedirs(f'{D}/audio', exist_ok=True)
master(mix, f'{D}/audio/reel' + ('_bruitages' if MODE == 'bruitages' else '') + '.wav', DUR, lufs=-16 if MODE == 'bruitages' else -13)
print('ok', DUR)
