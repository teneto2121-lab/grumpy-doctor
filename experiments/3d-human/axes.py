import bpy, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'human.blend'))
sc = bpy.context.scene; arm = bpy.data.objects['you']
sc.render.engine = 'BLENDER_WORKBENCH'; sc.render.resolution_x = sc.render.resolution_y = 360
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (4.2, 0, 1.0); cam.rotation_euler = (math.radians(90), 0, math.radians(90))
pb = arm.pose.bones
for b in pb: b.rotation_mode = 'XYZ'
tests = [('upperarm01.L', 0), ('lowerarm01.L', 0), ('upperleg01.L', 0), ('upperleg01.L', 2), ('lowerleg01.L', 0), ('spine03', 0), ('head', 0), ('upperarm01.L', 2)]
for i, (bn, ax) in enumerate(tests):
    for b in pb: b.rotation_euler = (0, 0, 0)
    r = [0, 0, 0]; r[ax] = math.radians(60); pb[bn].rotation_euler = r
    sc.render.filepath = os.path.join(HERE, f'ax_{i}.png'); bpy.ops.render.render(write_still=True)
