"""Bande-son du spot BOOST RUSH « slow motion » (20 s), calée sur promo_slowmo.html.
Usage : python3 build_audio_slowmo.py  -> audio/boost_rush_slowmo.wav"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'demos_portfolio'))
from audiolib import *

D = os.path.dirname(os.path.abspath(__file__))
DUR = 20.0
N = int(DUR * SR)
mus, sfx = np.zeros(N), np.zeros(N)
T = np.arange(N) / SR

# nappe grave continue (ralenti), coupée net à l'accélération puis reprise
m = int(9.2 * SR)
drone = filt(saw(hz(-33), m, .004), 160) * np.minimum(1, np.arange(m) / SR / 1.5)
add(mus, drone, 0, .35)
add(mus, pad([-21, -14, -9], 9.2, 900), 0, .2)
# notes cristallines espacées (piano/cloche lointaine)
for at, n in ((.2, 15), (2.4, 12), (3.9, 19), (5.6, 15), (7.2, 10), (8.3, 22)):
    mm = int(2.5 * SR)
    note = (sine(hz(n), mm) + .35 * sine(hz(n) * 2.01, mm) + .15 * sine(hz(n) * 3.02, mm)) * env(mm, .004, .7)
    add(mus, note, at, .22)
# battements de cœur ralentis
for at in np.arange(2.2, 8.8, 1.3):
    mm = int(.45 * SR); tt = np.arange(mm) / SR
    hb = np.sin(2 * np.pi * (38 + 25 * np.exp(-tt * 18)) * tt) * np.exp(-tt * 6)
    add(mus, hb, at, .5); add(mus, hb, at + .24, .3)
# souffle inversé qui monte vers l'accélération
add(sfx, riser(2.2) * 1.0, 7.0, .45)
mm = int(1.6 * SR); rev = whoosh(1.6)[::-1]; add(sfx, rev, 7.65, .5)
# accélération : whoosh rapide + impact + flash
add(sfx, whoosh(.35), 9.0, .8); add(sfx, boom(1.3), 9.45, 1.0)
mm = int(.6 * SR); add(sfx, filt(rng.standard_normal(mm), 3000, 'high') * env(mm, .001, .12), 9.45, .4)
# après : beat lourd en demi-tempo (70 BPM)
BT = 60 / 70
for k in range(int((15.3 - 9.45) / (BT / 2))):
    at = 9.45 + k * BT / 2
    if k % 4 == 0:
        add(mus, kick(1.2), at, .95)
    if k % 4 == 2:
        add(mus, clap(), at, .5)
    add(mus, hat(), at + BT / 4, .12)
for i, at in enumerate(np.arange(9.45, 15.3, 2 * BT)):
    mm = int(2 * BT * SR)
    sub = sine(hz(-33 if i % 2 == 0 else -36), mm) * env(mm, .01, .9)
    add(mus, np.tanh(sub * 1.5), at, .5)
add(mus, pad([-9, -5, 0, 3], 15.3 - 9.45, 1500), 9.45, .22)
for i in range(16):  # lettres de FUEL YOUR LIMITS
    add(sfx, tick(), 12.3 + i * .12, .18)
add(sfx, boom(.7), 10.0, .45)
# packshot : grand accord qui résonne + coup final
add(sfx, whoosh(.5), 15.0, .45); add(sfx, boom(.9), 15.5, .7)
add(mus, pad([-9, -5, 0, 3, 7], 4.5, 2200), 15.5, .32)
for at, n in ((15.6, 15), (16.2, 19), (16.8, 22), (17.4, 27)):
    mm = int(2.2 * SR)
    add(mus, (sine(hz(n), mm) + .3 * sine(hz(n) * 2, mm)) * env(mm, .003, .6), at, .18)
add(sfx, pop(), 16.8, .35)
# pétillement léger tout du long
add(sfx, sizzle(20) * .5, 0, .05)
master(.8 * mus + .9 * sfx, f'{D}/audio/boost_rush_slowmo.wav', DUR, lufs=-14)
print('ok')
