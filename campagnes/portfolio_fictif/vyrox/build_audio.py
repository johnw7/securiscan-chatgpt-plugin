"""Bande-son VYROX (30 s, 120 bpm). Usage : python3 build_audio.py bruitages|musique -> audio/vyrox_<mode>.wav
Prérequis : python3 voix.py <dossier vits-piper-fr_FR-tom-medium>."""
import os, sys, subprocess, numpy as np, soundfile as sf
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__)); DUR = 30.0; N = int(DUR * SR); B = .5
VO = {'v1': 2.3, 'v2': 6.45, 'v3': 11.4, 'v4': 15.9, 'v5': 26.95}
def deep(k):  # voix plus grave (-1 demi-ton, même durée)
    o = f'/tmp/_vy_{k}.wav'; f = 2 ** (-1 / 12); sr0 = sf.info(f'{D}/audio/vo_{k}.wav').samplerate
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'{D}/audio/vo_{k}.wav', '-af', f'asetrate={int(sr0 * f)},aresample={SR},atempo={1 / f:.5f},lowshelf=g=3:f=180', '-ac', '1', o], check=True)
    y, _ = sf.read(o); return y / np.abs(y).max() * .9
voice, sfx, mus = np.zeros(N), np.zeros(N), np.zeros(N); mask = np.zeros(N)
for k, t0 in VO.items():
    y = deep(k); i = int(t0 * SR); voice[i:i + len(y)] += y[:N - i]; mask[i:i + len(y)] = 1
rng = np.random.RandomState(4)
def noise(L): return rng.randn(int(L * SR))
def breath(t0, L=.9, k=.18, bright=2500):
    n = noise(L); n = filt(n, bright, 'low'); n = filt(n, 300, 'high'); e = np.sin(np.linspace(0, np.pi, len(n))) ** 2; add(sfx, n * e, t0, k)
def heart(t0, k=.5):
    add(sfx, thud(), t0, k); add(sfx, thud(), t0 + .18, k * .6)
# 1 · silence avant l'effort
m = int(5.2 * SR); tt = np.arange(m) / SR; add(sfx, (sine(hz(-31), m) + .4 * sine(hz(-24), m)) * np.minimum(1, tt / 1.5) * np.minimum(1, (5.2 - tt) / .3), 0, .25)
for j, t0 in enumerate([.2, 1.0, 1.75, 2.45, 3.1, 3.7, 4.25, 4.75]): heart(t0, .35 + .04 * j)
for t0 in (0.1, 1.3, 2.5, 3.7): breath(t0, 1.0, .2); breath(t0 + 1.05, .7, .14, 1800)
add(sfx, tick(), 1.75, .5); add(sfx, snap(), 1.76, .35); add(sfx, ding(31), 1.8, .12)
add(sfx, riser(1.8), 3.2, .3)
# 2 · le rythme
add(sfx, boom(1.6), 5.0, .7); add(sfx, whoosh(.5), 4.85, .35)
for c in [6, 7, 7.5, 8, 9, 10]: add(sfx, whoosh(.35), c - .12, .25 if c > 8.5 else .1); add(sfx, thud(), c, .3 if c > 8.5 else .08)
for j in range(int(6 / .357)): add(sfx, thud(), 5.0 + j * .357, .12 if not 5.9 < 5.0 + j * .357 < 8.6 else .04)       # foulées
add(sfx, boom(1.4), 10.05, .55); add(sfx, snap(), 10.05, .3)
for j in range(8): add(sfx, tick(), 9.0 + j * .0625, .08)
# 3 · disciplines
for c in (11, 13, 15, 17): add(sfx, whoosh(.45), c - .15, .35); add(sfx, boom(.9), c, .35); add(sfx, snap(), c + .15, .2)
add(sfx, riser(1.2), 17.8, .25)
# 4 · produit
add(sfx, boom(1.8), 19.0, .5); add(sfx, whoosh(1.2), 19.2, .18)
for t0 in (19.5, 20.8, 22.1, 23.4):
    for j in range(5): add(sfx, ding(24 + [0, 7, 12, 16, 19][j]), t0 + j * .06, .1)
    add(sfx, pop(), t0, .15)
for j in range(14): add(sfx, pop(), 19.3 + j * .38 + rng.rand() * .1, .05)        # gouttes
add(sfx, whoosh(.8), 23.2, .25); add(sfx, boom(1.2), 24.6, .45); add(sfx, ding(28), 24.62, .2)
# 5 · arrivée + signature
for t0 in (25.0, 25.55, 26.1): breath(t0, .5, .25, 2200)
add(sfx, riser(.6), 26.0, .3); add(sfx, whoosh(.4), 26.45, .4); add(sfx, boom(2.0), 26.6, .7); add(sfx, snap(), 26.62, .35)
for j in range(9): add(sfx, ding(24 + [0, 4, 7, 12, 16, 19, 24, 28, 31][j]), 26.75 + j * .05, .1)
add(sfx, ding(31), 28.3, .2); add(sfx, pop(), 28.3, .2)
# musique électro 120 bpm (version « avec musique »)
CH = [(-12, -5, 0, 3), (-16, -9, -4, 0), (-14, -7, -2, 2), (-17, -10, -5, -1)]
for k in range(int(5 / 2)): add(mus, pad(list(CH[k % 4]), 2.3, 900), k * 2, .12)
for b in range(int((26.6 - 5) / B)):
    t0 = 5 + b * B; half = 19 <= t0 < 25
    if not half or b % 4 == 0: add(mus, kick(1.0), t0, .55)
    add(mus, hat(), t0 + B / 2, .06); add(mus, hat(), t0 + B / 4, .025)
    if b % 2 == 1 and not half: add(mus, clap(), t0, .22)
    n = [-29, -29, -26, -24][(b // 4) % 4]; m = int(B * SR); add(mus, filt(saw(hz(n), m) + saw(hz(n) * 1.005, m), 420, 'low') * env(m, .005, .35), t0, .3)
for k in range(int((26.6 - 5) / 2) + 1):
    t0 = 5 + 2 * k; add(mus, pad(list(CH[k % 4]), 2.2, 2600 if 19 <= t0 < 25 else 1700), t0, .1)
    add(mus, chord_stab([c + 12 for c in CH[k % 4]], .25, 3500), t0, .1)
for b in range(int(3.4 / B)): t0 = 26.6 + b * B; add(mus, kick(1.0), t0, .5 if b % 2 == 0 else .25); add(mus, hat(), t0 + B / 2, .05)
add(mus, pad(list(CH[0]), 3.4, 2000), 26.6, .16)
from scipy.ndimage import uniform_filter1d
dk = np.clip(uniform_filter1d(mask, int(.3 * SR)) * 3, 0, 1); mus *= 1 - .65 * dk; sfx *= 1 - .8 * dk
MODE = sys.argv[1] if len(sys.argv) > 1 else 'bruitages'
mix = voice * (1.05 if MODE == 'musique' else 1.35) + sfx + (mus * .85 if MODE == 'musique' else 0); t = np.arange(N) / SR; mix *= np.minimum(1, t / .05) * np.minimum(1, (DUR - t) / .6)
os.makedirs(f'{D}/audio', exist_ok=True); master(mix, f'{D}/audio/vyrox_{MODE}.wav', DUR, lufs=-15 if MODE == 'bruitages' else -14); print('ok')
