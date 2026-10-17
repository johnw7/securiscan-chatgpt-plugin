"""Voix off V2 avec Piper (TTS local, voix « tom », licence AGPLv3), débit rapide.
Usage : python3 tts_piper.py <modele.onnx> [speaker]"""
import os, sys, subprocess
D = os.path.dirname(os.path.abspath(__file__))
LINES = {
    'L2': "Un nouveau poste, une nouvelle équipe, de nouveaux défis ! Bienvenue dans votre nouvelle aventure professionnelle !",
    'L3': "Découvrez les équipes et les services qui vous accompagneront au quotidien.",
    'L4': "Messagerie, agenda, documents et espace erre-ache : retrouvez tous les outils pour bien démarrer.",
    'L5': "Respect, confidentialité et esprit d'équipe : quelques bonnes pratiques pour évoluer dans un environnement professionnel serein.",
    'L6': "Vous n'êtes pas seul ! Votre manager et vos collègues sont là pour vous accompagner à chaque étape.",
    'L7': "Vous avez désormais toutes les premières clés pour réussir votre intégration. Bienvenue dans l'équipe !",
    'L8': "Chez I-Deust Solutions, nous transformons vos parcours d'intégration en expériences visuelles engageantes. Donnons vie à vos idées !",
}
model = sys.argv[1]
spk = sys.argv[2] if len(sys.argv) > 2 else '0'
out = f'{D}/vo_tom'
for k, txt in LINES.items():
    wav = f'{out}/{k}_raw.wav'
    subprocess.run([sys.executable, '-m', 'piper', '-m', model, '-s', spk, '--length-scale', '0.86', '--noise-scale', '0.75',
                    '--noise-w-scale', '0.9', '--sentence-silence', '0.12', '-f', wav], input=txt.encode(), check=True)
    # coupe le silence de tête (la fin est gardée pour ne pas rogner la dernière syllabe), compresse, éclaircit
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', wav, '-af',
                    'silenceremove=start_periods=1:start_threshold=-45dB,'
                    'highpass=f=80,equalizer=f=3000:t=q:w=1:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2',
                    '-ar', '44100', '-b:a', '192k', f'{out}/{k}.mp3'], check=True)
    os.remove(wav)
print('ok')
