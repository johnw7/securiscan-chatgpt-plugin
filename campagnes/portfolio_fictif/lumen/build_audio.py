"""Bruitages (+ musique optionnelle) du TikTok « Lumen Immobilier — vendu en 7 jours », calés sur tiktok_7jours.html.
Usage : python3 build_audio.py [complet] -> audio/tiktok_7jours_bruitages.wav (ou _complet.wav)"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__))
COVER = 2.4; SD = [3.6, 3.6, 3.8, 3.6, 3.8, 3.4, 3.6, 3.8]
T = [COVER + sum(SD[:i]) for i in range(len(SD))]; END = COVER + sum(SD); DUR = END + 5
N = int(DUR * SR); sfx, mus = np.zeros(N), np.zeros(N)
for a in T[1:]: add(sfx, whoosh(.4), a - .1, .25)
for a in T: add(sfx, pop(), a + .1, .18)                                   # le jour qui arrive
for j in range(18): add(sfx, tick(), T[0] + .5 + j * .105, .12)             # estimation qui monte
add(sfx, ding(19), T[0] + 2.45, .3)
for k in (.8, 1.25, 1.7): add(sfx, snap(), T[1] + k, .35); add(sfx, sizzle(.12), T[1] + k, .15)   # déclencheur photo
for j in range(10): add(sfx, pop(), T[2] + 1 + j * .2, .08)                 # cœurs / vues
for k in range(9): add(sfx, tick(), T[3] + .6 + k * .22, .16)              # créneaux qui se remplissent
add(sfx, thud(), T[3] + 2.8, .45)
for k in range(3): add(sfx, ding(12 + 4 * k), T[4] + .4 + k * .9, .3)       # offres reçues
add(sfx, riser(1.6), T[5] + .9, .18)                                        # signature
add(sfx, boom(1.1), T[6] + .7, .55); add(sfx, ding(24), T[6] + .8, .25)    # VENDU
for j in range(10): add(sfx, tick(), T[7] + .1 + j * .11, .12)
add(sfx, boom(.9), END, .45); add(sfx, ding(12), END + .4, .22)
if len(sys.argv) > 1 and sys.argv[1] == 'complet':
    BT = 60 / 100; beats = []; i = 0
    CH = [(-9, -5, 0, 3), (-14, -9, -5, -2), (-12, -7, -3, 0), (-7, -2, 2, 5)]
    t = 0; k = 0
    while t < DUR: add(mus, pad(list(CH[k % 4]), BT * 4 + .3, 1800), t, .18); t += BT * 4; k += 1
    while i * BT / 2 < END:
        at = i * BT / 2
        if i % 4 == 0: add(mus, kick(1.0), at, .6); beats.append(at)
        if i % 4 == 2: add(mus, clap(), at, .25)
        add(mus, hat(), at + BT / 4, .06); i += 1
    mus = pump(mus, beats, .3); mix = mus * .8 + sfx; out = 'complet'; lufs = -13
else:
    mix = sfx; out = 'bruitages'; lufs = -16
t = np.arange(N) / SR; mix *= np.minimum(1, t / .3) * np.minimum(1, (DUR - t) / 1.5)
os.makedirs(f'{D}/audio', exist_ok=True); master(mix, f'{D}/audio/tiktok_7jours_{out}.wav', DUR, lufs=lufs); print('ok', out, DUR)
