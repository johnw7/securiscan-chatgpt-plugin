"""Voix off Chatterbox Multilingual (Resemble AI, licence MIT, voix par défaut, français) : phrase par phrase,
avec contrôle qualité (Whisper réécoute chaque phrase : texte complet, aucun ajout, débit plausible ; sinon nouvel essai),
regroupées en 6 blocs dans audio/voix_blocs/ (découpés ensuite en sous-titres par voix.py, alignement Whisper).
Usage (environnement avec torch + chatterbox-tts) : python voix_chatterbox.py [intensité émotionnelle, défaut 0.6]"""
import os, re, sys
import difflib, json
import numpy as np, torch, soundfile as sf
from faster_whisper import WhisperModel
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voix_kokoro_textes import BLOCS

def serre(w, sr, seuil=.012, garde=.22, maxi=.28):
    """Compresse les silences internes : toute pause de plus de `maxi` s est ramenée à `garde` s."""
    h = int(.01 * sr); e = np.sqrt((w[:len(w) // h * h].reshape(-1, h) ** 2).mean(1)); calme = e < seuil
    out, i = [], 0
    while i < len(calme):
        j = i
        while j < len(calme) and calme[j] == calme[i]: j += 1
        seg = w[i * h:j * h]
        out.append(seg[:int(garde * sr) // 2].tolist() + seg[-int(garde * sr) // 2:].tolist() if calme[i] and (j - i) * .01 > maxi else seg.tolist())
        i = j
    return np.array([x for s_ in out for x in s_] + w[len(calme) * h:].tolist(), dtype=np.float32)

def mots(x):   # même normalisation que voix.py (accents, ponctuation et pluriels ignorés)
    import unicodedata
    x = unicodedata.normalize('NFD', x.lower().replace('’', "'")); x = ''.join(c for c in x if unicodedata.category(c) != 'Mn')
    return [re.sub(r"(?<=..)[sx]$", "", w) for w in re.findall(r"[a-z0-9]+", x)]
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/audio/voix_blocs', exist_ok=True)
EX = float(sys.argv[1]) if len(sys.argv) > 1 else .85   # intensité émotionnelle (dynamique)
CFG = float(sys.argv[2]) if len(sys.argv) > 2 else .3   # guidage bas = débit plus vif et naturel
REF = os.environ.get('REF')   # voix de référence française (timbre et accent francophones) ; sans elle, voix par défaut (accent américain)
PH = f'{D}/audio/cb_phrases_ex{int(EX * 100)}_cfg{int(CFG * 100)}' + ('_ref_' + os.path.splitext(os.path.basename(REF))[0] if REF else ''); os.makedirs(PH, exist_ok=True)
QC = json.load(open(f'{PH}/qc.json')) if os.path.exists(f'{PH}/qc.json') else {}   # phrases déjà validées (reprise)
m = ChatterboxMultilingualTTS.from_pretrained(device='cpu')
WM = WhisperModel('small', device='cpu', compute_type='int8')
for i, bloc in enumerate(BLOCS, 1):
    phrases = [p.strip() for p in re.findall(r'[^.?!]+[.?!]+', bloc)]
    morceaux = []
    for j, p in enumerate(phrases):
        cle = f'{i}_{j}'
        if cle in QC and QC[cle]['texte'] == p and QC[cle]['ok']:
            w, _ = sf.read(f'{PH}/{cle}.wav'); morceaux += [w, np.zeros(int(m.sr * .3))]; continue
        meilleur = None
        for essai in range(12):
            torch.manual_seed(1000 * i + 37 * j + essai + (500 if cle in QC else 0))
            w = m.generate(p, language_id='fr', audio_prompt_path=REF, exaggeration=EX if essai < 6 else EX - .15, cfg_weight=CFG if essai < 6 else CFG + .1,
                           temperature=.8 if essai < 6 else .7)[0].numpy()
            nz = np.nonzero(np.abs(w) > .01)[0]; w = w[max(nz[0] - 300, 0):nz[-1] + 1500] if len(nz) else w
            w = serre(w, m.sr)
            a16 = np.interp(np.arange(0, len(w) * 16000 / m.sr) * m.sr / 16000, np.arange(len(w)), w).astype(np.float32)
            entendu = ' '.join(sg.text for sg in WM.transcribe(a16, language='fr', beam_size=5)[0])
            score = difflib.SequenceMatcher(a=mots(p), b=mots(entendu)).ratio(); cps = len(p) / (len(w) / m.sr)
            note = score - (.3 if not 10 <= cps <= 21 else 0)
            if meilleur is None or note > meilleur[0]: meilleur = (note, w, score, cps, entendu)
            if score >= .95 and 10 <= cps <= 21: break
        note, w, score, cps, entendu = meilleur
        sf.write(f'{PH}/{cle}.wav', w, m.sr)
        QC[cle] = {'texte': p, 'ok': bool(score >= .93 and 10 <= cps <= 21), 'fidelite': round(score, 2), 'entendu': entendu.strip()}
        json.dump(QC, open(f'{PH}/qc.json', 'w'), ensure_ascii=False, indent=1)
        morceaux += [w, np.zeros(int(m.sr * .3))]
        print(i, j, f'{len(w) / m.sr:.1f} s · {cps:.0f} car/s · fidélité {score:.2f} · essais {essai + 1}', '|', p, '→', entendu.strip(), flush=True)
    sf.write(f'{D}/audio/voix_blocs/bloc{i}.wav', np.concatenate(morceaux), m.sr)
print('ok')
