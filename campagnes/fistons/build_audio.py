"""Bande-son de la proposition vidéo « Les Fistons » (35 s) : jazz lo-fi chaleureux, calé sur fistons.html.
Usage : python3 build_audio.py  -> audio/fistons.wav"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'demos_portfolio'))
from audiolib import *

D = os.path.dirname(os.path.abspath(__file__))
DUR = 35.0
N = int(DUR * SR)
mus, sfx = np.zeros(N), np.zeros(N)
BT = 60 / 80
# progression jazz : Ré m9 · Sol 13 · Do maj9 · La 7(b9)
PROG = [(-7, -4, 0, 3, 7), (-2, 2, 5, 8, 12), (-9, -5, -2, 2, 5), (0, 4, 7, 10, 13)]


def rhodes(notes, L):
    m = int(L * SR); t = np.arange(m) / SR
    s = sum(np.sin(2 * np.pi * hz(n) * t) + .25 * np.sin(4 * np.pi * hz(n) * t) * np.exp(-t * 3) for n in notes) / len(notes)
    return s * np.exp(-t * .9) * np.minimum(1, t / .01) * (1 + .12 * np.sin(2 * np.pi * 5 * t))


def upright(n, L):
    m = int(L * SR); t = np.arange(m) / SR
    return (np.sin(2 * np.pi * hz(n) * t) + .3 * np.sin(4 * np.pi * hz(n) * t)) * np.exp(-t * 3.5) * np.minimum(1, t / .006)


def brush(L=.22):
    m = int(L * SR)
    return filt(rng.standard_normal(m), [2500, 9000], 'band') * np.sin(np.pi * np.arange(m) / m) ** .5 * np.exp(-np.arange(m) / SR * 8)


bar = 0; t = 0.0
while t < DUR - 1:
    ch = PROG[bar % 4]
    add(mus, rhodes([n + 12 for n in ch[1:]], 4 * BT + .3), t, .3)
    add(mus, rhodes([n + 12 for n in ch[1:4]], BT * 1.5), t + 2.5 * BT, .14)
    for k, o in enumerate((0, 1, 2, 3)):
        add(mus, upright(ch[0] - 12 + (0, 7, 12, 7)[k], BT), t + o * BT, .42)
    if t >= 2.2:
        for k in range(4):
            add(mus, kick(.55), t + k * BT, .28 if k % 2 == 0 else 0)
            add(mus, brush(), t + k * BT + BT / 2, .12)
            if k % 2 == 1:
                add(mus, snap(), t + k * BT, .16)
    bar += 1; t += 4 * BT
# craquement de vinyle
crackle = np.zeros(N)
for _ in range(int(DUR * 12)):
    i = rng.integers(0, N - 50); crackle[i:i + 30] += rng.uniform(.1, .6) * np.exp(-np.arange(30) / 4)
add(sfx, filt(crackle, 1500, 'high'), 0, .12)
# transitions : souffle doux
for c in (2.2, 6, 9.6, 13.4, 17, 20.6, 24.2, 27.6, 30.8):
    add(sfx, whoosh(.9)[::-1] * .8, c - .9, .3)
# grill sur l'entrecôte, couverts, verres qui trinquent
add(sfx, sizzle(3.6), 9.6, .1)
for at in (17.6, 18.9):
    add(sfx, ding(31), at, .12); add(sfx, ding(36), at + .015, .08)
for at in (24.8, 25.6):
    add(sfx, ding(33), at, .07)
# miniature et fin
add(sfx, ding(19), .05, .15)
add(sfx, boom(.5), 30.8, .35); add(sfx, pop(), 32.4, .3)
master(.85 * mus + .9 * sfx, f'{D}/audio/fistons.wav', DUR, lufs=-15)
print('ok')
