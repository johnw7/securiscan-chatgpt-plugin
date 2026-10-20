"""Bruitages du Reel Studio Nacre (36,6 s), calés sur reel_slowmotion.html.
Usage : python3 build_audio.py [bruitages] -> audio/reel_slowmotion[_bruitages].wav"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__))
COVER = 2.4; SD = [3.2, 3.2, 4.2, 3.0, 4.2, 4.2, 3.8, 3.8]
T = [COVER + sum(SD[:i]) for i in range(len(SD))]; END = COVER + sum(SD); DUR = END + 4.8
N = int(DUR * SR); mus, sfx = np.zeros(N), np.zeros(N)
def slowdown(L=1.0):  # « whoom » de ralenti : glissando grave descendant
    m = int(L * SR); t = np.arange(m) / SR; f = 420 * np.exp(-t * 3.2) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(m, .01, .6)
def shimmer(at, n=6, k=.12):
    for j in range(n): add(sfx, ding(24 + [0, 4, 7, 12, 16, 19][j % 6]), at + j * .07, k)
# musique douce (pad + notes) : seulement dans la version complète
BT = 60 / 80; CH = [(-3, 0, 4, 9), (-7, 0, 5, 9), (0, 4, 7, 12), (-5, 2, 7, 11)]
t = 0; k = 0
while t < DUR:
    add(mus, pad(list(CH[k % 4]), BT * 4 + .3, 1500), t, .2); t += BT * 4; k += 1
for i in range(int(DUR / BT)):
    mm = int(1.6 * SR); add(mus, sine(hz([12, 16, 19, 23][i % 4]), mm) * env(mm, .004, .5), i * BT, .07)
# couverture et scène 0 : horloge qui défile
add(sfx, pop(), .3, .2); add(sfx, pop(), .55, .2); shimmer(1.3, 4, .08)
for j in range(10): add(sfx, tick(), T[0] + .2 + j * .3, .16)
add(sfx, thud(), T[0] + .9, .3); add(sfx, thud(), T[0] + 1.9, .3)
for a in T[1:]: add(sfx, whoosh(.5), a - .15, .28)
add(sfx, boom(.8), T[1] + .05, .35); shimmer(T[1] + 1.2, 6, .1)
for i in (2, 4, 5): add(sfx, slowdown(1.1), T[i] + .02, .5)
for j in range(9): add(sfx, pop(), T[2] + .8 + j * .36, .07)  # bulles
for j in range(3): add(sfx, snap(), T[3] + 1 + j * .7, .45); add(sfx, thud(), T[3] + 1 + j * .7, .25)
for j in range(12): add(sfx, tick(), T[3] + .4 + j * .18, .07)  # ciseaux
for j in range(4): add(sfx, whoosh(.9), T[4] + .7 + j * .8, .1)  # souffle du séchoir
shimmer(T[5] + 1.5, 6, .14)
add(sfx, whoosh(.6), T[6] + .9, .2); add(sfx, boom(1.0), T[6] + 2.4, .45); shimmer(T[6] + 2.45, 6, .12)
add(sfx, pop(), T[7] + 1.15, .3); add(sfx, pop(), T[7] + 1.95, .3); add(sfx, ding(19), T[7] + 2.1, .3); shimmer(T[7] + 2.2, 6, .1)
add(sfx, riser(1.2), END - 1.2, .2); add(sfx, boom(.9), END, .45); shimmer(END + .3, 6, .1)
MODE = sys.argv[1] if len(sys.argv) > 1 else 'complet'
mix = sfx if MODE == 'bruitages' else mus * .85 + sfx
t = np.arange(N) / SR; mix *= np.minimum(1, t / .2) * np.minimum(1, (DUR - t) / 1.5)
os.makedirs(f'{D}/audio', exist_ok=True)
master(mix, f'{D}/audio/reel_slowmotion' + ('_bruitages' if MODE == 'bruitages' else '') + '.wav', DUR, lufs=-16 if MODE == 'bruitages' else -13)
print('ok', DUR)
