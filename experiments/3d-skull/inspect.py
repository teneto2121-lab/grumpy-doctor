import bpy,sys
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="model/skull.glb")
for o in bpy.context.scene.objects:
    if o.type=='MESH':print('MESH',o.name,'verts',len(o.data.vertices),'dims',tuple(round(d,3) for d in o.dimensions),'loc',tuple(round(v,3) for v in o.location),'rot',tuple(round(v,3) for v in o.rotation_euler))
