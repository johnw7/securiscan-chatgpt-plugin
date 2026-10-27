"""Voix off Chatterbox Multilingual (Resemble AI, licence MIT, voix par défaut, français) : phrase par phrase,
regroupées en 6 blocs dans audio/voix_blocs/ (découpés ensuite en sous-titres par voix.py, alignement Whisper).
Usage (environnement avec torch + chatterbox-tts) : python voix_chatterbox.py [intensité émotionnelle, défaut 0.6]"""
import os, re, sys
import numpy as np, torch, soundfile as sf
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voix_kokoro_textes import BLOCS
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/audio/voix_blocs', exist_ok=True)
EX = float(sys.argv[1]) if len(sys.argv) > 1 else .6
m = ChatterboxMultilingualTTS.from_pretrained(device='cpu')
for i, bloc in enumerate(BLOCS, 1):
    phrases = [p.strip() for p in re.findall(r'[^.?!]+[.?!]+', bloc)]
    morceaux = []
    for j, p in enumerate(phrases):
        torch.manual_seed(100 * i + j)
        w = m.generate(p, language_id='fr', exaggeration=EX, cfg_weight=.45, temperature=.75)[0].numpy()
        nz = np.nonzero(np.abs(w) > .01)[0]; w = w[max(nz[0] - 300, 0):nz[-1] + 1500] if len(nz) else w
        morceaux += [w, np.zeros(int(m.sr * .35))]
        print(i, j, round(len(w) / m.sr, 1), 's', p, flush=True)
    sf.write(f'{D}/audio/voix_blocs/bloc{i}.wav', np.concatenate(morceaux), m.sr)
print('ok')
