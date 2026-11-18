# 3D shot: saliva boiling on a tongue in a vacuum (BodyParts3D tongue, CC BY-SA 2.1 JP).
# Run: GPU=1 Blender -b --python tongue3d.py -- still 1,90,170 <samples> <res%>   or   -- frames x <samples> <res%>
import bpy, math, sys, json, os, random
from mathutils import Vector
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
A = dict(enumerate(args))
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..', '..')
OBJ = os.path.join(ROOT, 'assets/anatomy/dl/partof_BP3D_4.0_obj_99')
ORG = json.load(open(os.path.join(ROOT, 'assets/anatomy/organs.json')))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
FPS, SEC = 30, 6; sc.render.fps = FPS; sc.frame_start = 1; sc.frame_end = FPS * SEC
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
if os.environ.get('GPU'):
    pr = bpy.context.preferences.addons['cycles'].preferences
    for kind in ('METAL', 'OPTIX', 'CUDA', 'HIP'):
        try:
            pr.compute_device_type = kind; pr.get_devices()
            if any(d.type == kind for d in pr.devices):
                for d in pr.devices: d.use = True
                sc.cycles.device = 'GPU'; print('Rendering on', kind); break
        except Exception: pass
sc.cycles.samples = int(A.get(2, 48)); sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'
sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.03; sc.cycles.max_bounces = 8
sc.render.resolution_x, sc.render.resolution_y = 1080, 1920; sc.render.resolution_percentage = int(A.get(3, 100))
sc.render.use_persistent_data = True
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']
bg.inputs[0].default_value = (0.008, 0.008, 0.016, 1); bg.inputs[1].default_value = 1

S = 0.01
ids = [i for i in ORG['tongue'] if os.path.exists(f'{OBJ}/{i}.obj')]
objs = []
for i in ids:
    bpy.ops.wm.obj_import(filepath=f'{OBJ}/{i}.obj', forward_axis='Y', up_axis='Z'); objs += list(bpy.context.selected_objects)
bpy.ops.object.select_all(action='DESELECT')
for o in objs: o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]
if len(objs) > 1: bpy.ops.object.join()
tg = bpy.context.active_object; tg.scale = (S, S, S); bpy.ops.object.transform_apply(scale=True)
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS'); tg.location = (0, 0, 0); bpy.ops.object.shade_smooth()
tg.modifiers.new('sub', 'SUBSURF').levels = 1
print('TONGUE dims', tuple(round(x, 3) for x in tg.dimensions))

# wet tongue: pink subsurface flesh, fine papillae bumps, glossy saliva coat
m = bpy.data.materials.new('tongue'); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
b.inputs['Roughness'].default_value = 0.45; b.inputs['Subsurface Weight'].default_value = 0.45; b.inputs['Subsurface Radius'].default_value = (1.0, 0.35, 0.25)
b.inputs['Coat Weight'].default_value = 0.9; b.inputs['Coat Roughness'].default_value = 0.12
tex = nt.nodes.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value = 160; tex.inputs['Detail'].default_value = 6
vor = nt.nodes.new('ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = 140
ramp = nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].color = (0.42, 0.06, 0.10, 1); ramp.color_ramp.elements[1].color = (0.80, 0.26, 0.32, 1)
nt.links.new(tex.outputs['Fac'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], b.inputs['Base Color'])
bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.6; bp.inputs['Distance'].default_value = 0.004
# midline groove: a soft valley along the tongue's centre line (object X = 0), darker and lower
tc = nt.nodes.new('ShaderNodeTexCoord'); sx = nt.nodes.new('ShaderNodeSeparateXYZ'); ab = nt.nodes.new('ShaderNodeMath'); ab.operation = 'ABSOLUTE'
dv = nt.nodes.new('ShaderNodeMath'); dv.operation = 'DIVIDE'; dv.inputs[1].default_value = max(tg.dimensions.x, tg.dimensions.y) * 0.07
mn = nt.nodes.new('ShaderNodeMath'); mn.operation = 'MINIMUM'; mn.inputs[1].default_value = 1.0
mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
nt.links.new(tc.outputs['Object'], sx.inputs['Vector']); nt.links.new(sx.outputs['X'], ab.inputs[0]); nt.links.new(ab.outputs[0], dv.inputs[0]); nt.links.new(dv.outputs[0], mn.inputs[0])
nt.links.new(vor.outputs['Distance'], mul.inputs[0]); nt.links.new(mn.outputs[0], mul.inputs[1]); nt.links.new(mul.outputs[0], bp.inputs['Height'])
dk = nt.nodes.new('ShaderNodeMix'); dk.data_type = 'RGBA'; dk.inputs['B'].default_value = (0.30, 0.03, 0.06, 1)
inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0; nt.links.new(mn.outputs[0], inv.inputs[1])
nt.links.new(inv.outputs[0], dk.inputs['Factor']); nt.links.new(ramp.outputs['Color'], dk.inputs['A']); nt.links.new(dk.outputs['Result'], b.inputs['Base Color'])
nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
tg.data.materials.clear(); tg.data.materials.append(m)

# saliva bubbles on the upper surface: spawn, swell, pop - faster and more of them as the shot goes on
dg = bpy.context.evaluated_depsgraph_get(); ev = tg.evaluated_get(dg); me = ev.to_mesh()
top = [tg.matrix_world @ v.co for v in me.vertices if (tg.matrix_world.to_3x3() @ v.normal).z > 0.55]
print('surface points', len(top))
glass = bpy.data.materials.new('saliva'); glass.use_nodes = True; gb = glass.node_tree.nodes['Principled BSDF']
gb.inputs['Base Color'].default_value = (1, 0.96, 0.97, 1); gb.inputs['Transmission Weight'].default_value = 1.0; gb.inputs['Roughness'].default_value = 0.03; gb.inputs['IOR'].default_value = 1.33
random.seed(11); D = max(tg.dimensions)
for i in range(260):
    p = random.choice(top); r = D * random.uniform(0.006, 0.022)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=16, ring_count=10, location=p); bb = bpy.context.active_object; bb.data.materials.append(glass); bpy.ops.object.shade_smooth()
    t = random.uniform(0, 1) ** 0.55 * SEC   # later = denser
    while t < SEC:
        life = random.uniform(0.35, 1.1) * (1 - 0.5 * t / SEC)
        f0, f1, f2 = int(t * FPS) + 1, int((t + life * .7) * FPS) + 1, int((t + life) * FPS) + 1
        for f, s in [(f0 - 1, 0), (f0, 0.15), (f1, 1.0), (f2, 1.25), (f2 + 1, 0)]:
            if 1 <= f <= FPS * SEC: bb.scale = (s, s, s); bb.keyframe_insert('scale', frame=f)
        bb.location = p + Vector((0, 0, r * 0.4)); bb.keyframe_insert('location', frame=max(1, f0 - 1))
        t += life + random.uniform(0.1, 1.2) * (1 - 0.7 * t / SEC); p = random.choice(top)
    if not bb.animation_data: bb.scale = (0, 0, 0)

C = Vector((0, 0, 0))
def area(name, loc, energy, col, size):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = energy; l.color = col; l.shape = 'DISK'; l.size = size
    o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.location = loc; o.rotation_euler = (C - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
k = D
area('key', (-1.2 * k, -1.4 * k, 1.6 * k), 120 * k * k, (1.0, 0.88, 0.76), 1.2 * k)
area('rim', (1.4 * k, 1.2 * k, 1.0 * k), 200 * k * k, (0.5, 0.7, 1.0), 0.8 * k)
area('top', (0, 0, 2.2 * k), 60 * k * k, (1, 1, 1), 1.5 * k)

cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 70; cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = 2.8
tgt = bpy.data.objects.new('tgt', None); sc.collection.objects.link(tgt); con = cam.constraints.new('TRACK_TO'); con.target = tgt
con.track_axis = 'TRACK_NEGATIVE_Z'; con.up_axis = 'UP_Y'; cam.data.dof.focus_object = tgt
for f, a, dist, h in [(1, -30, 2.1 * k, 1.1 * k), (FPS * SEC, -5, 1.3 * k, 0.75 * k)]:
    tgt.location = C + Vector((0, 0, tg.dimensions.z * 0.3)); tgt.keyframe_insert('location', frame=f)
    cam.location = C + Vector((math.sin(math.radians(a)) * dist, -math.cos(math.radians(a)) * dist, h)); cam.keyframe_insert('location', frame=f)

sc.render.image_settings.file_format = 'PNG'
if A.get(0) == 'still':
    for f in [int(x) for x in A[1].split(',')]:
        sc.frame_set(f); sc.render.filepath = os.path.join(HERE, f'still_tongue_{f:03d}.png'); bpy.ops.render.render(write_still=True)
elif A.get(0) == 'frames':
    sc.render.filepath = os.path.join(HERE, 'frames_tongue/f'); bpy.ops.render.render(animation=True)
