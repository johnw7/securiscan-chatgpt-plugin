"""Montage des séquences vidéo Adobe Stock (clips/, 1920×1080 25 i/s) calé sur timeline.js :
pour chaque plan, extrait centré, ralenti si la séquence est plus courte que le plan (jamais sous 0,6×),
étalonnage commun dans la palette du projet, fondus enchaînés. Sortie : out/base_169.mp4 (sans son).
Les titres, cartes, infographies et sous-titres sont rendus à part (video.html en mode calque) puis superposés.
Usage : python3 montage.py"""
import os, json, subprocess
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/out', exist_ok=True)
TL = json.loads(open(f'{D}/timeline.js').read().split('=', 1)[1].strip().rstrip(';'))
M, SUBS, DUR = TL['marks'], TL['subs'], TL['dur']
sub = lambda p: next(s for s in SUBS if s[2].startswith(p))
XF, FPS = .6, 25

def duree(n):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{D}/clips/{n}.mp4'],
                                capture_output=True, text=True).stdout)

# (séquence, début du plan, position de l'extrait dans la séquence 0..1)
PLANS = [('entree', 0, .5), ('sourire', sub('Un nouveau')[0], .5), ('groupe', M['titre'], .3), ('poignee', M['c1'], .5),
         ('reunion', M['e1a'], .5), ('fenetre', M['e1b'], .5), ('poste', M['c2'], .4), ('marche', M['e2b'], .5),
         ('mentor', M['c3'], .5), ('rire_ecran', M['e3d'], .5), ('responsable', M['c4'], .5), ('ecrit', M['e4c'], .5),
         ('eclat', M['c5'], .5), ('couchant', M['fin'], .5)]
FIN = DUR
GRADE = ("eq=contrast=1.06:saturation=0.86,colorbalance=rs=.02:bs=.06:gs=-.01:rh=.05:gh=.01:bh=-.05,"
         "colorlevels=rimin=0:romin=.06:gomin=.055:bomin=.085,vignette=PI/5,noise=alls=5:allf=t")
entrees, filtres = [], []
for k, (n, t0, pos) in enumerate(PLANS):
    t1 = PLANS[k + 1][1] if k + 1 < len(PLANS) else FIN
    besoin = (t1 - t0) + (XF if 0 < k < len(PLANS) - 1 else XF / 2)  # durée à couvrir, fondus compris
    L = duree(n); v = min(1.0, max(.6, (L - .1) / besoin))         # vitesse (ralenti si nécessaire)
    src = besoin * v; a = max(0, min(L - src - .05, (L - src) * pos))
    entrees += ['-i', f'{D}/clips/{n}.mp4']
    filtres.append(f'[{k}:v]trim=start={a:.3f}:duration={src:.3f},setpts=(PTS-STARTPTS)/{v:.4f},fps={FPS},{GRADE},'
                   f'trim=duration={besoin:.3f},setpts=PTS-STARTPTS,format=yuv420p[v{k}]')
    PLANS[k] = (n, t0, besoin)
chaine, off = '[v0]', 0.0
for k in range(1, len(PLANS)):
    off = PLANS[k][1] - XF / 2
    out = f'[x{k}]' if k + 1 < len(PLANS) else '[vout]'
    filtres.append(f'{chaine}[v{k}]xfade=transition=fade:duration={XF}:offset={off:.3f}{out}'); chaine = out
cmd = ['ffmpeg', '-y', '-v', 'error', *entrees, '-filter_complex', ';'.join(filtres), '-map', '[vout]', '-t', f'{DUR:.3f}',
       '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-r', str(FPS), f'{D}/out/base_169.mp4']
subprocess.run(cmd, check=True)
print('ok base_169.mp4', subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{D}/out/base_169.mp4'],
                                        capture_output=True, text=True).stdout.strip(), 's')
