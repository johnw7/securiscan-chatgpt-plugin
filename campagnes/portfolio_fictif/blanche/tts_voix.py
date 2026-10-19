"""Voix off du film « Et puis un jour… » avec Piper (voix féminine fr_FR-siwis, licence libre), débit lent et doux.
Usage : python3 tts_voix.py <modele.onnx>"""
import os, sys, subprocess
D = os.path.dirname(os.path.abspath(__file__))
LINES = {
    'v1': "Tu l'imagines comment, ce jour-là ?",
    'v2': "Comme dans un conte de fées ?",
    'v3': "Élé-gante. Inoubliable ?",
    'v4': "Libre. Légère. Amoureuse ?",
    'v5': "Ou simplement. Toi ?",
    'v6': "Et puis un jour…",
    'v7': "Sans même t'en rendre compte… tu es devenue la femme dont tu rêvais.",
}
model = sys.argv[1]
os.makedirs(f'{D}/vo', exist_ok=True)
for k, txt in LINES.items():
    wav = f'{D}/vo/{k}_raw.wav'
    subprocess.run([sys.executable, '-m', 'piper', '-m', model, '--length-scale', '1.18', '--noise-scale', '0.6',
                    '--noise-w-scale', '0.7', '--sentence-silence', '0.35', '-f', wav], input=txt.encode(), check=True)
    # silence de tête coupé, voix adoucie et réchauffée, petite réverbération
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', wav, '-af',
                    'silenceremove=start_periods=1:start_threshold=-45dB,highpass=f=90,lowpass=f=9000,'
                    'equalizer=f=250:t=q:w=1:g=2,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=120:makeup=2,'
                    'aecho=0.8:0.6:60|120:0.18|0.10',
                    '-ar', '44100', f'{D}/vo/{k}.wav'], check=True)
    os.remove(wav)
print('ok')
