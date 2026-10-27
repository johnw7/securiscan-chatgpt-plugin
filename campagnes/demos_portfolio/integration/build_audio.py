"""Bande-son de la vidéo d'intégration : voix off (voix.py) + bruitages calés sur les animations de video.html,
et en option une nappe musicale de synthèse (aucune musique sous licence).
Usage : python3 build_audio.py bruitages   → audio/bande_bruitages.wav (version par défaut : voix + bruitages, sans musique)
        python3 build_audio.py musique     → audio/bande_musique.wav (voix + bruitages + nappe atténuée sous la voix)"""
import os, sys, json, subprocess
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from audiolib import SR, add, filt, env, hz, whoosh, pop, ding, tick, riser, boom, pad, sine
D = os.path.dirname(os.path.abspath(__file__))
TL = json.loads(open(f'{D}/timeline.js').read().split('=', 1)[1].strip().rstrip(';'))
M, SUBS, DUR = TL['marks'], TL['subs'], TL['dur']
sub = lambda p: next(s for s in SUBS if s[2].startswith(p))
third = lambda s, k, n=3: s[0] + (s[1] - s[0]) * k / n
voix = np.load(f'{D}/audio/voix.npy'); n = len(voix)
sfx, mus = np.zeros(n), np.zeros(n)
rng = np.random.default_rng(8)

# ambiance de bureau très discrète (souffle filtré)
amb = filt(rng.standard_normal(n), [120, 900], 'band') * .05
amb *= np.clip(np.arange(n) / SR / 2, 0, 1) * np.clip((M['logo'] - np.arange(n) / SR) / 1.5, 0, 1)
add(sfx, amb, 0, 1)
# ouverture : la porte qui coulisse, puis l'accueil
add(sfx, filt(rng.standard_normal(int(1.1 * SR)), [300, 2500], 'band') * np.sin(np.pi * np.arange(int(1.1 * SR)) / (1.1 * SR)) ** 2, sub('Un nouveau')[0] - .6, .35)
add(sfx, whoosh(.7), sub('Un nouveau')[0] - .35, .25)
# titre du film, puis les cartes d'étape : balayage lumineux + carillon doux
add(sfx, riser(1.2), M['titre'] - 1.2, .16); add(sfx, whoosh(.8), M['titre'] - .1, .4); add(sfx, ding(7), M['titre'] + .3, .14)
for k in range(1, 6):
    c = M[f'c{k}']
    add(sfx, whoosh(.9), c - .25, .45); add(sfx, ding([12, 14, 16, 17, 19][k - 1]), c + .35, .12); add(sfx, tick(), c + 1.4, .35)
# apparitions (puces, repères, tuiles, nœuds) : petits « pop »
pops = [M['r1'], M['r2'], M['r3']] + [third(sub('Votre poste'), i) + .1 for i in range(3)] + [third(sub('horaires'), i) + .05 for i in range(3)]
pops += [third(sub('messagerie'), i, 4) + .05 for i in range(4)] + [M['e3c'], sub('Votre référent ou')[0] - .2]
pops += [M['e4b'] + .3, sub('Les premières semaines')[1] - 1.2, sub('personne ne')[0] + .4] + [third(sub('Le livret'), i) + .05 for i in range(3)]
for t in pops: add(sfx, pop(), t, .32); add(sfx, tick(), t + .02, .25)
add(sfx, whoosh(.6), M['e3b'] - .3, .3); add(sfx, whoosh(.6), M['e4b'] - .2, .3)
# fin : souffle, puis la poussière qui forme le logo
add(sfx, riser(1.6), M['fin2'] - 1.4, .12); add(sfx, whoosh(1.0), M['logo'] - .1, .35)
for i in range(14): add(sfx, tick(), M['logo'] + .3 + i * .1, .3 * (1 - i / 16))
add(sfx, boom(.5), M['logo'] + 1.7, .35); add(sfx, ding(19), M['logo'] + 1.75, .2)

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
