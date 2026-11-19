#!/usr/bin/env python3
"""Make a steady, tense music bed with no samples: soft minor pad + clock tick + low pulse.
Usage: python3 tools/drone_bed.py <out.wav> <seconds> [bpm=60]"""
import sys, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter
SR = 44100; out, secs = sys.argv[1], float(sys.argv[2]); bpm = float(sys.argv[3]) if len(sys.argv) > 3 else 60
n = int(SR * secs); t = np.arange(n) / SR; rng = np.random.default_rng(3)
def note(f): return 440 * 2 ** ((f - 69) / 12)
chords = [[45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [43, 50, 55, 59, 62], [40, 47, 52, 55, 59]]   # Am F G Em
bar = 4 * 60 / bpm * 2; pad = np.zeros(n)
for i in range(int(secs / bar) + 1):
    a, b = int(i * bar * SR), min(n, int((i + 1) * bar * SR + SR))
    if a >= n: break
    tt = t[a:b] - t[a]; env = np.minimum(1, tt / 1.5) * np.minimum(1, (tt[-1] - tt + 1e-3) / 1.5)
    for m in chords[i % 4]:
        f = note(m)
        for det in (-0.12, 0.12):
            pad[a:b] += env * (np.sin(2 * np.pi * f * (1 + det / 100) * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) / 10
bl, al = butter(2, 900 / (SR / 2)); pad = lfilter(bl, al, pad)
tick = np.zeros(n); beat = 60 / bpm
for k in range(int(secs / beat) + 1):
    s = int(k * beat * SR); L = int(0.03 * SR)
    if s + L >= n: break
    click = rng.standard_normal(L) * np.exp(-np.arange(L) / (0.004 * SR)); bh, ah = butter(2, 2500 / (SR / 2), 'high')
    tick[s:s + L] += lfilter(bh, ah, click) * (0.5 if k % 2 else 0.35)
pulse = np.zeros(n)
for k in range(int(secs / (beat * 2)) + 1):
    s = int(k * beat * 2 * SR); L = int(0.25 * SR)
    if s + L >= n: break
    tt = np.arange(L) / SR; pulse[s:s + L] += np.sin(2 * np.pi * 55 * tt) * np.exp(-tt * 14)
mix = pad * 0.9 + tick * 0.25 + pulse * 0.35
mix *= np.minimum(1, t / 0.3) * np.minimum(1, (secs - t) / 1.0)
mix = mix / np.max(np.abs(mix)) * 0.8
wavfile.write(out, SR, np.stack([mix, mix], 1).astype(np.float32)); print('wrote', out)
