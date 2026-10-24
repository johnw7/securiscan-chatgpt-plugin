"""Bande-son CITRON FRESH (15 s, 120 bpm). Usage : python3 build_audio.py bruitages|musique -> out/audio_<mode>.wav
Bruitages : plongeon, bulles, glaçons, « PSHHHT » d'ouverture, pétillement, impacts calés sur les coupes (3 · 6 · 7,5 · 8,5 · 10 · 13 s)."""
import os, sys, numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'demos_portfolio'))
from audiolib import *
D = os.path.dirname(os.path.abspath(__file__)); DUR = 15.0; N = int(DUR * SR); B = .5; MODE = sys.argv[1]
sfx, mus = np.zeros(N), np.zeros(N); r = np.random.default_rng(11)

def bloop(f0=500, f1=1400, L=.07):  # bulle qui remonte
    m = int(L * SR); t = np.arange(m) / SR; return np.sin(2 * np.pi * (f0 + (f1 - f0) * t / L) * t) * env(m, .002, L / 3)
def splash(L=.9, k=1.0):
    m = int(L * SR); x = r.standard_normal(m); e = env(m, .004, L / 4)
    return k * (filt(x, [300, 7000], 'band') * e + .6 * filt(x, 900) * env(m, .002, L / 8))
def clink(semi=40):  # glaçon contre le métal / le verre
    m = int(.6 * SR); t = np.arange(m) / SR
    return (sine(hz(semi), m) + .5 * sine(hz(semi) * 2.31, m) + .3 * sine(hz(semi) * 3.9, m)) * env(m, .0005, .07) + .4 * np.pad(tick(), (0, m - len(tick())))
def pshht(L=.7):
    m = int(L * SR); x = r.standard_normal(m); t = np.arange(m) / SR
    hiss = filt(x, [2500, 11000], 'band') * (np.minimum(1, t / .006) * np.exp(-t / .22))
    return hiss + .5 * np.pad(pop(), (0, m - len(pop()))) + .4 * np.pad(snap(), (0, m - len(snap())))
def fizz(L, k=1.0):
    s = sizzle(L); m = len(s); return k * s * np.exp(-np.arange(m) / SR / (L / 2.2))

# 1 · plongeon (0-3 s)
add(sfx, splash(1.1, 1.0), 0.0, .9); add(sfx, boom(.6), 0.0, .35)
for _ in range(60):
    t0 = r.uniform(.15, 2.9); f0 = r.uniform(300, 800); add(sfx, bloop(f0, f0 * r.uniform(1.8, 3), r.uniform(.04, .1)), t0, r.uniform(.05, .16))
m = int(3 * SR); add(sfx, filt(r.standard_normal(m), 220) * np.minimum(1, np.arange(m) / SR / .3), 0, .25)  # grondement sous l'eau
add(sfx, riser(1.2), 1.8, .35)
# 2 · canette (3-6 s)
add(sfx, boom(1.2), 3.0, .75); add(sfx, whoosh(.5), 2.8, .45)
for t0, s in [(3.45, 41), (4.15, 44), (4.9, 39), (5.5, 46)]: add(sfx, clink(s), t0, .35)
add(sfx, whoosh(.6), 5.6, .4)
# 3 · ouverture (6-10 s)
add(sfx, tick(), 6.62, .6); add(sfx, snap(), 6.66, .5); add(sfx, pshht(.75), 6.72, 1.0)
add(sfx, fizz(1.6, 1.0), 6.8, .7); add(sfx, riser(.5), 7.0, .3)
add(sfx, boom(1.3), 7.5, .8); add(sfx, fizz(1.2, 1.0), 7.5, .8)
for _ in range(40):
    t0 = r.uniform(7.5, 9.9); f0 = r.uniform(600, 1200); add(sfx, bloop(f0, f0 * 2.2, .05), t0, .07)
add(sfx, whoosh(.45), 8.3, .45); add(sfx, boom(.9), 8.5, .55); add(sfx, clink(47), 8.6, .3); add(sfx, fizz(1.4, .8), 8.5, .5)
add(sfx, riser(.8), 9.2, .35)
# 4 · slogan (10-13 s)
add(sfx, boom(1.1), 10.0, .7); add(sfx, whoosh(.4), 9.85, .35)
for t0 in (10.15, 10.55): add(sfx, pop(), t0, .5); add(sfx, snap(), t0, .3)
for t0, s in [(11.2, 43), (12.1, 40)]: add(sfx, clink(s), t0, .25)
add(sfx, whoosh(.5), 12.6, .4)
# 5 · plan final (13-15 s)
add(sfx, boom(1.4), 13.0, .8); add(sfx, splash(1.0, .8), 13.0, .6)
for t0 in (13.0, 13.12, 13.45): add(sfx, pop(), t0, .45)
add(sfx, ding(36), 13.5, .18); add(sfx, clink(48), 14.1, .3)

if MODE == 'musique':
    CH = [[0, 4, 7, 11], [-5, -1, 2, 7], [-3, 0, 4, 9], [-7, -3, 0, 4]]  # A · E · F#m · D (chaque accord 2 temps)
    def chord_at(t): return CH[int(t / (2 * B)) % 4]
    for k in range(int(3 / B)):  # intro filtrée
        t0 = k * B; add(mus, pad(chord_at(t0), 2 * B, 700 + 500 * k), t0, .1) if k % 2 == 0 else None
        add(mus, hat(), t0 + B / 2, .05)
    drops = [(3.0, 6.0), (7.5, 13.0)]
    for a, b in drops:
        k = 0
        while a + k * B < b - 1e-6:
            t0 = a + k * B; add(mus, kick(1.1), t0, .65)
            if k % 2 == 1: add(mus, clap(), t0, .3)
            add(mus, hat(True), t0 + B / 2, .12); add(mus, hat(), t0 + B / 4, .05); add(mus, hat(), t0 + 3 * B / 4, .05)
            ch = chord_at(t0); add(mus, chord_stab([c + 12 for c in ch], B * .45, 3200), t0 + B / 2, .16)
            m = int(B * SR); root = ch[0] - 24; add(mus, filt(saw(hz(root), m, .004), 600) * env(m, .005, .25), t0, .3)
            add(mus, sine(hz(ch[0] + 24), int(.12 * SR)) * env(int(.12 * SR), .002, .05), t0 + .75 * B, .08)  # pluck aigu
            k += 1
    for t0 in np.arange(6.0, 7.5, B):  # cassure : pad + montée
        add(mus, pad(chord_at(t0), B, 900), t0, .1)
    add(mus, riser(1.5), 6.0, .3)
    for t0 in np.arange(13.0, 14.5, B): add(mus, chord_stab([c + 12 for c in chord_at(t0)], B * .6, 3500), t0, .17); add(mus, kick(1.0), t0, .5)
    add(mus, pad(CH[0], 1.6, 1800), 13.4, .14)
    beats = [b0 + k * B for b0, b1 in drops for k in range(int((b1 - b0) / B))] + list(np.arange(13.0, 14.5, B))
    mus = pump(mus, beats, .55)
mix = sfx + (mus if MODE == 'musique' else 0)
os.makedirs(f'{D}/out', exist_ok=True); master(mix, f'{D}/out/audio_{MODE}.wav', DUR, -14)
print('ok', MODE)
