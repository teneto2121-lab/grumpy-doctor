import bpy, os
from mathutils import Vector
M = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'models')
bpy.ops.wm.read_factory_settings(use_empty=True)
for m in sorted(os.listdir(M)):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(M, m, m + '_1k.gltf'))
    obs = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
    pts = [o.matrix_world @ Vector(c) for o in obs for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    print('DIM', m, tuple(round(v, 2) for v in lo), tuple(round(v, 2) for v in hi))
    for o in list(bpy.data.objects): bpy.data.objects.remove(o)
