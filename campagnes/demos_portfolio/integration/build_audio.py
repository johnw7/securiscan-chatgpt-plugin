"""Bande-son de la vidéo d'intégration : voix off (voix.py) + bruitages calés sur les animations de video.html,
et en option une nappe musicale de synthèse (aucune musique sous licence).
Usage : python3 build_audio.py bruitages   → audio/bande_bruitages.wav (version par défaut : voix + bruitages, sans musique)
        python3 build_audio.py musique     → audio/bande_musique.wav (voix + bruitages + nappe atténuée sous la voix)"""
import os, sys, json, subprocess
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from audiolib import SR, add, filt, env, hz, pop, ding, tick, pad, sine
D = os.path.dirname(os.path.abspath(__file__))
TL = json.loads(open(f'{D}/timeline.js').read().split('=', 1)[1].strip().rstrip(';'))
M, SUBS, DUR = TL['marks'], TL['subs'], TL['dur']
sub = lambda p: next(s for s in SUBS if s[2].startswith(p))
third = lambda s, k, n=3: s[0] + (s[1] - s[0]) * k / n
voix = np.load(f'{D}/audio/voix.npy'); n = len(voix)
sfx, mus = np.zeros(n), np.zeros(n)

# aucun souffle (pas de « whoosh », de montée ni d'ambiance) : uniquement des sons doux et courts
add(sfx, ding(7), sub('Un nouveau')[0] - .1, .08)                         # l'accueil
add(sfx, ding(12), M['titre'] + .2, .12); add(sfx, ding(19), M['titre'] + .45, .06)
for k in range(1, 6):                                                    # cartes d'étape : carillon doux
    c = M[f'c{k}']
    add(sfx, ding([12, 14, 16, 17, 19][k - 1]), c + .3, .11); add(sfx, ding([19, 21, 23, 24, 26][k - 1]), c + .55, .05)
pops = [M['r1'], M['r2'], M['r3']] + [third(sub('Votre poste'), i) + .1 for i in range(3)] + [third(sub('horaires'), i) + .05 for i in range(3)]
pops += [third(sub('messagerie'), i, 4) + .05 for i in range(4)] + [M['e3c'], sub('Votre référent ou')[0] - .2]
pops += [M['e4b'] + .3, sub('Les premières semaines')[1] - 1.2, sub('personne ne')[0] + .4] + [third(sub('Le livret'), i) + .05 for i in range(3)]
for t in pops: add(sfx, pop(), t, .22)
add(sfx, ding(14), M['fin2'] + .1, .1)                                   # « Bienvenue dans l'équipe »
for i in range(14): add(sfx, tick(), M['logo'] + .3 + i * .1, .18 * (1 - i / 16))   # la poussière qui forme le logo
add(sfx, ding(19), M['logo'] + 1.75, .16); add(sfx, ding(26), M['logo'] + 1.9, .06)

def nappe():
    """Accords lents (Do maj7 · La m7 · Fa maj7 · Sol), notes de piano douces, montée à l'étape 4."""
    PROG = [(-9, -5, -2, 2), (-12, -9, -5, -2), (-16, -12, -9, -5), (-14, -10, -7, -3)]
    L = 6.0; t = 0.0; k = 0
    while t < DUR - 2:
        ch = PROG[k % 4]
        add(mus, pad(list(ch), L + 1.2, 1100), t, .22)
        for j, s in enumerate((ch[3] + 12, ch[1] + 12, ch[2] + 12)):
            m = int(2.2 * SR); add(mus, (sine(hz(s), m) + .3 * sine(hz(s) * 2, m)) * env(m, .004, .7), t + j * 1.5 + .2, .07)
        t += L; k += 1
    g = np.clip((np.arange(n) / SR - M['c4']) / 20, 0, 1) * .35 + .85          # légère montée émotionnelle
    w = int(.3 * SR); c = np.concatenate([[0], np.cumsum(np.abs(voix))])        # atténuation sous la voix
    v = (c[np.clip(np.arange(n) + w // 2, 0, n)] - c[np.clip(np.arange(n) - w // 2, 0, n)]) / w
    duck = 1 - .55 * np.clip(v / (v.max() * .25), 0, 1)
    fade = np.clip(np.arange(n) / SR / 2, 0, 1) * np.clip((DUR - np.arange(n) / SR) / 3, 0, 1)
    return mus * g * duck * fade

def sortie(mix, nom):
    raw = f'{D}/audio/{nom}.f32'
    np.clip(mix, -1, 1).astype('<f4').tofile(raw)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', raw,
                    '-af', 'highpass=f=60,loudnorm=I=-14:TP=-1:LRA=9', '-ar', '48000', '-ac', '2', f'{D}/audio/{nom}.wav'], check=True)
    os.remove(raw)

mode = sys.argv[1] if len(sys.argv) > 1 else 'bruitages'
voix_eq = filt(voix, 80, 'high') * 1.0
mix = voix_eq + sfx * .8 + (nappe() if mode == 'musique' else 0)
sortie(mix, f'bande_{mode}')
print('ok', mode, round(n / SR, 2), 's')
