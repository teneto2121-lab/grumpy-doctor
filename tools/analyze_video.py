#!/usr/bin/env python3
"""Deep analysis of a reference video (e.g. a TikTok we want to learn from).

Usage:  python3 tools/analyze_video.py <video file> [out_dir]

Writes into out_dir (default: analysis/<video name>/):
  report.json     per-frame motion, cut list, shot lengths, palette per shot, transcript stats
  motion.png      motion-per-frame graph with cuts marked (where the video "hits")
  sheets/         contact sheets covering the whole video (every Nth frame, timestamped)
  focus/          every frame around the hook, each cut, and the ending (for close study)
  transcript.json word-level transcript (ElevenLabs speech-to-text), if audio is present
"""
import json, os, subprocess, sys, urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFont

src = sys.argv[1]
name = os.path.splitext(os.path.basename(src))[0]
out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "..", "analysis", name)
os.makedirs(os.path.join(out, "sheets"), exist_ok=True)
os.makedirs(os.path.join(out, "focus"), exist_ok=True)


def probe(key):
    return subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", f"stream={key}",
                           "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip()


W0, H0 = [int(x) for x in probe("width,height").split(",")[:2]]
num, den = probe("r_frame_rate").split("/")
FPS = float(num) / float(den)
# long videos: analyse at a lower frame rate so every (sampled) frame still fits in memory
LEN = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip() or 0)
VF = ""
if LEN > 120: FPS = 10.0; VF = "fps=10,"

SW = 180; SH = int(SW * H0 / W0) // 2 * 2  # small analysis size

# ---- every frame, small, as raw RGB ----
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"{VF}scale={SW}:{SH}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                     capture_output=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, SH, SW, 3)
N = len(frames)
dur = N / FPS

# motion = mean abs difference to previous frame; cuts = big spikes relative to local motion
motion = np.zeros(N)
for i in range(1, N): motion[i] = np.abs(frames[i].astype(np.int16) - frames[i - 1]).mean()
hist = lambda f: np.histogram(f[..., 0] // 32 * 64 + f[..., 1] // 32 * 8 + f[..., 2] // 32, bins=512, range=(0, 512))[0] / f[..., 0].size
hd = np.zeros(N)
H = [hist(f) for f in frames]
for i in range(1, N): hd[i] = np.abs(H[i] - H[i - 1]).sum() / 2
cuts = [i for i in range(1, N) if hd[i] > 0.35 and motion[i] > 18 and motion[i] > 2.5 * np.median(motion[max(1, i - 15):i + 15])]
merged = []
for c in cuts:
    if not merged or c - merged[-1] > 4: merged.append(c)
cuts = merged
bounds = [0] + cuts + [N]
shots = [(bounds[i], bounds[i + 1]) for i in range(len(bounds) - 1)]


def palette(a, b):
    px = frames[a:b:max(1, (b - a) // 6)].reshape(-1, 3)
    q = (px // 32) * 32 + 16
    vals, counts = np.unique(q, axis=0, return_counts=True)
    top = vals[np.argsort(-counts)[:5]]
    return ["#%02x%02x%02x" % tuple(int(c) for c in v) for v in top]


report = {
    "file": src, "size": [W0, H0], "fps": round(FPS, 3), "frames": N, "duration_s": round(dur, 2),
    "cuts": [{"frame": c, "t": round(c / FPS, 2)} for c in cuts],
    "cuts_per_second": round(len(cuts) / dur, 2),
    "shots": [{"start": round(a / FPS, 2), "len_s": round((b - a) / FPS, 2), "palette": palette(a, b),
               "avg_motion": round(float(motion[a + 1:b].mean()) if b - a > 1 else 0, 1)} for a, b in shots],
    "motion_per_second": [round(float(motion[int(s * FPS):int((s + 1) * FPS)].mean()), 1) for s in range(int(dur))],
    "first_3s_motion": round(float(motion[1:int(3 * FPS)].mean()), 1),
    "avg_motion": round(float(motion.mean()), 1),
}

# ---- motion graph ----
G = Image.new("RGB", (1600, 400), "white"); d = ImageDraw.Draw(G)
mx = max(1, motion.max())
for i in range(1, N):
    x0, x1 = (i - 1) / N * 1600, i / N * 1600
    d.line([(x0, 390 - motion[i - 1] / mx * 370), (x1, 390 - motion[i] / mx * 370)], fill=(30, 90, 200), width=2)
for c in cuts: x = c / N * 1600; d.line([(x, 0), (x, 400)], fill=(230, 60, 70), width=1)
for s in range(int(dur) + 1): x = s * FPS / N * 1600; d.text((x + 2, 2), f"{s}s", fill=(80, 80, 80))
G.save(os.path.join(out, "motion.png"))

# ---- contact sheets over the whole video (every STEP frames), full-res frames, timestamped ----
STEP = 4 if FPS > 20 else 3
CW = 216; CH = int(CW * H0 / W0) // 2 * 2
idx = list(range(0, N, STEP))
per = 24  # 6 x 4 per sheet
try: font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
except Exception: font = None


# decode every frame once at contact-sheet size (fast, and covers the whole video)
big = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"{VF}scale={CW}:{CH}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                     capture_output=True).stdout
BIG = np.frombuffer(big, np.uint8).reshape(-1, CH, CW, 3)


def grab(i, w):
    return Image.fromarray(BIG[min(i, len(BIG) - 1)])


def sheet(ids, path, w=CW):
    h = int(w * H0 / W0); cols = 6; rows = (len(ids) + cols - 1) // cols
    S = Image.new("RGB", (cols * w, rows * (h + 24)), "black"); dd = ImageDraw.Draw(S)
    for k, i in enumerate(ids):
        im = grab(i, w).resize((w, h)); x, y = (k % cols) * w, (k // cols) * (h + 24)
        S.paste(im, (x, y + 24)); dd.text((x + 4, y + 2), f"{i / FPS:.2f}s f{i}" + (" CUT" if i in cuts else ""), fill=(255, 220, 0), font=font)
    S.save(path, quality=85)


for n in range(0, len(idx), per):
    sheet(idx[n:n + per], os.path.join(out, "sheets", f"sheet_{n // per + 1:02d}.jpg"))

# ---- focus: every frame of the hook, around each cut, and the last second ----
focus = {"hook": list(range(0, min(N, int(3 * FPS))))}
for k, c in enumerate(cuts): focus[f"cut{k + 1:02d}_{c / FPS:.2f}s"] = list(range(max(0, c - 6), min(N, c + 7)))
focus["ending"] = list(range(max(0, N - int(FPS * 1.2)), N))
for key, ids in focus.items():
    for n in range(0, len(ids), 24):
        sheet(ids[n:n + 24], os.path.join(out, "focus", f"{key}_{n // 24 + 1}.jpg"), w=200)

# ---- transcript via ElevenLabs speech-to-text (word timestamps) ----
has_audio = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", src],
                           capture_output=True, text=True).stdout.strip()
if has_audio:
    wav = os.path.join(out, "audio.mp3")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-vn", "-ac", "1", "-b:a", "96k", wav], check=True)
    bnd = "----gdboundary"
    body = (f"--{bnd}\r\nContent-Disposition: form-data; name=\"model_id\"\r\n\r\nscribe_v1\r\n"
            f"--{bnd}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"a.mp3\"\r\nContent-Type: audio/mpeg\r\n\r\n").encode() + open(wav, "rb").read() + f"\r\n--{bnd}--\r\n".encode()
    try:
        r = json.load(urllib.request.urlopen(urllib.request.Request("https://api.elevenlabs.io/v1/speech-to-text", data=body,
              headers={"Content-Type": f"multipart/form-data; boundary={bnd}", "xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")}), timeout=300))
        words = [w for w in r.get("words", []) if w.get("type") == "word"]
        json.dump(r, open(os.path.join(out, "transcript.json"), "w"), indent=1)
        speech = (words[-1]["end"] - words[0]["start"]) if words else 0
        report["transcript"] = r.get("text", "")
        report["words"] = len(words)
        report["words_per_second"] = round(len(words) / speech, 2) if speech else None
        report["first_words_at_s"] = round(words[0]["start"], 2) if words else None
        report["hook_words_first_3s"] = " ".join(w["text"] for w in words if w["start"] < 3)
    except Exception as e:
        report["transcript_error"] = str(e)[:300]

json.dump(report, open(os.path.join(out, "report.json"), "w"), indent=1)
print(json.dumps({k: report[k] for k in ["duration_s", "fps", "cuts_per_second", "avg_motion", "first_3s_motion"] if k in report}, indent=1))
print("cuts:", [c["t"] for c in report["cuts"]][:40])
print("words/s:", report.get("words_per_second"), "| hook:", report.get("hook_words_first_3s"))
print("sheets:", len(os.listdir(os.path.join(out, "sheets"))), "| focus sheets:", len(os.listdir(os.path.join(out, "focus"))))
