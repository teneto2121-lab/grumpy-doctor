import bpy, sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
bpy.ops.wm.read_factory_settings(use_empty=False)
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
from human_lib import make_human
body, arm = make_human()
print('BODY', body.name, tuple(round(x,3) for x in body.dimensions), 'ARM', arm and arm.name)
print('BONES', [b.name for b in arm.data.bones] if arm else None)
print('CHILDREN', [c.name for c in (arm or body).children_recursive])
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'human.blend'))
