#!/usr/bin/env python3
"""Synthesize the channel's sound-effect library into engine/sfx/*.wav.

Everything is generated from math (no samples), so there are no licensing issues.
Run once:  python3 tools/make_sfx.py
"""
import os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "engine", "sfx")
rng = np.random.default_rng(7)


def t(d): return np.arange(int(SR * d)) / SR
def env(n, attack=0.002, decay=0.1):
    x = np.arange(n) / SR
    return np.minimum(1, x / max(attack, 1e-4)) * np.exp(-x / decay)
def bp(x, lo, hi): return sosfilt(butter(4, [lo, hi], "bandpass", fs=SR, output="sos"), x)
def lp(x, f): return sosfilt(butter(4, f, "lowpass", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(4, f, "highpass", fs=SR, output="sos"), x)
def sweep(f0, f1, d, curve=1.0):
    x = t(d); k = (x / d) ** curve
    return np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * k) / SR)
def place(buf, snd, at):
    i = int(at * SR); buf[i:i + len(snd)] += snd[:len(buf) - i]; return buf
def norm(x, peak=0.9): return x / (np.max(np.abs(x)) + 1e-9) * peak
def save(name, x, peak=0.9):
    os.makedirs(OUT, exist_ok=True)
    x = np.concatenate([x, np.zeros(int(SR * 0.02))])
    wavfile.write(os.path.join(OUT, name + ".wav"), SR, (norm(x, peak) * 32767).astype(np.int16))


# knuckle crack: a few sharp clicks + a low knock
def crack():
    b = np.zeros(int(SR * 0.25))
    for i, at in enumerate([0, 0.018, 0.041, 0.07]):
        n = int(SR * 0.03)
        click = bp(rng.standard_normal(n), 1500, 7000) * env(n, 0.0003, 0.004) * (1 - i * 0.18)
        place(b, click, at)
    knock = np.sin(2 * np.pi * 180 * t(0.08)) * env(int(SR * 0.08), 0.001, 0.02) * 0.6
    return place(b, knock, 0)

# bubble pop: quick rising blip + click
def pop():
    d = 0.09
    s = sweep(350, 1400, d, 0.6) * env(int(SR * d), 0.001, 0.035)
    c = hp(rng.standard_normal(int(SR * 0.01)), 3000) * env(int(SR * 0.01), 0.0002, 0.002) * 0.5
    return place(s, c, 0)

# small UI blip for labels popping in
def blip():
    d = 0.07
    return sweep(700, 1150, d, 0.5) * env(int(SR * d), 0.001, 0.025)

# bell ding
def ding(f=1320):
    d = 1.2; x = t(d); s = np.zeros_like(x)
    for ratio, amp, dec in [(1, 1, .6), (2.76, .5, .3), (5.4, .25, .15), (8.93, .12, .08)]:
        s += amp * np.sin(2 * np.pi * f * ratio * x) * np.exp(-x / dec)
    return s * np.minimum(1, x / 0.002)

# whoosh for scene changes: band-passed noise sweeping up then down
def whoosh():
    d = 0.4; n = int(SR * d); u = np.linspace(0, 1, n); noise = rng.standard_normal(n); out = np.zeros(n)
    # crossfade noise bands so the "air" rises in pitch then falls
    for lo, hi, peak_at in [(300, 700, .2), (700, 1500, .4), (1500, 3200, .55), (3200, 6000, .65)]:
        out += bp(noise, lo, hi) * np.exp(-((u - peak_at) / 0.18) ** 2)
    return out * np.sin(np.pi * u) ** 1.5

# rubber stamp / thud
def stamp():
    d = 0.3
    thud = sweep(130, 55, d, 0.4) * env(int(SR * d), 0.001, 0.07)
    slap = lp(rng.standard_normal(int(SR * 0.04)), 2500) * env(int(SR * 0.04), 0.0005, 0.01) * 0.7
    return place(thud, slap, 0)

# sparkle: little high pings
def sparkle():
    b = np.zeros(int(SR * 0.7))
    for i in range(7):
        f = rng.uniform(2500, 5000); d = 0.25
        place(b, np.sin(2 * np.pi * f * t(d)) * env(int(SR * d), 0.001, 0.05) * rng.uniform(.4, 1), i * 0.07 + rng.uniform(0, .03))
    return b

# falling tone (pressure drops)
def fall():
    d = 0.7
    s = sweep(900, 180, d, 0.7)
    s = s + 0.3 * np.sign(s)  # a bit of edge
    return lp(s, 3000) * env(int(SR * d), 0.01, 0.35)

# clock tick
def tick():
    n = int(SR * 0.03)
    return bp(rng.standard_normal(n), 2500, 6000) * env(n, 0.0002, 0.003)

# MRI-style beep
def beep():
    d = 0.12
    return np.sin(2 * np.pi * 1000 * t(d)) * np.minimum(1, t(d) / .005) * np.minimum(1, (d - t(d)) / .01)

# fanfare (trophy)
def tada():
    notes = [523.25, 659.25, 783.99, 1046.5]
    b = np.zeros(int(SR * 1.6))
    def tone(f, d, dec):
        x = t(d); s = sum(np.sin(2 * np.pi * f * k * x) / k for k in (1, 2, 3, 4))
        return s * np.minimum(1, x / 0.005) * np.exp(-x / dec)
    for i, f in enumerate(notes[:3]): place(b, tone(f, 0.25, 0.12), i * 0.09)
    for f in notes[1:]: place(b, tone(f, 1.2, 0.5) * 0.6, 0.3)
    return b

# steam hiss (doctor boils over)
def steam():
    d = 0.8; n = int(SR * d)
    s = hp(rng.standard_normal(n), 4000)
    shape = np.minimum(1, np.linspace(0, 1, n) * 6) * np.linspace(1, 0, n) ** 1.5
    return s * shape


if __name__ == "__main__":
    for name, fn, peak in [("crack", crack, .9), ("pop", pop, .9), ("blip", blip, .6), ("ding", ding, .7),
                           ("whoosh", whoosh, .6), ("stamp", stamp, .9), ("sparkle", sparkle, .5),
                           ("fall", fall, .6), ("tick", tick, .7), ("beep", beep, .5), ("tada", tada, .7),
                           ("steam", steam, .5)]:
        save(name, fn(), peak)
    print("wrote", sorted(os.listdir(OUT)))
