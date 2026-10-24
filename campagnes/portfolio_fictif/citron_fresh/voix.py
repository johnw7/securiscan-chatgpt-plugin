"""Voix off féminine commerciale (Kokoro ff_siwis, local), calée sur les scènes. Usage : python3 voix.py <dossier tts kokoro>
Sorties : out/vo_<k>.wav (traitée : présence, compression, légère réverbération) + out/vo_plan.json (début, durée)."""
import sys, os, json, subprocess, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
D = os.path.dirname(os.path.abspath(__file__)); T = sys.argv[1]; k = Kokoro(f'{T}/kokoro-v1.0.onnx', f'{T}/voices-v1.0.bin')
LINES = {  # nom: (texte, début dans la vidéo, fin maximale)
    'v1': ("Un plongeon... et tout se met à pétiller !", .35, 2.85),
    'v2': ("Voici Citron Frèche. Glacée... et pétillante !", 3.2, 6.0),
    'v3': ("Des bulles vives... un vrai coup de fraîcheur !", 7.65, 9.95),
    'v4': ("La fraîcheur... à l'état pur !", 10.2, 12.7),
    'v5': ("Citron Frèche... Goûte la fraîcheur !", 13.05, 14.95)}
plan = {}
for n, (tx, t0, t1) in LINES.items():
    sp = 1.0
    for _ in range(6):
        y, sr = k.create(tx, voice='ff_siwis', speed=sp * (.92 if n == 'v4' else 1), lang='fr-fr')
        nz = np.flatnonzero(np.abs(y) > 4e-3); y = y[max(nz[0] - 400, 0):nz[-1] + 1200]
        if len(y) / sr <= t1 - t0: break
        sp *= (len(y) / sr) / (t1 - t0) * 1.02
    raw = f'{D}/out/vo_{n}_raw.wav'; sf.write(raw, y, sr)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af',
                    'highpass=f=110,equalizer=f=220:t=q:w=1:g=1.5,equalizer=f=3200:t=q:w=1.2:g=3.5,equalizer=f=9000:t=q:w=1:g=2,'
                    'acompressor=threshold=-20dB:ratio=3.5:attack=5:release=80:makeup=4,aecho=0.8:0.6:35:0.12,alimiter=limit=0.9',
                    '-ar', '44100', '-ac', '1', f'{D}/out/vo_{n}.wav'], check=True)
    plan[n] = [t0, round(len(y) / sr, 3), round(sp, 3)]; print(n, plan[n])
json.dump(plan, open(f'{D}/out/vo_plan.json', 'w'))
