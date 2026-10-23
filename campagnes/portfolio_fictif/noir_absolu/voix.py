"""Voix off FR (Kokoro ff_siwis, local) : 4 répliques -> audio/vo_<k>.wav + plan.json (durées). Usage : python3 voix.py <dossier tts avec kokoro-v1.0.onnx et voices-v1.0.bin>"""
import sys, os, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
D = os.path.dirname(os.path.abspath(__file__)); T = sys.argv[1]
k = Kokoro(f'{T}/kokoro-v1.0.onnx', f'{T}/voices-v1.0.bin')
LINES = {'l1': "Vous cherchez un parfum qui fait vraiment la différence ?",
         'l2': "Je vous présente... Noir Absolu.",
         'l3': "Une fragrance élégante, intense, avec ce petit quelque chose qui ne passe pas inaperçu.",
         'l4': "Noir Absolu. Laissez votre empreinte."}
os.makedirs(f'{D}/audio', exist_ok=True); plan = {}
for n, tx in LINES.items():
    y, sr = k.create(tx, voice='ff_siwis', speed=.97, lang='fr-fr'); sf.write(f'{D}/audio/vo_{n}.wav', y, sr); plan[n] = len(y) / sr; print(n, round(plan[n], 2))
json.dump(plan, open(f'{D}/audio/plan.json', 'w'))
