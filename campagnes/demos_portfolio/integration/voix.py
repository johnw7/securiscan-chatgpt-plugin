"""Voix off de « Les premières étapes d'un nouvel arrivant » (Piper, voix française siwis), phrase par phrase.
Chaque phrase devient un sous-titre ; les repères (mark) calent les scènes de video.html.
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

t, subs, marks, morceaux = DEBUT, [], {}, []
for k, (m, txt) in enumerate(SCRIPT):
    if m and m[0] == 'e' and m[1:].isdigit():
        t += AVANT_CARTE; marks['c' + m[1:]] = round(t, 3); t += CARTE
    if m: marks[m] = round(t, 3)
    a = synth(k, txt); morceaux.append((t, a)); d = len(a) / SR
    subs.append([round(t, 3), round(t + d, 3), txt]); t += d
    t += .9 if txt[-1] in '.?…' else .5
dur = round(t + FIN_LOGO, 2); marks['logo'] = round(t + .4, 3)
voix = np.zeros(int(dur * SR))
for t0, a in morceaux:
    i = int(t0 * SR); voix[i:i + len(a)] += a
np.save(f'{D}/audio/voix.npy', voix)
open(f'{D}/timeline.js', 'w').write('window.TL = ' + json.dumps({'dur': dur, 'subs': subs, 'marks': marks}, ensure_ascii=False) + ';\n')
print('durée', dur, 's ·', len(subs), 'sous-titres')
