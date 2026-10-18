"""Bande-son de la pub BOOST RUSH (20 s, 128 BPM), synthétisée : beat électro + effets calés sur l'image.
Usage : python3 build_audio.py  -> audio/boost_rush_mix.wav"""
import os, subprocess
import numpy as np
from scipy.signal import butter, lfilter

D = os.path.dirname(os.path.abspath(__file__))
SR = 44100
DUR = 20.0
BPM = 128
BEAT = 60 / BPM
B = lambda n: n * BEAT
N = int(DUR * SR)
rng = np.random.default_rng(11)
t_all = np.arange(N) / SR


def filt(x, f, kind='low', order=2):
    b, a = butter(order, np.array(f) / (SR / 2), btype=kind)
    return lfilter(b, a, x)


def add(buf, sig, at, gain=1.0):
    i0 = int(at * SR)
    if i0 >= len(buf):
        return
    n = min(len(sig), len(buf) - i0)
    buf[i0:i0 + n] += gain * sig[:n]


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def hz(semi):  # demi-tons depuis La 440
    return 440 * 2 ** (semi / 12)


def saw(f, n, detune=0.0):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for d in (-detune, 0, detune):
        out += 2 * ((t * f * (1 + d)) % 1) - 1
    return out / 3


music = np.zeros(N)
sfx = np.zeros(N)

# ---------- intro : drone grave + battements de cœur + montée ----------
n = int(B(8) * SR)
drone = filt(saw(hz(-36), n, .004), 220) * np.minimum(1, t_all[:n] / 1.0)
music[:n] += .35 * drone
for k in (2, 3, 4, 5, 6, 7):  # battements sourds
    m = int(.3 * SR); tt = np.arange(m) / SR
    add(music, np.sin(2 * np.pi * (45 + 40 * np.exp(-tt * 25)) * tt) * np.exp(-tt * 9), B(k), .55 + .05 * k)
m = int((B(8) - B(4)) * SR)
riser = rng.standard_normal(m)
riser = np.concatenate([filt(riser[i:i + 2205], 300 + 9000 * (i / m) ** 2, 'low', 1) for i in range(0, m, 2205)])[:m]
add(music, riser * np.linspace(0, 1, m) ** 2, B(4), .32)

# tonnerre sur l'éclair
m = int(2.2 * SR)
th = filt(rng.standard_normal(m), 900) * env(m, .005, .5) + filt(rng.standard_normal(m), [2000, 9000], 'band') * env(m, .001, .06)
add(sfx, th, B(1) - .02, .9)


# ---------- drop (B8 -> fin) ----------
def kick():
    m = int(.38 * SR); tt = np.arange(m) / SR
    return np.tanh(2.2 * np.sin(2 * np.pi * (50 + 120 * np.exp(-tt * 32)) * tt) * np.exp(-tt * 7))


def clap():
    m = int(.25 * SR)
    x = filt(rng.standard_normal(m), [900, 6000], 'band')
    e = np.zeros(m)
    for o in (0, .012, .024):
        i = int(o * SR); e[i:] += env(m - i, .001, .07 if o == .024 else .012)
    return x * e


def hat(open_=False):
    m = int((.18 if open_ else .05) * SR)
    return filt(rng.standard_normal(m), 7000, 'high') * env(m, .001, .06 if open_ else .015)


PROG = [(-12, -9, -5), (-16, -12, -9), (-21, -17, -14), (-14, -10, -7)]  # La m · Fa · Do · Sol (graves)
duck = np.ones(N)
end_beat = 40  # dernier temps joué (B40 = 18,75 s)
for k in range(8, end_beat):
    at = B(k)
    in_break = 28 <= k < 30  # mini-pause à l'ouverture de la canette
    if not in_break:
        add(music, kick(), at, .95)
        i0 = int(at * SR); m = int(.3 * SR)
        duck[i0:i0 + m] = np.minimum(duck[i0:i0 + m], 1 - .65 * np.exp(-np.arange(min(m, N - i0)) / SR * 9))
    if k % 2 == 1 and not in_break:
        add(music, clap(), at, .45)
    add(music, hat(k % 2 == 1), at + BEAT / 2, .22 if not in_break else .1)
    if k >= 16:
        add(music, hat(), at + BEAT / 4, .1); add(music, hat(), at + 3 * BEAT / 4, .1)
    # basse sur le contretemps
    chord = PROG[((k - 8) // 4) % 4]
    m = int(BEAT / 2 * SR)
    bs = filt(saw(hz(chord[0] - 12), m, .003), 700) * env(m, .004, .16)
    add(music, bs, at + BEAT / 2, .55 if not in_break else .2)
    # stabs d'accords syncopés
    if k >= 16 and k % 2 == 0 and not in_break:
        m = int(.22 * SR)
        st = sum(saw(hz(s + 12), m, .006) for s in chord) / 3
        add(music, filt(st, 3200) * env(m, .002, .09), at + B(.75), .32)

# appliquer la compression « pompe » à la musique (pas aux effets)
sm = int(.004 * SR)
duck = np.convolve(duck, np.ones(sm) / sm, mode='same')
music *= duck

# accord tenu pendant l'ouverture de la canette et le packshot
for at, dur, ch in ((B(28), B(2), PROG[0]), (B(40), 1.25, PROG[0])):
    m = int(dur * SR)
    pad = sum(saw(hz(s + 12), m, .008) for s in ch) / 3
    add(music, filt(pad, 1800) * np.minimum(1, np.arange(m) / SR / .05) * np.exp(-np.arange(m) / SR / max(.4, dur)), at, .35)


# ---------- impacts et effets ----------
def boom(strength=1.0):
    m = int(1.4 * SR); tt = np.arange(m) / SR
    sub = np.sin(2 * np.pi * (36 + 70 * np.exp(-tt * 12)) * tt) * np.exp(-tt * 2.6)
    nz = filt(rng.standard_normal(m), 2500) * env(m, .002, .12)
    return strength * np.tanh(1.6 * sub + .6 * nz)


def whoosh(length=.5):
    m = int(length * SR)
    x = rng.standard_normal(m)
    out = np.concatenate([filt(x[i:i + 1102], 400 + 7000 * np.sin(np.pi * i / m), 'low', 1) for i in range(0, m, 1102)])[:m]
    return out * np.sin(np.pi * np.arange(m) / m) ** 2


def stamp():
    m = int(.35 * SR); tt = np.arange(m) / SR
    return np.tanh(2 * np.sin(2 * np.pi * (90 + 200 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 14)) + .4 * filt(rng.standard_normal(m), 3000) * env(m, .001, .03)


add(sfx, boom(1.0), B(8), .9)
add(sfx, whoosh(.45), B(8) - .45, .5)
for k in (10, 12, 13, 14, 15):
    add(sfx, stamp(), B(k), .55)
for k in (16, 20, 24):
    add(sfx, whoosh(.4), B(k) - .4, .45); add(sfx, boom(.6), B(k), .6)
for k in (28, 30, 32):
    add(sfx, stamp(), B(k), .5)
add(sfx, boom(1.0), B(36), .85); add(sfx, whoosh(.5), B(36) - .5, .45)
add(sfx, stamp(), B(37), .5); add(sfx, stamp(), B(38), .45); add(sfx, stamp(), B(39), .45)
add(sfx, boom(.9), B(40), .75)

# ouverture de la canette : clic + « pssht » + pétillement
m = int(.05 * SR); add(sfx, filt(rng.standard_normal(m), 2500, 'high') * env(m, .0005, .006), B(28) - .32, .9)
m = int(.9 * SR)
pss = filt(rng.standard_normal(m), [2500, 11000], 'band') * np.minimum(1, np.arange(m) / SR / .01) * np.exp(-np.arange(m) / SR / .32)
add(sfx, pss, B(28) - .28, .75)
m = int(3.2 * SR)
fizz = np.zeros(m)
for _ in range(1600):
    i = rng.integers(0, m - 200)
    fizz[i:i + 60] += rng.uniform(.2, 1) * np.exp(-np.arange(60) / 8) * rng.choice([-1, 1])
fizz = filt(fizz, 4000, 'high') * np.exp(-np.arange(m) / SR / 1.6)
add(sfx, fizz, B(28) - .2, .35)

# ---------- mixage ----------
music = filt(music, 30, 'high')
mix = .8 * music + .9 * sfx
mix *= np.clip((DUR - t_all) / .9, 0, 1)  # fondu final
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
os.makedirs(f'{D}/audio', exist_ok=True)
raw = f'{D}/audio/_mix.raw'
(np.clip(mix, -1, 1) * 32767).astype('<i2').tofile(raw)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', raw,
                '-af', 'aecho=0.6:0.5:24:0.18,loudnorm=I=-12:TP=-1:LRA=7', '-ar', '48000', '-ac', '2', f'{D}/audio/boost_rush_mix.wav'], check=True)
os.remove(raw)
print('ok')
