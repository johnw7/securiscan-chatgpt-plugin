"""Bande-son du Reel L'Étang-la-Ville (36,4 s), calée sur reel_nouvel_arrivant.html.
Usage : python3 build_audio.py [bruitages] -> audio/reel_nouvel_arrivant[_bruitages].wav"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__))
COVER = 2.4; SD = [3.4, 3.6, 3.8, 3.6, 3.6, 3.6, 3.6, 4.2]
T = [COVER + sum(SD[:i]) for i in range(len(SD))]; END = COVER + sum(SD); DUR = END + 4.6
N = int(DUR * SR); mus, sfx = np.zeros(N), np.zeros(N)
# musique douce et lumineuse (do -> sol -> la m -> fa) à 96 bpm
BT = 60 / 96; CH = [(0, 4, 7, 12), (-5, 2, 7, 11), (-3, 0, 4, 9), (-7, 0, 5, 9)]
t = 0; k = 0
while t < DUR:
    ch = CH[k % 4]; L = BT * 4
    add(mus, pad(list(ch), L + .3, 1800), t, .18); t += L; k += 1
for i in range(int(DUR / (BT / 2))):
    n = [12, 16, 19, 24, 19, 16, 14, 19][i % 8]; mm = int(.9 * SR)
    add(mus, sine(hz(n), mm) * env(mm, .004, .25), i * BT / 2, .07)
beats = []; i = 0
while T[0] + i * BT / 2 < END:
    at = T[0] + i * BT / 2
    if i % 4 == 0: add(mus, kick(.8), at, .45); beats.append(at)
    if i % 4 == 2: add(mus, clap(), at, .16)
    add(mus, hat(), at + BT / 4, .05); i += 1
mus = pump(mus, beats, .25)
# bruitages : pop de couverture, whoosh de scène, coche + ding à chaque case, notifications, confettis
add(sfx, pop(), .35, .25); add(sfx, pop(), .65, .2); add(sfx, ding(19), 1.2, .2)
for a in T: add(sfx, whoosh(.45), a - .12, .25)
for a in T[0:1]: add(sfx, pop(), a + .6, .18); add(sfx, pop(), a + .9, .18)
for a in T[1:7]:
    add(sfx, pop(), a + .45, .15); add(sfx, snap(), a + 1.0, .3); add(sfx, ding(24), a + 1.3, .22)
add(sfx, ding(12), T[6] + .8, .3); add(sfx, ding(19), T[6] + .87, .2)
add(sfx, ding(12), T[6] + 1.6, .3); add(sfx, ding(19), T[6] + 1.67, .2)
for j in range(6): add(sfx, tick(), T[7] + .3 + j * .2, .16)
add(sfx, boom(1.0), T[7] + 1.8, .5)
for j in range(8): add(sfx, pop(), T[7] + 1.85 + j * .09, .1)
add(sfx, riser(1.2), END - 1.2, .22); add(sfx, boom(.9), END, .5); add(sfx, ding(12), END + .4, .25)
MODE = sys.argv[1] if len(sys.argv) > 1 else 'complet'   # 'bruitages' = sans musique
mix = sfx if MODE == 'bruitages' else mus * .85 + sfx
t = np.arange(N) / SR; mix *= np.minimum(1, t / .2) * np.minimum(1, (DUR - t) / 1.5)
os.makedirs(f'{D}/audio', exist_ok=True)
master(mix, f'{D}/audio/reel_nouvel_arrivant' + ('_bruitages' if MODE == 'bruitages' else '') + '.wav', DUR, lufs=-16 if MODE == 'bruitages' else -13)
print('ok', DUR)
