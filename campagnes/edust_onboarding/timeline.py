"""Montage de la vidéo E-DUST « Bienvenue dans votre entreprise » :
placement des voix off, sous-titres (SRT + timeline.json pour l'incrustation) et bande-son.

Usage : python3 timeline.py   -> timeline.json, srt/*.srt, audio/*.wav
"""
import os, json, subprocess
import numpy as np

D = os.path.dirname(os.path.abspath(__file__))
SR = 44100
FPS = 30

# Découpage des sous-titres : coupures placées sur les pauses réelles de la voix (ffmpeg silencedetect)
VO = {
    'L2': [(0.00, 3.40, "Un nouveau poste, une nouvelle équipe,\nde nouveaux défis…"),
           (3.40, 6.35, "Bienvenue dans votre nouvelle\naventure professionnelle !")],
    'L3': [(0.00, 3.97, "Découvrez les équipes et les services\nqui vous accompagneront au quotidien.")],
    'L4': [(0.10, 4.30, "Messagerie, agenda, documents\net espace RH :"),
           (4.30, 6.55, "retrouvez tous les outils\npour bien démarrer.")],
    'L5': [(0.00, 3.20, "Respect, confidentialité\net esprit d'équipe :"),
           (3.20, 4.62, "quelques bonnes pratiques"),
           (4.62, 7.81, "pour évoluer dans un environnement\nprofessionnel serein.")],
    'L6': [(0.00, 1.30, "Vous n'êtes pas seul."),
           (1.30, 6.03, "Votre manager et vos collègues sont là\npour vous accompagner à chaque étape.")],
    'L7': [(0.00, 4.20, "Vous avez désormais toutes les premières\nclés pour réussir votre intégration."),
           (4.20, 5.88, "Bienvenue dans l'équipe !")],
    'L8': [(0.00, 3.90, "Chez E-DUST SOLUTIONS, nous transformons\nvos parcours d'intégration"),
           (3.90, 6.45, "en expériences visuelles engageantes."),
           (6.45, 8.36, "Donnons vie à vos idées.")],
}

# EDL : (scène, début, fin, temps local de départ, vitesse)
CUTS = {
    'full': {
        'dur': 90,
        'edl': [(1, 0, 3, 0, 1), (2, 3, 13, 0, 1), (3, 13, 25, 0, 1), (4, 25, 40, 0, 1),
                (5, 40, 54, 0, 1), (6, 54, 68, 0, 1), (7, 68, 78, 0, 1), (8, 78, 90, 0, 1)],
        'vo': [('L2', 4.0), ('L3', 14.2), ('L4', 26.6), ('L5', 41.4), ('L6', 55.6), ('L7', 69.4), ('L8', 79.2)],
    },
    'short': {
        'dur': 30,
        'edl': [(1, 0, 2, 0.6, 1), (2, 2, 9, 0.5, 1), (3, 9, 11.5, 4.0, 1), (4, 11.5, 14, 6.0, 1),
                (6, 14, 16.5, 7.0, 1), (7, 16.5, 21, 1.0, 1), (8, 21, 30, 0, 12 / 9)],
        'vo': [('L2', 2.5), ('L7', 15.0), ('L8', 21.3)],
    },
}


def load_vo(name):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{D}/vo/{name}.mp3', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def srt_time(t):
    ms = int(round(t * 1000))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


# ---------- musique : boucle pop douce et positive, synthétisée (maquette) ----------
NOTES = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def hz(n, octave):
    return 440 * 2 ** ((NOTES[n] + 12 * (octave + 1) - 69) / 12)

PROG = [('C', 'E', 'G'), ('G', 'B', 'D'), ('A', 'C', 'E'), ('F', 'A', 'C')]
BPM = 100
BEAT = 60 / BPM
BAR = 4 * BEAT


def music(dur, energy):
    """energy(t) -> 0..1 : intensité de l'arrangement selon le moment de la vidéo."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    rng = np.random.default_rng(7)
    e = np.array([energy(x) for x in np.arange(0, dur, 0.01)])
    E = np.interp(t, np.arange(len(e)) * 0.01, e)
    nbars = int(np.ceil(dur / BAR))
    for b in range(nbars):
        chord = PROG[b % 4]
        t0 = b * BAR
        i0, i1 = int(t0 * SR), min(n, int((t0 + BAR + 0.6) * SR))
        if i0 >= n:
            break
        tt = t[i0:i1] - t0
        env = np.minimum(1, tt / 0.35) * np.exp(-np.maximum(0, tt - BAR) * 6)
        # nappe (accord tenu, harmoniques douces)
        for k, note in enumerate(chord):
            f = hz(note, 4 if k else 3 + (note in 'AB'))
            for h, a in [(1, 1), (2, .28), (3, .1)]:
                out[i0:i1] += .045 * a * env * np.sin(2 * np.pi * f * h * tt + k)
        # basse sur les temps 1 et 3
        for beat in (0, 2):
            s = t0 + beat * BEAT
            j0, j1 = int(s * SR), min(n, int((s + 2 * BEAT) * SR))
            if j0 < n:
                u = t[j0:j1] - s
                out[j0:j1] += .11 * np.sin(2 * np.pi * hz(chord[0], 2) * u) * np.exp(-u * 2.2) * np.minimum(1, u / .01)
        # arpège pluck en croches
        for step in range(8):
            s = t0 + step * BEAT / 2
            j0, j1 = int(s * SR), min(n, int((s + .6) * SR))
            if j0 >= n:
                break
            note = [chord[0], chord[1], chord[2], chord[1]][step % 4]
            u = t[j0:j1] - s
            f = hz(note, 5)
            out[j0:j1] += .05 * (np.sin(2 * np.pi * f * u) + .3 * np.sin(4 * np.pi * f * u)) * np.exp(-u * 9) * np.minimum(1, u / .004) * np.minimum(1, E[j0:j1] * 2.5)
        # kick doux + charleston, selon l'énergie
        for beat in range(4):
            s = t0 + beat * BEAT
            j0 = int(s * SR)
            if j0 >= n:
                break
            lvl = E[j0]
            if lvl > .45:
                j1 = min(n, j0 + int(.25 * SR))
                u = t[j0:j1] - s
                out[j0:j1] += .16 * (lvl - .3) * np.sin(2 * np.pi * (48 + 90 * np.exp(-u * 30)) * u) * np.exp(-u * 14)
            if lvl > .6:
                h0 = int((s + BEAT / 2) * SR)
                h1 = min(n, h0 + int(.06 * SR))
                if h0 < n:
                    nz = rng.standard_normal(h1 - h0)
                    nz = np.diff(np.concatenate([[0], nz]))  # passe-haut grossier
                    out[h0:h1] += .03 * (lvl - .4) * nz * np.exp(-np.arange(h1 - h0) / SR * 60)
    # fondu de fin
    out *= np.clip((dur - t) / 1.8, 0, 1) * np.clip(t / 0.4, 0, 1)
    return out


def whoosh(n_samples):
    rng = np.random.default_rng(3)
    nz = rng.standard_normal(n_samples)
    # passe-bas progressif (filtre à un pôle dont la coupure monte)
    y = np.zeros(n_samples); a = 0.0
    for i in range(n_samples):
        c = 0.02 + 0.25 * i / n_samples
        a += c * (nz[i] - a); y[i] = a
    env = np.sin(np.pi * np.arange(n_samples) / n_samples) ** 2
    return .35 * y * env


def build(cut):
    C = CUTS[cut]
    dur = C['dur']
    n = int(dur * SR)
    # énergie : intro calme, montée progressive, pic sur conclusion et pub
    if cut == 'full':
        energy = lambda x: .3 if x < 3 else .55 if x < 13 else .7 if x < 68 else .85
    else:
        energy = lambda x: .35 if x < 2 else .7 if x < 16.5 else .85
    mus = music(dur, energy)
    voice = np.zeros(n)
    duck = np.zeros(n)
    cues = []
    for name, at in C['vo']:
        v = load_vo(name)
        i0 = int(at * SR)
        i1 = min(n, i0 + len(v))
        voice[i0:i1] += v[:i1 - i0]
        duck[max(0, i0 - int(.25 * SR)):min(n, i1 + int(.35 * SR))] = 1
        for j, (a, b, txt) in enumerate(VO[name]):
            tail = 0.25 if j == len(VO[name]) - 1 else 0
            cues.append((round(at + a, 3), round(min(dur, at + b + tail), 3), txt))
    # lissage de la courbe de ducking
    k = int(.25 * SR)
    duck = np.convolve(duck, np.ones(k) / k, mode='same')
    mus *= 1 - .55 * duck
    # whooshs aux transitions
    for s, a, b, lf, sp in C['edl'][1:]:
        L = int(.6 * SR)
        i0 = int((a - .4) * SR)
        mus[i0:i0 + L] += whoosh(L)[:max(0, min(L, n - i0))]
    voice /= max(1e-6, np.abs(voice).max()) / .89
    mix = .9 * voice + .55 * mus
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    os.makedirs(f'{D}/audio', exist_ok=True)
    pcm = (np.clip(mix, -1, 1) * 32767).astype('<i2')
    path = f'{D}/audio/mix_{cut}.raw'
    pcm.tofile(path)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', path,
                    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-ar', str(SR), '-ac', '2', f'{D}/audio/mix_{cut}.wav'], check=True)
    os.remove(path)
    # musique seule (pour le monteur)
    pcm = (np.clip(mus / max(1e-6, np.abs(mus).max()) * .8, -1, 1) * 32767).astype('<i2')
    pcm.tofile(path)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', path,
                    f'{D}/audio/musique_maquette_{cut}.wav'], check=True)
    os.remove(path)
    os.makedirs(f'{D}/srt', exist_ok=True)
    with open(f'{D}/srt/sous-titres_{cut}.srt', 'w', encoding='utf-8') as f:
        for i, (a, b, txt) in enumerate(cues, 1):
            f.write(f'{i}\n{srt_time(a)} --> {srt_time(b)}\n{txt}\n\n')
    return {'dur': dur, 'edl': C['edl'], 'cues': cues}


if __name__ == '__main__':
    tl = {cut: build(cut) for cut in CUTS}
    json.dump(tl, open(f'{D}/timeline.json', 'w'), ensure_ascii=False, indent=1)
    print('ok')
