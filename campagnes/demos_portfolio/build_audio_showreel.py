"""Bande-son du showreel E-DUST « films de marque » (30 s), calée sur showreel.html.
Usage : python3 build_audio_showreel.py  -> audio/showreel.wav"""
import os
import numpy as np
from audiolib import *

D = os.path.dirname(os.path.abspath(__file__))
DUR = 30.0
N = int(DUR * SR)
mus, sfx = np.zeros(N), np.zeros(N)
T0, SD = 4.6, 3.6
CUTS = [2.2] + [T0 + i * SD for i in range(7)]          # transitions
# grille d'accords lente (un accord par scène)
CH = [(-9, -5, 0), (-9, -5, 0), (-12, -5, -1), (-16, -9, -4), (-14, -7, -2), (-9, -5, 0), (-12, -5, -1), (-17, -10, -5), (-9, -5, 0, 3)]
starts = [0, 2.2] + [T0 + i * SD for i in range(6)] + [T0 + 6 * SD]
ends = starts[1:] + [DUR]
for (a, b), ch in zip(zip(starts, ends), CH):
    add(mus, pad(list(ch), b - a + .4, 1300), a, .24)
    m = int((b - a + .4) * SR)
    add(mus, filt(saw(hz(ch[0] - 24), m, .003), 140) * np.minimum(1, np.arange(m) / SR / .4), a, .3)
# notes cristallines (motif lent qui revient à chaque scène)
for a in starts:
    for k, n in enumerate((15, 19, 22)):
        mm = int(2.2 * SR)
        add(mus, (sine(hz(n), mm) + .35 * sine(hz(n) * 2.01, mm)) * env(mm, .004, .6), a + .15 + k * .55, .16)
# beat lent en demi-tempo à partir des secteurs
BT = 60 / 72
beats = []
k = 0
while T0 + k * BT / 2 < T0 + 6 * SD:
    at = T0 + k * BT / 2
    if k % 4 == 0:
        add(mus, kick(1.1), at, .7); beats.append(at)
    if k % 4 == 2:
        add(mus, clap(), at, .32)
    add(mus, hat(), at + BT / 4, .07)
    k += 1
mus = pump(mus, beats, .35)
# transitions : souffle inversé + impact grave
for c in CUTS:
    rv = whoosh(.8)[::-1]
    add(sfx, rv, c - .8, .4); add(sfx, boom(.7), c, .55)
# couleurs sonores par secteur
add(sfx, sizzle(3.2) * .6, T0, .12)                                     # boissons : pétillement
for i in range(6):
    add(sfx, ding(24 + i), T0 + 2 * SD + .4 + i * .45, .08)              # parfum : scintillements
for i in range(10):
    add(sfx, tick(), T0 + 3 * SD + .3 + i * .3, .15)                    # café : grains
for i in range(3):
    add(sfx, pop(), T0 + 4 * SD + .4 + i * .35, .3)                     # tech : notifications
for i in range(8):
    add(sfx, ding(27 + (i % 3) * 2), T0 + 5 * SD + .2 + i * .38, .07)    # bijoux : éclats
# fin
add(sfx, boom(1.0), T0 + 6 * SD, .7); add(sfx, pop(), T0 + 6 * SD + 1.6, .35); add(sfx, ding(24), T0 + 6 * SD + 1.7, .25)
# accroche de la miniature
add(sfx, boom(.6), 0, .5); add(sfx, ding(19), .1, .2)
master(.8 * mus + .9 * sfx, f'{D}/audio/showreel.wav', DUR, lufs=-14)
print('ok')
