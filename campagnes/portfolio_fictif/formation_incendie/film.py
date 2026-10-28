"""« Incendie en entreprise : que faire en cas de départ de feu ? » — film d'animation 3D (Blender / Cycles).
Usage : <python avec bpy> film.py rendu <début s> <fin s> [échantillons] [largeur]   → frames/00000.jpg …
        <python avec bpy> film.py stills t1 t2 …                                  → out/stills/t_<t>.jpg
Les dialogues, titres et étapes (calque HTML) et les bruitages (build_audio.py) se calent sur TIMING (timing.json)."""
import sys, os, math, json, random
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, D)
import bpy
from mathutils import Vector, Matrix, Euler
import perso3d as P, decor3d as Dc

FPS = 24
ease = lambda x: x * x * (3 - 2 * x)
cl = lambda x, a=0., b=1.: max(a, min(b, x))
seg = lambda t, a, b: cl((t - a) / (b - a)) if b > a else float(t >= a)
mix = lambda a, b, k: a + (b - a) * k
def win(t, a, b, i=.35, o=.35): return min(seg(t, a, a + i), 1 - seg(t, b - o, b))

# ------------------------------------------------------------------ minutage (secondes)
T = dict(odeur=7.0, fumee=10.0, flamme=12.2, question=14.6, leve=17.0, dm=21.4, alarme=21.6, sophie_leve=23.6, parle_thomas=26.6, parle_sophie=29.2, tel=30.6,
         marc_ext=34.0, marc_jet=40.4, feu_eteint=42.2, porte_repro=46.2, marc_crie=47.4, evac=49.2, ascenseur=56.0, marc_asc=56.4, dos_main=60.2, porte_sortie=61.0,
         couloir=67.5, serre=73.0, dehors=76.0, camion=76.3, comptage=82.0, ok=87.0, fin=90.0, DUR=99.0)
DIALOGUES = [  # (début, fin, qui, texte)
    (14.6, 16.4, 'Thomas', 'Euh… je fais quoi, là ?'),
    (26.6, 28.9, 'Thomas', 'Sophie ! Il y a de la fumée à la reprographie !'),
    (29.2, 30.6, 'Sophie', 'J’appelle les secours.'),
    (31.2, 34.0, 'Sophie', 'Un départ de feu, Atelier Norvan, 2e étage…'),
    (T['marc_crie'], T['marc_crie'] + 2.0, 'Marc', 'Tout le monde me suit ! On laisse ses affaires.'),
    (T['marc_asc'], T['marc_asc'] + 1.8, 'Marc', 'Pas l’ascenseur, Thomas. L’escalier !'),
    (T['serre'] + .1, T['serre'] + 1.7, 'Sophie', 'Personne derrière. Je ferme.'),
    (T['comptage'] + .4, T['comptage'] + 3.0, 'Marc', 'Un, deux, trois, quatre, cinq…'),
    (T['comptage'] + 3.2, T['comptage'] + 4.6, 'Sophie', 'Je suis la dernière. Personne derrière moi.'),
    (T['comptage'] + 4.8, T['ok'] - .2, 'Marc', 'Six. Tout le monde est là.'),
    (T['ok'] + .4, T['ok'] + 1.8, 'Sophie', 'Bien joué, Thomas.'),
]
SPEAK = {}
for a, b, q, _ in DIALOGUES: SPEAK.setdefault(q.lower(), []).append((a, b))

# ------------------------------------------------------------------ scène
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
M = Dc.matieres()
A = Dc.bureaux(M); C = Dc.couloir(M); E = Dc.exterieur(M)
PERSOS = {n: P.Perso(n) for n in ('thomas', 'sophie', 'marc', 'lea', 'karim', 'ines')}
w = bpy.data.worlds.new('monde'); sc.world = w
w.node_tree.nodes['Background'].inputs[0].default_value = (.42, .62, .95, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .9
cam = bpy.data.objects.new('camera', bpy.data.cameras.new('camera')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.sensor_width = 36; cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = 2.8

# ------------------------------------------------------------------ outils d'animation
def chemin(keys):
    """keys : [(t, x, y)] → position (x, y) ; départs et arrêts adoucis (Hermite), vitesse constante dans les enchaînements"""
    arret = lambda i: i < 0 or i >= len(keys) - 1 or keys[i][1:] == keys[i + 1][1:] or (Vector(keys[i + 1][1:]) - Vector(keys[i][1:])).length > 4
    def f(t):
        if t <= keys[0][0]: return Vector(keys[0][1:3])
        for i, ((t0, *p0), (t1, *p1)) in enumerate(zip(keys, keys[1:])):
            if t < t1:
                if p0 == p1: return Vector(p0)
                if (Vector(p1) - Vector(p0)).length > 4: return Vector(p0)          # changement de décor
                k = (t - t0) / (t1 - t0); v0 = 0 if arret(i - 1) else 1; v1 = 0 if arret(i + 1) else 1
                k = (k ** 3 - 2 * k ** 2 + k) * v0 + (3 * k ** 2 - 2 * k ** 3) + (k ** 3 - k ** 2) * v1
                return Vector(p0).lerp(Vector(p1), k)
        return Vector(keys[-1][1:3])
    return f

class Acteur:
    def __init__(self, p, pos, cap=None, assis=(), accroupi=(), gestes=(), tete=(), expr=(), seed=0, brassard=0):
        bad = [(a[0], b[0]) for a, b in zip(pos, pos[1:]) if b[0] <= a[0]]
        if bad: print('ATTENTION temps non croissants', p.ident, bad)
        self.p, self.pos, self.cap = p, chemin(pos), cap or []
        self.assis, self.accroupi, self.gestes, self.tete, self.expr = assis, accroupi, gestes, tete, expr
        self.rnd = random.Random(seed); self.seed = seed; self.brassard = brassard
        # distance cumulée (phase de marche) + cap suivant le déplacement
        self.dist, self.vit, self.head = {}, {}, {}
        d, h, prev = 0., None, None
        for f in range(int(T['DUR'] * FPS) + 2):
            t = f / FPS; q = self.pos(t); v = (self.pos(t + .12) - self.pos(t - .12)) / .24
            if v.length > 4:                 # changement de décor : vitesse prise du côté sans saut
                a, b = (self.pos(t + .12) - q) / .12, (q - self.pos(t - .12)) / .12
                v = a if a.length < b.length else b
                if v.length > 4: v = Vector((0, 0))
            if prev is not None and (q - prev).length < 1: d += (q - prev).length
            prev = q; self.dist[f] = d; self.vit[f] = v.length
            if v.length > .15:
                target = math.degrees(math.atan2(v.x, -v.y))
                if h is None: h = target
                dh = (target - h + 180) % 360 - 180; h += dh * .22
            self.head[f] = h

    def heading(self, t, f):
        for (a, b, hd) in self.cap:          # cap imposé sur un intervalle (fondu .4 s)
            if a <= t <= b:
                h0 = self.head[f] if self.head[f] is not None else hd
                k = ease(min(seg(t, a, a + .4), 1 - seg(t, b - .4, b))) if self.vit[f] > .15 else 1
                dh = (hd - h0 + 180) % 360 - 180
                return h0 + dh * k
        return self.head[f] if self.head[f] is not None else 0

    def regle(self, t):
        p, f = self.p, int(round(t * FPS)); H = p.H
        q = self.pos(t); hd = self.heading(t, f)
        pose = {k: list(v) for k, v in p.pose.items()}; pose['_z'] = p.hipz
        # assis / accroupi
        sit = max([win(t, a, b, .8, .9) for a, b in self.assis] + [0])
        if sit:
            sz = .485 + .08 + .03 * H
            for k, v in (('hipL', (-88, 0, 3)), ('hipR', (-88, 0, -3)), ('knL', (88, 0, 0)), ('knR', (88, 0, 0)), ('ftL', (0, 0, 0)), ('ftR', (0, 0, 0)), ('spine', (4, 0, 0))):
                pose[k] = [mix(a, b, ease(sit)) for a, b in zip(pose[k], v)]
            pose['_z'] = mix(p.hipz, sz, ease(sit))
        # marche
        wv = cl(self.vit[f] / .7); ph = 2 * math.pi * self.dist[f] / 1.4
        if wv > 0:
            cro = max([win(t, a, b, .6, .6) for a, b in self.accroupi] + [0])
            amp = 26 * (1 - .25 * cro)
            for L, s in (('L', 1), ('R', -1)):
                th = -amp * math.sin(ph) * s; kn = 8 + 42 * max(0, math.cos(ph) * s) ** 1.3 + 45 * cro
                pose['hip' + L][0] += wv * (th - 32 * cro); pose['kn' + L][0] += wv * kn; pose['ft' + L][0] += wv * (-(th - 32 * cro + kn) * .75)
                pose['sh' + L][0] += wv * (20 * math.sin(ph) * s); pose['el' + L][0] += wv * (-14 - 8 * max(0, math.sin(ph) * s))
            pose['spine'][0] += wv * (3 + 42 * cro); pose['spine'][2] += wv * 5 * math.sin(ph); pose['head'][0] -= wv * 30 * cro
            pose['_z'] -= wv * (.025 * math.sin(ph) ** 2 + .2 * cro)
        # gestes (surcharges d'articulations avec fondu)
        for a, b, g in self.gestes:
            k = win(t, a, b, .35, .4)
            if k <= 0: continue
            for art, v in GESTES[g](t - a, b - a).items():
                if art in pose: pose[art] = [mix(x, y, ease(k)) for x, y in zip(pose[art], v)]
        # tête (rx, rz) et regard
        hx, hz, gx, gz = interp(self.tete, t, (0, 0, 0, 0))
        # micro-mouvements : la tête n'est jamais figée
        s = self.seed
        hx += 1.6 * math.sin(t * .9 + s) + .8 * math.sin(t * 2.3 + 2 * s); hz += 2.2 * math.sin(t * .6 + 3 * s)
        pose['head'] = [pose['head'][0] + hx * .7, pose['head'][1], pose['head'][2] + hz * .7]; pose['neck'] = [hx * .3, 0, hz * .3]
        pose['spine'][0] += .8 * math.sin(t * 1.3 + s)                   # respiration
        e = dict(zip(('sourire', 'sourcils', 'inquiet', 'fronce', 'ouv'), interp(self.expr, t, (.15, 0, 0, 0, -48))))
        e['regard'] = (gx + 2.5 * math.sin(t * .7 + s), gz)
        bt = (t + s * .37) % 3.7; e['blink'] = max(0, 1 - abs(bt - .1) / .08) if bt < .2 else 0
        sp = 0
        for a, b in SPEAK.get(p.ident, []):
            k = win(t, a, b, .08, .1)
            if k: sp = k * (.35 + .65 * abs(math.sin(t * 13.5 + s)) * (.6 + .4 * math.sin(t * 5.1)))
        e['parle'] = sp
        if sp: pose['head'][0] += 2.5 * math.sin(t * 6)
        e['brassard'] = t >= self.brassard if self.brassard else False
        p.appliquer((q.x, q.y), hd, pose, e)
        return q, hd

def interp(keys, t, defaut):
    """keys : [(t, (valeurs…))] interpolés avec lissage"""
    if not keys: return defaut
    if t <= keys[0][0]: return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t < t1:
            k = ease((t - t0) / (t1 - t0)); return tuple(mix(a, b, k) for a, b in zip(v0, v1))
    return keys[-1][1]

# gestes : fonction (temps local, durée) → {articulation: (x, y, z)} (axes du monde, personnage vu de face)
def g_tape(u, d):
    b = math.sin(u * 17) * 4; c = math.sin(u * 15 + 1) * 4
    return {'shL': (-30, -2, 0), 'elL': (-62 + b, 0, -8), 'shR': (-30, 2, 0), 'elR': (-62 + c, 0, 8), 'haL': (8, 0, 0), 'haR': (8, 0, 0), 'spine': (12, 0, 0)}
def g_appuie(u, d):
    k = ease(seg(u, .2, .6)); return {'shR': (-78 - 6 * k, -3, 0), 'elR': (-22 + 14 * k, 0, 0), 'haR': (-60, 0, 0), 'spine': (4, 0, 0)}
def g_pointe(u, d): return {'shR': (-72, 0, -38), 'elR': (-8, 0, 0), 'haR': (-10, 0, 0)}
def g_telephone(u, d): return {'shR': (-28, 52, 0), 'elR': (-142, 0, 0), 'haR': (0, 0, -20), 'head': (0, 0, 0)}
def g_porte_ext(u, d): return {'shR': (-12, 6, 0), 'elR': (-20, 0, 0), 'shL': (-10, -6, 0), 'elL': (-35, 0, 0)}
def g_pulverise(u, d): return {'shL': (-62, 0, 10), 'elL': (-18, 0, 0), 'shR': (-25, 8, 0), 'elR': (-35, 0, 0), 'spine': (8, 0, 0), 'hipL': (-12, 0, 0), 'knL': (10, 0, 0), 'hipR': (8, 0, 0), 'knR': (6, 0, 0)}
def g_decroche(u, d): return {'shR': (-45 + 30 * ease(seg(u, .3, .9)), 10, 0), 'elR': (-30, 0, 0), 'spine': (14 * (1 - ease(seg(u, .5, 1.1))), 0, 0)}
def g_ferme(u, d):
    k = ease(seg(u, .1, .9)); return {'shR': (-55 + 25 * k, -10, 0), 'elR': (-25, 0, 0)}
def g_leve_bras(u, d):
    k = math.sin(u * 5) * 8; return {'shR': (-150, -10, 0), 'elR': (-20 + k, 0, 0), 'haR': (0, 0, 0)}
def g_geste_escalier(u, d): return {'shL': (-60, -38, 0), 'elL': (-10, 0, 0), 'shR': (-15, 8, 0)}
def g_bouton(u, d): return {'shR': (-60, 20, 0), 'elR': (-15, 0, 0), 'haR': (-30, 0, 0)}
def g_dos_main(u, d): return {'shR': (-70, 0, 0), 'elR': (-35, 0, 0), 'haR': (0, 0, -90)}
def g_pousse(u, d): return {'shR': (-70, 0, 0), 'elR': (-15, 0, 0), 'shL': (-60, 0, 0), 'elL': (-15, 0, 0), 'spine': (8, 0, 0)}
def g_manche(u, d): return {'shL': (-60, 0, 30), 'elL': (-110, 0, 0), 'haL': (0, 0, 0)}
def g_compte(u, d):
    i = int(u / .55) % 6; a = -30 + i * 12; return {'shR': (-78, 0, a), 'elR': (-10, 0, 0), 'shL': (-35, -10, 0), 'elL': (-70, 0, 0)}
def g_epaule(u, d): return {'shR': (-72, 30, 0), 'elR': (-28, 0, 0), 'haR': (-20, 0, 0)}
def g_souffle(u, d):
    k = math.sin(seg(u, 0, d) * math.pi); return {'spine': (12 * k, 0, 0), 'shL': (5, -4, 0), 'shR': (5, 4, 0)}
def g_mug(u, d): return {'shR': (-20, 4, 0), 'elR': (-70, 0, 0)}
def g_bras_croises(u, d): return {'shL': (-35, -5, -10), 'elL': (-95, 0, 25), 'shR': (-35, 5, 10), 'elR': (-95, 0, -25)}
GESTES = dict(tape=g_tape, appuie=g_appuie, pointe=g_pointe, telephone=g_telephone, porte_ext=g_porte_ext, pulverise=g_pulverise, decroche=g_decroche, ferme=g_ferme,
              leve_bras=g_leve_bras, geste_escalier=g_geste_escalier, bouton=g_bouton, dos_main=g_dos_main, pousse=g_pousse, manche=g_manche, compte=g_compte,
              epaule=g_epaule, souffle=g_souffle, mug=g_mug, bras_croises=g_bras_croises)

# ------------------------------------------------------------------ jeu des acteurs
YC, YE = 40, 100
CHAISES = {'thomas': (-.92, 0, 90), 'sophie': (1.72, -2.6, -90), 'marc': (1.52, 3.6, -90), 'lea': (-3.82, 3.4, 90), 'ines': (-3.82, -2.3, 90), 'karim': (-5.0, -2.3, -90)}
def assis_jusqua(n, t1, t0=-5):
    x, y, h = CHAISES[n]; return [(t0, x, y), (t1, x, y)]
V_MARCHE = 1.3
def marche(t0, pts, v=V_MARCHE, arrivee=None):
    """trajet à vitesse de marche constante ; si arrivee est donné, le départ est recalculé pour arriver à cette heure"""
    L = sum((Vector(b) - Vector(a)).length for a, b in zip(pts, pts[1:]))
    if arrivee is not None: t0 = arrivee - L / v
    k, t = [(t0, *pts[0])], t0
    for a, b in zip(pts, pts[1:]): t += (Vector(b) - Vector(a)).length / v; k.append((t, *b))
    return k

# évacuation : Marc (guide-file) devant, puis Thomas, Léa, Karim, Inès, Sophie (serre-file)
EV = T['evac']; PS = T['porte_sortie'] + .4
def porte(r): return PS + .85 * r                       # heure de passage de la porte de sortie, rang r
def couloir_x(r, t): return 7 + 1.2 * r - 1.25 * (t - T['couloir'])
XE = [(-9.5, YE + .1), (-8.8, YE + 2.0), (-9.6, YE + 2.25), (-10.4, YE + 2.0), (-11.2, YE + 2.2), (-8.0, YE + 2.2)]   # Marc compte face au groupe
def suite(r, cap_y=None):
    """porte de sortie → couloir (accroupi) → extérieur jusqu'au point de rassemblement"""
    k = [(porte(r), -7.3, 1.0), (porte(r) + 1.5, -9.2, 1.0), (T['couloir'] - .02, -9.2, 1.0)]
    y = YC + (.3 if r % 2 else -.3)
    k += [(T['couloir'] - .01, couloir_x(r, T['couloir']), y), (T['dehors'] - .02, couloir_x(r, T['dehors']), y)]
    dep = (-1.0 - .5 * r, YE + 8.5 + (.3 if r % 2 else 0))
    k += marche(T['dehors'], [dep, XE[r]])
    return k

def depart_groupe(r, depuis):
    pts = [depuis, (-1.0 - .3 * r, -1.0), (-5.6 + .2 * r, -1.0 + .25 * r), (-7.3, 1.0)]
    k = marche(0, pts, arrivee=porte(r))
    return [(EV - 10, *depuis)] + k[:-1] + suite(r)

ACT = {}
TH_ASC = (-7.25, -2.05)
th_path = (assis_jusqua('thomas', T['leve']) + [(T['leve'] + .9, -.4, -.4), (T['dm'] - .4, 3.2, .42), (T['dm'] + .8, 3.2, .42), (T['parle_thomas'] - .4, 2.35, -2.55), (EV - 1.0, 2.35, -2.55)]
           + marche(0, [(2.35, -2.55), (-1.0, -1.6), TH_ASC], arrivee=T['ascenseur'])[1:]
           + [(T['marc_asc'] + 1.2, *TH_ASC), (T['marc_asc'] + 3.4, -6.7, .2), (porte(1) - .7, -6.7, .2)] + suite(1))
ACT['thomas'] = Acteur(PERSOS['thomas'], th_path,
    cap=[(-5, T['leve'] + .4, 90), (T['dm'] - .5, T['dm'] + 1.2, 180), (T['parle_thomas'] - .2, EV + .4, -90), (T['ascenseur'] - .2, T['marc_asc'] + 1.1, -90),
         (T['marc_asc'] + 3.4, porte(1) - .6, -60), (T['comptage'] - 1, T['DUR'], 0)],
    assis=[(-5, T['leve'] + .3)], accroupi=[(T['couloir'] - .5, T['dehors'])],
    gestes=[(0, T['odeur'] - .3, 'tape'), (T['dm'] - .1, T['dm'] + .9, 'appuie'), (T['parle_thomas'], T['parle_thomas'] + 1.8, 'pointe'), (T['ascenseur'] - .1, T['marc_asc'] + .5, 'bouton'),
            (T['ok'] - 1.6, T['ok'] + .8, 'souffle')],
    tete=[(0, (8, 0, 0, -6)), (T['odeur'] - .2, (8, 0, 0, -6)), (T['odeur'] + .6, (-8, 8, 0, 4)), (T['odeur'] + 1.8, (-4, 40, 10, 2)), (T['question'], (0, 30, 6, 0)),
          (T['question'] + 1.6, (6, 10, 18, -4)), (T['leve'], (0, 0, 0, 0)), (T['dm'] - .4, (-6, 0, 0, 4)), (T['parle_thomas'] - .5, (0, 0, 0, 0)), (T['parle_thomas'] + 1, (0, 35, 15, 0)),
          (T['parle_thomas'] + 2.2, (0, 0, 0, 0)), (T['marc_asc'], (0, 50, 15, 0)), (T['marc_asc'] + 1.5, (0, 0, 0, 0)), (T['comptage'], (0, -10, -8, 0)), (T['ok'] + .5, (-5, 30, 14, 3))],
    expr=[(0, (.35, 0, 0, 0, -48)), (T['odeur'], (.2, 0, 0, 0, -48)), (T['odeur'] + 1, (-.2, .3, .3, .6, -48)), (T['fumee'] + 1, (-.5, .8, .9, 0, -62)), (T['question'] + 1.6, (-.3, .4, .6, .2, -60)),
          (T['leve'], (-.1, 0, .1, .8, -50)), (T['alarme'] + 1, (-.3, .3, .5, .4, -55)), (T['ascenseur'] + 1, (-.4, .5, .6, 0, -58)), (T['dehors'], (-.2, .2, .4, 0, -50)),
          (T['ok'] - .5, (.3, 0, 0, 0, -48)), (T['ok'] + .5, (.85, .2, 0, 0, -45))],
    seed=1)
so_path = (assis_jusqua('sophie', T['sophie_leve']) + [(T['sophie_leve'] + 1.2, 1.75, -2.6), (EV + 1.0, 1.75, -2.6)]
           + marche(0, [(1.75, -2.6), (-2.5, -1.0), (-5.6 + 1.0, .25), (-7.3, 1.0)], arrivee=porte(5))[1:-1]
           + [(porte(5), -7.3, 1.0), (porte(5) + 1.5, -9.2, 1.0), (T['couloir'] - .02, -9.2, 1.0), (T['couloir'] - .01, 10.0, YC - .3), (T['serre'] - .2, 4.3, YC + .6), (T['serre'] + 1.4, 4.3, YC + .6),
              (T['dehors'] - .02, 4.3 - 1.25 * (T['dehors'] - T['serre'] - 1.4), YC - .3)]
           + marche(T['dehors'], [(.3, YE + 10.0), XE[5]]))
ACT['sophie'] = Acteur(PERSOS['sophie'], so_path,
    cap=[(T['sophie_leve'] + 1.0, EV + .8, 90), (T['serre'] - .1, T['serre'] + 1.3, 180), (T['comptage'] + 3.0, T['ok'] + .2, 0), (T['ok'] + .2, T['DUR'], -20)],
    assis=[(-5, T['sophie_leve'] + .2)], accroupi=[(T['couloir'] - .5, T['serre'] - .3), (T['serre'] + 1.4, T['dehors'])],
    gestes=[(0, T['sophie_leve'] - .4, 'tape'), (T['tel'] - .3, T['tel'] + .5, 'decroche'), (T['tel'] + .5, EV + .6, 'telephone'), (T['serre'], T['serre'] + 1.2, 'ferme'),
            (T['ok'] + .2, T['DUR'], 'epaule')],
    tete=[(0, (8, 0, 0, -6)), (T['alarme'], (8, 0, 0, -6)), (T['alarme'] + .5, (-6, -20, -10, 3)), (T['sophie_leve'] + 1, (0, 0, 0, 0)), (T['parle_thomas'], (0, 0, 0, 0)),
          (T['tel'] + 1, (4, 0, 0, -2)), (T['serre'] - .3, (0, 0, 0, 0)), (T['serre'] + .1, (0, -60, -20, 0)), (T['serre'] + 1.2, (0, 0, 0, 0))],
    expr=[(0, (.3, 0, 0, 0, -48)), (T['alarme'] + .3, (-.2, .6, .4, 0, -60)), (T['sophie_leve'] + 1.5, (0, .1, 0, .5, -50)), (T['tel'], (.05, 0, 0, .6, -48)),
          (T['ok'] - .4, (.1, 0, 0, 0, -48)), (T['ok'] + .4, (.8, .3, 0, 0, -45))],
    seed=2)
ma_path = (assis_jusqua('marc', T['marc_ext'] - 2.6) + [(T['marc_ext'] - .3, 2.33, 1.2), (T['marc_ext'] + 1.4, 2.33, 1.2), (T['marc_ext'] + 3.0, 4.65, 1.0), (T['marc_ext'] + 3.8, 4.75, 2.0), (T['marc_jet'] - .6, 7.2, 3.9),
                                               (T['feu_eteint'] + .6, 7.2, 3.9), (T['feu_eteint'] + 2.4, 4.75, 2.0), (T['porte_repro'] - .2, 4.65, .95), (T['porte_repro'] + 1.0, 4.4, .6), (EV, 4.4, .6)]
           + marche(EV, [(4.4, .6), (1.0, -1.0), (-5.6, -1.4)])[1:]
           + [(T['marc_asc'] + 1.4, -5.9, -1.2), (T['dos_main'] - .3, -7.45, 1.0), (T['porte_sortie'] + .5, -7.5, 1.0), (porte(0) + 1.0, -9.2, 1.0), (T['couloir'] - .02, -9.2, 1.0)]
           + [(T['couloir'] - .01, couloir_x(0, T['couloir']), YC - .3), (T['dehors'] - .02, couloir_x(0, T['dehors']), YC - .3)] + marche(T['dehors'], [(-4.0, YE + 5.0), XE[0]]))
ACT['marc'] = Acteur(PERSOS['marc'], ma_path,
    cap=[(T['marc_ext'] - .3, T['marc_ext'] + 1.3, 90), (T['marc_jet'] - .5, T['feu_eteint'] + .5, -140), (T['porte_repro'] - .1, T['porte_repro'] + .9, 180), (T['marc_crie'] - .3, EV, 0),
         (T['marc_asc'] - .2, T['marc_asc'] + 1.3, 60), (T['dos_main'] - .3, T['porte_sortie'] + .5, -90), (T['comptage'] - .5, T['DUR'], 180)],
    assis=[(-5, T['marc_ext'] - 2.7)], accroupi=[(T['couloir'] - .5, T['dehors'])],
    gestes=[(0, T['marc_ext'] - 3.1, 'tape'), (T['marc_ext'] - .2, T['marc_ext'] + 1.2, 'decroche'), (T['marc_ext'] + 1.0, T['marc_jet'] - .3, 'porte_ext'),
            (T['marc_jet'] - .3, T['feu_eteint'] + .6, 'pulverise'), (T['feu_eteint'] + .6, T['porte_repro'] - .1, 'porte_ext'), (T['porte_repro'], T['porte_repro'] + 1.0, 'ferme'),
            (T['porte_repro'] + 1.0, T['marc_crie'], 'manche'), (T['marc_crie'], EV + .8, 'leve_bras'), (T['marc_asc'], T['marc_asc'] + 1.4, 'geste_escalier'),
            (T['dos_main'] - .2, T['dos_main'] + .8, 'dos_main'), (T['dos_main'] + .8, T['porte_sortie'] + .8, 'pousse'), (T['comptage'] + .2, T['ok'] - .2, 'compte')],
    tete=[(0, (8, 0, 0, -6)), (T['alarme'], (8, 0, 0, -6)), (T['alarme'] + .6, (-4, -30, -10, 0)), (T['marc_ext'] - 2, (0, 0, 0, 0)), (T['marc_jet'], (8, 0, 0, -4)),
          (T['feu_eteint'] + .8, (0, 0, 0, 0)), (T['marc_asc'], (0, -30, -10, 0)), (T['marc_asc'] + 1.4, (0, 0, 0, 0)), (T['ok'] + .2, (0, 0, 0, 0))],
    expr=[(0, (.25, 0, 0, 0, -48)), (T['alarme'] + .5, (0, .3, .1, .6, -52)), (T['marc_jet'], (0, 0, 0, 1, -42)), (T['feu_eteint'] + 1, (.1, 0, 0, .3, -48)), (T['ok'], (.2, 0, 0, 0, -48)),
          (T['ok'] + .6, (.8, .3, 0, 0, -45))],
    seed=3, brassard=T['porte_repro'] + 1.2)
COMMUN = dict(accroupi=[(T['couloir'] - .5, T['dehors'])])
ACT['lea'] = Acteur(PERSOS['lea'], assis_jusqua('lea', EV + .4) + [(EV + 1.4, -3.82, 2.9)] + depart_groupe(2, (-3.82, 2.9))[1:], assis=[(-5, EV + .6)],
    gestes=[(0, T['alarme'] - .2, 'tape')], tete=[(0, (8, 0, 0, -6)), (T['alarme'], (8, 0, 0, -6)), (T['alarme'] + .6, (-5, 40, 15, 0)), (EV, (0, 0, 0, 0))],
    expr=[(0, (.3, 0, 0, 0, -48)), (T['alarme'] + .5, (-.3, .6, .5, 0, -60)), (T['ok'], (.6, 0, 0, 0, -48))], seed=4, cap=[(T['comptage'] - 1, T['DUR'], 0)], **COMMUN)
ACT['ines'] = Acteur(PERSOS['ines'], assis_jusqua('ines', EV + .6) + [(EV + 1.6, -3.82, -1.7)] + depart_groupe(4, (-3.82, -1.7))[1:], assis=[(-5, EV + .8)],
    gestes=[(0, T['alarme'] - .2, 'tape')], tete=[(0, (8, 0, 0, -6)), (T['alarme'], (8, 0, 0, -6)), (T['alarme'] + .6, (-5, 30, 15, 0)), (EV, (0, 0, 0, 0))],
    expr=[(0, (.3, 0, 0, 0, -48)), (T['alarme'] + .5, (-.3, .6, .5, 0, -60)), (T['ok'], (.6, 0, 0, 0, -48))], seed=5, cap=[(T['comptage'] - 1, T['DUR'], 0)], **COMMUN)
ACT['karim'] = Acteur(PERSOS['karim'], [(0, -6.6, -4.4), (5.0, -3.0, -1.3), (EV + .9, -3.0, -1.3)] + depart_groupe(3, (-3.0, -1.3))[1:],
    cap=[(5.0, EV, -40), (T['comptage'] - 1, T['DUR'], 0)], gestes=[(0, T['alarme'] + 1, 'mug'), (T['alarme'] + 1, EV, 'bras_croises')],
    tete=[(0, (0, 0, 0, 0)), (T['alarme'], (0, 0, 0, 0)), (T['alarme'] + .5, (-5, 20, 10, 0)), (EV, (0, 0, 0, 0))],
    expr=[(0, (.5, 0, 0, 0, -48)), (T['alarme'] + .5, (-.3, .6, .5, 0, -60)), (T['ok'], (.6, 0, 0, 0, -48))], seed=6, **COMMUN)
for n, a in ACT.items():                 # contrôle : personne ne court (vitesse max ≤ 1,9 m/s hors téléportations entre décors)
    fm = max(a.vit, key=a.vit.get)
    print('vitesse max', n, round(a.vit[fm], 2), 'à', round(fm / FPS, 2), 's')
MUG = Dc.cyl('mug_karim', .045, .11, (0, 0, 0), M['tasse'])

# ------------------------------------------------------------------ plans caméra : (début, position début, position fin, cible début, cible fin, focale)
def V3(*a): return Vector(a)
PLANS = [
    (0.0, V3(-6.5, -5.5, 2.3), V3(-4.6, -3.8, 1.8), V3(-.5, 0, 1.0), V3(-.6, .2, 1.0), 28),                 # le plateau, un mardi
    (5.0, V3(.5, 1.9, 1.35), V3(.3, 1.6, 1.3), V3(-.92, .02, 1.12), V3(-.92, .02, 1.14), 42),                 # Thomas travaille, sent l'odeur
    (T['fumee'] - .3, V3(7.6, 5.75, .8), V3(7.55, 5.7, .68), V3(6.15, 5.2, .3), V3(6.15, 5.2, .4), 30),         # fumée derrière l'imprimante
    (T['question'] - .4, V3(.15, 1.35, 1.25), V3(.05, 1.25, 1.24), V3(-.92, .02, 1.12), V3(-.92, .02, 1.12), 45),     # « je fais quoi, là ? »
    (T['leve'] - .3, V3(-1.3, -3.1, 1.6), V3(.6, -2.0, 1.55), V3(-.6, 0, 1.2), V3(3.0, .9, 1.3), 30),            # il se lève et va au déclencheur
    (T['dm'] - .7, V3(1.75, -.65, 1.65), V3(1.85, -.5, 1.62), V3(3.1, .75, 1.3), V3(3.1, .8, 1.32), 36),           # gros plan : il appuie
    (T['alarme'] + .6, V3(6.6, -5.4, 2.6), V3(6.2, -5.2, 2.5), V3(-.6, -.5, 1.0), V3(-.4, -.7, 1.0), 26),          # tout le plateau réagit
    (T['parle_thomas'] - .6, V3(3.5, -4.4, 1.6), V3(3.3, -4.2, 1.6), V3(2.0, -2.6, 1.4), V3(2.0, -2.6, 1.4), 40), # Thomas prévient Sophie
    (T['tel'] + .2, V3(2.75, -3.95, 1.6), V3(2.7, -3.85, 1.6), V3(1.75, -2.6, 1.5), V3(1.75, -2.6, 1.5), 42),     # Sophie appelle les secours
    (T['marc_ext'] - .4, V3(1.0, -.9, 1.45), V3(2.4, -1.0, 1.4), V3(2.5, 1.2, 1.0), V3(4.6, 1.2, 1.0), 30),          # Marc prend l'extincteur
    (T['marc_jet'] - .9, V3(7.85, 5.75, 1.15), V3(7.82, 5.7, 1.1), V3(6.75, 4.45, .85), V3(6.7, 4.5, .8), 24),        # le jet à la base des flammes
    (T['porte_repro'] - .4, V3(3.4, -2.2, 1.6), V3(3.3, -2.0, 1.6), V3(4.4, .8, 1.4), V3(4.3, .6, 1.5), 35),    # porte fermée, « tout le monde me suit »
    (EV + 1.2, V3(1.5, -5.6, 2.4), V3(-1.5, -5.4, 2.2), V3(.0, -.8, 1.1), V3(-5.5, -.8, 1.2), 24),           # évacuation
    (T['ascenseur'] - .8, V3(-5.0, -4.6, 1.5), V3(-5.2, -4.4, 1.5), V3(-7.0, -2.2, 1.3), V3(-7.0, -2.0, 1.3), 32),# pas l'ascenseur
    (T['dos_main'] - .7, V3(-5.4, 2.8, 1.5), V3(-5.6, 2.6, 1.5), V3(-7.6, 1.0, 1.2), V3(-7.7, .8, 1.2), 32),     # le dos de la main sur la porte
    (T['couloir'], V3(.8, YC - .55, 1.05), V3(-1.2, YC - .5, 1.05), V3(7.0, YC, 1.0), V3(5.0, YC, 1.0), 28),        # couloir enfumé : on se baisse
    (T['serre'] - .6, V3(-1.0, YC - .8, 1.45), V3(-.6, YC - .8, 1.45), V3(4.4, YC + .6, 1.2), V3(4.2, YC + .5, 1.2), 35),  # Sophie, serre-file
    (T['dehors'], V3(.5, YE + 11.0, 2.9), V3(-1.0, YE + 10.0, 2.7), V3(-6.0, YE + 4.0, 1.3), V3(-9.0, YE + 1.5, 1.3), 26),   # dehors, camion
    (T['comptage'], V3(-6.0, YE - 1.9, 1.6), V3(-6.2, YE - 1.7, 1.6), V3(-9.6, YE + 1.7, 1.4), V3(-9.6, YE + 1.7, 1.4), 30),  # comptage
    (T['ok'] - .3, V3(-7.4, YE - .6, 1.62), V3(-7.5, YE - .4, 1.62), V3(-8.5, YE + 2.1, 1.55), V3(-8.5, YE + 2.1, 1.55), 45),  # soulagement
    (T['fin'], V3(.5, -3.4, 1.5), V3(2.2, -.9, 1.42), V3(3.2, .95, 1.4), V3(3.2, .95, 1.4), 32),                   # retour au déclencheur
]
def camera(t):
    k = max(i for i, p in enumerate(PLANS) if p[0] <= t)
    t0, p0, p1, c0, c1, lens = PLANS[k]; t1 = PLANS[k + 1][0] if k + 1 < len(PLANS) else T['DUR']
    u = ease(seg(t, t0, t1)) * .7 + seg(t, t0, t1) * .3
    pos, tgt = p0.lerp(p1, u), c0.lerp(c1, u)
    pos += Vector((math.sin(t * .8) * .012, math.sin(t * 1.1 + 1) * .01, math.sin(t * .9 + 2) * .008))   # caméra portée, très légère
    cam.location = pos; cam.rotation_euler = (tgt - pos).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = lens
    cam.data.dof.focus_distance = (tgt - pos).length
    return k

# ------------------------------------------------------------------ effets
FUM_RND = [random.Random(i) for i in range(22)]
def effets(t):
    src = A['feu_src']; on = t >= T['fumee']; eteint = seg(t, T['feu_eteint'], T['feu_eteint'] + 2.5)
    for i, o in enumerate(A['fumee']):
        r = FUM_RND[i]; per = 3.2; ph = ((t - T['fumee']) / per + i / 22) % 1 if on else 0
        dens = seg(t, T['fumee'], T['fumee'] + 2.5) * (1 - .6 * eteint)
        o.location = src + Vector((math.sin(ph * 6 + i) * .25 * ph + (r.random() - .5) * .3 * ph, -.25 * ph, .15 + ph * 2.6))
        s = (.45 + 1.9 * ph) * dens; o.scale = (s, s, s * .85); o.hide_render = not on or s < .02
    fl = seg(t, T['flamme'], T['flamme'] + 1.2) * (1 - seg(t, T['marc_jet'] + .3, T['feu_eteint']))
    for i, o in enumerate(A['flammes']):
        f = fl * (.8 + .2 * math.sin(t * 23 + i * 2) + .15 * math.sin(t * 37 + i))
        o.scale = (max(2.4 * f, .001),) * 2 + (max(2.6 * f * (1 + .25 * math.sin(t * 19 + i)), .001),); o.hide_render = f < .02
    A['feu_lum'].data.energy = 150 * fl * (.8 + .2 * math.sin(t * 29))
    # alarme : flashs rouges (1 Hz)
    al = t >= T['alarme'] and t < T['dehors']
    fl1 = 1. if al and (t - T['alarme']) % 1.0 < .18 else 0.
    M['rouge_flash'].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 40 * fl1
    for l in A['flash_lum']: l.data.energy = 120 * fl1
    # déclencheur : la vitre s'enfonce
    A['dm_vitre'].location.y = .928 + .012 * seg(t, T['dm'] + .25, T['dm'] + .4)
    # portes
    A['porte_repro'].rotation_euler.z = math.radians(75 * (seg(t, T['marc_ext'] + 2.5, T['marc_ext'] + 3.3) - seg(t, T['porte_repro'] + .1, T['porte_repro'] + .9)))
    for g, s in A['sortie']: g.rotation_euler.z = math.radians(-s * 95 * ease(seg(t, T['porte_sortie'], T['porte_sortie'] + .9)))
    # gyrophares du camion (bleu, 2 Hz) + arrivée
    c = E['camion']; u = ease(seg(t, T['camion'], T['camion'] + 6.0)); c.location.x = 30 - 31 * u
    gb = [1. if (t * 2 + k * .5) % 1 < .3 else 0. for k in range(2)]
    M['bleu_flash'].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 30 * max(gb)
    for k, l in enumerate(E['gyro_lum']): l.data.energy = 600 * gb[k]
    for i, o in enumerate(C['fumee']): o.location.x += 0; o.location.z = 2.45 + .05 * math.sin(t * .5 + i)

def accessoires(t):
    """objets tenus en main (après la mise à jour de la scène)"""
    m, th, so, ka = PERSOS['marc'], PERSOS['thomas'], PERSOS['sophie'], PERSOS['karim']
    ex, cor = A['extincteur'], A['cornet']
    if t >= T['marc_ext'] + .4 and t < T['porte_repro'] + .1:
        Mh = m.matrice('haR'); ex.matrix_world = Matrix.Translation(Mh @ Vector((0, -.02, -.1)) - Vector((0, 0, .28))) @ Matrix.Rotation(math.radians(0), 4, 'Z')
        ex.rotation_euler = (0, 0, math.radians(ACT['marc'].heading(t, int(round(t * FPS)))))
        Ml = m.matrice('haL'); cor.matrix_world = Ml @ Matrix.Translation(m.jt['haL'][0] + Vector((0, -.06, -.07))) @ Matrix.Rotation(0, 4, 'X')
        cor.rotation_euler = (math.radians(90 - 10), 0, math.radians(ACT['marc'].heading(t, int(round(t * FPS)))))
    elif t >= T['porte_repro'] + .1:
        ex.location = (4.0, 2.2, .26); ex.rotation_euler = (0, 0, 0); cor.location = (3.9, 2.0, .05); cor.rotation_euler = (math.radians(90), 0, 1.2)
    else:
        ex.location = (2.86, 1.2, .5); ex.rotation_euler = (0, 0, 0); cor.location = (2.78, 1.2, .38); cor.rotation_euler = (0, 0, 0)
    jet = win(t, T['marc_jet'], T['feu_eteint'] + .4, .15, .3)
    for i, o in enumerate(A['co2']):
        o.hide_render = jet <= 0
        if jet > 0:
            tip = cor.matrix_world @ Vector((0, 0, -.12)); d = (A['feu_src'] + Vector((0, 0, .1)) - tip).normalized()
            o.location = tip + d * (.45 + .1 * i); o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
            sc_ = jet * (1 + .08 * math.sin(t * 40 + i)); o.scale = (sc_, sc_, sc_ * (1 + .3 * i))
    tel = A['telephone']
    if T['tel'] + .1 <= t < EV + 1.8:
        Mh = so.matrice('haR'); tel.matrix_world = Mh @ Matrix.Translation(so.jt['haR'][0] + Vector((0, -.03, -.06))) @ Matrix.Rotation(math.radians(90), 4, 'Y')
    else:
        tel.location = (.95, -2.15, .79); tel.rotation_euler = (0, 0, 0)
    if t < T['alarme'] + 1:
        MUG.hide_render = False; Mh = ka.matrice('haR'); MUG.matrix_world = Mh @ Matrix.Translation(ka.jt['haR'][0] + Vector((0, -.06, -.05)))
    else:
        MUG.location = (-2.0, -3.35, .8); MUG.rotation_euler = (0, 0, 0); MUG.hide_render = False
    liste = E['liste']
    if t >= T['dehors']:
        Mh = m.matrice('haL'); liste.matrix_world = Mh @ Matrix.Translation(m.jt['haL'][0] + Vector((0, -.08, -.08))) @ Matrix.Rotation(math.radians(-60), 4, 'X')
    else:
        liste.location = (0, 0, -10)

def regler(t):
    for a in ACT.values(): a.regle(t)
    k = camera(t); effets(t)
    bpy.context.view_layer.update(); accessoires(t)
    return k

# ------------------------------------------------------------------ rendu
def reglages(S, Wd):
    r = sc.render; r.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = S; sc.cycles.use_denoising = True
    sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = .04
    sc.cycles.max_bounces = 3; sc.cycles.diffuse_bounces = 1; sc.cycles.glossy_bounces = 1; sc.cycles.transmission_bounces = 1; sc.cycles.transparent_max_bounces = 8
    sc.cycles.use_fast_gi = True; sc.cycles.fast_gi_method = 'ADD'; sc.world.light_settings.distance = 3.0
    r.use_simplify = True; r.simplify_subdivision_render = int(os.environ.get('SUBDIV', 1))
    sc.cycles.denoiser = 'OPENIMAGEDENOISE'; sc.cycles.denoising_prefilter = 'FAST'
    sc.cycles.caustics_reflective = sc.cycles.caustics_refractive = False; sc.cycles.blur_glossy = 1.0
    r.resolution_x, r.resolution_y = Wd, Wd * 9 // 16; r.use_persistent_data = True
    if os.environ.get('THREADS'): r.threads_mode = 'FIXED'; r.threads = int(os.environ['THREADS'])
    r.image_settings.file_format = 'JPEG'; r.image_settings.quality = 93
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'; sc.view_settings.exposure = .1

PAS = []                                   # instants des pas (bruitages) : tous les 0,7 m parcourus en marchant
for n, ac in ACT.items():
    last = 0
    for f in sorted(ac.dist):
        if ac.vit[f] > .3 and ac.dist[f] - last >= .7: PAS.append((round(f / FPS, 3), n)); last = ac.dist[f]
        elif ac.vit[f] <= .3: last = ac.dist[f] - .35
json.dump(dict(T=T, dialogues=DIALOGUES, plans=[p[0] for p in PLANS], pas=PAS), open(f'{D}/timing.json', 'w'), ensure_ascii=False, indent=1)
mode = sys.argv[1] if len(sys.argv) > 1 else 'stills'
if mode == 'stills':
    reglages(int(os.environ.get('S', 12)), int(os.environ.get('W', 640)))
    os.makedirs(f'{D}/out/stills', exist_ok=True)
    for a in sys.argv[2:]:
        import time; t = float(a); regler(t); sc.render.filepath = f'{D}/out/stills/t_{t:06.2f}.jpg'; c0 = time.time(); bpy.ops.render.render(write_still=True); print('TEMPS', a, round(time.time() - c0, 1))
elif mode == 'rendu':
    t0, t1 = float(sys.argv[2]), float(sys.argv[3]); reglages(int(sys.argv[4]) if len(sys.argv) > 4 else 24, int(sys.argv[5]) if len(sys.argv) > 5 else 1280)
    os.makedirs(f'{D}/frames', exist_ok=True)
    for f in range(int(round(t0 * FPS)), int(round(t1 * FPS))):
        out = f'{D}/frames/{f:05d}.jpg'
        if os.path.exists(out): continue
        regler(f / FPS); sc.render.filepath = out; bpy.ops.render.render(write_still=True)
        print('image', f, flush=True)
