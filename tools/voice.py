#!/usr/bin/env python3
"""Generate the doctor's voiceover for an episode.

Usage:  python3 tools/voice.py episodes/<episode-folder>
        python3 tools/voice.py --outro          (re-make the "Next patient!" signature line)

Reads   script.txt   (ElevenLabs v3 emotion tags like [annoyed] [sighs] [shouting] allowed)
Writes  voice.wav    sped up to the channel pace (pitch preserved)
        words.json   per-word start/end times, for captions and timing scenes
        env.json     voice loudness per video frame (how wide the mouth opens)
        visemes.json mouth shapes over time (A/E/O/M/F/C), from the letter timings
Voice settings live in engine/voice/config.json (per-episode overrides: <episode>/voice.json).

Needs an ElevenLabs API key. In a Claude cloud session it is injected by the network
proxy; elsewhere set ELEVENLABS_API_KEY.
"""
import base64, json, os, struct, subprocess, sys, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
CFG = json.load(open(os.path.join(ROOT, "engine", "voice", "config.json")))
SPEED, FPS = CFG["speed"], 30


def tts(text):
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{CFG['voice_id']}/with-timestamps",
        data=json.dumps({"text": text, "model_id": CFG["model"], "voice_settings": {"stability": CFG["stability"]}}).encode(),
        headers={"Content-Type": "application/json", "xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")})
    return json.load(urllib.request.urlopen(req))


def viseme(c):
    c = c.lower()
    if c in "a": return "A"
    if c in "ei": return "E"
    if c in "ouwy": return "O"
    if c in "mbp": return "M"
    if c in "fv": return "F"
    if c.isalpha(): return "C"
    return None


def process(d, out):
    raw = out + ".raw.mp3"
    open(raw, "wb").write(base64.b64decode(d["audio_base64"]))
    a = d["alignment"]
    words, vis, cur, s, e, intag = [], [], "", None, None, False
    for c, a0, b0 in zip(a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"]):
        if c == "[": intag = True; continue
        if intag:
            if c == "]": intag = False
            continue
        v = viseme(c)
        if v: vis.append([round(a0 / SPEED, 3), round(b0 / SPEED, 3), v])
        if c.isspace():
            if cur: words.append({"w": cur, "s": s / SPEED, "e": e / SPEED}); cur = ""
            continue
        if not cur: s = a0
        cur += c; e = b0
    if cur: words.append({"w": cur, "s": s / SPEED, "e": e / SPEED})
    wav = out + ".wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-filter:a", f"atempo={SPEED}", "-ar", "44100", wav], check=True)
    os.remove(raw)
    pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", wav, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    n = len(pcm) // 2; smp = struct.unpack(f"{n}h", pcm); hop = 16000 // FPS
    env = [(sum(x * x for x in smp[i:i + hop]) / max(1, len(smp[i:i + hop]))) ** .5 for i in range(0, n, hop)]
    mx = sorted(env)[int(len(env) * .97)] or 1
    return words, [min(1, v / mx) for v in env], vis, n / 16000


if sys.argv[1] == "--outro":
    out = os.path.join(ROOT, "engine", "voice", "next_patient")
    words, env, vis, dur = process(tts("[annoyed] Next patient!"), out)
    json.dump({"env": env, "vis": vis, "len": round(dur + 0.9, 2)}, open(out + ".json", "w"))
    print(f"outro line: {dur:.2f}s")
else:
    ep = sys.argv[1]
    # optional per-episode overrides, e.g. {"speed": 1.2}
    ov = os.path.join(ep, "voice.json")
    if os.path.exists(ov):
        CFG.update(json.load(open(ov))); SPEED = CFG["speed"]
    words, env, vis, dur = process(tts(open(os.path.join(ep, "script.txt")).read().strip()), os.path.join(ep, "voice"))
    json.dump(words, open(os.path.join(ep, "words.json"), "w"))
    json.dump(env, open(os.path.join(ep, "env.json"), "w"))
    json.dump(vis, open(os.path.join(ep, "visemes.json"), "w"))
    print(f"voice ({CFG['voice_name']}): {dur:.1f}s, {len(words)} words")
    for w in words: print(f"{w['s']:6.2f}  {w['w']}")
