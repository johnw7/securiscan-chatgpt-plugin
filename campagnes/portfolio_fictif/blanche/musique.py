"""Musique originale du film « Et puis un jour… » (40 s) : boîte à musique enfantine -> orchestre émouvant.
Synthèse numpy, puis mixage avec la voix off (vo/*.wav) -> audio/film_et_puis_un_jour.wav"""
import os, subprocess, numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile
D = os.path.dirname(os.path.abspath(__file__)); SR = 44100; DUR = 40.0
N = int(SR * DUR); L = np.zeros(N); R = np.zeros(N)
f = lambda m: 440 * 2 ** ((m - 69) / 12)
def add(sig, t0, pan=0.0, g=1.0):
    i = int(t0 * SR); n = min(len(sig), N - i)
    if n <= 0: return
    L[i:i+n] += sig[:n] * g * (1 - pan) / 1.4; R[i:i+n] += sig[:n] * g * (1 + pan) / 1.4
def env(n, a, d):
    t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def bell(m, d=2.2):  # boîte à musique
    n = int(SR * d * 2); t = np.arange(n) / SR; fr = f(m)
    s = np.sin(2*np.pi*fr*t) + .45*np.sin(2*np.pi*fr*2.0*t)*np.exp(-t*3) + .25*np.sin(2*np.pi*fr*3.01*t)*np.exp(-t*6)
    return s * env(n, .003, d * .45)
def piano(m, d=3.0):
    n = int(SR * d); t = np.arange(n) / SR; fr = f(m)
    s = sum(np.sin(2*np.pi*fr*k*t + k) / k**1.6 * np.exp(-t*(.8+k*.5)) for k in range(1, 6))
    return s * env(n, .006, d * .5)
def strings(ms, d, att=1.2):
    n = int(SR * d); t = np.arange(n) / SR; s = np.zeros(n)
    for m in ms:
        for det in (-.12, 0, .11):
            fr = f(m) * 2 ** (det / 12) * (1 + .0025 * np.sin(2*np.pi*5.2*t))
            ph = 2*np.pi*np.cumsum(fr) / SR
            s += sum(np.sin(k*ph) / k for k in range(1, 9))
    s = sosfilt(butter(2, 2200, 'low', fs=SR, output='sos'), s)
    a = np.minimum(1, t / att) * np.minimum(1, (d - t) / .8)
    return s * a / (len(ms) * 3)
def horn(m, d):
    n = int(SR * d); t = np.arange(n) / SR; fr = f(m) * (1 + .004*np.sin(2*np.pi*5*t))
    ph = 2*np.pi*np.cumsum(fr) / SR; s = sum(np.sin(k*ph) * (.8**k) for k in range(1, 7))
    s = sosfilt(butter(2, 1400, 'low', fs=SR, output='sos'), s)
    return s * np.minimum(1, t / .35) * np.minimum(1, (d - t) / .5)
def timpani(d=2.5):
    n = int(SR * d); t = np.arange(n) / SR
    return (np.sin(2*np.pi*(55 + 25*np.exp(-t*8))*t) * np.exp(-t*2.2) + .3*np.random.randn(n)*np.exp(-t*30))
def swell(d=2.6):
    n = int(SR * d); t = np.arange(n) / SR; s = sosfilt(butter(2, [1500, 9000], 'band', fs=SR, output='sos'), np.random.randn(n))
    return s * (t / d) ** 2.5 * .5
np.random.seed(3)
# progression (ré majeur) : D Bm G A, 2,5 s par accord
PROG = [(50, [62, 66, 69]), (47, [59, 62, 66]), (43, [55, 59, 62]), (45, [57, 61, 64])]
# mélodie originale de boîte à musique (notes MIDI, durée en temps ; 1 temps = 0,625 s)
MEL = [81,78,74,78, 81,83,81,78, 79,76,73,76, 78,81,74,None,
       81,78,74,78, 83,85,86,83, 81,78,76,79, 78,74,None,None]
B = .625
for i, m in enumerate(MEL * 2):
    t0 = .3 + i * B
    if m is None or t0 > 29.2: continue
    k = .55 if t0 < 25 else .55 * max(0, 1 - (t0 - 25) / 4.5)  # « le temps passe » : la boîte à musique s'éteint doucement
    add(bell(m), t0, pan=-.25 if i % 2 else .25, g=k)
# main gauche du piano (à partir de 5 s)
for b in range(16):
    t0 = 5 + b * 2.5
    if t0 > 37.5: break
    root, ch = PROG[b % 4]
    g = .5 if t0 < 30 else .65
    add(piano(root - 12 + 12, 3.2), t0, g=g * .8); add(piano(ch[0], 2.6), t0 + 1.25, -.2, g * .45); add(piano(ch[2], 2.4), t0 + 1.875, .2, g * .4)
# cordes : entrée à 10 s, crescendo, respiration à 25 s, orchestre à 30 s
for b in range(12):
    t0 = 10 + b * 2.5
    if t0 > 37.5: break
    root, ch = PROG[b % 4]
    lvl = .18 + .22 * min(1, (t0 - 10) / 15)
    if 24.9 < t0 < 29.9: lvl = .12
    if t0 >= 30: lvl = .55
    add(strings(ch + [ch[0] + 12], 2.9, att=.9 if t0 >= 30 else 1.3), t0, g=lvl)
    if t0 >= 30: add(strings([root, root + 12], 2.9, .6), t0, g=.35)
# orchestre final : timbales, cor, mélodie reprise aux cordes aiguës et cloches
add(swell(2.8), 27.3, g=.6); add(timpani(), 30.0, g=.55); add(timpani(), 35.0, g=.35)
for i, (m, d) in enumerate([(74, 1.25), (78, 1.25), (81, 2.5), (79, 1.25), (78, 1.25), (76, 2.4)]):
    add(horn(m - 12, d + .2), 30.0 + sum(x[1] for x in [(74, 1.25), (78, 1.25), (81, 2.5), (79, 1.25), (78, 1.25), (76, 2.4)][:i]), g=.32)
for i, m in enumerate([86, 90, 93, 90, 88, 86, 81]):
    add(bell(m, 2.5), 30.2 + i * 1.1, pan=.3 if i % 2 else -.3, g=.22)
# accord final qui résonne
add(strings([62, 66, 69, 74], 4.5, 1.0), 35.5, g=.35); add(bell(86, 3.5), 37.6, g=.3)
mix = np.stack([L, R], 1)
# réverbération simple (échos diffus)
for dl, g in [(.031, .35), (.047, .3), (.071, .25), (.113, .2), (.173, .14)]:
    k = int(dl * SR); mix[k:, 0] += mix[:-k, 1] * g; mix[k:, 1] += mix[:-k, 0] * g
t = np.arange(N) / SR; mix *= np.minimum(1, t / .4)[:, None] * np.minimum(1, (DUR - t) / 2.0)[:, None]
mix /= np.abs(mix).max() / .8
os.makedirs(f'{D}/audio', exist_ok=True)
wavfile.write(f'{D}/audio/musique.wav', SR, (mix * 32767).astype(np.int16))
# voix off (secondes) avec musique baissée pendant la voix
VO = [('v1', .9), ('v2', 5.7), ('v3', 10.6), ('v4', 15.3), ('v5', 20.6), ('v6', 26.4), ('v7', 31.0)]
ins = ['-i', f'{D}/audio/musique.wav'] + sum([['-i', f'{D}/vo/{k}.wav'] for k, _ in VO], [])
fl = ''.join(f'[{i+1}:a]adelay={int(t0*1000)}|{int(t0*1000)},volume=1.9[v{i}];' for i, (_, t0) in enumerate(VO))
fl += ''.join(f'[v{i}]' for i in range(len(VO))) + f'amix=inputs={len(VO)}:normalize=0,apad[vo];[vo]asplit[vo1][vo2];'
fl += '[0:a][vo1]sidechaincompress=threshold=0.04:ratio=5:attack=40:release=500[m];[m][vo2]amix=inputs=2:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=11[out]'
subprocess.run(['ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex', fl, '-map', '[out]', '-ar', '44100', '-t', str(DUR),
                f'{D}/audio/film_et_puis_un_jour.wav'], check=True)
print('ok')
