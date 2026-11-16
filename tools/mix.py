#!/usr/bin/env python3
"""Mix an episode's voice with its sound-effect cues.

Usage:  python3 tools/mix.py episodes/<folder>
Reads   voice.wav and sfx.json ([[seconds, "name", volume], ...], written by render.js from window.SFX)
Writes  mix.wav
"""
import json, os, subprocess, sys
import numpy as np
from scipy.io import wavfile

SR = 44100
ep = sys.argv[1]
root = os.path.join(os.path.dirname(__file__), "..")
lib = os.path.join(root, "engine", "sfx")

sr, voice = wavfile.read(os.path.join(ep, "voice.wav"))
assert sr == SR, sr
voice = voice.astype(np.float32) / 32768
if voice.ndim > 1: voice = voice.mean(axis=1)
mix = np.concatenate([voice, np.zeros(SR * 2, np.float32)])

cache = {}
for cue in json.load(open(os.path.join(ep, "sfx.json"))):
    at, name = cue[0], cue[1]
    vol = cue[2] if len(cue) > 2 else 1.0
    if name not in cache:
        _, s = wavfile.read(os.path.join(lib, name + ".wav")); cache[name] = s.astype(np.float32) / 32768
    s = cache[name] * 0.45 * vol          # effects sit under the voice
    i = int(at * SR); mix[i:i + len(s)] += s[:len(mix) - i]

peak = np.max(np.abs(mix))
if peak > 0.98: mix *= 0.98 / peak
wavfile.write(os.path.join(ep, "mix.wav"), SR, (mix * 32767).astype(np.int16))
print("mixed", len(json.load(open(os.path.join(ep, "sfx.json")))), "cues")
