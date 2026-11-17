# 3D test shot: iron rod through a skull (Phineas Gage). Run: blender -b --python shot.py -- [frames|still N]
import bpy,math,sys,random
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene
FPS=30;SEC=8;sc.render.fps=FPS;sc.frame_start=1;sc.frame_end=FPS*SEC
sc.render.engine='CYCLES';sc.cycles.device='CPU';sc.cycles.samples=int(dict(enumerate(args)).get(2,40));sc.cycles.use_denoising=True;sc.cycles.denoiser='OPENIMAGEDENOISE'
sc.cycles.max_bounces=4;sc.cycles.use_adaptive_sampling=True;sc.cycles.adaptive_threshold=0.03;sc.render.use_persistent_data=True;sc.cycles.diffuse_bounces=2;sc.cycles.glossy_bounces=2;sc.cycles.transmission_bounces=2
sc.render.resolution_x=1080;sc.render.resolution_y=1920;sc.render.resolution_percentage=int(dict(enumerate(args)).get(3,100))
sc.render.use_motion_blur=True;sc.render.motion_blur_shutter=0.5
sc.view_settings.view_transform='AgX';sc.view_settings.look='AgX - Punchy'
# world: deep, dark gradient
w=bpy.data.worlds.new('w');sc.world=w;w.use_nodes=True;bg=w.node_tree.nodes['Background'];bg.inputs[0].default_value=(0.012,0.010,0.014,1);bg.inputs[1].default_value=1
# skull
bpy.ops.import_scene.gltf(filepath="model/skull.glb")
sk=[o for o in sc.objects if o.type=='MESH'][0]
bpy.context.view_layer.objects.active=sk;sk.select_set(True);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
bpy.context.view_layer.objects.active=sk;bpy.ops.object.shade_smooth()
mn=Vector((min(v.co.x for v in sk.data.vertices),min(v.co.y for v in sk.data.vertices),min(v.co.z for v in sk.data.vertices)))
mx=Vector((max(v.co.x for v in sk.data.vertices),max(v.co.y for v in sk.data.vertices),max(v.co.z for v in sk.data.vertices)))
C=(mn+mx)/2;D=mx-mn;print('BBOX',tuple(round(x,2) for x in mn),tuple(round(x,2) for x in mx))
bone=bpy.data.materials.new('bone');bone.use_nodes=True;b=bone.node_tree.nodes['Principled BSDF']
b.inputs['Base Color'].default_value=(0.78,0.70,0.58,1);b.inputs['Roughness'].default_value=0.55;b.inputs['Subsurface Weight'].default_value=0.08;b.inputs['Subsurface Radius'].default_value=(0.6,0.3,0.2)
nt=bone.node_tree;tex=nt.nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=18;tex.inputs['Detail'].default_value=8;bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=0.05
nt.links.new(tex.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],b.inputs['Normal'])
ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=0.35;ramp.color_ramp.elements[1].position=0.75;ramp.color_ramp.elements[0].color=(0.70,0.62,0.50,1);ramp.color_ramp.elements[1].color=(0.86,0.80,0.68,1);nt.links.new(tex.outputs['Fac'],ramp.inputs['Fac']);nt.links.new(ramp.outputs['Color'],b.inputs['Base Color'])
sk.data.materials.clear();sk.data.materials.append(bone)
# the rod: enters under the skull's LEFT cheekbone (+X side, front = -Y), exits the top
E=Vector((C.x+D.x*0.24,mn.y+D.y*0.18,mn.z+D.z*0.38))   # under the left cheekbone
X=Vector((C.x+D.x*0.06,mn.y+D.y*0.42,mx.z-D.z*0.02))   # top of the skull
dirv=(X-E).normalized();L=D.z*3.2;R=D.x*0.055
bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=R,depth=L);rod=bpy.context.active_object;rod.name='rod'
bpy.ops.object.shade_smooth()
iron=bpy.data.materials.new('iron');iron.use_nodes=True;ib=iron.node_tree.nodes['Principled BSDF'];ib.inputs['Base Color'].default_value=(0.10,0.10,0.11,1);ib.inputs['Metallic'].default_value=1;ib.inputs['Roughness'].default_value=0.38
rod.data.materials.append(iron)
rod.rotation_mode='QUATERNION';rod.rotation_quaternion=dirv.to_track_quat('Z','Y')
lodged=(E+X)/2+dirv*(L*0.18)                 # final resting position (sticks out below the jaw and above the head)
start=lodged-dirv*(L*1.1)                    # off-screen below
f_hit=int(FPS*2.0)
rod.location=start;rod.keyframe_insert('location',frame=1);rod.keyframe_insert('location',frame=f_hit-3)
rod.location=lodged;rod.keyframe_insert('location',frame=f_hit+3)
for fc in rod.animation_data.action.fcurves:
    for k in fc.keyframe_points:k.interpolation='LINEAR'
# bone chips flying out of the top at impact
random.seed(3)
chipmat=bone
for i in range(26):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=D.x*random.uniform(0.008,0.02),location=X);ch=bpy.context.active_object;ch.data.materials.append(chipmat)
    ch.scale=(1,random.uniform(.5,1.5),random.uniform(.4,1));ch.location=X;ch.keyframe_insert('location',frame=f_hit+1);ch.scale=(0,0,0);ch.keyframe_insert('scale',frame=f_hit)
    ch.scale=(1,1,1);ch.keyframe_insert('scale',frame=f_hit+1)
    v=(dirv*random.uniform(.6,1.4)+Vector((random.uniform(-.7,.7),random.uniform(-.7,.7),random.uniform(0,.5)))).normalized()*D.z*random.uniform(.6,1.4)
    for k in range(1,25):
        tt=k/FPS;ch.location=X+v*tt*2.2+Vector((0,0,-9.8*tt*tt*D.z*0.05));ch.rotation_euler=(k*.3,k*.5,k*.2);ch.keyframe_insert('location',frame=f_hit+1+k);ch.keyframe_insert('rotation_euler',frame=f_hit+1+k)
    ch.scale=(0,0,0);ch.keyframe_insert('scale',frame=f_hit+26)
# lights: warm key, cool rim, impact flash
def area(name,loc,energy,col,size):
    l=bpy.data.lights.new(name,'AREA');l.energy=energy;l.color=col;l.size=size;o=bpy.data.objects.new(name,l);sc.collection.objects.link(o);o.location=loc
    o.rotation_euler=(C-Vector(loc)).to_track_quat('-Z','Y').to_euler();return o
s=D.z
area('key',(C.x-s*1.1,C.y-s*1.3,C.z+s*0.9),2600*s*s/100,(1.0,0.82,0.62),s*0.9)
area('rim',(C.x+s*1.2,C.y+s*1.4,C.z+s*0.6),3800*s*s/100,(0.55,0.70,1.0),s*0.6)
area('fill',(C.x,C.y-s*1.8,C.z-s*0.6),250*s*s/100,(0.8,0.85,1.0),s*1.5)
fl=bpy.data.lights.new('flash','POINT');fl.color=(1,.55,.25);fo=bpy.data.objects.new('flash',fl);sc.collection.objects.link(fo);fo.location=X+Vector((0,-s*.3,s*.2))
for f,e in [(1,0),(f_hit-1,0),(f_hit+1,60000*s*s/100),(f_hit+10,0)]:fl.energy=e;fl.keyframe_insert('energy',frame=f)
# camera: slow push-in, then a slow 3/4 orbit after the hit
cam=bpy.data.objects.new('cam',bpy.data.cameras.new('cam'));sc.collection.objects.link(cam);sc.camera=cam;cam.data.lens=55;cam.data.dof.use_dof=True;cam.data.dof.aperture_fstop=5.6
tgt=bpy.data.objects.new('tgt',None);sc.collection.objects.link(tgt);tgt.location=C+Vector((0,0,s*0.05))
con=cam.constraints.new('TRACK_TO');con.target=tgt;con.track_axis='TRACK_NEGATIVE_Z';con.up_axis='UP_Y';cam.data.dof.focus_object=tgt
def campos(a,dist,h):return C+Vector((math.sin(a)*dist,-math.cos(a)*dist,h))
keys=[(1,campos(math.radians(20),s*3.4,s*.1)),(f_hit,campos(math.radians(28),s*2.9,s*.12)),(f_hit+8,campos(math.radians(30),s*2.7,s*.12)),(FPS*SEC,campos(math.radians(70),s*2.6,s*.25))]
for f,p in keys:cam.location=p;cam.keyframe_insert('location',frame=f)
# shake on impact
for f,dx in [(f_hit,0),(f_hit+1,.05),(f_hit+2,-.04),(f_hit+3,.03),(f_hit+4,-.015),(f_hit+6,0)]:
    tgt.location=C+Vector((dx*s,0,s*0.05+dx*s*.5));tgt.keyframe_insert('location',frame=f)
sc.render.image_settings.file_format='PNG';sc.render.filepath='//pframes/f';sc.frame_step=2
if args and args[0]=='still':
    for f in [int(a) for a in args[1].split(',')]:
        sc.frame_set(f);sc.render.filepath=f'//still_{f:03d}.png';bpy.ops.render.render(write_still=True)
elif args and args[0]=='frames':
    bpy.ops.render.render(animation=True)
