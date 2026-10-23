"""Voix off masculine FR (Piper via sherpa-onnx, local). Usage : python3 voix.py <dossier vits-piper-fr_FR-tom-medium> -> audio/vo_*.wav + audio/plan.json"""
import sys, os, json, numpy as np, soundfile as sf, sherpa_onnx as so
D = os.path.dirname(os.path.abspath(__file__)); M = sys.argv[1]; name = [f for f in os.listdir(M) if f.endswith('.onnx')][0]
tts = so.OfflineTts(so.OfflineTtsConfig(model=so.OfflineTtsModelConfig(vits=so.OfflineTtsVitsModelConfig(model=f'{M}/{name}', tokens=f'{M}/tokens.txt', data_dir=f'{M}/espeak-ng-data', length_scale=1.08), num_threads=4)))
LINES = {'v1': "Chaque défi commence par une décision.", 'v2': "Trouve ton rythme. Libère ton énergie.",
         'v3': "Peu importe ton terrain. Peu importe ton objectif.", 'v4': "Le mouvement ne s'arrête jamais.", 'v5': "Virox. Le son de ta performance."}
os.makedirs(f'{D}/audio', exist_ok=True); plan = {}
for k, tx in LINES.items():
    a = tts.generate(tx, sid=0, speed=1.0); y = np.array(a.samples, np.float32); sf.write(f'{D}/audio/vo_{k}.wav', y, a.sample_rate); plan[k] = len(y) / a.sample_rate; print(k, round(plan[k], 2))
json.dump(plan, open(f'{D}/audio/plan.json', 'w'))
