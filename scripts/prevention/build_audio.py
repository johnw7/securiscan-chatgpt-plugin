import sys, json, subprocess, numpy as np, soundfile as sf
V, ROOT = sys.argv[1], sys.argv[2]
SR = 48000; DUR = 58.0; FPS = 30
# (début, ligne) — doit rester aligné sur CUES dans timeline.ts
CUES = [(5.5,0),(7.3,1),(10.9,2),(13.3,3),(16.9,4),(20.5,5),(23.9,6),(27.9,7),(30.8,8),(35.4,9),(39.8,10),(42.9,11),(45.6,12),(47.9,13)]
WIPES = [5.0, 20.0, 27.5, 35.0]
POPS = [24.4, 25.0, 26.1, 32.2, 33.3, 34.0, 38.6, 39.0, 39.4, 41.3, 43.1, 43.9, 44.8, 52.6, 52.85, 53.1]
n = int(DUR * SR)
voice = np.zeros(n); sfx = np.zeros(n)
def resample(x, sr):
    t = np.arange(int(len(x) * SR / sr)) / SR
    return np.interp(t, np.arange(len(x)) / sr, x)
lips = []; ends = []
for start, i in CUES:
    x, sr = sf.read(f'{V}/lines/{i:02d}.wav'); x = resample(x, sr)
    a = int(start * SR); voice[a:a + len(x)] += x * 0.9
    ends.append(round(start + len(x) / SR, 2))
    # enveloppe d'ouverture de bouche : RMS par image (30 i/s), lissée, normalisée
    hop = SR // FPS
    env = np.array([np.sqrt((x[j:j + hop] ** 2).mean()) for j in range(0, len(x) - hop, hop)])
    env = np.convolve(env, [0.25, 0.5, 0.25], 'same')
    env = env / (np.percentile(env, 92) + 1e-6)
    env = np.clip((env - 0.12) / 0.88, 0, 1)
    lips.append(''.join(str(min(9, int(round(v * 9)))) for v in env))
rng = np.random.default_rng(3)
def whoosh(t0, d=0.6):
    m = int(d * SR); noise = rng.standard_normal(m)
    # bruit filtré dont la fréquence balaie (passe-bande grossier par moyenne glissante variable)
    out = np.zeros(m); k = np.linspace(40, 4, m).astype(int)
    c = np.cumsum(noise); 
    for j in range(m): out[j] = (c[j] - c[max(0, j - k[j])]) / k[j]
    env = np.sin(np.linspace(0, np.pi, m)) ** 2
    a = int(t0 * SR); sfx[a:a + m] += out * env * 0.5
def pop(t0):
    m = int(0.12 * SR); tt = np.arange(m) / SR
    f = 900 + 500 * np.exp(-tt * 40)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 38)
    a = int(t0 * SR); sfx[a:a + m] += s * 0.10
for w in WIPES: whoosh(w - 0.05)
for p in POPS: pop(p)
# Pas de musique : elle sera ajoutée au montage.
mix = voice + sfx
mix = mix / np.abs(mix).max() * 0.89
wav = f'{V}/bande-son.wav'; sf.write(wav, np.stack([mix, mix], 1).astype(np.float32), SR)
out = f'{ROOT}/public/audio/prevention/bande-son.m4a'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'aac', '-b:a', '160k', out], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '160k', out.replace('.m4a', '.mp3')], check=True)
ts = ['/* Généré par l\'export audio (voix de synthèse) — ne pas modifier à la main. */',
      '/** Ouverture de bouche par réplique (0 → 9), 30 valeurs par seconde, calculée sur la voix réelle. */',
      'export const LIPSYNC_FPS = 30;', '', 'export const LIPSYNC: string[] = [']
ts += [f'  "{l}",' for l in lips]
ts += ['];', '', '/** Fin réelle de chaque réplique (s). */', f'export const CUE_ENDS = {json.dumps(ends)};', '']
open(f'{ROOT}/src/components/prevention/lipsync.ts', 'w').write('\n'.join(ts))
print('ends', ends)
