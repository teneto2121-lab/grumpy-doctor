import bpy, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'human.blend'))
sc = bpy.context.scene; arm = bpy.data.objects['you']; sc.render.engine = 'BLENDER_WORKBENCH'; sc.render.resolution_x = sc.render.resolution_y = 300
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 200
cam.location = (0, -3, 1.62); cam.rotation_euler = (math.radians(90), 0, 0)
pb = arm.pose.bones
for b in pb: b.rotation_mode = 'XYZ'
for i, (bn, ax, a) in enumerate([('orbicularis03', 0, 30), ('orbicularis03', 0, -30), ('orbicularis04', 0, 30), ('orbicularis04', 0, -30), ('jaw', 0, 15)]):
    for b in pb: b.rotation_euler = (0, 0, 0)
    for s in ('.L', '.R'):
        n = bn + s if bn + s in pb else bn
        r = [0, 0, 0]; r[ax] = math.radians(a); pb[n].rotation_euler = r
    sc.render.filepath = os.path.join(HERE, f'ld_{i}.png'); bpy.ops.render.render(write_still=True)
