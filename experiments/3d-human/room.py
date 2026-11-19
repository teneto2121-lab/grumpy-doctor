# ep23 shots: one 3D person (MPFB, CC0) in a bedroom. Furniture: Poly Haven (CC0).
# Run: GPU=1 Blender -b --python room.py -- <MODE> still <frames> [res%]   |   -- <MODE> frames x [res%]
# MODEs: bed_phone bed_sleep desk_day desk_tired desk_nod desk_stare wide_shadow
import bpy, os, sys, math, random
from mathutils import Vector, Euler
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
MOD = os.path.join(HERE, '..', '..', 'assets', 'models')
A = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
MODE = A[0] if A else 'desk_day'; ACT = A[1] if len(A) > 1 else 'still'; RES = int(A[3]) if len(A) > 3 else 100
R = math.radians
bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'human.blend'))
sc = bpy.context.scene; FPS = 30; sc.render.fps = FPS
SEC = {'bed_phone': 7, 'bed_sleep': 6, 'desk_day': 4, 'desk_tired': 5, 'desk_nod': 7, 'desk_stare': 8, 'wide_shadow': 4, 'xray': 6}[MODE]
sc.frame_start, sc.frame_end = 1, FPS * SEC
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1080, 1920, RES
sc.render.engine = 'BLENDER_EEVEE'
ee = sc.eevee
for k, v in [('taa_render_samples', 32), ('use_raytracing', True), ('use_shadows', True), ('use_volumetric_shadows', True)]:
    try: setattr(ee, k, v)
    except Exception: pass
try: ee.ray_tracing_options.resolution_scale = '1'
except Exception: pass
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
arm = bpy.data.objects['you']; body = bpy.data.objects['you.body']
shirt = bpy.data.objects.get('you.male_casualsuit06')
if shirt:
    for ms in shirt.material_slots:
        nt = ms.material.node_tree
        for n in nt.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                for l in list(n.inputs['Base Color'].links): nt.links.remove(l)
                n.inputs['Base Color'].default_value = (0.05, 0.055, 0.065, 1); n.inputs['Roughness'].default_value = 0.85
for o in arm.children_recursive:
    for m in o.modifiers:
        if m.type == 'SUBSURF': m.render_levels = 1

# ---------- materials ----------
def mat(name, col, rough=0.6, emit=None, strength=0, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = strength
    return m
def box(name, size, loc, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.active_object; o.name = name
    o.scale = size; bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); o.data.materials.append(m)
    bv = o.modifiers.new('bv', 'BEVEL'); bv.width = min(0.01, min(size) * 0.3); bv.segments = 2
    return o
def load(name, loc, rot=0, scale=1.0):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(MOD, name, name + '_1k.gltf'))
    new = [o for o in bpy.data.objects if o not in before]
    root = bpy.data.objects.new(name + '_root', None); sc.collection.objects.link(root)
    for o in new:
        if o.parent is None: o.parent = root
    root.location = loc; root.rotation_euler = (0, 0, R(rot)); root.scale = (scale,) * 3
    return root
def area(name, loc, target, energy, col, size, shape='DISK'):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = energy; l.color = col; l.shape = shape; l.size = size
    o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return o
def spot(name, loc, target, energy, col, angle=60, blend=0.6, radius=0.05):
    l = bpy.data.lights.new(name, 'SPOT'); l.energy = energy; l.color = col; l.spot_size = R(angle); l.spot_blend = blend; l.shadow_soft_size = radius
    o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return o

NIGHT = MODE not in ('desk_day',)
wall_m = mat('wall', (0.55, 0.56, 0.6) if not NIGHT else (0.42, 0.44, 0.5), 0.9)
floor_m = mat('floor', (0.32, 0.2, 0.12), 0.45)
dark_m = mat('dark', (0.01, 0.01, 0.012), 0.9)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']
bg.inputs[0].default_value = (0.02, 0.025, 0.05, 1) if NIGHT else (0.6, 0.7, 0.85, 1); bg.inputs[1].default_value = 0.15 if NIGHT else 0.6

# ---------- room shell (person faces -Y; back wall behind him at +Y) ----------
box('floor', (7, 7, 0.05), (0, 0, -0.025), floor_m)
box('back_l', (2.6, 0.1, 2.7), (-1.05, 2.0, 1.35), wall_m); box('back_r', (1.6, 0.1, 2.7), (2.55, 2.0, 1.35), wall_m)
box('back_top', (1.0, 0.1, 0.6), (1.25, 2.0, 2.4), wall_m)       # doorway gap x 0.75..1.75, height 2.1
box('door_frame_l', (0.06, 0.14, 2.1), (0.72, 2.0, 1.05), mat('trim', (0.8, 0.8, 0.78), 0.5)); box('door_frame_r', (0.06, 0.14, 2.1), (1.78, 2.0, 1.05), bpy.data.materials['trim'])
box('hall_back', (1.6, 0.1, 2.7), (1.25, 3.4, 1.35), wall_m); box('hall_l', (0.1, 1.4, 2.7), (0.7, 2.7, 1.35), wall_m); box('hall_r', (0.1, 1.4, 2.7), (1.8, 2.7, 1.35), wall_m)
box('left_wall', (0.1, 6, 2.7), (-2.4, -1, 1.35), wall_m); box('right_wall', (0.1, 6, 2.7), (3.3, -1, 1.35), wall_m)
box('ceiling', (7, 7, 0.05), (0, 0, 2.72), wall_m)
# window on left wall (moonlight / daylight)
win_m = mat('win', (0, 0, 0), 1, emit=(0.55, 0.7, 1.0) if NIGHT else (1.0, 0.97, 0.9), strength=1.2 if NIGHT else 8)
box('window', (0.02, 1.2, 1.1), (-2.34, 0.6, 1.5), win_m)
for dz in (-0.55, 0, 0.55): box(f'wbar{dz}', (0.04, 1.26, 0.04), (-2.32, 0.6, 1.5 + dz), bpy.data.materials['trim'])
for dy in (-0.6, 0, 0.6): box(f'wbarv{dy}', (0.04, 0.04, 1.14), (-2.32, 0.6 + dy, 1.5), bpy.data.materials['trim'])
load('wooden_bookshelf_worn', (-1.4, 1.65, 0), 180, 1.0)
load('potted_plant_02', (2.6, 1.5, 0), 0, 1.0)
load('old_bed_frame', (-1.6, -0.2, 0), 0, 1.0)
box('pillow2', (0.0001,)*3, (0,0,-5), wall_m)
box('mattress', (0.86, 1.92, 0.22), (-1.6, -0.2, 0.42), mat('sheet', (0.75, 0.78, 0.85), 0.85))
box('duvet', (0.92, 1.3, 0.12), (-1.6, -0.55, 0.56), mat('duvet', (0.18, 0.24, 0.38), 0.95))
pl = box('pillow', (0.62, 0.4, 0.14), (-1.6, 0.6, 0.6), mat('pillowm', (0.85, 0.86, 0.9), 0.9)); pl.modifiers['bv'].width = 0.06; pl.modifiers['bv'].segments = 5

def pose(d):
    pb = arm.pose.bones
    for n, (x, y, z) in d.items():
        b = pb[n]; b.rotation_mode = 'XYZ'; b.rotation_euler = (R(x), R(y), R(z))
def fingers(curl=22):
    pb = arm.pose.bones
    for b in pb:
        if b.name.startswith('finger') and not b.name.startswith('finger1'):
            b.rotation_mode = 'XYZ'; b.rotation_euler = (R(curl), 0, 0)
def key(d, f):
    pose(d)
    for n in d: arm.pose.bones[n].keyframe_insert('rotation_euler', frame=f)
def lids(a, f=None):   # a: 0 open .. 1 closed
    d = {'orbicularis03.L': (-32 * a, 0, 0), 'orbicularis03.R': (-32 * a, 0, 0), 'orbicularis04.L': (8 * a, 0, 0), 'orbicularis04.R': (8 * a, 0, 0)}
    key(d, f) if f else pose(d)

SIT = {'upperleg01.L': (-88, 0, 4), 'upperleg01.R': (-88, 0, -4), 'lowerleg01.L': (92, 0, 0), 'lowerleg01.R': (92, 0, 0),
       'upperarm01.L': (2, 0, -40), 'upperarm01.R': (2, 0, 40), 'lowerarm01.L': (68, 0, 8), 'lowerarm01.R': (68, 0, -8),
       'spine03': (6, 0, 0), 'neck01': (4, 0, 0), 'head': (2, 0, 0)}
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
tgt = bpy.data.objects.new('tgt', None); sc.collection.objects.link(tgt)
con = cam.constraints.new('TRACK_TO'); con.target = tgt; con.track_axis = 'TRACK_NEGATIVE_Z'; con.up_axis = 'UP_Y'
cam.data.dof.use_dof = True; cam.data.dof.focus_object = tgt; cam.data.dof.aperture_fstop = 2.0
def campath(p0, p1, t0, t1, lens=50):
    cam.data.lens = lens
    for f, p, t in [(1, p0, t0), (FPS * SEC, p1, t1)]:
        cam.location = p; cam.keyframe_insert('location', frame=f); tgt.location = t; tgt.keyframe_insert('location', frame=f)
    for fc in (cam.animation_data.action.fcurves if hasattr(cam.animation_data.action, 'fcurves') else []):
        for k in fc.keyframe_points: k.interpolation = 'SINE'

if MODE.startswith('desk') or MODE == 'wide_shadow':
    pose(SIT); bpy.context.view_layer.update()
    hip = arm.matrix_world @ arm.pose.bones['upperleg01.L'].head
    arm.location.z -= hip.z - 0.50
    desk = load('metal_office_desk', (0, -0.62, 0), 0, 1.0)
    lap = load('classic_laptop', (0.05, -0.6, 0.79), 180, 0.42)
    load('desk_lamp_arm_01', (-0.75, -0.75, 0.79), 40, 0.9)
    box('mug', (0.08, 0.08, 0.1), (0.55, -0.5, 0.84), mat('mug', (0.85, 0.3, 0.2), 0.4))
    scr = area('screen_glow', (0.05, -0.62, 1.0), (0, 0, 1.15), 18 if NIGHT else 4, (0.65, 0.78, 1.0), 0.3, 'RECTANGLE')
    if NIGHT:
        spot('lamp', (-0.62, -0.62, 1.25), (-0.1, -0.3, 0.8), 60, (1.0, 0.72, 0.45), 70, 0.8, 0.06)
        area('moon', (-2.2, 0.6, 1.6), (0, 0, 1.0), 40, (0.55, 0.68, 1.0), 1.0)
        area('rim', (0.8, 1.2, 1.8), (0, 0, 1.2), 25, (0.5, 0.6, 1.0), 0.6)
        hall = area('hall', (1.25, 3.2, 2.5), (1.25, 2.6, 0), 30, (1.0, 0.75, 0.5), 0.5)
    else:
        sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 3.5; sun.color = (1.0, 0.94, 0.85); so = bpy.data.objects.new('sun', sun); sc.collection.objects.link(so)
        so.rotation_euler = (R(60), R(0), R(-70))
        area('fill', (0.5, -2.0, 1.6), (0, 0, 1.15), 60, (1, 0.97, 0.94), 1.5)
    head = lambda: arm.matrix_world @ arm.pose.bones['head'].head
    bpy.context.view_layer.update(); H = head(); print('HEAD', tuple(round(v, 2) for v in H))
    face = H + Vector((0, -0.02, 0.08))
    if MODE == 'desk_day':
        lids(0); campath(face + Vector((0.3, -1.1, 0.12)), face + Vector((0.22, -0.85, 0.1)), face + Vector((0,0,-0.12)), face + Vector((0,0,-0.1)), 45)
        for f, a in [(1, 0), (40, 0), (43, 1), (47, 0), (95, 0), (98, 1), (102, 0)]: lids(a, f)
        for f, hy in [(1, -6), (60, 4), (120, -3)]: key({'neck01': (4, hy, 0), 'head': (2, hy * .5, 0)}, f)
    elif MODE == 'desk_tired':
        TIRED = dict(SIT); TIRED.update({'spine03': (8, 0, 0), 'neck01': (3, 0, -8), 'head': (-2, 0, -12)})
        pose(TIRED); lids(0.45)
        campath(face + Vector((0.38, -0.8, -0.1)), face + Vector((0.28, -0.62, -0.1)), face + Vector((0,0,-0.03)), face + Vector((0,0,-0.03)), 50)
        for f, a in [(1, .45), (60, .55), (66, .9), (75, .5), (150, .5)]: lids(a, f)
    elif MODE in ('desk_nod', 'desk_stare'):
        lids(0.3)
        if MODE == 'desk_nod':
            campath(face + Vector((0.25, -0.75, -0.02)), face + Vector((0.18, -0.6, -0.04)), face, face + Vector((0, 0, -0.05)), 60)
            seq = [(1, 4, 2, .35), (25, 8, 4, .7), (45, 30, 14, 1), (70, 34, 16, 1), (74, 0, -4, 0), (80, 4, 2, .1), (120, 8, 4, .6), (140, 28, 12, 1), (170, 32, 15, 1), (174, 0, -4, 0), (210, 4, 2, .2)]
            for f, n, h, l in seq: key({'neck01': (n, 0, 0), 'head': (h, 0, 0)}, f); lids(l, f)
        else:
            campath(face + Vector((0.0, -0.62, 0.0)), face + Vector((0.0, -0.48, 0.0)), face, face, 70)
            for f, a in [(1, .3), (90, .3), (96, 1), (102, .35), (200, .35), (206, 1), (212, .35)]: lids(a, f)
    elif MODE == 'wide_shadow':
        lids(0.3)
        campath(Vector((0.9, -2.4, 1.3)), Vector((0.75, -2.0, 1.28)), Vector((0.6, 1.0, 1.1)), Vector((0.75, 1.6, 1.1)), 30)
        cam.data.dof.aperture_fstop = 4
        # the shadow figure in the doorway: a second human, pure black
        import human_lib
        fig, farm = human_lib.make_human(name='shadow', hair='', clothes=(), phen={'height': 0.85, 'weight': 0.3})
        black = mat('void', (0, 0, 0), 1.0)
        for o in farm.children_recursive:
            if o.type == 'MESH': o.data.materials.clear(); o.data.materials.append(black)
        farm.location = (1.25, 2.55, 0); fp = farm.pose.bones
        for n, r in {'upperarm01.L': (0, 0, -38), 'upperarm01.R': (0, 0, 38), 'head': (8, 0, 6)}.items(): fp[n].rotation_mode = 'XYZ'; fp[n].rotation_euler = [R(v) for v in r]
        bpy.data.objects['hall'].data.energy = 80
elif MODE == 'xray':
    keep = set([arm] + list(arm.children_recursive))
    for o in sc.objects:
        if o not in keep and o.type != 'CAMERA': o.hide_render = True
    for o in arm.children_recursive:
        if o.type == 'MESH' and o.name != 'you.body' and 'high-poly' not in o.name: o.hide_render = True
    bg.inputs[0].default_value = (0.0, 0.004, 0.012, 1); bg.inputs[1].default_value = 1
    xm = bpy.data.materials.new('xray'); xm.use_nodes = True; nt = xm.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); lw = nt.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.35
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (0.35, 0.75, 1.0, 1); em.inputs['Strength'].default_value = 2.5
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); mx = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(lw.outputs['Facing'], mx.inputs[0]); nt.links.new(tr.outputs[0], mx.inputs[1]); nt.links.new(em.outputs[0], mx.inputs[2]); nt.links.new(mx.outputs[0], out.inputs[0])
    try: xm.surface_render_method = 'DITHERED'
    except Exception: pass
    body.data.materials.clear(); body.data.materials.append(xm)
    for o in arm.children_recursive:
        if 'high-poly' in o.name: o.data.materials.clear(); o.data.materials.append(xm)
    bpy.context.view_layer.update(); H = arm.matrix_world @ arm.pose.bones['head'].head
    import json
    OBJ = os.path.join(HERE, '..', '..', 'assets/anatomy/dl/partof_BP3D_4.0_obj_99'); ORG = json.load(open(os.path.join(HERE, '..', '..', 'assets/anatomy/organs.json')))
    bobs = []
    for i in ORG['brain']:
        f = f'{OBJ}/{i}.obj'
        if os.path.exists(f): bpy.ops.wm.obj_import(filepath=f, forward_axis='Y', up_axis='Z'); bobs += list(bpy.context.selected_objects)
    bpy.ops.object.select_all(action='DESELECT')
    for o in bobs: o.select_set(True)
    bpy.context.view_layer.objects.active = bobs[0]; bpy.ops.object.join(); br = bpy.context.active_object
    for ms in br.material_slots: ms.material = None
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS'); print('BRAIN raw dims', tuple(round(v, 1) for v in br.dimensions))
    k = 0.150 / max(br.dimensions); br.scale = (k, k, k); bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); bpy.ops.object.shade_smooth()
    br.location = H + Vector((0, 0.012, 0.062)); br.data.materials.clear()
    bm = mat('brainm', (0.9, 0.45, 0.5), 0.35, emit=(1.0, 0.4, 0.5), strength=3); br.data.materials.append(bm)
    bn = bm.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
    for f, v in [(1, 3), (60, 2.6), (100, 0.6), (106, 2.0), (115, 0.4), (122, 1.4), (180, 0.3)]:
        bn.default_value = v; bn.keyframe_insert('default_value', frame=f)
    area('key', H + Vector((-0.6, -0.8, 0.5)), H, 20, (0.8, 0.9, 1), 0.5)
    face = H + Vector((0, -0.01, 0.08))
    cam.data.dof.use_dof = False
    campath(face + Vector((-0.4, -0.6, 0.12)), face + Vector((0.14, -0.62, 0.1)), face + Vector((0, 0, 0.03)), face + Vector((0, 0, 0.03)), 45)
else:   # bed
    arm.rotation_euler = (R(-90), 0, R(0)); arm.location = (-1.6, -1.08, 0.66)
    BED = {'upperarm01.L': (0, 0, -40), 'upperarm01.R': (0, 0, 40), 'neck01': (-10, 0, 0)}
    d = bpy.data.objects['duvet']; d.scale = (1.05, 1.25, 1.0); d.location = (-1.6, -0.45, 0.74); d.modifiers['bv'].width = 0.05; d.modifiers['bv'].segments = 5
    if MODE == 'bed_phone':
        BED.update({'upperarm01.R': (58, 0, 22), 'lowerarm01.R': (92, 0, -22), 'upperarm01.L': (0, 0, -45), 'lowerarm01.L': (20, 0, 0), 'neck01': (4, 0, 0), 'head': (10, 0, 0)})
        pose(BED); lids(0.15)
        bpy.context.view_layer.update()
        wr = arm.pose.bones['wrist.R']; ph = box('phone', (0.075, 0.155, 0.009), (0, 0, 0), mat('phoneb', (0.02, 0.02, 0.02), 0.3))
        scrn = box('phone_scr', (0.07, 0.148, 0.002), (0, 0, -0.0055), mat('phonescr', (0, 0, 0), 1, emit=(0.7, 0.82, 1.0), strength=6))
        scrn.parent = ph
        H = arm.matrix_world @ arm.pose.bones['head'].head
        hand = arm.matrix_world @ arm.pose.bones['wrist.R'].tail
        ph.location = hand + Vector((-0.04, 0.0, 0.03)); eye = H + Vector((0, 0.1, 0.08))
        ph.rotation_euler = (eye - ph.location).to_track_quat('-Z', 'Y').to_euler()
        print('HAND', tuple(round(v,2) for v in hand), 'HEADB', tuple(round(v,2) for v in H))
        area('phone_light', ph.location + Vector((0, 0, 0.02)), H + Vector((0, 0.1, 0.08)), 12, (0.62, 0.76, 1.0), 0.1, 'RECTANGLE')
        area('moon', (-2.2, 0.6, 1.8), (-1.6, 0, 0.6), 8, (0.5, 0.65, 1.0), 1.0); bg.inputs[1].default_value = 0.04
        face = H + Vector((0, 0.08, 0.06))
        campath(face + Vector((0.55, -0.45, 0.42)), face + Vector((0.42, -0.32, 0.32)), face + Vector((0.06, -0.12, 0.06)), face + Vector((0.05, -0.1, 0.05)), 40)
        for f, a in [(1, .15), (70, .15), (73, 1), (77, .15), (150, .2), (153, 1), (157, .2)]: lids(a, f)
    else:
        BED.update({'upperarm01.L': (0, 0, -42), 'upperarm01.R': (0, 0, 42), 'lowerarm01.L': (15, 0, 0), 'lowerarm01.R': (15, 0, 0), 'neck01': (-4, 0, 10), 'head': (0, 0, 12)})
        pose(BED); lids(1); bpy.data.objects['duvet'].hide_render = True
        bpy.context.view_layer.update(); H = arm.matrix_world @ arm.pose.bones['head'].head
        area('morning', (-2.2, 0.6, 1.8), (-1.6, 0, 0.6), 120, (1.0, 0.85, 0.65), 1.2)
        w.node_tree.nodes['Background'].inputs[1].default_value = 0.3
        face = H + Vector((0, 0.08, 0.06))
        campath(face + Vector((0.95, -0.85, 0.95)), face + Vector((0.75, -0.65, 0.75)), face + Vector((0, -0.2, 0)), face + Vector((0, -0.15, 0)), 45)
        for f, s in [(1, 0), (60, 1), (120, 0), (180, 1)]:
            key({'spine03': (-2 * s, 0, 0)}, f)

fingers()
sc.render.image_settings.file_format = 'PNG'
if os.environ.get('SAVE'): bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, f'{MODE}.blend'))
if ACT == 'still':
    for f in [int(x) for x in A[2].split(',')]:
        sc.frame_set(f); sc.render.filepath = os.path.join(HERE, f'st_{MODE}_{f:03d}.png'); bpy.ops.render.render(write_still=True)
elif ACT == 'frames':
    os.makedirs(os.path.join(HERE, 'frames', MODE), exist_ok=True)
    sc.render.filepath = os.path.join(HERE, 'frames', MODE, 'f'); bpy.ops.render.render(animation=True)
