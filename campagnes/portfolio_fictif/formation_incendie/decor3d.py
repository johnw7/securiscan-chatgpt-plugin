"""Décors 3D de la formation incendie : plateau de bureaux + reprographie (origine), couloir d'évacuation (y = 40),
extérieur avec point de rassemblement (y = 100). Renvoie les objets animés (fumée, flammes, alarme, portes, extincteur…)."""
import math, random
import bpy, bmesh
from mathutils import Vector
from perso3d import mat, boite, sphere, capsule, vide, _obj

def cube(nom, dims, loc, m, bev=.01, rot=(0, 0, 0)):
    o = boite(nom, dims, loc, None, m, bev=bev, sub=0); o.rotation_euler = rot
    return o

def cyl(nom, r, h, loc, m, rot=(0, 0, 0), seg=24):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, rotation=rot, vertices=seg)
    o = bpy.context.object; o.name = nom; o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    return o

def cone(nom, r1, r2, h, loc, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=h, location=loc, rotation=rot, vertices=24)
    o = bpy.context.object; o.name = nom; o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    return o

def texte(nom, txt, loc, taille, m, rot=(math.radians(90), 0, 0)):
    cu = bpy.data.curves.new(nom, 'FONT'); cu.body = txt; cu.size = taille; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'; cu.extrude = .002
    o = bpy.data.objects.new(nom, cu); bpy.context.collection.objects.link(o); o.location = loc; o.rotation_euler = rot; o.data.materials.append(m)
    return o

def lumiere(nom, typ, loc, e, col=(1, 1, 1), size=1., vise=None, rot=None, size_y=None):
    d = bpy.data.lights.new(nom, typ); d.energy = e; d.color = col
    if typ == 'AREA':
        d.size = size
        if size_y: d.shape = 'RECTANGLE'; d.size_y = size_y
    if typ in ('POINT', 'SPOT'): d.shadow_soft_size = size
    o = bpy.data.objects.new(nom, d); bpy.context.collection.objects.link(o); o.location = loc
    if vise is not None: o.rotation_euler = (Vector(vise) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    if rot is not None: o.rotation_euler = rot
    return o

def emissif(nom, hexa, force):
    m = mat(nom, hexa, rough=.4, emit=force)
    return m

def fumee(nom, hexa, dens):
    """fumée : bords transparents (facing), cœur plus dense"""
    m = mat(nom, hexa, rough=1); nt = m.node_tree; b = nt.nodes['Principled BSDF']
    lw = nt.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = .5
    m1 = nt.nodes.new('ShaderNodeMath'); m1.operation = 'POWER'; m1.inputs[1].default_value = 2.2
    m2 = nt.nodes.new('ShaderNodeMath'); m2.operation = 'MULTIPLY'; m2.inputs[1].default_value = dens
    inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1
    nt.links.new(lw.outputs['Facing'], inv.inputs[1]); nt.links.new(inv.outputs[0], m1.inputs[0]); nt.links.new(m1.outputs[0], m2.inputs[0]); nt.links.new(m2.outputs[0], b.inputs['Alpha'])
    return m

def verre(nom='verre'):
    m = mat(nom, '#cfe3ea', rough=.05, alpha=.14)
    return m

# ---------------------------------------------------------------------------------------------------------
def bureau(nom, x, y, rot, M, ecran=True, objets=True, rnd=None):
    """poste de travail : plateau, pieds, écran, clavier, lampe/plante ; rot en degrés (0 : la personne regarde +X)"""
    g = vide(nom + '_g', (x, y, 0)); g.rotation_euler = (0, 0, math.radians(rot))
    def add(o): o.parent = g; return o
    add(cube(nom + '_plateau', (.8, 1.5, .035), (0, 0, .735), M['plateau'], .008))
    for sx in (-.35, .35):
        add(cube(nom + f'_pied{sx}', (.05, .05, .72), (sx, -.68, .36), M['metal'], .005)); add(cube(nom + f'_pied2{sx}', (.05, .05, .72), (sx, .68, .36), M['metal'], .005))
    if ecran:
        add(cube(nom + '_ecran', (.03, .62, .38), (.24, 0, 1.06), M['ecran_dos'], .01))
        add(cube(nom + '_dalle', (.006, .58, .34), (.222, 0, 1.06), M['dalle'], .002))
        add(cube(nom + '_pied_ecran', (.03, .05, .2), (.26, 0, .84), M['metal'], .004)); add(cube(nom + '_socle', (.18, .2, .015), (.26, 0, .76), M['metal'], .004))
        add(cube(nom + '_clavier', (.16, .44, .02), (-.08, 0, .762), M['clavier'], .006)); add(cube(nom + '_souris', (.09, .055, .03), (-.06, .32, .765), M['clavier'], .012))
    if objets:
        rnd = rnd or random.Random(1)
        add(cyl(nom + '_tasse', .04, .1, (.05, -.55, .8), M['tasse'])); add(cube(nom + '_carnet', (.2, .15, .015), (-.1, -.45, .76), M['carnet'], .004))
        if rnd.random() < .6:
            add(cyl(nom + '_pot', .07, .14, (.25, .6, .82), M['pot'])); [add(sphere(nom + f'_feuille{i}', .07, (.25 + rnd.uniform(-.05, .05), .6 + rnd.uniform(-.05, .05), .93 + i * .04), (1, 1, .8), m=M['plante'], seg=12)) for i in range(3)]
    # chaise
    c = vide(nom + '_chaise', (-.62, 0, 0), g)
    for o in (cube(nom + '_assise', (.48, .48, .07), (0, 0, .45), M['chaise'], .03), cube(nom + '_dossier', (.06, .46, .5), (-.25, 0, .78), M['chaise'], .03),
              cyl(nom + '_vérin', .03, .4, (0, 0, .22), M['metal']), cube(nom + '_base1', (.55, .05, .03), (0, 0, .05), M['metal'], .01), cube(nom + '_base2', (.05, .55, .03), (0, 0, .05), M['metal'], .01)):
        o.parent = c
    return g

def plante(nom, x, y, h, M, rnd):
    cyl(nom + '_pot', .2, .45, (x, y, .225), M['pot2'])
    for i in range(9):
        a = rnd.uniform(0, 6.28); d = rnd.uniform(0, .18)
        sphere(nom + f'_f{i}', rnd.uniform(.16, .26), (x + math.cos(a) * d, y + math.sin(a) * d, .5 + h * rnd.uniform(.3, 1)), (1, 1, 1.2), m=M['plante'], seg=14)

def matieres():
    return dict(
        sol=mat('sol', '#b89c7c', rough=.45, coat=.15), mur=mat('mur', '#ece7df', rough=.9), mur2=mat('mur2', '#5b6b63', rough=.85), plafond=mat('plafond', '#f4f2ee', rough=.95),
        plateau=mat('plateau', '#e9e4da', rough=.4), metal=mat('metal', '#2d2f33', rough=.35, metal=.6), ecran_dos=mat('ecran_dos', '#1b1c1f', rough=.4),
        dalle=emissif('dalle', '#9cc3e6', 1.2), clavier=mat('clavier', '#d9d9db', rough=.5), tasse=mat('tasse', '#f1efe9', rough=.3), carnet=mat('carnet', '#c25b3f', rough=.6),
        pot=mat('pot', '#d8d2c6', rough=.6), pot2=mat('pot2', '#8a7a66', rough=.7), plante=mat('plante', '#4f7d3c', rough=.7, sheen=.3), chaise=mat('chaise', '#2f3a48', rough=.8, sheen=.3),
        bois=mat('bois', '#a7825c', rough=.55), cadre=mat('cadre', '#2b2c30', rough=.4, metal=.5), rouge=mat('rouge_secu', '#c4161c', rough=.35, coat=.4),
        rouge_flash=emissif('flash_rouge', '#ff2a1a', 0.0), vert=emissif('vert_sortie', '#18b04a', 4.0), blanc=mat('blanc', '#f6f6f3', rough=.4), noir=mat('noir', '#141414', rough=.5),
        acier=mat('acier', '#9ea3a8', rough=.25, metal=1), imprimante=mat('imprimante', '#e6e6e3', rough=.45), imprimante2=mat('imprimante2', '#3a3d42', rough=.5),
        fumee=fumee('fumee', '#3a3836', .75), flamme=emissif('flamme', '#ff8a1c', 25), flamme2=emissif('flamme2', '#ffd36a', 30), co2=mat('co2', '#ffffff', rough=1, alpha=.45),
        verre=verre(), lampe=emissif('lampe', '#fff6e8', 6), ciel=emissif('ciel', '#bcd8ef', 1.6), immeuble=mat('immeuble', '#c9c4bb', rough=.8), vitre_ext=mat('vitre_ext', '#6f8ea6', rough=.08, metal=.3),
        asphalte=mat('asphalte', '#55575b', rough=.9), trottoir=mat('trottoir', '#b9b5ad', rough=.85), herbe=mat('herbe', '#6c9a4a', rough=.95), camion=mat('camion', '#c8141a', rough=.3, coat=.8),
        bleu_flash=emissif('bleu_flash', '#2a6cff', 0.0), pneu=mat('pneu', '#161616', rough=.8), chrome=mat('chrome', '#d8dadc', rough=.15, metal=1), liste=mat('liste', '#f0eee8', rough=.6),
    )

# ---------------------------------------------------------------------------------------------------------
def bureaux(M):
    """plateau 16 × 12 m ; reprographie vitrée à droite au fond ; sortie et ascenseur sur le mur de gauche"""
    A = {}
    rnd = random.Random(7)
    cube('sol', (16, 12, .1), (0, 0, -.05), M['sol'], 0); cube('plafond', (16, 12, .1), (0, 0, 3.05), M['plafond'], 0)
    for i, x in enumerate([-6, -3, 0, 3, 6]):
        for j, y in enumerate([-3.5, 0, 3.5]):
            cube(f'dalle_lum{i}{j}', (1.2, .6, .02), (x, y, 2.99), M['lampe'], 0)
    # mur du fond (y = 6) : grandes baies vitrées
    cube('mur_fond_bas', (16, .2, .7), (0, 6.1, .35), M['mur'], 0); cube('mur_fond_haut', (16, .2, .4), (0, 6.1, 2.8), M['mur'], 0)
    for x in range(-8, 9, 2): cube(f'meneau{x}', (.12, .22, 1.9), (x, 6.1, 1.65), M['cadre'], .005)
    cube('baie', (16, .02, 1.9), (0, 6.1, 1.65), M['verre'], 0)
    cube('ciel_fond', (60, .1, 30), (0, 30, 8), M['ciel'], 0)
    for i in range(14):              # silhouettes d'immeubles au loin
        h = rnd.uniform(4, 14); cube(f'tour{i}', (rnd.uniform(2, 5), 3, h), (-28 + i * 4.3, rnd.uniform(18, 26), h / 2 - 2), mat('tour', '#a9b7c4', rough=.8), 0)
    cube('mur_gauche', (.2, 12, 3), (-8.1, 0, 1.5), M['mur2'], 0); cube('mur_droit', (.2, 12, 3), (8.1, 0, 1.5), M['mur'], 0)
    # sortie de secours (mur de gauche, y = 1) : double porte + bloc vert
    A['sortie'] = []
    for s in (-1, 1):
        g = vide(f'porte_sortie{s}', (-7.98, 1 + s * .8, 0))
        p = cube(f'vantail{s}', (.06, .78, 2.1), (0, -s * .39, 1.05), M['bois'], .01); p.parent = g
        b = cube(f'barre{s}', (.05, .5, .05), (.06, -s * .45, 1.05), M['acier'], .01); b.parent = g
        A['sortie'].append((g, s))
    cube('cadre_sortie', (.08, 1.8, .1), (-7.97, 1, 2.15), M['cadre'], .005)
    cube('bloc_sortie', (.08, .5, .2), (-7.93, 1, 2.45), M['vert'], .01)
    texte('txt_sortie', 'SORTIE', (-7.88, 1, 2.45), .1, M['blanc'], (math.radians(90), 0, math.radians(-90)))
    # ascenseur (y = -3)
    for s in (-1, 1): cube(f'asc_porte{s}', (.04, .55, 2.1), (-7.97, -3 + s * .28, 1.05), M['acier'], .003)
    cube('asc_cadre', (.06, 1.3, 2.3), (-7.99, -3, 1.15), M['cadre'], .005)
    cube('asc_bouton_plaque', (.03, .12, .25), (-7.95, -2.05, 1.15), M['acier'], .005)
    A['asc_bouton'] = sphere('asc_bouton', .025, (-7.93, -2.05, 1.18), m=mat('bouton', '#e6e2d8', rough=.3, emit=0.0), seg=12)
    # reprographie vitrée : x ∈ [3.5, 8], y ∈ [1.5, 6]
    cube('repro_vitre_avant_g', (.7, .03, 2.9), (3.85, 1.5, 1.45), M['verre'], 0); cube('repro_vitre_avant_d', (2.9, .03, 2.9), (6.55, 1.5, 1.45), M['verre'], 0)
    cube('repro_vitre_cote', (.03, 4.5, 2.9), (3.5, 3.75, 1.45), M['verre'], 0)
    for x in (3.5, 4.2, 5.1, 8): cube(f'repro_montant{x}', (.06, .06, 2.95), (x, 1.5, 1.48), M['cadre'], .003)
    for y in (1.5, 3.75, 6): cube(f'repro_montant_c{y}', (.06, .06, 2.95), (3.5, y, 1.48), M['cadre'], .003)
    cube('repro_traverse', (4.5, .06, .06), (5.75, 1.5, 2.1), M['cadre'], .003)
    g = A['porte_repro'] = vide('porte_repro', (4.22, 1.5, 0))         # porte pivotant sur x = 4.2
    p = cube('porte_repro_vitre', (.86, .03, 2.05), (.44, 0, 1.03), M['verre'], 0); p.parent = g
    for o in (cube('porte_repro_cadre_h', (.88, .05, .05), (.44, 0, 2.05), M['cadre'], .003), cube('porte_repro_cadre_b', (.88, .05, .05), (.44, 0, .03), M['cadre'], .003),
              cube('porte_repro_cadre_d', (.05, .05, 2.05), (.86, 0, 1.03), M['cadre'], .003), cube('porte_repro_poignee', (.03, .06, .3), (.8, -.05, 1.05), M['acier'], .005)):
        o.parent = g
    texte('txt_repro', 'REPROGRAPHIE', (6.55, 1.48, 2.3), .14, M['noir'])
    # imprimante + multiprise
    cube('imprimante', (1.0, .7, .95), (6.2, 4.6, .475), M['imprimante'], .03); cube('imprimante_haut', (.9, .6, .12), (6.2, 4.6, 1.01), M['imprimante2'], .02)
    cube('imprimante_bac', (.6, .4, .05), (6.2, 4.15, .85), M['imprimante2'], .01); cube('imprimante_ecran', (.18, .02, .1), (6.55, 4.24, 1.0), M['dalle'], .003)
    cube('etagere_papier', (1.2, .4, .9), (4.6, 5.6, .45), M['plateau'], .02)
    for i in range(4): cube(f'rame{i}', (.3, .22, .06), (4.3 + (i % 2) * .4, 5.6, .93 + (i // 2) * .065), M['blanc'], .005)
    cube('multiprise', (.42, .08, .05), (6.2, 5.25, .03), M['blanc'], .01)
    for i in range(3): cube(f'fiche{i}', (.05, .05, .07), (6.05 + i * .14, 5.25, .08), M['noir'], .01)
    A['feu_src'] = Vector((6.15, 5.2, .1))
    # pilier avec déclencheur manuel (face -y) et extincteur (face -x)
    cube('pilier', (.45, .45, 3), (3.2, 1.2, 1.5), M['mur'], .005)
    cube('dm_boitier', (.14, .05, .14), (3.2, .955, 1.4), M['rouge'], .01)
    A['dm_vitre'] = cube('dm_vitre', (.1, .01, .1), (3.2, .928, 1.4), mat('dm_vitre', '#f3f0ea', rough=.2), .004)
    texte('dm_txt', '▲', (3.2, .92, 1.33), .03, M['blanc'])
    A['dm_voyant'] = sphere('dm_voyant', .012, (3.25, .925, 1.46), m=M['rouge_flash'], seg=10)
    cube('panneau_ext', (.01, .2, .2), (2.97, 1.2, 1.35), M['rouge'], .002)
    texte('panneau_ext_txt', 'EXTINCTEUR', (2.96, 1.2, 1.22), .035, M['rouge'], (math.radians(90), 0, math.radians(-90)))
    A['ext_support'] = cube('ext_support', (.04, .12, .05), (2.97, 1.2, .95), M['metal'], .005)
    ex = A['extincteur'] = vide('extincteur', (2.86, 1.2, .5))
    for o in (cyl('ext_corps', .075, .52, (0, 0, 0), M['rouge']), sphere('ext_dome', .075, (0, 0, .26), (1, 1, .5), m=M['rouge'], seg=16),
              cube('ext_tete', (.06, .05, .08), (0, 0, .33), M['noir'], .01), cube('ext_poignee', (.16, .03, .02), (.04, 0, .38), M['noir'], .008),
              cyl('ext_tuyau', .012, .32, (-.08, 0, .2), M['noir'])):
        o.parent = ex
    cor = A['cornet'] = vide('cornet', (2.78, 1.2, .38)); cone('cornet_c', .045, .02, .22, (0, 0, 0), M['noir'], (math.radians(90), 0, 0)).parent = cor
    # alarme : flashs rouges au plafond + lumières
    A['flashs'] = [sphere(f'flash{i}', .07, p, (1, 1, .5), m=M['rouge_flash'], seg=12) for i, p in enumerate([(-7.9, -.5, 2.8), (3.2, .96, 2.6), (0, 5.95, 2.75), (7.9, -1, 2.8)])]
    A['flash_lum'] = [lumiere(f'flash_l{i}', 'POINT', p, 0, (1, .1, .05), .2) for i, p in enumerate([(-7.6, -.5, 2.6), (3.2, .6, 2.5), (0, 5.6, 2.6), (7.6, -1, 2.6)])]
    # fumée et flammes
    A['fumee'] = [sphere(f'fumee{i}', .25, (6.15, 5.2, .1), m=M['fumee'], seg=16) for i in range(22)]
    A['flammes'] = [cone(f'flamme{i}', .05 - i * .008, .0, .2 + i * .04, (6.03 + i * .1, 5.2, .15), M['flamme' if i % 2 else 'flamme2']) for i in range(3)]
    A['feu_lum'] = lumiere('feu_lum', 'POINT', (6.15, 5.0, .4), 0, (1, .55, .2), .1)
    A['co2'] = [cone(f'co2_{i}', .2 + .08 * i, .02 + .05 * i, .9, (0, 0, 0), M['co2']) for i in range(3)]
    for o in A['co2']: o.hide_render = True
    # postes de travail
    BUREAUX = {'thomas': (-.3, 0, 0), 'sophie': (1.1, -2.6, 180), 'marc': (.9, 3.6, 180), 'lea': (-3.2, 3.4, 0), 'ines': (-3.2, -2.3, 0), 'karim': (-4.5, -2.3, 180)}
    for n, (x, y, r) in BUREAUX.items(): bureau('bureau_' + n, x, y, r, M, rnd=rnd)
    for k, (x, y) in enumerate([(-1.6, 3.6), (2.4, -3.8), (-5.2, 4.8)]): bureau(f'bureau_libre{k}', x, y, 0 if k % 2 else 180, M, rnd=rnd)
    for k, (x, y, h) in enumerate([(-7.3, 5.2, 1.4), (2.3, 5.3, 1.1), (7.3, -5.2, 1.3), (-7.3, -5.2, 1.2), (-5.4, -5.3, 1.0)]): plante(f'plante{k}', x, y, h, M, rnd)
    A['telephone'] = vide('telephone', (.95, -2.15, .79))
    for o in (cube('tel_combine', (.2, .05, .045), (0, 0, 0), M['noir'], .02),): o.parent = A['telephone']
    cube('tel_base', (.22, .18, .05), (.95, -2.15, .76), M['noir'], .02)
    # lumière
    lumiere('soleil', 'SUN', (0, 20, 20), 3.2, (1, .93, .82), .05, rot=(math.radians(55), 0, math.radians(200)))
    for i, x in enumerate([-5, 0, 5]):
        for j, y in enumerate([-3, 2]):
            lumiere(f'plafonnier{i}{j}', 'AREA', (x, y, 2.9), 280, (1, .97, .92), 2.2, rot=(0, 0, 0))
    lumiere('repro_lum', 'AREA', (5.8, 3.8, 2.9), 160, (1, .97, .92), 1.5, rot=(0, 0, 0))
    return A

def couloir(M, Y=40):
    """couloir d'évacuation (axe X), fumée sous le plafond"""
    A = {}
    cube('c_sol', (30, 2.6, .1), (0, Y, -.05), M['sol'], 0); cube('c_plafond', (30, 2.6, .1), (0, Y, 2.75), M['plafond'], 0)
    cube('c_mur1', (30, .2, 2.8), (0, Y + 1.4, 1.4), M['mur'], 0); cube('c_mur2', (30, .2, 2.8), (0, Y - 1.4, 1.4), M['mur'], 0)
    for x in range(-12, 13, 4):
        cube(f'c_porte{x}', (.9, .06, 2.05), (x, Y + 1.29, 1.02), M['bois'], .01); cube(f'c_lum{x}', (.9, .4, .02), (x + 2, Y, 2.69), M['lampe'], 0)
        lumiere(f'c_lumiere{x}', 'AREA', (x + 2, Y, 2.6), 90, (1, .97, .92), 1.2, rot=(0, 0, 0))
    for x in (-8, 0, 8):
        cube(f'c_sortie{x}', (.5, .06, .2), (x, Y + 1.27, 2.35), M['vert'], .01)
        texte(f'c_sortie_txt{x}', '← SORTIE', (x, Y + 1.23, 2.35), .08, M['blanc'])
    cube('c_fond', (.2, 2.6, 2.8), (-15, Y, 1.4), M['mur2'], 0)
    cube('c_porte_fin', (.06, 1.2, 2.1), (-14.88, Y, 1.05), M['bois'], .01); cube('c_sortie_fin', (.06, .5, .2), (-14.85, Y, 2.35), M['vert'], .01)
    rnd = random.Random(11)
    A['fumee'] = [sphere(f'c_fumee{i}', rnd.uniform(.5, .9), (rnd.uniform(-14, 14), Y + rnd.uniform(-1, 1), 2.45), (1.6, 1, .35), m=fumee('fumee_c', '#3e3e40', .7), seg=14) for i in range(26)]
    A['flash'] = [sphere(f'c_flash{x}', .06, (x, Y - 1.28, 2.5), (1, .5, 1), m=M['rouge_flash'], seg=10) for x in (-10, 0, 10)]
    return A

def exterieur(M, Y=100):
    A = {}
    cube('e_rue', (120, 30, .1), (0, Y - 6, -.06), M['asphalte'], 0); cube('e_parvis', (40, 12, .1), (0, Y + 6, -.04), M['trottoir'], 0)
    cube('e_pelouse', (14, 6, .1), (-14, Y + 3, -.03), M['herbe'], 0)
    for i in range(-4, 5): cube(f'e_marquage{i}', (2.5, .15, .01), (i * 6, Y - 6, .0), M['blanc'], 0)
    # bâtiment
    cube('e_bat', (30, 10, 14), (0, Y + 17, 7), M['immeuble'], .02)
    for i in range(-7, 8):
        for j in range(4): cube(f'e_fen{i}_{j}', (1.4, .1, 2.0), (i * 2, Y + 11.97, 2.5 + j * 3.2), M['vitre_ext'], .01)
    cube('e_porte_cadre', (3.0, .3, 2.8), (0, Y + 12, 1.4), M['cadre'], .01); cube('e_porte_verre', (2.6, .1, 2.5), (0, Y + 11.87, 1.25), M['vitre_ext'], .01)
    cube('e_auvent', (5, 2, .15), (0, Y + 11, 3.0), M['cadre'], .02)
    texte('e_nom', 'ATELIER NORVAN', (0, Y + 11.85, 4.0), .55, M['blanc'])
    rnd = random.Random(4)
    for k, x in enumerate([-12, -8, 9, 13]):
        cyl(f'e_tronc{k}', .12, 2.4, (x, Y + 9, 1.2), mat('tronc', '#6b4f36', rough=.8))
        for i in range(6): sphere(f'e_arbre{k}{i}', rnd.uniform(.8, 1.2), (x + rnd.uniform(-.6, .6), Y + 9 + rnd.uniform(-.6, .6), 3 + rnd.uniform(0, 1.2)), m=M['plante'], seg=14)
    # point de rassemblement
    cyl('e_poteau', .04, 2.6, (-9, Y + 3, 1.3), M['acier'])
    cube('e_panneau', (1.1, .04, .8), (-9, Y + 2.97, 2.3), mat('vert_ras', '#11934a', rough=.4), .01)
    texte('e_panneau_txt', 'POINT DE\nRASSEMBLEMENT', (-9, Y + 2.94, 2.3), .12, M['blanc'])
    # camion de pompiers
    c = A['camion'] = vide('camion', (30, Y - 4, 0)); c.rotation_euler = (0, 0, math.pi)
    parts = [cube('cam_caisse', (6.0, 2.4, 2.5), (-.8, 0, 1.65), M['camion'], .05), cube('cam_cabine', (2.0, 2.4, 2.2), (3.2, 0, 1.5), M['camion'], .08),
             cube('cam_parebrise', (.05, 2.0, .9), (4.21, 0, 2.0), M['vitre_ext'], .02), cube('cam_vitre_l', (1.2, .05, .7), (3.3, -1.21, 2.0), M['vitre_ext'], .01),
             cube('cam_bande', (8.0, 2.44, .18), (.2, 0, 1.0), M['blanc'], .01), cube('cam_echelle', (5.5, .8, .15), (-.8, 0, 3.0), M['chrome'], .01),
             cube('cam_pare_choc', (.2, 2.4, .3), (4.25, 0, .55), M['chrome'], .02)]
    for o in parts: o.parent = c
    for x in (-2.8, -1.3, 3.0):
        for s in (-1, 1): cyl(f'cam_roue{x}{s}', .5, .3, (x, s * 1.15, .5), M['pneu'], (math.radians(90), 0, 0)).parent = c
    A['gyros'] = []
    for s in (-1, 1):
        o = cube(f'cam_gyro{s}', (.3, .3, .15), (3.4, s * .7, 2.68), M['bleu_flash'], .03); o.parent = c; A['gyros'].append(o)
    A['gyro_lum'] = [lumiere(f'gyro_l{s}', 'POINT', (0, 0, 0), 0, (.2, .4, 1), .3) for s in (-1, 1)]
    for i, l in enumerate(A['gyro_lum']): l.parent = c; l.location = (3.4, (-1, 1)[i] * .7, 3.0)
    A['liste'] = vide('liste', (0, 0, 0)); cube('liste_plaque', (.25, .02, .32), (0, 0, 0), M['liste'], .005).parent = A['liste']
    lumiere('e_soleil', 'SUN', (0, Y, 30), 4.0, (1, .94, .85), .03, rot=(math.radians(50), 0, math.radians(150)))
    return A
