#!/usr/bin/env python3
"""Search / download Pixabay stock video (Pixabay Content License: free for commercial use, no attribution needed).

Usage:  python3 tools/pixabay.py search "man sneezing"
        python3 tools/pixabay.py get <video_id> [<video_id> ...]     -> assets/footage/px<ID>.webm (vertical 1080x1920, VP9)
Needs PIXABAY_API_KEY. Footage is converted to VP9 webm because the headless Chromium used for rendering can't decode H.264.
"""
import json, os, subprocess, sys, urllib.parse, urllib.request

KEY = os.environ["PIXABAY_API_KEY"]
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "assets", "footage")
UA = {"User-Agent": "Mozilla/5.0 (Macintosh) TikTokAnimTool/1.0"}


def api(**q):
    q["key"] = KEY
    req = urllib.request.Request("https://pixabay.com/api/videos/?" + urllib.parse.urlencode(q), headers=UA)
    return json.load(urllib.request.urlopen(req, timeout=60))


if sys.argv[1] == "search":
    for h in api(q=sys.argv[2], per_page=20, safesearch="true")["hits"]:
        v = h["videos"]["large"] if h["videos"]["large"]["url"] else h["videos"]["medium"]
        print(h["id"], f'{h["duration"]}s', f'{v["width"]}x{v["height"]}', h["tags"])
else:
    os.makedirs(OUT, exist_ok=True)
    for vid in sys.argv[2:]:
        h = api(id=vid)["hits"][0]
        v = h["videos"]["large"] if h["videos"]["large"]["url"] else h["videos"]["medium"]
        raw = os.path.join(OUT, f"px{vid}.src.mp4")
        req = urllib.request.Request(v["url"], headers=UA)
        open(raw, "wb").write(urllib.request.urlopen(req, timeout=300).read())
        out = os.path.join(OUT, f"px{vid}.webm")
        # centre-crop to 9:16 and scale to 1080x1920
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-an", "-vf",
                        "crop='min(iw,ih*9/16)':'min(ih,iw*16/9)',scale=1080:1920,fps=30",
                        "-c:v", "libvpx-vp9", "-b:v", "6M", "-deadline", "good", "-cpu-used", "4", "-row-mt", "1", out], check=True)
        os.remove(raw)
        print("wrote", out, f'({h["duration"]}s) tags: {h["tags"]}')
