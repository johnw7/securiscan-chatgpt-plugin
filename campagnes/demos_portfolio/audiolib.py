"""Briques sonores partagées par les démos (synthèse numpy)."""
import subprocess
import numpy as np
from scipy.signal import butter, lfilter

SR = 44100
rng = np.random.default_rng(5)


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


def sine(f, n):
    return np.sin(2 * np.pi * f * np.arange(n) / SR)


def kick(punch=1.0):
    m = int(.38 * SR); t = np.arange(m) / SR
    return np.tanh(2.2 * punch * np.sin(2 * np.pi * (50 + 120 * np.exp(-t * 32)) * t) * np.exp(-t * 7))


def clap():
    m = int(.25 * SR); x = filt(rng.standard_normal(m), [900, 6000], 'band'); e = np.zeros(m)
    for o in (0, .012, .024):
        i = int(o * SR); e[i:] += env(m - i, .001, .07 if o == .024 else .012)
    return x * e


def snap():
    m = int(.12 * SR)
    return filt(rng.standard_normal(m), [1500, 5000], 'band') * env(m, .0005, .02)


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


def thud():
    m = int(.3 * SR); t = np.arange(m) / SR
    return np.tanh(2 * np.sin(2 * np.pi * (80 + 160 * np.exp(-t * 45)) * t) * np.exp(-t * 16)) + .3 * filt(rng.standard_normal(m), 2000) * env(m, .001, .02)


def pop():
    m = int(.12 * SR); t = np.arange(m) / SR
    return np.sin(2 * np.pi * (300 + 900 * np.exp(-t * 60)) * t) * env(m, .001, .03)


def ding(semi=12):
    m = int(1.2 * SR)
    return (sine(hz(semi), m) + .4 * sine(hz(semi) * 2.76, m) * np.exp(-np.arange(m) / SR * 6)) * env(m, .002, .35)


def tick():
    m = int(.03 * SR)
    return filt(rng.standard_normal(m), 3000, 'high') * env(m, .0003, .004)


def sizzle(L):
    m = int(L * SR); x = np.zeros(m)
    for _ in range(int(L * 900)):
        i = rng.integers(0, m - 80); x[i:i + 40] += rng.uniform(.2, 1) * np.exp(-np.arange(40) / 6) * rng.choice([-1, 1])
    return filt(x + .15 * rng.standard_normal(m), 2500, 'high')


def riser(L):
    m = int(L * SR); x = rng.standard_normal(m)
    o = np.concatenate([filt(x[i:i + 2205], 300 + 9000 * (i / m) ** 2, 'low', 1) for i in range(0, m, 2205)])[:m]
    return o * (np.arange(m) / m) ** 2


def chord_stab(ch, L, cutoff=3000):
    m = int(L * SR)
    return filt(sum(saw(hz(s), m, .006) for s in ch) / len(ch), cutoff) * env(m, .002, L / 2.5)


def pad(ch, L, cutoff=1600):
    m = int(L * SR)
    return filt(sum(saw(hz(s), m, .008) for s in ch) / len(ch), cutoff) * np.minimum(1, np.arange(m) / SR / .3) * np.minimum(1, (m - np.arange(m)) / SR / .4)


def pump(buf, beats, depth=.6):
    d = np.ones(len(buf))
    for at in beats:
        i0 = int(at * SR); m = int(.3 * SR)
        if i0 >= len(buf):
            continue
        n = min(m, len(buf) - i0)
        d[i0:i0 + n] = np.minimum(d[i0:i0 + n], 1 - depth * np.exp(-np.arange(n) / SR * 9))
    k = int(.004 * SR)
    return buf * np.convolve(d, np.ones(k) / k, mode='same')


def master(mix, out, dur, lufs=-13):
    t = np.arange(len(mix)) / SR
    mix = filt(mix, 30, 'high') * np.clip((dur - t) / .6, 0, 1)
    mix = np.tanh(mix * 1.2) / np.tanh(1.2)
    raw = out + '.raw'
    (np.clip(mix, -1, 1) * 32767).astype('<i2').tofile(raw)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', raw,
                    '-af', f'aecho=0.6:0.5:24:0.15,loudnorm=I={lufs}:TP=-1:LRA=7', '-ar', '48000', '-ac', '2', out], check=True)
    subprocess.run(['rm', '-f', raw])
