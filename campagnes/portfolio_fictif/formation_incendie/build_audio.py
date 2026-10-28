"""Bruitages de la formation incendie (synthèse numpy, aucun son sous licence), calés sur timing.json (film.py).
Version par défaut : bruitages sans musique. Usage : python3 build_audio.py → audio/bande_bruitages.wav"""
import os, sys, json, subprocess
import numpy as np
D = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(D, '..', '..', 'demos_portfolio'))
from audiolib import SR, add, filt, env, sine, tick, thud, pop
J = json.load(open(f'{D}/timing.json')); T = J['T']; DUR = T['DUR']
n = int(DUR * SR); bus = np.zeros(n); rng = np.random.default_rng(3)
noise = lambda L: rng.standard_normal(int(L * SR))
def fondu(x, a=.05, b=.05):
    m = len(x); e = np.ones(m); ia, ib = int(a * SR), int(b * SR)
    if ia: e[:ia] = np.linspace(0, 1, ia)
    if ib: e[-ib:] = np.linspace(1, 0, ib)
    return x * e
def seg(a, b): return slice(int(a * SR), int(min(b, DUR) * SR))

# ambiance de bureau (souffle de ventilation très léger + rumeur), jusqu'à la sortie
amb = filt(noise(T['porte_sortie'] + 2), [120, 900], 'band') * .025
add(bus, fondu(amb, 1.5, 1.5), 0)
# clavier (Thomas, Léa, Inès…)
for t in np.arange(.4, T['odeur'] - .3, .11):
    if rng.random() < .7: add(bus, filt(noise(.03), 2500, 'high') * env(int(.03 * SR), .001, .008), t + rng.uniform(-.03, .03), .09)
# grésillement électrique puis crépitement du feu
add(bus, fondu(filt(noise(T['flamme'] - T['fumee'] + .5), [2000, 6000], 'band') * .02, .8, .3), T['fumee'] - .5)
fe = T['feu_eteint']
for t in np.arange(T['flamme'], fe, .015):
    if rng.random() < .35: add(bus, filt(noise(.012), 1500, 'high') * env(int(.012 * SR), .0005, .004), t, .12 * rng.uniform(.3, 1))
# déclencheur manuel : clic
add(bus, tick(), T['dm'] + .3, .5); add(bus, thud(), T['dm'] + .31, .25)
# son d'évacuation (type NF S 32-001 : 554 Hz 100 ms / 440 Hz 400 ms) — fort au plateau, atténué dans le couloir, lointain dehors
def alarme(L):
    tt = np.arange(int(L * SR)) / SR; ph = tt % .5
    f = np.where(ph < .1, 554, 440); s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .5 + np.sin(2 * np.pi * np.cumsum(f) / SR) * .5
    return filt(s, 3500) * .5
al = alarme(DUR - T['alarme'])
g = np.ones(len(al)); tt = np.arange(len(al)) / SR + T['alarme']
g[(tt >= T['couloir'])] = .55; g[(tt >= T['dehors'])] = .12
add(bus, fondu(al * g * .22, .02, 1.0), T['alarme'])
# téléphone décroché
add(bus, tick(), T['tel'] + .1, .4); add(bus, thud(), T['tel'] + .12, .15)
# extincteur : décroché du support, goupille, jet de CO2
add(bus, thud(), T['marc_ext'] + .3, .35); add(bus, tick(), T['marc_ext'] + 1.2, .5); add(bus, tick(), T['marc_ext'] + 1.32, .35)
jet = filt(noise(fe + .4 - T['marc_jet']), 1200, 'high') * .35
add(bus, fondu(jet, .05, .4), T['marc_jet'])
# portes
add(bus, thud(), T['porte_repro'] + .8, .6); add(bus, tick(), T['porte_repro'] + .82, .3)
add(bus, tick(), T['dos_main'] + .9, .3); add(bus, thud(), T['porte_sortie'] + .1, .5)
add(bus, thud(), T['serre'] + 1.0, .45)
# pas (tous les personnages en marche ; plus discrets dehors)
for t, qui in J['pas']:
    k = .5 if t >= T['dehors'] else 1.0
    add(bus, filt(noise(.06), [150, 1800], 'band') * env(int(.06 * SR), .002, .025), t + rng.uniform(-.01, .01), .16 * k * rng.uniform(.7, 1))
# extérieur : oiseaux, sirène des pompiers (deux tons 435 / 488 Hz) qui approche
for t in np.arange(T['dehors'] + .5, T['fin'] - .5, .9):
    if rng.random() < .5:
        L = .12; f0 = rng.uniform(2800, 4200); tt = np.arange(int(L * SR)) / SR
        add(bus, np.sin(2 * np.pi * (f0 + 900 * np.sin(tt * 60)) * tt) * env(int(L * SR), .01, .05), t, .04)
L = 9.0; tt = np.arange(int(L * SR)) / SR; f = np.where((tt % 1.0) < .5, 435, 488)
sir = np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
vol = np.clip((tt - 0) / 5, 0, 1) ** 1.5 * np.clip((L - tt) / 1.5, 0, 1)
add(bus, filt(sir * vol, 2500) * .12, T['camion'] - 4.0)
# fin : petit carillon sur le récapitulatif (pas de souffle)
for i in range(5): add(bus, pop(), T['fin'] + 1.0 + i * .7, .2)

raw = f'{D}/audio/bande.f32'; os.makedirs(f'{D}/audio', exist_ok=True)
np.clip(bus, -1, 1).astype('<f4').tofile(raw)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', raw, '-af', 'highpass=f=50,loudnorm=I=-16:TP=-1.5:LRA=11',
                '-ar', '48000', '-ac', '2', f'{D}/audio/bande_bruitages.wav'], check=True)
os.remove(raw); print('ok', DUR, 's')
