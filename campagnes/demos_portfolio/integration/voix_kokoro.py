"""Voix off Kokoro (modèle libre Apache 2.0, voix française ff_siwis) : un enregistrement par séquence dans audio/voix_blocs/,
découpé ensuite en phrases par voix.py (alignement Whisper). Usage : python3 voix_kokoro.py <dossier_modele_kokoro> [vitesse]"""
import os, sys
import soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kokoro_onnx import Kokoro
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/audio/voix_blocs', exist_ok=True)
K, V = sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else .93
from voix_kokoro_textes import BLOCS
k = Kokoro(f'{K}/kokoro-v1.0.onnx', f'{K}/voices-v1.0.bin')
for i, t in enumerate(BLOCS, 1):
    a, sr = k.create(t, voice='ff_siwis', speed=V, lang='fr-fr'); sf.write(f'{D}/audio/voix_blocs/bloc{i}.wav', a, sr)
    print(i, round(len(a) / sr, 1), 's')
