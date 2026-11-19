# Build a realistic human with the installed MPFB extension (CC0 output). Import from Blender scripts.
import bpy, addon_utils
addon_utils.enable('bl_ext.user_default.mpfb', default_set=False)
from bl_ext.user_default.mpfb.services.humanservice import HumanService

def make_human(name='you', skin='young_caucasian_male/young_caucasian_male.mhmat', hair='short02/short02.mhclo',
               clothes=('male_casualsuit06/male_casualsuit06.mhclo',), phen=None, rig='default', subdiv=1):
    p = {"gender": 1.0, "age": 0.42, "muscle": 0.5, "weight": 0.45, "proportions": 0.6, "height": 0.55, "cupsize": 0.5, "firmness": 0.5,
         "race": {"asian": 0.0, "caucasian": 1.0, "african": 0.0}}
    if phen: p.update(phen)
    info = {"name": name, "phenotype": p, "rig": rig, "eyes": "high-poly/high-poly.mhclo", "eyebrows": "eyebrow001/eyebrow001.mhclo",
            "eyelashes": "eyelashes01/eyelashes01.mhclo", "teeth": "teeth_base/teeth_base.mhclo", "tongue": "tongue01/tongue01.mhclo",
            "hair": hair, "proxy": "", "clothes": list(clothes), "skin_mhmat": skin, "skin_material_type": "ENHANCED_SSS",
            "eyes_material_type": "PROCEDURAL_EYES", "clothes_material_type": "MAKESKIN", "targets": [], "expressions": [], "makeup": [],
            "alternative_materials": {}}
    st = HumanService.get_default_deserialization_settings(); st["subdiv_levels"] = subdiv
    body = HumanService.deserialize_from_dict(info, st)
    arm = body.parent if body.parent and body.parent.type == 'ARMATURE' else None
    return body, arm
