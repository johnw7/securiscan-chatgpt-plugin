"""Voix off de « Les premières étapes d'un nouvel arrivant », phrase par phrase.
Source : si audio/voix_blocs/bloc1…bloc6 (wav, mp3, m4a…) existent — un enregistrement par séquence (voix humaine ou ElevenLabs),
chacun est découpé en phrases sur ses silences ; sinon, voix de synthèse locale Piper (siwis).
Chaque phrase devient un sous-titre ; les repères (mark) calent les scènes de video.html et du montage.
Sorties : audio/voix.wav (mono 44,1 kHz) et timeline.js (window.TL = {dur, subs:[[t0, t1, texte]], marks:{nom: t}}).
Usage : python3 voix.py [dossier_du_modele_piper]"""
import os, sys, json, subprocess, wave
import numpy as np
D = os.path.dirname(os.path.abspath(__file__))
LS = 1.13                                   # débit (length scale Piper)
PH = f'{D}/audio/phrases_{int(LS * 100)}'; os.makedirs(PH, exist_ok=True)
MOD = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/tts/vits-piper-fr_FR-siwis-medium')
SR = 44100
# (repère, texte) — un repère commençant par « e » ouvre une étape : la carte d'étape précède la phrase
SCRIPT = [
    ('intro', 'Lundi matin.'), (None, 'Un nouveau lieu, de nouveaux visages…'), (None, 'et cette petite question : par où commencer ?'),
    ('titre', 'Bienvenue dans votre nouvelle équipe.'), (None, 'Voici les premières étapes pour bien commencer.'),
    ('e1', 'Première étape : faire connaissance.'), ('e1a', 'Votre responsable vous accueille'), (None, 'et vous présente l’équipe avec laquelle vous allez travailler.'),
    ('e1b', 'Retenez trois repères :'), ('r1', 'votre responsable, pour les priorités ;'), ('r2', 'un collègue référent, pour les questions du quotidien ;'),
    ('r3', 'et le service des ressources humaines, pour votre contrat et votre parcours.'),
    ('e2', 'Deuxième étape : découvrir votre environnement.'), ('e2a', 'Votre poste de travail, les espaces communs, les salles de réunion…'),
    ('e2b', 'prenez le temps d’en faire le tour.'), ('e2c', 'Et notez les informations pratiques :'), (None, 'horaires, accès au bâtiment, consignes de sécurité.'),
    (None, 'Ce sont elles qui rendent les premiers jours plus simples.'),
    ('e3', 'Troisième étape : accéder à vos outils.'), ('e3a', 'On vous remet votre matériel et vos accès personnels :'),
    ('e3b', 'messagerie, agenda, documents partagés, outils de votre métier.'), ('e3c', 'Ces accès sont les vôtres : on ne les partage jamais, même avec un collègue.'),
    ('e3d', 'Un blocage, une question ? C’est normal.'), (None, 'Votre référent ou le support informatique sont là pour vous aider.'),
    ('e4', 'Quatrième étape : comprendre vos premières missions.'), ('e4a', 'Avec votre responsable, vous faites le point sur les priorités,'),
    (None, 'ce qui est attendu de vous, et les prochaines étapes.'), ('e4b', 'Les premières semaines servent à découvrir, puis à contribuer :'),
    (None, 'personne ne vous demande de tout savoir dès le premier jour.'), ('e4c', 'Posez vos questions : c’est comme ça qu’on avance.'),
    ('e5', 'Dernière étape : bien démarrer ensemble.'), ('e5a', 'Le livret d’accueil, votre référent, votre responsable :'), (None, 'vos ressources sont à portée de main.'),
    ('fin', 'Chaque parcours commence par un premier pas.'), ('fin2', 'Bienvenue dans l’équipe.'),
]
DEBUT, CARTE, AVANT_CARTE, FIN_LOGO = 3.0, 1.0, 2.0, 7.0

def synth(k, txt):
    out = f'{PH}/{k:02d}.wav'
    if not os.path.exists(out):
        subprocess.run(['piper', '-m', f'{MOD}/fr_FR-siwis-medium.onnx', '-c', f'{MOD}/fr_FR-siwis-medium.onnx.json',
                        '--length-scale', str(LS), '-f', out], input=txt.replace('’', "'").encode(), check=True, capture_output=True)
    with wave.open(out) as w:
        sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32768
    a = np.interp(np.arange(0, len(a) * SR / sr) * sr / SR, np.arange(len(a)), a)   # rééchantillonnage à 44,1 kHz
    nz = np.nonzero(np.abs(a) > .01)[0]                                              # silences de bord retirés
    return a[max(nz[0] - 400, 0):nz[-1] + 1200] if len(nz) else a

def lire(f):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, '<f4').astype(np.float64)

def mots(x):
    import re, unicodedata
    x = unicodedata.normalize('NFD', x.lower().replace('’', "'")); x = ''.join(c for c in x if unicodedata.category(c) != 'Mn')
    return re.findall(r"[a-z0-9]+", x)

def decoupe(a, textes):
    """Découpe un bloc en phrases par alignement : Whisper (faster-whisper, small) horodate chaque mot reconnu,
    les mots du script sont alignés dessus (difflib), et l'on coupe entre le dernier mot d'une phrase et le premier de la suivante."""
    import difflib
    from faster_whisper import WhisperModel
    global _WM
    if '_WM' not in globals(): _WM = WhisperModel('small', device='cpu', compute_type='int8')
    a16 = np.interp(np.arange(0, len(a) * 16000 / SR) * SR / 16000, np.arange(len(a)), a).astype(np.float32)
    segs, _ = _WM.transcribe(a16, language='fr', word_timestamps=True, beam_size=5, vad_filter=False)
    rec = [(w.start, w.end, m) for sg in segs for w in sg.words for m in mots(w.word)]
    ref, fin_phrase = [], []
    for t in textes: ref += mots(t); fin_phrase.append(len(ref) - 1)
    sm = difflib.SequenceMatcher(a=ref, b=[r[2] for r in rec], autojunk=False); carte = {}
    for blk in sm.get_matching_blocks():
        for i in range(blk.size): carte[blk.a + i] = blk.b + i
    def proche(i, sens):   # indice reconnu du mot de script i (ou du plus proche aligné)
        j = i
        while 0 <= j < len(ref) and j not in carte: j += sens
        return carte.get(j)
    bornes = [0]
    for f in fin_phrase[:-1]:
        e, d = proche(f, -1), proche(f + 1, 1)
        t_fin = rec[e][1] if e is not None else None; t_deb = rec[d][0] if d is not None else None
        t = (t_fin + t_deb) / 2 if t_fin is not None and t_deb is not None else (t_fin or t_deb)
        bornes.append(int(t * SR))
    # recalage fin : chaque coupure va au centre du silence le plus long à ± 0,7 s (enveloppe 10 ms)
    h = int(.01 * SR); e = np.sqrt((a[:len(a) // h * h].reshape(-1, h) ** 2).mean(1)); seuil = max(e.max() * .04, 1e-4)
    for i in range(1, len(bornes)):
        c = bornes[i] // h; lo, hi = max(c - 70, 1), min(c + 70, len(e) - 1); best, j = None, lo
        while j < hi:
            if e[j] < seuil:
                k = j
                while k < hi and e[k] < seuil: k += 1
                sc = (k - j) - abs((j + k) / 2 - c) * .15
                if best is None or sc > best[0]: best = (sc, (j + k) // 2)
                j = k
            else: j += 1
        if best: bornes[i] = best[1] * h
    bornes.append(len(a)); out = []
    for b0, b1 in zip(bornes, bornes[1:]):
        x = a[b0:b1]; nz = np.nonzero(np.abs(x) > .01)[0]
        out.append(x[max(nz[0] - 400, 0):nz[-1] + 1200] if len(nz) else x)
    return out

BLOCS = f'{D}/audio/voix_blocs'
DEBUTS = [k for k, (m, _) in enumerate(SCRIPT) if m in ('intro', 'e1', 'e2', 'e3', 'e4', 'e5')]
fichiers = sorted(os.listdir(BLOCS)) if os.path.isdir(BLOCS) else []
EXTERNE = {}
if len(fichiers) >= 6:
    for b, f in enumerate(sorted(fichiers)[:6]):
        k0, k1 = DEBUTS[b], (DEBUTS[b + 1] if b + 1 < 6 else len(SCRIPT))
        for k, x in zip(range(k0, k1), decoupe(lire(f'{BLOCS}/{f}'), [SCRIPT[j][1] for j in range(k0, k1)])): EXTERNE[k] = x
    print('voix : enregistrements de', BLOCS)

t, subs, marks, morceaux = DEBUT, [], {}, []
for k, (m, txt) in enumerate(SCRIPT):
    if m and m[0] == 'e' and m[1:].isdigit():
        t += AVANT_CARTE; marks['c' + m[1:]] = round(t, 3); t += CARTE
    if m: marks[m] = round(t, 3)
    a = EXTERNE[k] if EXTERNE else synth(k, txt); morceaux.append((t, a)); d = len(a) / SR
    subs.append([round(t, 3), round(t + d, 3), txt]); t += d
    t += .9 if txt[-1] in '.?…' else .5
dur = round(t + FIN_LOGO, 2); marks['logo'] = round(t + .4, 3)
voix = np.zeros(int(dur * SR))
for t0, a in morceaux:
    i = int(t0 * SR); voix[i:i + len(a)] += a
np.save(f'{D}/audio/voix.npy', voix)
open(f'{D}/timeline.js', 'w').write('window.TL = ' + json.dumps({'dur': dur, 'subs': subs, 'marks': marks}, ensure_ascii=False) + ';\n')
print('durée', dur, 's ·', len(subs), 'sous-titres')
