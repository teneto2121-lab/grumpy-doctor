#!/usr/bin/env python3
"""Make a music bed with the ElevenLabs music API.

Usage:  python3 tools/music.py <out.mp3> <seconds> "<prompt>"
Needs ELEVENLABS_API_KEY. Keep prompts steady (no big swells, no vocals) so the bed can sit under the voice.
"""
import json, os, sys, urllib.request

out, secs, prompt = sys.argv[1], float(sys.argv[2]), sys.argv[3]
req = urllib.request.Request(
    "https://api.elevenlabs.io/v1/music",
    data=json.dumps({"prompt": prompt, "music_length_ms": int(secs * 1000), "force_instrumental": True}).encode(),
    headers={"Content-Type": "application/json", "xi-api-key": os.environ["ELEVENLABS_API_KEY"]})
open(out, "wb").write(urllib.request.urlopen(req, timeout=300).read())
print("wrote", out)
