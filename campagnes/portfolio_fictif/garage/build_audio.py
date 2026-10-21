"""Bruitages du Reel Garage du Parc (36,4 s), calés sur reel.html.
Usage : python3 build_audio.py bruitages -> audio/reel_bruitages.wav"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__))
COVER = 2.4; SD = [2.8, 3.4, 3.6, 3.2, 3.0, 3.0, 3.8, 3.2, 3.4]
T = [COVER + sum(SD[:i]) for i in range(len(SD))]; END = COVER + sum(SD); DUR = END + 4.6
N = int(DUR * SR); sfx = np.zeros(N)
def beep(f=1800, L=.07):
    m = int(L * SR); return sine(f, m) * env(m, .002, .06)
def rumble(L, f0=38, f1=38, k=1.0):  # ronflement de moteur : dents de scie graves filtrées, régime f0 -> f1
    m = int(L * SR); t = np.arange(m) / SR; f = f0 + (f1 - f0) * np.clip(t / L * k, 0, 1)
    ph = np.cumsum(f) / SR; x = 2 * (ph % 1) - 1
    x = x + .5 * np.sin(2 * np.pi * ph * 2) + .3 * np.random.default_rng(1).normal(0, 1, m) * .1
    return filt(x, 420) * np.minimum(1, t / .08) * np.minimum(1, (L - t) / .25)
# couverture : bips d'alerte
for j in range(4): add(sfx, beep(880, .12), .3 + j * .5, .25)
# alerte moteur : clignotement
for j in range(5): add(sfx, beep(660, .1), T[0] + .2 + j * .5, .2)
add(sfx, thud(), T[0] + .1, .3)
# diagnostic : clic de branchement + bips de scan
add(sfx, tick(), T[1] + .35, .5); add(sfx, tick(), T[1] + .42, .4)
for j in range(14): add(sfx, beep(1500 + 120 * (j % 4), .05), T[1] + .6 + j * .17, .12)
add(sfx, beep(2200, .18), T[1] + 3.05, .25)
# transitions « vroum »
for a in T[1:]: add(sfx, whoosh(.45), a - .1, .3); add(sfx, rumble(.5, 45, 90), a - .05, .25)
# contrôles : bips de scan + clic de validation
CHK = {2: [1.1, 2.2], 3: [1.5], 4: [1.4], 5: [1.4]}
for s, ts in CHK.items():
    for at in ts:
        for j in range(4): add(sfx, beep(1700, .04), T[s] + at - .7 + j * .15, .09)
        add(sfx, tick(), T[s] + at, .45); add(sfx, ding(24), T[s] + at + .02, .18)
# tout est au vert
add(sfx, ding(19), T[6] + 1.2, .3); add(sfx, ding(24), T[6] + 1.3, .25); add(sfx, boom(1.0), T[6] + 1.5, .45); add(sfx, thud(), T[6] + 1.5, .4)
# notification compte rendu
add(sfx, ding(12), T[7] + 1.4, .3); add(sfx, ding(19), T[7] + 1.48, .22)
# démarrage + montée en régime + compte-tours
add(sfx, tick(), T[8] + .05, .4); add(sfx, rumble(1.3, 35, 120), T[8] + .1, .55); add(sfx, rumble(1.6, 120, 55), T[8] + 1.35, .4)
# fin
add(sfx, riser(1.0), END - 1.0, .18); add(sfx, boom(1.1), END, .5); add(sfx, tick(), END + .3, .3)
t = np.arange(N) / SR; sfx *= np.minimum(1, t / .05) * np.minimum(1, (DUR - t) / 1.5)
os.makedirs(f'{D}/audio', exist_ok=True)
master(sfx, f'{D}/audio/reel_bruitages.wav', DUR, lufs=-16)
print('ok', DUR)
