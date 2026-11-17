import bpy,math
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="model/skull.glb")
sk=[o for o in bpy.context.scene.objects if o.type=='MESH'][0]
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.device='CPU';sc.cycles.samples=4;sc.cycles.use_denoising=False;sc.world=bpy.data.worlds.new('w');sc.world.color=(0.6,0.6,0.6);sc.render.resolution_x=400;sc.render.resolution_y=400
cam=bpy.data.objects.new('cam',bpy.data.cameras.new('cam'));sc.collection.objects.link(cam);sc.camera=cam
import mathutils
for name,pos in [('negY',(0,-30,0)),('posY',(0,30,0)),('negX',(-30,0,0))]:
    cam.location=pos;d=mathutils.Vector((0,0,0))-cam.location;cam.rotation_euler=d.to_track_quat('-Z','Y').to_euler()
    sc.render.filepath=f'/tmp/claude-0/-home-user/ec23b1f8-4838-5b27-872d-ab2e6a8f816f/scratchpad/or_{name}.png';bpy.ops.render.render(write_still=True)
