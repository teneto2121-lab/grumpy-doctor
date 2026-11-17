#!/usr/bin/env python3
"""Trim dead air from a finished voiceover (the opposite of pause.py).

Usage:  python3 tools/tighten.py episodes/<folder> [max_gap=0.45] [word_index:keep_gap ...]
Every silence between words longer than max_gap is shortened to max_gap (cut from the middle of the gap).
word_index:keep_gap keeps a longer gap BEFORE that word (e.g. a dramatic beat), e.g. 61:0.75
Leading silence is trimmed to 0.05s. Rewrites voice.wav, words.json, env.json, visemes.json in place.
Run it before pause.py (delete *_raw files first if they belong to an older recording).
"""
import json, os, subprocess, sys
ep = sys.argv[1]; J = lambda n: os.path.join(ep, n)
maxg = float(sys.argv[2]) if len(sys.argv) > 2 else .45
keep = {int(a.split(':')[0]): float(a.split(':')[1]) for a in sys.argv[3:]}
words = json.load(open(J("words.json")))
# find silences from the audio itself (word end times often swallow trailing silence)
import numpy as np
SR0 = 44100
_raw = subprocess.run(["ffmpeg", "-v", "error", "-i", J("voice.wav"), "-ac", "1", "-ar", str(SR0), "-f", "s16le", "-"], capture_output=True).stdout
x = np.frombuffer(_raw, np.int16).astype(np.float32) / 32768
HOP = 441; rms = np.sqrt(np.convolve(x[:len(x)//HOP*HOP].reshape(-1, HOP).__pow__(2).mean(1), np.ones(3)/3, 'same'))
quiet = 20 * np.log10(rms + 1e-9) < -42
cuts, i, n = [], 0, len(quiet)
while i < n:
    if quiet[i]:
        j = i
        while j < n and quiet[j]: j += 1
        a0, a1 = i * HOP / SR0, j * HOP / SR0
        if i == 0: m = .05
        else:
            nxt = min(range(len(words)), key=lambda k: abs(words[k]["s"] - a1))
            m = keep.get(nxt, maxg) if abs(words[nxt]["s"] - a1) < .4 else maxg
        if j < n and a1 - a0 > m + .02: cuts.append((a0 + (m / 2 if i else 0), a1 - a0 - m))
        i = j
    else: i += 1
def shift(t):
    off = 0
    for a, l in cuts:
        if t >= a + l: off += l
        elif t > a: off += t - a
    return t - off
SR = 44100
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", J("voice.wav"), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True).stdout
pcm, last = bytearray(), 0
for a, l in cuts:
    i = int(a * SR) * 2; pcm += raw[last:i]; last = int((a + l) * SR) * 2
pcm += raw[last:]
# 10 ms fades are unnecessary: cuts sit in silence
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", J("voice.wav")], input=bytes(pcm), check=True)
json.dump([{**w, "s": shift(w["s"]), "e": shift(w["e"])} for w in words], open(J("words.json"), "w"))
if os.path.exists(J("visemes.json")):
    json.dump([[shift(a), shift(b), v] for a, b, v in json.load(open(J("visemes.json")))], open(J("visemes.json"), "w"))
env = json.load(open(J("env.json"))); FPS = 30
drop = set()
for a, l in cuts: drop.update(range(int(round(a * FPS)), int(round((a + l) * FPS))))
json.dump([v for k, v in enumerate(env) if k not in drop], open(J("env.json"), "w"))
print(f"{len(cuts)} gaps trimmed, -{sum(l for _, l in cuts):.2f}s, now ends at {shift(words[-1]['e']):.2f}s")
