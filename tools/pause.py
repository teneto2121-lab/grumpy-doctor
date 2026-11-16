#!/usr/bin/env python3
"""Insert breathing pauses into an episode's voiceover without re-recording it.

Usage:  python3 tools/pause.py episodes/<folder> 5.85:0.8 6.5:0.5 ...
        (story time in seconds : pause length in seconds)
or      python3 tools/pause.py episodes/<folder>         (re-apply pauses.json)

- The first run keeps the untouched voice as voice_raw.wav / words_raw.json / env_raw.json / visemes_raw.json,
  so pauses can be changed and re-applied any number of times.
- Writes pauses.json (render.js passes it to the engine as window.PAUSES; the scene clock holds during each pause),
  and a new voice.wav / words.json / env.json / visemes.json shifted to video time.
Put pauses in silent gaps (e.g. just before a verdict word), never in the middle of a word.
"""
import json, os, shutil, struct, subprocess, sys

ep = sys.argv[1]
J = lambda n: os.path.join(ep, n)
for a, b in [("voice.wav", "voice_raw.wav"), ("words.json", "words_raw.json"), ("env.json", "env_raw.json"), ("visemes.json", "visemes_raw.json")]:
    if os.path.exists(J(a)) and not os.path.exists(J(b)): shutil.copy(J(a), J(b))

if len(sys.argv) > 2:
    pauses = sorted([float(x) for x in a.split(":")] for a in sys.argv[2:])
    json.dump(pauses, open(J("pauses.json"), "w"))
pauses = json.load(open(J("pauses.json"))) if os.path.exists(J("pauses.json")) else []


def to_video(s):
    off = 0
    for p, d in pauses:
        if s < p: break
        off += d
    return s + off


# audio: split the raw voice at each pause point and put silence in between
SR = 44100
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", J("voice_raw.wav"), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True).stdout
pcm = bytearray()
last = 0
for p, d in pauses:
    i = int(p * SR) * 2
    pcm += raw[last:i] + bytes(int(d * SR) * 2)
    last = i
pcm += raw[last:]
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", J("voice.wav")], input=bytes(pcm), check=True)

# timings -> video time
words = json.load(open(J("words_raw.json")))
json.dump([{**w, "s": to_video(w["s"]), "e": to_video(w["e"])} for w in words], open(J("words.json"), "w"))
if os.path.exists(J("visemes_raw.json")):
    vis = json.load(open(J("visemes_raw.json")))
    json.dump([[to_video(a), to_video(b), v] for a, b, v in vis], open(J("visemes.json"), "w"))
env = json.load(open(J("env_raw.json")))
FPS = 30
out, k = [], 0
for p, d in pauses:
    i = int(round(p * FPS))
    out += env[k:i] + [0.0] * int(round(d * FPS))
    k = i
out += env[k:]
json.dump(out, open(J("env.json"), "w"))
print(f"{len(pauses)} pauses, +{sum(d for _, d in pauses):.2f}s total")
