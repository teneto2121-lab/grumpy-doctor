# 3D test shot: breathing lungs, trachea, heart and diaphragm (BodyParts3D, CC BY-SA 2.1 JP).
# Run: GPU=1 Blender -b --python shot.py -- still 1,60,120 <samples> <res%>    or   -- frames x <samples> <res%>
import bpy, math, sys, json, os, random
from mathutils import Vector
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
A = dict(enumerate(args))
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..', '..')
OBJ = os.path.join(ROOT, 'assets/anatomy/dl/partof_BP3D_4.0_obj_99')
ORG = json.load(open(os.path.join(ROOT, 'assets/anatomy/organs.json')))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
FPS, SEC = 30, 8; sc.render.fps = FPS; sc.frame_start = 1; sc.frame_end = FPS * SEC
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
sc.cycles.samples = int(A.get(2, 64)); sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'
sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.03; sc.cycles.max_bounces = 6
sc.render.resolution_x, sc.render.resolution_y = 1080, 1920; sc.render.resolution_percentage = int(A.get(3, 100))
sc.render.use_persistent_data = True
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'
# world: very dark blue with a faint gradient glow behind the subject
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']
bg.inputs[0].default_value = (0.006, 0.010, 0.020, 1); bg.inputs[1].default_value = 1

S = 0.01  # mm -> scene units (1 unit = 10 cm)
def load(name, parts=None):
    ids = [i for i in (parts or ORG[name]) if os.path.exists(f'{OBJ}/{i}.obj')]
    objs = []
    for i in ids:
        bpy.ops.wm.obj_import(filepath=f'{OBJ}/{i}.obj', forward_axis='Y', up_axis='Z')
        objs += list(bpy.context.selected_objects)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join(); ob = bpy.context.active_object; ob.name = name
    ob.scale = (S, S, S); bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS'); bpy.ops.object.shade_smooth()
    return ob

def tissue(name, base, sss=0.25, rough=0.42, bump=0.06, scale=40, coat=0.25, emit=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = rough; b.inputs['Subsurface Weight'].default_value = sss
    b.inputs['Subsurface Radius'].default_value = (1.0, 0.35, 0.25); b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = 0.25
    tex = nt.nodes.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value = scale; tex.inputs['Detail'].default_value = 10
    ramp = nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].position = 0.3; ramp.color_ramp.elements[1].position = 0.75
    ramp.color_ramp.elements[0].color = tuple(c * 0.72 for c in base[:3]) + (1,); ramp.color_ramp.elements[1].color = base
    nt.links.new(tex.outputs['Fac'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], b.inputs['Base Color'])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump; nt.links.new(tex.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    if emit: b.inputs['Emission Color'].default_value = emit; b.inputs['Emission Strength'].default_value = 0.4
    return m

lungs = [load('right lung'), load('left lung')]
trach = load('trachea'); heart = load('heart'); diaph = load('diaphragm')
mats = {'lung': tissue('lung', (0.86, 0.46, 0.52, 1), sss=0.35, rough=0.5, bump=0.08, scale=90),
        'trach': tissue('trach', (0.90, 0.62, 0.62, 1), sss=0.2, rough=0.35, scale=60),
        'heart': tissue('heart', (0.55, 0.06, 0.08, 1), sss=0.3, rough=0.3, coat=0.5),
        'diaph': tissue('diaph', (0.38, 0.08, 0.09, 1), sss=0.2, rough=0.45, bump=0.12, scale=25)}
tree_mat = tissue('airways', (1.0, 0.72, 0.74, 1), sss=0.3, rough=0.3, scale=60, emit=(1.0, 0.45, 0.5, 1))
for o in lungs: o.data.materials.clear(); o.data.materials.append(tree_mat)
shell_mat = bpy.data.materials.new('lungshell'); shell_mat.use_nodes = True; sb = shell_mat.node_tree.nodes['Principled BSDF']
sb.inputs['Base Color'].default_value = (0.85, 0.30, 0.40, 1); sb.inputs['Transmission Weight'].default_value = 0.6; sb.inputs['Roughness'].default_value = 0.32
sb.inputs['IOR'].default_value = 1.15; sb.inputs['Coat Weight'].default_value = 0.25; sb.inputs['Coat Roughness'].default_value = 0.35
fr = shell_mat.node_tree.nodes.new('ShaderNodeLayerWeight'); fr.inputs['Blend'].default_value = 0.35
mix = shell_mat.node_tree.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.inputs['A'].default_value = (0.78, 0.22, 0.32, 1); mix.inputs['B'].default_value = (1.0, 0.62, 0.70, 1)
shell_mat.node_tree.links.new(fr.outputs['Facing'], mix.inputs['Factor']); shell_mat.node_tree.links.new(mix.outputs['Result'], sb.inputs['Base Color'])
random.seed(7); shells = []
for o in lungs:
    vs = [o.matrix_world @ v.co for v in o.data.vertices]; pts = random.sample(vs, min(1600, len(vs)))
    mb = bpy.data.metaballs.new(o.name + '_mb'); mb.resolution = 0.05; mb.render_resolution = 0.04; mb.threshold = 0.6
    mo = bpy.data.objects.new(o.name + '_shell', mb); sc.collection.objects.link(mo)
    for p in pts: e = mb.elements.new(); e.co = p; e.radius = 0.42
    bpy.ops.object.select_all(action='DESELECT'); mo.select_set(True); bpy.context.view_layer.objects.active = mo
    bpy.ops.object.convert(target='MESH'); sh = bpy.context.active_object; bpy.ops.object.shade_smooth()
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS'); sm = sh.modifiers.new('sm', 'SMOOTH'); sm.factor = 1.0; sm.iterations = 40
    sh.data.materials.append(shell_mat); shells.append(sh)
    sh.modifiers.new('sub', 'SUBSURF').levels = 1
for o, k in ((trach, 'trach'), (heart, 'heart'), (diaph, 'diaph')): o.data.materials.clear(); o.data.materials.append(mats[k])

# breathing: lungs swell while the diaphragm drops (2 breaths in 8 s); heart beats ~72 bpm
for f in range(1, FPS * SEC + 1, 3):
    br = 0.5 - 0.5 * math.cos(2 * math.pi * (f / FPS) / 4.0)       # 0 exhaled .. 1 inhaled
    for o in lungs + shells: o.scale = (1 + .045 * br, 1 + .045 * br, 1 + .06 * br); o.keyframe_insert('scale', frame=f)
    diaph.location.z = diaph.location.z if f > 1 else diaph.location.z
for f in range(1, FPS * SEC + 1, 3):
    br = 0.5 - 0.5 * math.cos(2 * math.pi * (f / FPS) / 4.0)
    diaph.delta_location = (0, 0, -0.16 * br); diaph.keyframe_insert('delta_location', frame=f)
    hb = math.exp(-((((f / FPS) * 1.2) % 1) / 0.12) ** 2); heart.scale = (1 + .03 * hb,) * 3; heart.keyframe_insert('scale', frame=f)

# air particles: glowing specks pulled down the trachea into both lungs on each inhale
C = (lungs[0].location + lungs[1].location) / 2
top = trach.location + Vector((0, 0, trach.dimensions.z * 0.5)); fork = trach.location - Vector((0, 0, trach.dimensions.z * 0.5))
glow = bpy.data.materials.new('air'); glow.use_nodes = True; gb = glow.node_tree.nodes['Principled BSDF']
gb.inputs['Base Color'].default_value = (0.6, 0.9, 1, 1); gb.inputs['Emission Color'].default_value = (0.55, 0.85, 1, 1); gb.inputs['Emission Strength'].default_value = 25
random.seed(4)
for i in range(40):
    side = lungs[i % 2]; end = side.location + Vector((random.uniform(-.25, .25), random.uniform(-.2, .2), random.uniform(-.4, .3)))
    start_t = random.uniform(0, 4.0); path = [top - Vector((0, 0, .05)), top - Vector((0, 0, trach.dimensions.z * .5)), fork, end]
    bpy.ops.mesh.primitive_uv_sphere_add(radius=random.uniform(.012, .022), segments=12, ring_count=6); p = bpy.context.active_object; p.data.materials.append(glow)
    for rep in range(2):
        t0 = start_t + rep * 4.0
        for k in range(0, 31, 3):
            u = k / 30; seg = min(2, int(u * 3)); lu = u * 3 - seg
            p.location = path[seg].lerp(path[seg + 1], lu); f = int((t0 + u * 1.6) * FPS) + 1
            if 1 <= f <= FPS * SEC: p.keyframe_insert('location', frame=f)
        for f, s in [(int(t0 * FPS), 0), (int(t0 * FPS) + 2, 1), (int((t0 + 1.5) * FPS), 1), (int((t0 + 1.7) * FPS), 0)]:
            if 1 <= f <= FPS * SEC: p.scale = (s, s, s); p.keyframe_insert('scale', frame=f)

# lights: warm key, strong cool rim from behind, soft fill
def area(name, loc, energy, col, size):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = energy; l.color = col; l.shape = 'DISK'; l.size = size * 1.8
    o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (C - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return o
area('key', C + Vector((-2.2, -3.0, 2.0)), 900, (1.0, 0.86, 0.72), 2.5)
area('rim', C + Vector((2.5, 3.0, 1.5)), 1600, (0.45, 0.65, 1.0), 2.0)
area('rim2', C + Vector((-2.8, 2.6, 0.5)), 900, (0.55, 0.75, 1.0), 2.0)
area('fill', C + Vector((0.5, -3.5, -1.5)), 150, (0.8, 0.85, 1.0), 4)

# camera: starts close on the trachea, pulls back and orbits to reveal both lungs
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 50; cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = 4.0
tgt = bpy.data.objects.new('tgt', None); sc.collection.objects.link(tgt); con = cam.constraints.new('TRACK_TO'); con.target = tgt
con.track_axis = 'TRACK_NEGATIVE_Z'; con.up_axis = 'UP_Y'; cam.data.dof.focus_object = tgt
def campos(a, dist, h, c): return c + Vector((math.sin(a) * dist, -math.cos(a) * dist, h))
for f, a, dist, h, tz in [(1, -20, 3.6, 1.1, 1.05), (80, -12, 6.2, 0.9, 0.75), (FPS * SEC, 28, 6.8, 1.0, 0.7)]:
    c = C + Vector((0, 0, tz)); tgt.location = c; tgt.keyframe_insert('location', frame=f)
    cam.location = campos(math.radians(a), dist, h, c); cam.keyframe_insert('location', frame=f)

sc.render.image_settings.file_format = 'PNG'
if A.get(0) == 'still':
    for f in [int(x) for x in A[1].split(',')]:
        sc.frame_set(f); sc.render.filepath = os.path.join(HERE, f'still_{f:03d}.png'); bpy.ops.render.render(write_still=True)
elif A.get(0) == 'frames':
    sc.render.filepath = os.path.join(HERE, 'frames/f'); bpy.ops.render.render(animation=True)
