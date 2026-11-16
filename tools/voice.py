#!/usr/bin/env python3
"""Generate the doctor's voiceover for an episode.

Usage:  python3 tools/voice.py episodes/<episode-folder>

Reads   script.txt   (ElevenLabs v3 emotion tags like [annoyed] [sighs] [shouting] allowed)
Writes  voice.wav    sped up to the channel pace (pitch preserved)
        words.json   per-word start/end times, for captions and timing scenes
        env.json     voice loudness per video frame, drives the mouth

Needs an ElevenLabs API key. In a Claude cloud session it is injected by the network
proxy; elsewhere set ELEVENLABS_API_KEY.
"""
import base64, json, os, struct, subprocess, sys, urllib.request

VOICE_ID = "nPczCjzI2devNBz1zQrb"   # Brian
MODEL = "eleven_v3"
SPEED = 1.12                        # channel pace (chosen in the voice test)
FPS = 30

ep = sys.argv[1]
text = open(os.path.join(ep, "script.txt")).read().strip()

req = urllib.request.Request(
    f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/with-timestamps",
    data=json.dumps({"text": text, "model_id": MODEL, "voice_settings": {"stability": 0.0}}).encode(),
    headers={"Content-Type": "application/json", "xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")},
)
d = json.load(urllib.request.urlopen(req))
raw = os.path.join(ep, "raw.mp3")
open(raw, "wb").write(base64.b64decode(d["audio_base64"]))

# words (emotion tags removed), times rescaled for the speed-up
a = d["alignment"]
words, cur, s, e, intag = [], "", None, None, False
for c, a0, b0 in zip(a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"]):
    if c == "[": intag = True; continue
    if intag:
        if c == "]": intag = False
        continue
    if c.isspace():
        if cur: words.append({"w": cur, "s": s / SPEED, "e": e / SPEED}); cur = ""
        continue
    if not cur: s = a0
    cur += c; e = b0
if cur: words.append({"w": cur, "s": s / SPEED, "e": e / SPEED})
json.dump(words, open(os.path.join(ep, "words.json"), "w"))

wav = os.path.join(ep, "voice.wav")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-filter:a", f"atempo={SPEED}", "-ar", "44100", wav], check=True)
os.remove(raw)

# loudness envelope per frame for lip sync
pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", wav, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
n = len(pcm) // 2; smp = struct.unpack(f"{n}h", pcm); hop = 16000 // FPS
env = [(sum(x * x for x in smp[i:i + hop]) / max(1, len(smp[i:i + hop]))) ** .5 for i in range(0, n, hop)]
mx = sorted(env)[int(len(env) * .97)] or 1
json.dump([min(1, v / mx) for v in env], open(os.path.join(ep, "env.json"), "w"))

print(f"voice: {n/16000:.1f}s, {len(words)} words")
for w in words: print(f"{w['s']:6.2f}  {w['w']}")
