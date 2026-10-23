"""Bande-son Velocity, calée sur timeline.json. Usage : python3 build_audio.py [bruitages|musique]  -> audio/velocity_<mode>.wav"""
import os, sys, json
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(f"{D}/{os.environ.get('TLF','timeline.json')}")); DUR = TL['dur']; BEAT = 60 / TL['bpm']; S = TL['s']
N = int(DUR * SR); sfx, mus = np.zeros(N), np.zeros(N)
def shimmer(t0, n=6, k=.12):
    for j in range(n): add(sfx, ding(24 + [0, 4, 7, 12, 16, 19][j % 6]), t0 + j * .07, k)
# couverture + S0 : tension
add(sfx, riser(2.0), S['s0'] - 2.0, .18); add(sfx, boom(1.0), 0.05, .3)
m = int(5.2 * SR); t = np.arange(m) / SR
add(sfx, (sine(hz(-24), m) + .5 * sine(hz(-17), m)) * np.minimum(1, t / 1.5) * np.minimum(1, (5.2 - t) / .6), S['s0'], .22)
for x in TL['rocks']:
    add(sfx, thud(), x, .5); add(sfx, boom(.7), x, .22)
for x, _ in TL['lines0'] + TL['lines1']: add(sfx, tick(), x, .2)
for x, _ in TL['chips']: add(sfx, pop(), x, .2)
# S1 : le souffle
add(sfx, riser(3.0), S['s2'] - 3.0, .26); add(sfx, whoosh(.9), S['s1'] - .1, .2)
# S2 : coupes rapides
for x in TL['cuts2']: add(sfx, whoosh(.5), x - .12, .3); add(sfx, snap(), x, .15)
for x, _, _ in TL['slams']: add(sfx, boom(1.2), x, .45); add(sfx, thud(), x, .3)
add(sfx, boom(1.6), S['s2'], .5); add(sfx, whoosh(.7), S['s2'] - .15, .3)
for j in range(8): add(sfx, whoosh(.25), TL['cuts2'][-4] + j * .234 - .1, .1)
# S3 : flottement
shimmer(S['s3'], 8, .12)
for x, _ in TL['lines3']: add(sfx, ding(19), x, .16); add(sfx, whoosh(.5), x - .1, .15)
# S4 : logo
add(sfx, riser(.9), TL['logo'] - .9, .25); add(sfx, boom(1.8), TL['logo'], .55); shimmer(TL['logo'] + .05, 9, .15)
add(sfx, ding(31), TL['tagline'], .2)
for j in range(3): add(sfx, pop(), TL['icons'] + j * .22, .18)
add(sfx, snap(), TL['cta'], .3); add(sfx, ding(28), TL['cta'] + .05, .25)
# musique : drone sombre puis beat 128 bpm dès S2
t0 = S['s2']; j = 0
while t0 + j * BEAT / 2 < DUR - 1.2:
    tt = t0 + j * BEAT / 2
    if j % 2 == 0: add(mus, kick(1.0), tt, .5)
    else: add(mus, hat(), tt, .12)
    if j % 4 == 2: add(mus, clap(), tt, .25)
    j += 1
for k in range(int((DUR - t0) / (BEAT * 4)) + 1):
    for ch, bt in ((( -12, -5, 0, 3), 0), ((-16, -9, -4, 0), 1)):
        pass
    ch = [(-12, -5, 0, 3), (-16, -9, -4, 0), (-14, -7, -2, 2), (-17, -10, -5, -1)][k % 4]
    add(mus, pad(list(ch), BEAT * 4 + .3, 2200), t0 + k * BEAT * 4, .2)
add(mus, boom(2.0), TL['logo'], .3)
MODE = sys.argv[1] if len(sys.argv) > 1 else 'bruitages'
mix = sfx + (mus * .9 if MODE == 'musique' else 0)
t = np.arange(N) / SR; mix *= np.minimum(1, t / .05) * np.minimum(1, (DUR - t) / 1.2)
os.makedirs(f'{D}/audio', exist_ok=True)
master(mix, f'{D}/audio/velocity{os.environ.get('SUF','')}_{MODE}.wav', DUR, lufs=-16 if MODE == 'bruitages' else -14)
print('ok', DUR)
