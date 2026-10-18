"""Bandes-son des 3 démos (burger, black friday, klairo) calées sur les animations.
Usage : python3 build_audio.py  -> audio/<demo>.wav"""
import os
import numpy as np
from audiolib import *

D = os.path.dirname(os.path.abspath(__file__))
os.makedirs(f'{D}/audio', exist_ok=True)


def groove(buf, start, end, beat, prog, kick_g=.9, clap_g=.4, hat_g=.18, bass_g=.5, stab_g=.3, bass_pat=(0, .75, 1.5, 2.5, 3), stab_off=(.5, 2.5), bass_oct=-24):
    beats = []
    k = 0
    t = start
    while t < end - 1e-6:
        bar = int(k // 4) % len(prog)
        ch = prog[bar]
        add(buf, kick(), t, kick_g); beats.append(t)
        if k % 2 == 1:
            add(buf, clap(), t, clap_g)
        add(buf, hat(k % 2 == 1), t + beat / 2, hat_g)
        if k % 4 == 0:
            for o in bass_pat:
                m = int(beat * .45 * SR)
                add(buf, filt(saw(hz(ch[0] + bass_oct), m, .003), 800) * env(m, .003, .12), t + o * beat, bass_g)
            for o in stab_off:
                add(buf, chord_stab([s for s in ch], beat * .5), t + o * beat, stab_g)
        k += 1; t = start + k * beat
    return beats


# ---------------- FLAMBO BURGER (15 s, 120 BPM) ----------------
DUR, BT = 15.0, .5
mus, sfx = np.zeros(int(DUR * SR)), np.zeros(int(DUR * SR))
PROG = [(-5, -1, 2, 5), (0, 4, 7, 10)]  # Mi7 · La7 (couleur funky)
add(mus, pad([-5, -1, 2], 1.6, 1400), 0, .3)
add(mus, chord_stab([-5, -1, 2, 5], .3), 0, .4); add(sfx, boom(.6), 0, .5)
for k in range(3):
    add(mus, hat(), k * BT + BT / 2, .15); add(mus, snap(), k * BT + BT, .2)
add(sfx, whoosh(.45), 1.45, .55)
beats = groove(mus, 2.0, 14.5, BT, PROG)
mus = pump(mus, beats, .45)
for i, a in enumerate([2.0, 2.5, 3.0, 3.5, 4.0, 4.5]):
    add(sfx, thud(), a + .2, .55); add(sfx, pop(), a + .15, .3)
add(sfx, boom(1.1), 5.0, .9); add(sfx, thud(), 5.15, .6)
add(sfx, sizzle(2.2), 5.0, .12 * 1)
add(sfx, whoosh(.5), 6.4, .45)
for a in (7.3, 7.8, 8.3):
    add(sfx, whoosh(.3), a - .1, .35); add(sfx, pop(), a + .25, .35)
add(sfx, ding(19), 9.05, .3)
add(sfx, whoosh(.5), 10.8, .5); add(sfx, boom(.8), 11.2, .7)
add(sfx, pop(), 12.25, .4); add(sfx, ding(24), 12.8, .3)
add(mus, chord_stab([-5, -1, 2, 5], 1.2, 2400), 14.5, .4)
master(.8 * mus + .9 * sfx, f'{D}/audio/burger.wav', DUR)

# ---------------- STUDIO LUMA BLACK FRIDAY (10 s, 140 BPM) ----------------
DUR, BT = 10.0, 60 / 140
b = lambda n: n * BT
mus, sfx = np.zeros(int(DUR * SR)), np.zeros(int(DUR * SR))
PROG = [(-9, -5, -2), (-14, -10, -7), (-16, -12, -9), (-11, -7, -4)]
for k in range(3):
    add(mus, kick(), b(k), .8); add(mus, chord_stab([-9, -5, -2], BT * .6, 3500), b(k) + BT / 2, .35)
add(sfx, boom(.7), 0, .6)
for k, f in ((3, 12), (4, 12), (5, 24)):
    m = int(.18 * SR); add(sfx, sine(hz(f + 12), m) * env(m, .002, .06), b(k), .35); add(mus, kick(), b(k), .9)
add(sfx, riser(b(6) - b(3)), b(3), .3)
add(sfx, boom(1.2), b(6), 1.0); add(sfx, whoosh(.4), b(6) - .4, .4)
beats = groove(mus, b(6), DUR - .3, BT, PROG, hat_g=.22, bass_g=.6, stab_g=.35, bass_pat=(0, .5, 1, 1.5, 2, 2.5, 3, 3.5), stab_off=(.75, 2.75), bass_oct=-12)
mus = pump(mus, beats, .6)
for k in (10, 11, 12):
    add(sfx, thud(), b(k), .6); add(sfx, pop(), b(k) + .05, .35)
add(sfx, boom(.8), b(14), .7)
for i in range(int((b(16) - b(14.5)) / .07)):
    add(sfx, tick(), b(14.5) + i * .07, .35)
add(sfx, boom(1.1), b(16), .9); add(sfx, pop(), b(18), .45); add(sfx, ding(24), b(19), .3)
master(.8 * mus + .9 * sfx, f'{D}/audio/blackfriday.wav', DUR, lufs=-12)

# ---------------- KLAIRO (45 s, 112 BPM) ----------------
DUR, BT = 45.0, 60 / 112
mus, sfx = np.zeros(int(DUR * SR)), np.zeros(int(DUR * SR))
MAJ = [(0, 4, 7), (-5, -1, 2), (-3, 0, 4), (-7, -3, 0)]      # Do · Sol · La m · Fa
MIN = [(-3, 0, 4), (-7, -3, 0)]                               # La m · Fa


def plucks(buf, start, end, prog, gain=.16, octv=12):
    k = 0; t = start
    while t < end - 1e-6:
        ch = prog[int(k // 8) % len(prog)]
        n = ch[[0, 1, 2, 1][k % 4]] + octv
        m = int(.3 * SR)
        add(buf, (sine(hz(n), m) + .3 * sine(hz(n) * 2, m)) * env(m, .002, .09), t, gain)
        k += 1; t = start + k * BT / 2


def pads(buf, start, end, prog, gain=.22):
    t, k = start, 0
    while t < end - 1e-6:
        L = min(4 * BT, end - t)
        add(buf, pad(list(prog[k % len(prog)]), L, 1300), t, gain)
        k += 1; t += 4 * BT


# intro miniature
pads(mus, 0, 2.5, [MAJ[0]]); plucks(mus, 0, 2.5, [MAJ[0]])
add(sfx, ding(19), .05, .25)
# problème : mineur, sobre
pads(mus, 2.5, 9, MIN, .2)
for k in np.arange(0, 9 - 2.5, BT * 2):
    add(mus, kick(.7), 2.5 + k, .45)
for i in range(6):
    add(sfx, thud(), 3.3 + i * .42 + .2, .35)
for i in range(12):
    add(sfx, tick(), 3.3 + i * .22, .3)
for i in range(3):
    add(sfx, pop(), 6.4 + i * .6, .3)
add(sfx, boom(.5), 7.6, .4)
# bascule
add(sfx, riser(1.5), 9.1, .3); add(sfx, whoosh(.5), 10.2, .4); add(sfx, ding(24), 10.6, .35); add(sfx, boom(.6), 10.6, .45)
pads(mus, 9, 12, [MAJ[3]], .2)
# fonctionnement + bénéfices : groove léger en majeur
beats = []
t = 12.0; k = 0
while t < 37:
    if k % 2 == 0:
        add(mus, kick(.8), t, .6); beats.append(t)
    else:
        add(mus, snap(), t, .3)
    add(mus, hat(), t + BT / 2, .1)
    k += 1; t = 12 + k * BT
pads(mus, 12, 37, MAJ, .18); plucks(mus, 12, 37, MAJ, .14)
mus = pump(mus, beats, .3)
for a in (12.0, 17.0, 22.0):
    add(sfx, whoosh(.4), a - .35, .35); add(sfx, pop(), a, .3)
for i in range(4):
    add(sfx, whoosh(.25), 13.2 + i * .6, .25)
add(sfx, whoosh(.9), 17.6, .3)
for i in range(3):
    add(sfx, pop(), 17.6 + i * 1.1, .35)
for i in range(4):
    add(sfx, ding(19 + 3 * i), 22.8 + i * .8, .25)
add(sfx, whoosh(.4), 26.7, .35)
for i in range(3):
    add(sfx, pop(), 28.2 + i * .7, .3)
add(sfx, riser(2.8), 31, .12)
# appel à l'action
add(sfx, whoosh(.5), 36.7, .4); add(sfx, boom(.6), 37.2, .4)
pads(mus, 37, 45, [MAJ[0], MAJ[3]], .24); plucks(mus, 37, 44, [MAJ[0], MAJ[3]], .14)
add(sfx, pop(), 38.6, .35); add(sfx, ding(24), 38.7, .3)
master(.8 * mus + .9 * sfx, f'{D}/audio/klairo.wav', DUR, lufs=-14)
print('ok')
