#!/usr/bin/env python3
"""Search and download free CC0 assets from Poly Haven (HDRIs, textures, models).
Usage:  python3 tools/polyhaven.py search hdris studio      -> lists matching asset ids
        python3 tools/polyhaven.py get <asset_id> [res=2k]   -> downloads the HDRI to assets/hdri/<id>_<res>.hdr
All Poly Haven assets are CC0 (no attribution required)."""
import sys,json,urllib.request,os
UA={"User-Agent":"video-pipeline/1.0"}
get=lambda u:json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=60))
if sys.argv[1]=='search':
    t,q=sys.argv[2],sys.argv[3].lower() if len(sys.argv)>3 else ''
    d=get(f"https://api.polyhaven.com/assets?t={t}")
    hits=[(k,v) for k,v in d.items() if q in k.lower() or any(q in c.lower() for c in v.get('categories',[])+v.get('tags',[]))]
    for k,v in sorted(hits,key=lambda kv:-kv[1].get('download_count',0))[:20]:print(k,'|',', '.join(v.get('categories',[])[:4]))
elif sys.argv[1]=='get':
    aid=sys.argv[2];res=sys.argv[3] if len(sys.argv)>3 else '2k'
    f=get(f"https://api.polyhaven.com/files/{aid}")
    url=f['hdri'][res]['hdr']['url'];out=os.path.join(os.path.dirname(__file__),'..','assets','hdri',f'{aid}_{res}.hdr')
    open(out,'wb').write(urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=120).read());print('saved',out)
