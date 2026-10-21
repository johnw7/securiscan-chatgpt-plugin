"""Bruitages doux du Reel Maison Lumea (31,6 s), calés sur reel.html : souffle d'inspiration/expiration, gong léger, eau.
Usage : python3 build_audio.py [bruitages] -> audio/reel[_bruitages].wav"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__))
COVER = 2.4; END = 24; DUR = COVER + END + 5.2
N = int(DUR * SR); mus, sfx = np.zeros(N), np.zeros(N)
rng = np.random.default_rng(7)
def breath(L, up):  # souffle : bruit filtré avec enveloppe montante (inspire) ou descendante (expire)
    m = int(L * SR); n = filt(rng.standard_normal(m), 900); t = np.linspace(0, 1, m)
    e = np.sin(np.pi * t) ** 1.5 * (0.6 + 0.4 * (t if up else 1 - t))
    return n * e
def gong(semi=-12, L=4.0):
    m = int(L * SR); t = np.arange(m) / SR; f = hz(semi)
    return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.76 * t) + .25 * np.sin(2 * np.pi * f * 5.4 * t)) * np.exp(-t * 1.1) * np.minimum(1, t / .01)
def drop(at, k=.2):
    m = int(.35 * SR); t = np.arange(m) / SR; f = 900 * np.exp(-t * 9) + 500
    add(sfx, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14), at, k)
# musique (version complète) : nappe lente
t = 0; k = 0; CH = [(0, 7, 12, 16), (-3, 4, 9, 12), (-7, 0, 7, 11), (-5, 2, 7, 14)]
while t < DUR:
    add(mus, pad(list(CH[k % 4]), 8.3, 1100), t, .2); t += 8; k += 1
add(sfx, gong(-12, 5), .2, .22); drop(1.2, .15)
for c in range(6):
    a = COVER + c * 4; add(sfx, breath(3.8, c % 2 == 0), a + .1, .22)
drop(COVER + 0.4, .25); drop(COVER + 1.6, .15)
for j in range(5): drop(COVER + 12.3 + j * .55, .12)
add(sfx, gong(-17, 6), COVER + END, .3); drop(COVER + END + 1.2, .12)
MODE = sys.argv[1] if len(sys.argv) > 1 else 'complet'
mix = sfx if MODE == 'bruitages' else mus * .85 + sfx
t = np.arange(N) / SR; mix *= np.minimum(1, t / .2) * np.minimum(1, (DUR - t) / 1.5)
os.makedirs(f'{D}/audio', exist_ok=True)
master(mix, f'{D}/audio/reel' + ('_bruitages' if MODE == 'bruitages' else '') + '.wav', DUR, lufs=-16 if MODE == 'bruitages' else -14)
print('ok', DUR)
