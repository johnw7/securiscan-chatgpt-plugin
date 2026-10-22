"""Relève l'heure de chaque mot de la voix (Whisper) pour caler animations et effets sonores sur la parole.
Usage : python3 -I cues.py -> vo/plan.json + assets/timeline.js (PLAN + WORDS, temps absolus depuis le début de la voix)"""
import os, json, subprocess, unicodedata
import numpy as np
from faster_whisper import WhisperModel
D = os.path.dirname(os.path.abspath(__file__))
plan = json.load(open(f'{D}/vo/plan.json'))
norm = lambda s: ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn' and c.isalnum())
m = WhisperModel('small', device='cpu', compute_type='int8')
words = {}
for L in plan['lines']:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f"{D}/vo/{L['k']}.wav", '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout
    a = np.frombuffer(raw, dtype=np.float32)
    segs, _ = m.transcribe(a, language='fr', beam_size=5, word_timestamps=True)
    words[L['k']] = [[norm(w.word), round(L['a'] + w.start, 2)] for s in segs for w in s.words if norm(w.word)]
plan['words'] = words
json.dump(plan, open(f'{D}/vo/plan.json', 'w'))
open(f'{D}/assets/timeline.js', 'w').write('const PLAN=' + json.dumps(plan, ensure_ascii=False) + ';')
for k, w in words.items(): print(k, ' '.join(f'{x[0]}@{x[1]}' for x in w))
