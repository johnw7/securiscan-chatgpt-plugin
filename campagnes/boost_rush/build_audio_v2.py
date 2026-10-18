"""Bande-son de la pub BOOST RUSH V2 (25 s, 128 BPM), calée sur promo_v2.html.
Usage : python3 build_audio_v2.py  -> audio/boost_rush_v2_mix.wav"""
import os, subprocess
import numpy as np
from scipy.signal import butter, lfilter

D = os.path.dirname(os.path.abspath(__file__))
SR = 44100
DUR = 25.0
BEAT = 60 / 128
B = lambda n: n * BEAT
N = int(DUR * SR)
rng = np.random.default_rng(21)
T = np.arange(N) / SR


def filt(x, f, kind='low', order=2):
    b, a = butter(order, np.array(f) / (SR / 2), btype=kind)
    return lfilter(b, a, x)


def add(buf, sig, at, gain=1.0):
    i0 = int(at * SR)
    if i0 < 0:
        sig, i0 = sig[-i0:], 0
    if i0 >= len(buf):
        return
    n = min(len(sig), len(buf) - i0)
    buf[i0:i0 + n] += gain * sig[:n]


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


hz = lambda semi: 440 * 2 ** (semi / 12)


def saw(f, n, det=0.0):
    t = np.arange(n) / SR
    return sum(2 * ((t * f * (1 + d)) % 1) - 1 for d in (-det, 0, det)) / 3


def kick():
    m = int(.38 * SR); t = np.arange(m) / SR
    return np.tanh(2.2 * np.sin(2 * np.pi * (50 + 120 * np.exp(-t * 32)) * t) * np.exp(-t * 7))


def clap():
    m = int(.25 * SR); x = filt(rng.standard_normal(m), [900, 6000], 'band'); e = np.zeros(m)
    for o in (0, .012, .024):
        i = int(o * SR); e[i:] += env(m - i, .001, .07 if o == .024 else .012)
    return x * e


def hat(op=False):
    m = int((.18 if op else .05) * SR)
    return filt(rng.standard_normal(m), 7000, 'high') * env(m, .001, .06 if op else .015)


def boom(k=1.0):
    m = int(1.4 * SR); t = np.arange(m) / SR
    return k * np.tanh(1.6 * np.sin(2 * np.pi * (36 + 70 * np.exp(-t * 12)) * t) * np.exp(-t * 2.6) + .6 * filt(rng.standard_normal(m), 2500) * env(m, .002, .12))


def whoosh(L=.5):
    m = int(L * SR); x = rng.standard_normal(m)
    o = np.concatenate([filt(x[i:i + 1102], 400 + 7000 * np.sin(np.pi * i / m), 'low', 1) for i in range(0, m, 1102)])[:m]
    return o * np.sin(np.pi * np.arange(m) / m) ** 2


def stamp():
    m = int(.35 * SR); t = np.arange(m) / SR
    return np.tanh(2 * np.sin(2 * np.pi * (90 + 200 * np.exp(-t * 40)) * t) * np.exp(-t * 14)) + .4 * filt(rng.standard_normal(m), 3000) * env(m, .001, .03)


def heart():
    m = int(.3 * SR); t = np.arange(m) / SR
    return np.sin(2 * np.pi * (42 + 30 * np.exp(-t * 25)) * t) * np.exp(-t * 10)


music = np.zeros(N); sfx = np.zeros(N)
PROG = [(-12, -9, -5), (-16, -12, -9), (-21, -17, -14), (-14, -10, -7)]

# 0 – B4 : miniature, accroche percutante (impact + accord)
add(sfx, boom(1.0), 0, .8)
m = int(B(4) * SR)
pad = sum(saw(hz(s + 12), m, .008) for s in PROG[0]) / 3
add(music, filt(pad, 1600) * np.exp(-np.arange(m) / SR / 1.2), 0, .4)
for k in range(0, 4):
    add(music, kick(), B(k), .7); add(music, hat(True), B(k) + BEAT / 2, .15)
add(sfx, whoosh(.5), B(4) - .45, .5)

# B4 – B18 : tension (drone grave, battements de cœur, tic de batterie)
m = int((B(20) - B(4)) * SR)
drone = filt(saw(hz(-36), m, .004), 200) * np.minimum(1, np.arange(m) / SR / 1.2)
add(music, drone, B(4), .16)
for k in np.arange(5, 18, 1.0):
    add(music, heart(), B(k), .38); add(music, heart(), B(k) + .17, .24)
for k in np.arange(6, 18, 2.0):  # bip batterie faible
    mm = int(.12 * SR); add(sfx, np.sin(2 * np.pi * 1400 * np.arange(mm) / SR) * env(mm, .002, .04), B(k), .18)
# frappes de clavier pendant le texte qui s'écrit
for i in range(int((B(9.5) - B(5)) / .09)):
    mm = int(.03 * SR); add(sfx, filt(rng.standard_normal(mm), 3000, 'high') * env(mm, .0005, .006), B(5) + i * .09 + rng.uniform(0, .03), .18)
# trois coups secs (+ glitch)
for k in (12, 14, 16):
    add(sfx, boom(.8), B(k), .6); add(sfx, stamp(), B(k), .4)
    mm = int(.25 * SR); g = np.sign(np.sin(2 * np.pi * 60 * np.arange(mm) / SR)) * filt(rng.standard_normal(mm), 5000) * env(mm, .001, .08)
    add(sfx, g, B(k) + .05, .15)
# PAS AUJOURD'HUI : coupure nette puis deux impacts
add(sfx, boom(1.0), B(18), .9); add(sfx, stamp(), B(19), .6)

# B20 – B24 : ouverture de la canette + recharge (montée)
mm = int(.05 * SR); add(sfx, filt(rng.standard_normal(mm), 2500, 'high') * env(mm, .0005, .006), B(20) - .05, .9)
mm = int(.9 * SR); add(sfx, filt(rng.standard_normal(mm), [2500, 11000], 'band') * np.minimum(1, np.arange(mm) / SR / .01) * np.exp(-np.arange(mm) / SR / .32), B(20), .75)
mm = int(4.0 * SR); fz = np.zeros(mm)
for _ in range(2000):
    i = rng.integers(0, mm - 200); fz[i:i + 60] += rng.uniform(.2, 1) * np.exp(-np.arange(60) / 8) * rng.choice([-1, 1])
add(sfx, filt(fz, 4000, 'high') * np.exp(-np.arange(mm) / SR / 2.0), B(20), .3)
mm = int((B(24) - B(20.6)) * SR); tt = np.arange(mm) / SR
f0 = 120 * 2 ** (tt / (mm / SR) * 3)  # montée de 3 octaves
add(music, np.sin(2 * np.pi * np.cumsum(f0) / SR) * (tt / tt[-1]) ** 1.5, B(20.6), .3)
rs = rng.standard_normal(mm)
rs = np.concatenate([filt(rs[i:i + 2205], 300 + 9000 * (i / mm) ** 2, 'low', 1) for i in range(0, mm, 2205)])[:mm]
add(music, rs * (tt / tt[-1]) ** 2, B(20.6), .3)
for k in np.arange(21, 24, .5):  # roulement de caisse claire qui s'accélère
    add(music, clap(), B(k), .25 + .1 * (k - 21))
for k in np.arange(23, 24, .25):
    add(music, clap(), B(k), .3)

# B24 – B52 : beat complet
duck = np.ones(N)
for k in range(24, 52):
    at = B(k)
    calm = 36 <= k < 40  # tension avant la rubalise
    add(music, kick(), at, .95 if not calm else .6)
    i0 = int(at * SR); m = int(.3 * SR)
    duck[i0:i0 + m] = np.minimum(duck[i0:i0 + m], 1 - .65 * np.exp(-np.arange(min(m, N - i0)) / SR * 9))
    if k % 2 == 1:
        add(music, clap(), at, .45 if not calm else .25)
    add(music, hat(k % 2 == 1), at + BEAT / 2, .22)
    if not calm:
        add(music, hat(), at + BEAT / 4, .1); add(music, hat(), at + 3 * BEAT / 4, .1)
    ch = PROG[((k - 24) // 4) % 4]
    m = int(BEAT / 2 * SR)
    add(music, filt(saw(hz(ch[0] - 12), m, .003), 700) * env(m, .004, .16), at + BEAT / 2, .55)
    if k % 2 == 0 and not calm:
        m = int(.22 * SR)
        add(music, filt(sum(saw(hz(s + 12), m, .006) for s in ch) / 3, 3200) * env(m, .002, .09), at + B(.75), .32)
sm = int(.004 * SR); duck = np.convolve(duck, np.ones(sm) / sm, mode='same')
music *= duck

# impacts du drop et des séquences
add(sfx, boom(1.2), B(24), .95); add(sfx, whoosh(.5), B(24) - .5, .5)
for k in (28, 30, 32):
    add(sfx, whoosh(.35), B(k) - .35, .45); add(sfx, boom(.6), B(k), .6)
for i in range(3):
    add(sfx, stamp(), B(34) + i * .15, .4)
# rubalise : tension montante puis déchirure
mm = int((B(40) - B(37)) * SR); tt = np.arange(mm) / SR
add(music, filt(rng.standard_normal(mm), 2000) * (tt / tt[-1]) ** 2, B(37), .35)
add(sfx, stamp(), B(37), .45); add(sfx, stamp(), B(38), .45)
add(sfx, boom(1.3), B(40), 1.0)
mm = int(.8 * SR); add(sfx, filt(rng.standard_normal(mm), 1500, 'high') * env(mm, .001, .18), B(40), .6)  # déchirure
# packshot
add(sfx, boom(.9), B(44), .8); add(sfx, stamp(), B(45), .45); add(sfx, stamp(), B(46), .5)
m = int(3.4 * SR)
pad = sum(saw(hz(s + 12), m, .008) for s in PROG[0]) / 3
add(music, filt(pad, 1800) * np.minimum(1, np.arange(m) / SR / .05) * np.exp(-np.arange(m) / SR / 1.2), B(52), .4)
add(sfx, boom(1.0), B(52), .85)

music = filt(music, 30, 'high')
mix = .8 * music + .9 * sfx
mix *= np.clip((DUR - T) / 1.0, 0, 1)
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
os.makedirs(f'{D}/audio', exist_ok=True)
raw = f'{D}/audio/_v2.raw'
(np.clip(mix, -1, 1) * 32767).astype('<i2').tofile(raw)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', raw,
                '-af', 'aecho=0.6:0.5:24:0.18,loudnorm=I=-12:TP=-1:LRA=7', '-ar', '48000', '-ac', '2', f'{D}/audio/boost_rush_v2_mix.wav'], check=True)
os.remove(raw)
print('ok')
