"""Voix off féminine d'Envol (démo fictive) avec Piper, voix fr_FR-siwis (licence libre).
Usage : python3 tts_voix.py <modele.onnx>  -> vo/vN.wav + assets/timeline.js (durées réelles de la voix)"""
import os, sys, subprocess, json
D = os.path.dirname(os.path.abspath(__file__))
# (clé, texte, vitesse : >1 = plus lent, pause avant en s) ; les passages émotionnels sont plus lents, le mode d'emploi plus net
LINES = [
 ('v1', "Candidature numéro quarante-sept. Toujours aucune réponse.", 1.12, 0.3),
 ('v2', "Inès cherche un emploi depuis six mois. Et chaque soir, c'est la même histoire.", 1.10, 0.35),
 ('v3', "Jusqu'au jour où une amie lui parle d'Envol.", 1.08, 0.35),
 ('v4', "Première étape. Tu crées ton profil en deux minutes. Tu déposes ton cé vé, et pour le reste, Envol s'occupe de tout.", 1.0, 0.4),
 ('v5', "Deuxième étape. Tu dis ce qui compte pour toi : le métier, la ville, le télétravail, les valeurs.", 1.0, 0.35),
 ('v6', "Troisième étape. Envol te propose des offres qui te ressemblent. À droite, tu gardes. À gauche, tu passes.", 1.0, 0.35),
 ('v7', "Quatrième étape. Une offre qui te plaît ? Tu postules en un seul geste, puis tu écris directement au recruteur.", 1.0, 0.35),
 ('v8', "Cinquième étape. Tu suis chaque candidature : envoyée, vue, entretien. Plus jamais dans le noir.", 1.0, 0.35),
 ('v9', "Et puis, un soir, ce message.", 1.18, 0.5),
 ('v10', "Trois semaines plus tard, premier jour. Bienvenue dans l'équipe, Inès.", 1.12, 0.45),
 ('v11', "Envol. Ton prochain chapitre commence ici.", 1.12, 0.5),
]
model = sys.argv[1]
os.makedirs(f'{D}/vo', exist_ok=True); os.makedirs(f'{D}/assets', exist_ok=True)
info = {}
for k, txt, ls, pre in LINES:
    raw = f'{D}/vo/{k}_raw.wav'
    subprocess.run([sys.executable, '-m', 'piper', '-m', model, '--length-scale', str(ls), '--noise-scale', '0.6',
                    '--noise-w-scale', '0.7', '--sentence-silence', '0.3', '-f', raw], input=txt.encode(), check=True)
    out = f'{D}/vo/{k}.wav'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', raw, '-af',
                    'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,'
                    'highpass=f=90,lowpass=f=9500,equalizer=f=250:t=q:w=1:g=2,'
                    'acompressor=threshold=-22dB:ratio=2.5:attack=8:release=120:makeup=2,aecho=0.8:0.6:55|110:0.14|0.08',
                    '-ar', '44100', out], check=True)
    os.remove(raw)
    d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).decode())
    info[k] = d
    print(k, round(d, 2))
# plan : chaque réplique démarre après la précédente (+ pause)
t = 0.3; plan = []
for k, txt, ls, pre in LINES:
    t += 0 if not plan else pre
    plan.append({'k': k, 'a': round(t, 2), 'b': round(t + info[k], 2)}); t += info[k]
json.dump({'lines': plan, 'end': round(t, 2)}, open(f'{D}/vo/plan.json', 'w'))
open(f'{D}/assets/timeline.js', 'w').write('const PLAN=' + json.dumps({'lines': plan, 'end': round(t, 2)}) + ';')
print('fin de voix', round(t, 2))
