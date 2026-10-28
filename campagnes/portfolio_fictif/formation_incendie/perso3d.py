"""Personnages 3D (Blender / bpy) de la formation incendie : Thomas, Sophie, Marc et les collègues.
Chaque personnage est construit par la même fonction à partir de sa fiche (FICHES) : il garde donc exactement
le même modèle du premier au dernier plan. Squelette = articulations (empties) ; pose réglée image par image.

Repère : Z vers le haut, personnage tourné vers -Y au repos, origine entre les pieds.
Rotations des articulations en degrés (x, y, z) :
  bras / jambes : x < 0 = vers l'avant ; coude : x < 0 = plie vers l'avant ; genou : x > 0 = plie vers l'arrière
  buste : x > 0 = penché en avant ; tête : x > 0 = baisse, z > 0 = tourne vers sa gauche"""
import math
import bpy, bmesh
from mathutils import Vector, Euler, Matrix

def lin(h):
    """couleur hexadécimale sRGB → linéaire (RGBA)"""
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c) + (1,)

_MATS = {}
def mat(nom, hexa, rough=.55, sheen=0., emit=0., alpha=1., metal=0., coat=0.):
    if nom in _MATS: return _MATS[nom]
    m = bpy.data.materials.new(nom); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = lin(hexa); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if sheen: b.inputs['Sheen Weight'].default_value = sheen
    if coat: b.inputs['Coat Weight'].default_value = coat
    if emit:
        b.inputs['Emission Color'].default_value = lin(hexa); b.inputs['Emission Strength'].default_value = emit
    if alpha < 1: b.inputs['Alpha'].default_value = alpha
    _MATS[nom] = m
    return m

def _obj(nom, me, parent=None, m=None, sub=2, smooth=True):
    o = bpy.data.objects.new(nom, me); bpy.context.collection.objects.link(o)
    if m: o.data.materials.append(m)
    if smooth:
        for p in o.data.polygons: p.use_smooth = True
    if sub:
        md = o.modifiers.new('sub', 'SUBSURF'); md.levels = 1; md.render_levels = sub
    if parent: o.parent = parent
    return o

def sphere(nom, r, loc=(0, 0, 0), sc=(1, 1, 1), parent=None, m=None, seg=24, sub=1, half=False):
    me = bpy.data.meshes.new(nom); bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=r)
    if half: bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -1e-4], context='VERTS')
    bm.to_mesh(me); bm.free()
    o = _obj(nom, me, parent, m, sub); o.location = loc; o.scale = sc
    return o

def capsule(nom, r, L, loc=(0, 0, 0), parent=None, m=None, down=True, sc=(1, 1, 1), seg=20):
    """capsule de longueur L (bouts compris) qui part de l'origine vers -Z (down) ou +Z"""
    me = bpy.data.meshes.new(nom); bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2 + 1, radius=r)
    h = max(L / 2 - r, 0)
    for v in bm.verts: v.co.z += h if v.co.z > 0 else -h
    for v in bm.verts: v.co.z += (-L / 2 if down else L / 2)
    bm.to_mesh(me); bm.free()
    o = _obj(nom, me, parent, m, 1); o.location = loc; o.scale = sc
    return o

def boite(nom, dims, loc=(0, 0, 0), parent=None, m=None, bev=.03, sub=2, taper=None):
    """boîte arrondie ; taper = (facteur bas x, facteur haut x) pour un buste en V"""
    me = bpy.data.meshes.new(nom); bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co.x *= dims[0]; v.co.y *= dims[1]; v.co.z *= dims[2]
        if taper: v.co.x *= taper[0] if v.co.z < 0 else taper[1]
    bm.to_mesh(me); bm.free()
    o = _obj(nom, me, parent, m, 0, smooth=False); o.location = loc
    if bev:
        b = o.modifiers.new('bev', 'BEVEL'); b.width = bev; b.segments = 3; b.limit_method = 'NONE'
        for p in o.data.polygons: p.use_smooth = True
        o.data.shade_smooth() if hasattr(o.data, 'shade_smooth') else None
    if sub:
        s = o.modifiers.new('sub', 'SUBSURF'); s.levels = 1; s.render_levels = sub
    return o

def vide(nom, loc=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(nom, None); bpy.context.collection.objects.link(o)
    o.empty_display_size = .05; o.parent = parent; o.location = loc
    return o

def bouche(nom, w, parent, m):
    """arc de bouche (tube) avec clés de forme : sourire, inquiet"""
    me = bpy.data.meshes.new(nom); bm = bmesh.new()
    n, rr = 14, .0075
    rings = []
    for i in range(n + 1):
        x = -w / 2 + w * i / n
        ring = [bm.verts.new((x, rr * math.cos(a), rr * math.sin(a))) for a in [k * math.pi / 3 for k in range(6)]]
        rings.append(ring)
    for i in range(n):
        for k in range(6):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % 6], rings[i + 1][(k + 1) % 6], rings[i + 1][k]))
    bm.to_mesh(me); bm.free()
    o = _obj(nom, me, parent, m, 1)
    o.shape_key_add(name='base')
    for nomk, k in (('sourire', 1), ('inquiet', -1)):
        sk = o.shape_key_add(name=nomk)
        for i, v in enumerate(me.vertices):
            x = v.co.x / (w / 2); sk.data[i].co.z = v.co.z + k * .022 * x * x; sk.data[i].co.y = v.co.y + .006 * x * x
    return o

# ---------------------------------------------------------------- fiches des personnages
FICHES = {
    'thomas': dict(H=1.80, peau='#d9a982', cheveux='#24170f', yeux='#7a5a2e', haut='#1f2f52', haut2='#f4f2ee', bas='#cdb593', chaussures='#f2f2f2',
                   semelle='#dcdcdc', coiffure='courts', barbe=True, barbe_c='#3e2c20', badge='#2f6fd6', larg=1.0),
    'sophie': dict(H=1.68, peau='#7b4a33', cheveux='#1d1411', yeux='#3a2214', haut='#d7a228', haut2='#f6f3ee', bas='#1d1d22', chaussures='#151515',
                   semelle='#151515', coiffure='chignon', boucles=True, badge='#c8302c', larg=.9, levres='#8a3b33'),
    'marc':   dict(H=1.85, peau='#e3b49a', cheveux='#6f6c68', yeux='#4f7cab', haut='#8fb0d3', haut2='#8fb0d3', bas='#3a3c42', chaussures='#18181a',
                   semelle='#2a2a2a', coiffure='court_gris', lunettes=True, moustache=True, larg=1.12, manches_retroussees=True),
    # collègues (silhouettes secondaires, mêmes proportions de famille)
    'lea':    dict(H=1.65, peau='#f0c8a8', cheveux='#b5651d', yeux='#4a6a3a', haut='#2e7d6b', haut2='#2e7d6b', bas='#2b3a55', chaussures='#5a3a26',
                   semelle='#3a2a1c', coiffure='carre', larg=.88),
    'karim':  dict(H=1.76, peau='#b07a52', cheveux='#120d0a', yeux='#2b1a10', haut='#7a2e3a', haut2='#7a2e3a', bas='#24262c', chaussures='#2a1d14',
                   semelle='#2a1d14', coiffure='courts', barbe=True, larg=1.02),
    'ines':   dict(H=1.62, peau='#c99572', cheveux='#2a1a12', yeux='#3a2414', haut='#e8e4dc', haut2='#e8e4dc', bas='#5c6b7a', chaussures='#e8e4dc',
                   semelle='#cfcac0', coiffure='queue', larg=.86),
}

ARTIC = ['pelvis', 'spine', 'neck', 'head', 'shL', 'elL', 'haL', 'shR', 'elR', 'haR', 'hipL', 'knL', 'ftL', 'hipR', 'knR', 'ftR']

def peau_continue(nom, pts, aretes, arm, os_, m, parent_arm=True):
    """surface continue (modificateur Skin → maillage réel) déformée par l'armature ; pts = [(x, y, z, rx, ry)]"""
    me = bpy.data.meshes.new(nom); me.from_pydata([p[:3] for p in pts], aretes, []); me.update()
    o = bpy.data.objects.new(nom, me); bpy.context.collection.objects.link(o)
    o.modifiers.new('skin', 'SKIN')
    for i, p in enumerate(pts):
        sv = me.skin_vertices[0].data[i]; sv.radius = (p[3], p[4]); sv.use_root = (i == 0)
    sm = o.modifiers.new('sub', 'SUBSURF'); sm.levels = 1
    bpy.context.view_layer.update()
    me2 = bpy.data.meshes.new_from_object(o.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(o); bpy.data.meshes.remove(me)
    o = bpy.data.objects.new(nom, me2); bpy.context.collection.objects.link(o)
    o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    # poids : distance aux segments des os (fondu gaussien près des articulations)
    segs = {b: (arm.data.bones[b].head_local, arm.data.bones[b].tail_local) for b in os_}
    vg = {b: o.vertex_groups.new(name=b) for b in os_}
    for v in o.data.vertices:
        d = {}
        for b, (a, c) in segs.items():
            ab = c - a; t = max(0, min(1, (v.co - a).dot(ab) / ab.length_squared)); d[b] = (v.co - (a + ab * t)).length
        dm = min(d.values()); w = {b: math.exp(-((x - dm) / .035) ** 2) for b, x in d.items()}; s = sum(w.values())
        for b, x in w.items():
            if x / s > .01: vg[b].add([v.index], x / s, 'REPLACE')
    o.parent = arm
    am = o.modifiers.new('arm', 'ARMATURE'); am.object = arm
    s2 = o.modifiers.new('sub', 'SUBSURF'); s2.levels = 1; s2.render_levels = 2
    return o

class Perso:
    def __init__(self, ident, suffixe=''):
        f = FICHES[ident]; nom = ident + suffixe; self.ident, self.nom, self.f = ident, nom, f
        H, W = f['H'], f['larg']; self.H = H
        P = lambda k, hexa, **kw: mat(f'{ident}_{k}', hexa, **kw)
        peau, cheveux = P('peau', f['peau'], rough=.5, sheen=.15), P('cheveux', f['cheveux'], rough=.55, sheen=.15)
        haut, bas = P('haut', f['haut'], rough=.85, sheen=.15), P('bas', f['bas'], rough=.8, sheen=.15)
        chauss = P('chauss', f['chaussures'], rough=.45, coat=.3)
        blanc_oeil, noir = mat('oeil_blanc', '#f7f5f0', rough=.15, coat=1), mat('pupille', '#0b0b0d', rough=.1, coat=1)
        iris = P('iris', f['yeux'], rough=.2, coat=1)
        levres = P('levres', f.get('levres', '#9a5045'), rough=.45)
        r = .165 * H / 1.8; self.r = r
        z0 = H - 2.09 * r                                                     # base de la tête
        a8 = math.radians(8)
        # ---- squelette (positions au repos)
        V = Vector
        jt = {'pelvis': (V((0, 0, .5 * H)), V((0, 0, .6 * H))), 'spine': (V((0, 0, .6 * H)), V((0, 0, .69 * H))),
              'chest': (V((0, 0, .69 * H)), V((0, 0, .79 * H))), 'neck': (V((0, 0, .79 * H)), V((0, 0, z0))), 'head': (V((0, 0, z0)), V((0, 0, z0 + .25)))}
        par = {'spine': 'pelvis', 'chest': 'spine', 'neck': 'chest', 'head': 'neck'}
        for s, L in ((1, 'L'), (-1, 'R')):
            sh = V((s * .175 * W, 0, .765 * H)); dr = V((s * math.sin(a8), 0, -math.cos(a8)))
            el = sh + dr * .165 * H; wr = el + dr * .135 * H
            jt['sh' + L] = (sh, el); jt['el' + L] = (el, wr); jt['ha' + L] = (wr, wr + dr * .08)
            par['sh' + L] = 'chest'; par['el' + L] = 'sh' + L; par['ha' + L] = 'el' + L
            hp, kn, an = V((s * .088 * W, 0, .47 * H)), V((s * .09 * W, 0, .27 * H)), V((s * .09 * W, 0, .052 * H))
            jt['hip' + L] = (hp, kn); jt['kn' + L] = (kn, an); jt['ft' + L] = (an, an + V((0, -.12, -.03)))
            par['hip' + L] = 'pelvis'; par['kn' + L] = 'hip' + L; par['ft' + L] = 'kn' + L
        self.jt = jt
        ad = bpy.data.armatures.new(nom + '_squelette'); arm = self.arm = bpy.data.objects.new(nom + '_squelette', ad)
        bpy.context.collection.objects.link(arm); bpy.context.view_layer.objects.active = arm
        bpy.ops.object.mode_set(mode='EDIT')
        for b, (h, t) in jt.items():
            eb = ad.edit_bones.new(b); eb.head, eb.tail = h, t
        for b, p in par.items(): ad.edit_bones[b].parent = ad.edit_bones[p]; ad.edit_bones[b].use_connect = False
        bpy.ops.object.mode_set(mode='OBJECT')
        self.rest = {b: ad.bones[b].matrix_local.to_3x3() for b in jt}
        for pb in arm.pose.bones: pb.rotation_mode = 'QUATERNION'
        # ---- vêtements continus
        sl = (.175 * W - .025)
        def bras(s):
            sh, el = jt['sh' + ('L' if s > 0 else 'R')]; wr = jt['el' + ('L' if s > 0 else 'R')][1]
            return sh, el, wr
        pts, ed = [(0, 0, .46 * H, .158 * W, .108), (0, 0, .58 * H, .15 * W, .102), (0, 0, .69 * H, .17 * W, .115), (0, 0, .772 * H, .062, .058)], [(0, 1), (1, 2), (2, 3)]
        manches = f.get('manches_retroussees')
        for s in (1, -1):
            sh, el, wr = bras(s); i = len(pts)
            fin = el + (wr - el) * .3 if manches else wr
            pts += [(s * sl, 0, sh.z - .01, .068 * W ** .5, .066), tuple(el) + (.05 * W ** .5, .05), tuple(fin) + ((.05 if manches else .041) * W ** .5, .04)]
            ed += [(2, i), (i, i + 1), (i + 1, i + 2)]
        os_haut = ['pelvis', 'spine', 'chest', 'neck', 'shL', 'elL', 'shR', 'elR']
        self.haut = peau_continue(nom + '_haut', pts, ed, arm, os_haut, haut)
        if manches:
            for s, L in ((1, 'L'), (-1, 'R')):
                sh, el, wr = bras(s)
                peau_continue(f'{nom}_avbras{L}', [tuple(el + (wr - el) * .2) + (.042, .04), tuple(wr) + (.034, .032)], [(0, 1)], arm, ['el' + L], peau)
        pts = [(0, 0, .57 * H, .15 * W, .104), (0, 0, .49 * H, .16 * W, .112)]; ed = [(0, 1)]
        for s, L in ((1, 'L'), (-1, 'R')):
            hp, kn = jt['hip' + L]; an = jt['kn' + L][1]; i = len(pts)
            pts += [tuple(hp + V((0, 0, -.03))) + (.083 * W ** .5, .088), tuple(kn) + (.062 * W ** .5, .066), tuple(an + V((0, 0, .015))) + (.05 * W ** .5, .054)]
            ed += [(1, i), (i, i + 1), (i + 1, i + 2)]
        self.bas = peau_continue(nom + '_bas', pts, ed, arm, ['pelvis', 'hipL', 'knL', 'hipR', 'knR'], bas)
        # ---- groupes rigides suivant un os (tête, mains, pieds)
        def groupe(gnom, b, origine):
            e = vide(f'{nom}_{gnom}', origine); bone = ad.bones[b]
            e.parent = arm; e.parent_type = 'BONE'; e.parent_bone = b
            e.matrix_parent_inverse = (bone.matrix_local @ Matrix.Translation((0, bone.length, 0))).inverted()
            return e
        J = self.J = {}
        J['head'] = groupe('g_tete', 'head', V((0, 0, z0)))
        if f['haut2'] != f['haut']:                                            # col / chemisier visible
            if ident == 'sophie':
                me = bpy.data.meshes.new('v'); bm = bmesh.new()
                a, b, c = bm.verts.new((-.065, 0, 0)), bm.verts.new((.065, 0, 0)), bm.verts.new((0, 0, -.17)); bm.faces.new((a, b, c)); bm.to_mesh(me); bm.free()
                g = groupe('g_buste', 'chest', V((0, 0, .69 * H)))
                o = _obj(f'{nom}_chemisier', me, g, P('haut2', f['haut2'], rough=.7), 0); o.location = (0, -.118, .772 * H - .69 * H + .012)
                for s in (-1, 1):     # revers du blazer
                    me = bpy.data.meshes.new('rv'); bm = bmesh.new()
                    a, b, c = bm.verts.new((s * .065, 0, 0)), bm.verts.new((s * .1, 0, -.03)), bm.verts.new((0, 0, -.175)); bm.faces.new((a, b, c)); bm.to_mesh(me); bm.free()
                    o = _obj(f'{nom}_revers{s}', me, g, mat(f'{ident}_revers', '#b8861a', rough=.8), 0); o.location = (0, -.121, .772 * H - .69 * H + .012)
            else:
                capsule(f'{nom}_col', .062, .03, (0, -.004, -.06), J['head'], P('haut2', f['haut2'], rough=.7), down=False, sc=(1.1, 1.0, .6))
        capsule(f'{nom}_cou', .046, .1, (0, -.005, -.07), J['head'], peau, down=False)
        hc = Vector((0, -.01, r * 1.02)); self.hc = hc
        sphere(f'{nom}_tete', r, hc, (.92, .97, 1.06), J['head'], peau, seg=32)
        sphere(f'{nom}_joues', r * .62, hc + Vector((0, -r * .3, -r * .45)), (1.18, .95, .82), J['head'], peau)
        for s in (-1, 1):
            sphere(f'{nom}_oreille{s}', r * .2, hc + Vector((s * r * .91, .01, -.02)), (.45, .8, 1.1), J['head'], peau)
        sphere(f'{nom}_nez', r * .15, hc + Vector((0, -r * .98, -r * .2)), (.8, 1, 1.15), J['head'], peau)
        self.lids, self.brows, self.irises = [], [], []
        er = r * .2
        for s in (-1, 1):
            c = hc + Vector((s * r * .36, -r * .79, r * .08))
            g = vide(f'{nom}_oeil{s}', c, J['head'])
            sphere(f'{nom}_globe{s}', er, (0, 0, 0), parent=g, m=blanc_oeil, sub=1)
            ir = vide(f'{nom}_irisv{s}', (0, 0, 0), g); self.irises.append(ir)
            sphere(f'{nom}_iris{s}', er * .6, (0, -er * .86, 0), (1, .35, 1), ir, iris, sub=1)
            sphere(f'{nom}_pup{s}', er * .3, (0, -er * .99, 0), (1, .25, 1), ir, noir, sub=1)
            lid = vide(f'{nom}_paup{s}', (0, 0, 0), g); self.lids.append(lid)
            sphere(f'{nom}_paupiere{s}', er * 1.1, (0, 0, 0), parent=lid, m=peau, half=True, sub=1)
            bz = c.z + er * 1.75
            bv = vide(f'{nom}_sourcilv{s}', (c.x, c.y - .012, bz), J['head']); self.brows.append((bv, s, bz))
            sb = capsule(f'{nom}_sourcil{s}', .0085, .055, (-.0275, 0, 0), bv, cheveux, down=False); sb.rotation_euler = (0, math.radians(90), 0)
        self.mouth = bouche(f'{nom}_bouche', r * .5, J['head'], levres); self.mouth.location = hc + Vector((0, -r * .9, -r * .5))
        self.mouth_open = sphere(f'{nom}_bouche_ouverte', r * .17, hc + Vector((0, -r * .87, -r * .52)), (1.3, .5, .1), J['head'], mat('bouche_int', '#3a1010', rough=.6))
        self._coiffure(f, cheveux, hc, r, P)
        for s, L in ((1, 'L'), (-1, 'R')):
            wr = jt['ha' + L][0]; g = J['ha' + L] = groupe('g_main' + L, 'ha' + L, wr)
            sphere(f'{nom}_main{L}', .046, (0, -.004, -.05), (.78, .6, 1.12), g, peau)
            th = capsule(f'{nom}_pouce{L}', .016, .05, (-s * .022, -.026, -.02), g, peau); th.rotation_euler = (math.radians(-25), math.radians(s * 25), 0)
            an = jt['ft' + L][0]; g = J['ft' + L] = groupe('g_pied' + L, 'ft' + L, an)
            boite(f'{nom}_chaussure{L}', (.105, .26, .08), (0, -.05, -.017), g, chauss, bev=.035)
            boite(f'{nom}_semelle{L}', (.108, .262, .022), (0, -.05, -.052), g, P('semelle', f['semelle'], rough=.7), bev=.01, sub=1)
        if f.get('badge'):
            g = groupe('g_badge', 'chest', V((0, 0, .69 * H))); lan = mat(f'{ident}_cordon', f['badge'], rough=.6)
            for s in (-1, 1):
                c = capsule(f'{nom}_cordon{s}', .006, .2, (s * .055, -.112, .08 * H), g, lan); c.rotation_euler = (math.radians(-6), math.radians(s * 17), 0)
            boite(f'{nom}_badge', (.07, .008, .095), (0, -.13, .08 * H - .23), g, mat('badge_blanc', '#f5f5f2', rough=.3), bev=.006, sub=0)
            boite(f'{nom}_badge_bande', (.07, .009, .02), (0, -.131, .08 * H - .195), g, lan, bev=.004, sub=0)
        self.brassard = None
        if ident == 'marc':          # brassard « guide-file », visible à partir de l'évacuation
            sh, el = jt['shL']; g = groupe('g_brassard', 'shL', sh)
            self.brassard = capsule('marc_brassard', .073, .075, tuple((el - sh) * .45), g, mat('orange_fluo', '#ff7a00', rough=.5, emit=.25), down=True)
            self.brassard.rotation_euler = (0, math.radians(-8), 0)
        self.hipz = .5 * H
        self.pose_neutre()

    def _coiffure(self, f, cheveux, hc, r, P):
        """coque de cheveux qui épouse la tête (ligne d'implantation : front / côtés / nuque) + volumes propres à chaque coiffure"""
        n, J, c = self.nom, self.J, f['coiffure']
        # matière cheveux : texture fibreuse en relief (bruit étiré)
        nt = cheveux.node_tree; b = nt.nodes['Principled BSDF']
        if not any(x.type == 'BUMP' for x in nt.nodes):
            tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (90, 90, 18)
            nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Detail'].default_value = 6
            bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .35
            nt.links.new(tc.outputs['Object'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], nz.inputs['Vector'])
            nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
            b.inputs['Roughness'].default_value = .62; b.inputs['Specular IOR Level'].default_value = .18; b.inputs['Sheen Weight'].default_value = 0
        lignes = {'courts': (.55, -.05, -.62), 'court_gris': (.62, -.02, -.55), 'chignon': (.5, -.02, -.5), 'carre': (.42, -.85, -.95), 'queue': (.45, -.1, -.6)}
        fr, co, nu = lignes[c]
        me = bpy.data.meshes.new(n + '_coque'); bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=1)
        sm = lambda a, b, x: min(1, max(0, (x - a) / (b - a)))
        suppr = []
        for v in bm.verts:
            ny = v.co.y; front = sm(.25, .7, -ny); back = sm(.0, .8, ny)
            thr = co + (fr - co) * front + (nu - co) * back
            if v.co.z < thr: suppr.append(v)
        bmesh.ops.delete(bm, geom=suppr, context='VERTS')
        for v in bm.verts: v.co = Vector((v.co.x * .92 * r * 1.05, v.co.y * .97 * r * 1.05 + .004, v.co.z * 1.06 * r * 1.04))
        bm.to_mesh(me); bm.free()
        o = _obj(n + '_coque', me, J['head'], cheveux, 2); o.location = hc
        so = o.modifiers.new('ep', 'SOLIDIFY'); so.thickness = .012; so.offset = 1
        o.modifiers.move(1, 0)
        R = r / .165
        if c == 'courts':                 # mèches ondulées sur le dessus
            for i, (x, y, z, rr, rx) in enumerate([(-.04, -.1, .135, .075, -25), (.045, -.085, .14, .07, -15), (0, -.03, .16, .08, 0), (-.06, .04, .14, .07, 10), (.06, .04, .14, .07, 10)]):
                s = sphere(f'{n}_meche{i}', rr * R, hc + Vector((x * R, y * R, z * R)), (1.15, 1.25, .55), J['head'], cheveux); s.rotation_euler = (math.radians(rx), 0, 0)
        if c == 'court_gris':
            sphere(f'{n}_dessus', .1 * R, hc + Vector((0, -.02 * R, .135 * R)), (1.3, 1.45, .45), J['head'], cheveux)
        if c == 'chignon':
            import random; rnd = random.Random(3)
            bun = hc + Vector((0, .04, r * 1.12))
            sphere(f'{n}_chignon', r * .48, bun, (1, 1, .85), J['head'], cheveux)
            for i in range(30):          # boucles naturelles
                a, bb = rnd.uniform(0, 2 * math.pi), rnd.uniform(-.25, 1.1)
                d = Vector((math.cos(a) * math.cos(bb), math.sin(a) * math.cos(bb), math.sin(bb))) * r * .46
                sphere(f'{n}_boucle{i}', r * rnd.uniform(.13, .19), bun + d, parent=J['head'], m=cheveux, seg=12)
            if f.get('boucles'):
                for s in (-1, 1):
                    sphere(f'{n}_bo{s}', .012, hc + Vector((s * r * .95, -.005, -r * .32)), parent=J['head'], m=mat('or', '#d4a640', rough=.2, metal=1), seg=12)
        if c == 'carre':
            sphere(f'{n}_frange', .09 * R, hc + Vector((0, -.11 * R, .1 * R)), (1.35, .55, .55), J['head'], cheveux).rotation_euler = (math.radians(-30), 0, 0)
        if c == 'queue':
            q = capsule(f'{n}_queue', r * .2, r * 1.3, hc + Vector((0, r * 1.02, r * .15)), J['head'], cheveux); q.rotation_euler = (math.radians(-22), 0, 0)
            sphere(f'{n}_elastique', r * .2, hc + Vector((0, r * .98, r * .18)), (1, .6, 1), J['head'], mat('elastique', '#c0392b', rough=.5))
        if f.get('barbe'):                # barbe courte qui suit la mâchoire
            me = bpy.data.meshes.new(n + '_barbe'); bm = bmesh.new()
            bmesh.ops.create_uvsphere(bm, u_segments=72, v_segments=36, radius=1)
            bmesh.ops.delete(bm, geom=[v for v in bm.verts if not (v.co.z < -.74 + .42 * abs(v.co.x) and v.co.y < .05)], context='VERTS')
            for v in bm.verts: v.co = Vector((v.co.x * .92 * r * 1.03, v.co.y * .97 * r * 1.03, v.co.z * 1.06 * r * 1.02))
            bm.to_mesh(me); bm.free()
            o = _obj(n + '_barbe', me, J['head'], mat(f'{self.ident}_barbe', f.get('barbe_c', f['cheveux']), rough=.95), 2); o.location = hc
            so = o.modifiers.new('ep', 'SOLIDIFY'); so.thickness = .008; so.offset = 1; o.modifiers.move(1, 0)
        if f.get('moustache'):
            m = capsule(f'{n}_moustache', .013, r * .5, hc + Vector((-r * .25, -r * .98, -r * .36)), J['head'], cheveux, down=False); m.rotation_euler = (0, math.radians(90), 0)
        if f.get('lunettes'):
            mon = mat('monture', '#111114', rough=.3)
            for s in (-1, 1):
                me = bpy.data.meshes.new('l'); bm = bmesh.new()
                bmesh.ops.create_circle(bm, segments=24, radius=r * .27)
                bm.to_mesh(me); bm.free()
                o = bpy.data.objects.new(f'{n}_verre{s}', me); bpy.context.collection.objects.link(o); o.parent = J['head']
                o.location = hc + Vector((s * r * .37, -r * 1.02, r * .08)); o.rotation_euler = (math.radians(90), 0, 0)
                o.modifiers.new('sk', 'SKIN')
                for v in me.skin_vertices[0].data: v.radius = (.0055, .0055)
                o.modifiers.new('sub', 'SUBSURF').render_levels = 1; o.data.materials.append(mon)
                b2 = capsule(f'{n}_branche{s}', .005, r * .95, hc + Vector((s * r * .63, -r * .97, r * .1)), J['head'], mon, down=False); b2.rotation_euler = (math.radians(-90), 0, 0)
            p = capsule(f'{n}_pont', .005, r * .2, hc + Vector((-r * .1, -r * 1.04, r * .12)), J['head'], mon, down=False); p.rotation_euler = (0, math.radians(90), 0)

    # ------------------------------------------------------------ pose
    def pose_neutre(self):
        self.pose = {k: [0., 0., 0.] for k in ARTIC}
        self.pose['elL'] = [-6, 0, 0]; self.pose['elR'] = [-6, 0, 0]

    def appliquer(self, loc, heading, pose, expr):
        """loc (x, y) ou (x, y, z) ; heading en degrés (0 = regarde -Y) ; pose : {art: (x,y,z)} en axes du monde au repos ;
        '_z' hauteur du bassin, '_dy' décalage avant/arrière du bassin ; expr : dict d'expression"""
        arm = self.arm
        arm.location = (loc[0], loc[1], loc[2] if len(loc) > 2 else 0); arm.rotation_euler = (0, 0, math.radians(heading))
        def q(b, v):
            R = self.rest[b]; Rw = Euler([math.radians(a) for a in v], 'XYZ').to_matrix()
            return (R.inverted() @ Rw @ R).to_quaternion()
        for k in ARTIC:
            v = pose.get(k, (0, 0, 0))
            if k == 'spine':
                h = [a / 2 for a in v]; arm.pose.bones['spine'].rotation_quaternion = q('spine', h); arm.pose.bones['chest'].rotation_quaternion = q('chest', h)
            else:
                arm.pose.bones[k].rotation_quaternion = q(k, v)
        d = Vector((0, pose.get('_dy', 0), pose.get('_z', self.hipz) - self.hipz))
        arm.pose.bones['pelvis'].location = self.rest['pelvis'].inverted() @ d
        bl = expr.get('blink', 0); ouv = expr.get('ouv', -48)
        for lid in self.lids: lid.rotation_euler = (math.radians(ouv + (98 - ouv) * bl), 0, 0)
        gx, gz = expr.get('regard', (0, 0))
        for ir in self.irises: ir.rotation_euler = (math.radians(gz), 0, math.radians(gx))
        sb, inq = expr.get('sourcils', 0), expr.get('inquiet', 0)
        for bv, s, bz in self.brows:
            bv.location.z = bz + .012 * sb + .006 * inq
            bv.rotation_euler = (0, math.radians(s * 14 * inq - s * 8 * expr.get('fronce', 0)), 0)
        kb = self.mouth.data.shape_keys.key_blocks
        kb['sourire'].value = max(0, expr.get('sourire', 0)); kb['inquiet'].value = max(0, -expr.get('sourire', 0))
        p = expr.get('parle', 0)
        self.mouth_open.scale = (1.3 - .3 * p, .5, .1 + 1.0 * p)
        if self.brassard: self.brassard.hide_render = not expr.get('brassard', False)

    def monde(self, b, offset=(0, 0, 0)):
        """position monde d'un point attaché à un os (après mise à jour de la scène) : bout de l'os + décalage dans le repère de l'os"""
        pb = self.arm.pose.bones[b]
        return self.arm.matrix_world @ pb.matrix @ Matrix.Translation((0, pb.length, 0)) @ Vector(offset)

    def matrice(self, b):
        pb = self.arm.pose.bones[b]
        return self.arm.matrix_world @ pb.matrix @ Matrix.Translation((0, pb.length, 0)) @ (self.arm.data.bones[b].matrix_local @ Matrix.Translation((0, pb.length, 0))).inverted()
