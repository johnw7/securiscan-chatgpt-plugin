"""Bande-son du TikTok Avenir Investissement (39,3 s), calée sur tiktok_mutation.html.
Usage : python3 build_audio.py -> audio/tiktok_mutation.wav"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__))
COVER = 2.4; SD = [3.4, 3.4, 3.6, 3.3, 3.3, 3.3, 4.2, 3.4, 4.0]
T = [COVER + sum(SD[:i]) for i in range(len(SD))]; END = COVER + sum(SD); DUR = END + 5
N = int(DUR * SR); mus, sfx = np.zeros(N), np.zeros(N)
# accords élégants (la mineur -> fa -> do -> sol), un accord par 2 temps à 90 bpm
BT = 60 / 90; CH = [(-12, -5, 0, 3), (-16, -9, -4, 0), (-9, -5, 0, 4), (-14, -7, -2, 2)]
t = 0; k = 0
while t < DUR:
    ch = CH[k % 4]; L = BT * 4
    add(mus, pad(list(ch), L + .3, 1400 if t < T[3] else 2200), t, .2)
    m = int((L + .3) * SR); add(mus, filt(saw(hz(ch[0] - 24), m, .003), 150) * np.minimum(1, np.arange(m) / SR / .3), t, .26)
    t += L; k += 1
# notes de piano cristallines
for i in range(int(DUR / (BT * 2))):
    at = i * BT * 2; n = [12, 15, 19, 22, 19, 15][i % 6]; mm = int(1.8 * SR)
    add(mus, (sine(hz(n), mm) + .3 * sine(hz(n) * 2.01, mm)) * env(mm, .004, .5), at + .05, .12)
# beat qui démarre avec l'appel à l'agence (« on s'occupe de tout »)
beats = []; i = 0
while T[2] + 1.3 + i * BT / 2 < END:
    at = T[2] + 1.3 + i * BT / 2
    if i % 4 == 0: add(mus, kick(1.0), at, .62); beats.append(at)
    if i % 4 == 2: add(mus, snap(), at, .22)
    add(mus, hat(), at + BT / 4, .06); i += 1
mus = pump(mus, beats, .3)
# sons : notification, coup de J-30, transitions, tampons, clé, révélation finale
add(sfx, ding(12), T[0] + .55, .35); add(sfx, ding(19), T[0] + .62, .2)
add(sfx, boom(1.0), T[1] + .1, .55)
for a in T[1:]: add(sfx, whoosh(.45), a - .12, .25)
for a in T[3:6]: add(sfx, thud(), a + 1.6, .4)
for j in range(5): add(sfx, tick(), T[2] + .2 + j * .35, .18)  # sonnerie
for j in range(6): add(sfx, pop(), T[6] + .3 + j * .35, .14)
add(sfx, riser(1.6), T[7] - .2, .3); add(sfx, ding(24), T[7] + .9, .3); add(sfx, boom(1.2), T[7] + 1.7, .6)
for j in range(10): add(sfx, tick(), T[8] + .1 + j * .11, .12)
add(sfx, boom(.9), END, .5); add(sfx, ding(12), END + .4, .25)
mix = mus * .85 + sfx
t = np.arange(N) / SR; mix *= np.minimum(1, t / .3) * np.minimum(1, (DUR - t) / 1.5)
os.makedirs(f'{D}/audio', exist_ok=True)
master(mix, f'{D}/audio/tiktok_mutation.wav', DUR)
print('ok', DUR)
