"""Fiches de référence 3D : chaque personnage vu de face, de trois quarts et de profil (même modèle, trois instances).
Usage : <python avec bpy> fiches.py <personnage> [largeur] [échantillons]  → out/fiche_<personnage>.png"""
import sys, os, math
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, D)
import bpy
from mathutils import Vector
import perso3d as P

nom = sys.argv[1]; GROS = os.environ.get('GROS'); W = int(sys.argv[2]) if len(sys.argv) > 2 else 1920; S = int(sys.argv[3]) if len(sys.argv) > 3 else 64
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
# studio : sol + fond arrondi
fond = P.mat('studio', '#cfcac2', rough=.9)
bpy.ops.mesh.primitive_plane_add(size=30); bpy.context.object.data.materials.append(fond)
bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 6, 0), rotation=(math.radians(90), 0, 0)); bpy.context.object.data.materials.append(fond)
vues = [(-1.15, 0), (0, -38), (1.15, -90)]
for i, (x, h) in enumerate(vues):
    p = P.Perso(nom, f'_v{i}')
    expr = dict(sourire=.55, regard=(0, 0))
    pose = {k: list(v) for k, v in p.pose.items()}
    p.appliquer((x, 0), h, pose, expr)
# lumières
def lum(t, loc, e, size=2, rot=None, col=(1, 1, 1)):
    d = bpy.data.lights.new('l', t); d.energy = e; d.color = col
    if t == 'AREA': d.size = size
    o = bpy.data.objects.new('l', d); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, 1)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler() if rot is None else rot
lum('AREA', (-2.5, -4, 3.5), 900, 3, col=(1, .96, .9))
lum('AREA', (3, -3.5, 2), 350, 3, col=(.9, .95, 1))
lum('AREA', (0, 3, 3.5), 500, 2)
w = bpy.data.worlds.new('w'); w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (.6, .6, .62, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .4
sc.world = w
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 50; cam.location = (0, -6.2, 1.15); cam.rotation_euler = (math.radians(89), 0, 0)
if GROS: cam.data.lens = 85; cam.location = (-0.35, -2.2, 1.62); cam.rotation_euler = (math.radians(91), 0, math.radians(-10))
sc.render.engine = 'CYCLES'; sc.cycles.samples = S; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y = W, W * 9 // 16
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
os.makedirs(f'{D}/out', exist_ok=True); sc.render.filepath = f'{D}/out/fiche_{nom}{"_gros" if GROS else ""}.png'
bpy.ops.render.render(write_still=True); print('ok', sc.render.filepath)
