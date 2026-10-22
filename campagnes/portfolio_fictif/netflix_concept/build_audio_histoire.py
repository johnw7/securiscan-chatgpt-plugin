"""Bande-son du Reel « Léa et Tom » (33,4 s), calée sur reel_histoire.html. Sons originaux (aucun son de marque).
Usage : python3 build_audio_histoire.py [bruitages] -> audio/histoire[_bruitages].wav"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__))
COVER = 2.4; SD = [3.8, 3.4, 3.8, 3.6, 4.6, 3.8, 3.8]
T = [COVER + sum(SD[:i]) for i in range(len(SD))]; END = COVER + sum(SD); DUR = END + 4.6
N = int(DUR * SR); mus, sfx = np.zeros(N), np.zeros(N)
def swell(L=2.0):  # montée chaude qui accompagne le rire
    m = int(L * SR); t = np.arange(m) / SR
    return (sine(hz(-5), m) + .6 * sine(hz(0), m) + .5 * sine(hz(4), m) + .35 * sine(hz(7), m)) * np.minimum(1, t / (L * .8)) * np.minimum(1, (L - t) / .5)
def buzz(at, k=.25):  # vibration de téléphone
    for j in range(2): add(sfx, thud(), at + j * .16, k)
# musique : piano doux et froid, qui s'ouvre et se réchauffe au rire (version complète seulement)
BT = 60 / 72; CH = [(-12, -5, 0, 3), (-16, -9, -4, 0), (-14, -7, -2, 2), (-17, -10, -5, -1)]
CH2 = [(-12, -5, 0, 4), (-17, -10, -5, 0), (-14, -7, 0, 4), (-19, -12, -7, 0)]
t = 0; k = 0
while t < DUR:
    ch = (CH2 if t >= T[4] - .2 else CH)[k % 4]; add(mus, pad(list(ch), BT * 4 + .3, 1200 if t < T[4] else 2400), t, .24); t += BT * 4; k += 1
for i in range(int(DUR / (BT / 2))):
    n = [12, 15, 19, 22, 19, 15][i % 6] if i * BT / 2 < T[4] else [12, 16, 19, 24, 19, 16][i % 6]; mm = int(1.8 * SR)
    add(mus, (sine(hz(n), mm) + .3 * sine(hz(n) * 2.01, mm)) * env(mm, .004, .5), i * BT / 2, .08 if i * BT / 2 < T[4] else .11)
# bruitages
add(sfx, pop(), .3, .12)
for j in range(3): add(sfx, tick(), T[0] + .6 + j * .55, .1)                    # deux écrans qui cliquent
buzz(T[0] + 2.4, .18)
add(sfx, whoosh(.7), T[1] - .2, .25); add(sfx, boom(1.2), T[1] + .1, .3)         # le silence
add(sfx, boom(1.4), T[1] + 1.7, .35)                                              # « ils se sont juste croisés »
add(sfx, whoosh(.45), T[2] - .12, .25)
add(sfx, pop(), T[2] + .85, .3); buzz(T[2] + 2.0, .2)                             # le message part, ça vibre
for j in range(8): add(sfx, tick(), T[2] + 1.75 + j * .14, .05)                   # il écrit…
add(sfx, ding(24), T[2] + 2.95, .3); add(sfx, pop(), T[2] + 2.95, .2)            # « Ok. »
add(sfx, whoosh(.45), T[3] - .12, .26)
for j in range(5): add(sfx, tick(), T[3] + .6 + j * .2, .08)                      # le catalogue défile
add(sfx, ding(19), T[3] + 1.95, .3); add(sfx, boom(.8), T[3] + 1.95, .3)
add(sfx, whoosh(.6), T[4] - .2, .3); add(sfx, riser(2.0), T[4] + .1, .22); add(sfx, swell(2.4), T[4] + .1, .22)
add(sfx, boom(1.2), T[4] + 2.1, .5)                                               # le rire éclate
for j in range(4): add(sfx, ding(12 + j * 4), T[4] + 2.2 + j * .12, .12)
add(sfx, whoosh(.45), T[5] - .12, .25); add(sfx, ding(24), T[5] + 1.9, .25); add(sfx, pop(), T[5] + 1.9, .25)
add(sfx, whoosh(.45), T[6] - .12, .25); add(sfx, swell(2.6), T[6] + .3, .12)
add(sfx, riser(1.2), END - 1.2, .2); add(sfx, boom(1.3), END, .5); add(sfx, thud(), END, .35)
MODE = sys.argv[1] if len(sys.argv) > 1 else 'complet'
mix = sfx if MODE == 'bruitages' else mus * .85 + sfx
t = np.arange(N) / SR; mix *= np.minimum(1, t / .2) * np.minimum(1, (DUR - t) / 1.6)
os.makedirs(f'{D}/audio', exist_ok=True)
master(mix, f'{D}/audio/histoire' + ('_bruitages' if MODE == 'bruitages' else '') + '.wav', DUR, lufs=-16 if MODE == 'bruitages' else -13)
print('ok', DUR)
