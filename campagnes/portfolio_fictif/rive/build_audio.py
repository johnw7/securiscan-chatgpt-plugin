"""Bruitages du Reel Rive Concept (32,4 s), calés sur reel.html.
Usage : python3 build_audio.py [bruitages] -> audio/reel[_bruitages].wav"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__))
COVER = 2.4; SD = [3.0, 3.2, 4.0, 4.0, 4.0, 3.8, 3.4]
T = [COVER + sum(SD[:i]) for i in range(len(SD))]; END = COVER + sum(SD); DUR = END + 4.6
N = int(DUR * SR); mus, sfx = np.zeros(N), np.zeros(N)
def shutter():  # déclencheur photo : deux clics secs
    return np.concatenate([snap() * .7, np.zeros(int(.045 * SR)), snap() * .5])
# musique (version complète) : groove chic
BT = 60 / 112; CH = [(-3, 0, 4, 7), (-7, -3, 0, 4), (-5, -1, 2, 7), (-8, -5, -1, 2)]
t = 0; k = 0
while t < DUR:
    add(mus, pad(list(CH[k % 4]), BT * 4 + .3, 1800), t, .18); t += BT * 4; k += 1
i = 0
while i * BT / 2 < DUR:
    at = i * BT / 2
    if i % 4 == 0: add(mus, kick(.8), at, .4)
    if i % 4 == 2: add(mus, snap(), at, .18)
    add(mus, hat(), at + BT / 4, .05); i += 1
# bruitages : pages qui tournent, déclencheurs, claquements de doigts
add(sfx, shutter(), .25, .35); add(sfx, pop(), .8, .15)
for a in T[1:]: add(sfx, whoosh(.5), a - .1, .28)
for a in T: add(sfx, shutter(), a + .25, .3)
for a in T[2:6]: add(sfx, snap(), a, .7); add(sfx, clap(), a + .01, .25)
add(sfx, pop(), T[1] + .85, .25)
for j in range(3): add(sfx, shutter(), T[5] + .3 + j * .45, .3)
add(sfx, thud(), T[5] + 2.4, .45)
add(sfx, riser(1.2), END - 1.2, .18); add(sfx, boom(.8), END, .4); add(sfx, ding(19), END + .4, .2)
MODE = sys.argv[1] if len(sys.argv) > 1 else 'complet'
mix = sfx if MODE == 'bruitages' else mus * .85 + sfx
t = np.arange(N) / SR; mix *= np.minimum(1, t / .15) * np.minimum(1, (DUR - t) / 1.5)
os.makedirs(f'{D}/audio', exist_ok=True)
master(mix, f'{D}/audio/reel' + ('_bruitages' if MODE == 'bruitages' else '') + '.wav', DUR, lufs=-16 if MODE == 'bruitages' else -13)
print('ok', DUR)
