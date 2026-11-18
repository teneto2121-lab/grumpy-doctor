#!/usr/bin/env python3
"""Make short looping TikToks (7-12s): one strong line of text over moving footage, or a question-and-reveal over an illustration.

Footage mode (emotional loops):
  python3 tools/loop.py footage <clip.webm> <start_s> <dur_s> "<text>" <out.mp4> [music.mp3]
Illustration mode (question -> reveal):
  python3 tools/loop.py reveal <spec.json> <out.mp4>
    spec = {"image": "...png", "dur": 10, "question": "WHY ...?", "q_until": 3.0, "answer": "...",
            "focus": [u, v], "zoom": [z0, z1], "labels": [["TEXT", u, v, lx, ly, t], ...], "music": null}
    (u, v) are fractions of the image; lx, ly are screen pixels; zoom 1 = image width fills the screen.
Text is drawn with Inter; videos are 1080x1920 30fps, H.264, loop-friendly (text is on screen from frame 0).
"""
import json, os, subprocess, sys, textwrap
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1080, 1920, 30
FONTS = os.path.expanduser('~/Library/Fonts')
def font(name, size): return ImageFont.truetype(os.path.join(FONTS, name), size)
def ease(u): u = max(0.0, min(1.0, u)); return u * u * (3 - 2 * u)


def text_block(draw, text, cx, cy, fnt, width_chars, fill=(255, 255, 255), shadow=True, line_gap=1.18):
    lines = []
    for para in text.split('\n'):
        lines += textwrap.wrap(para, width_chars) or ['']
    asc, desc = fnt.getmetrics(); lh = int((asc + desc) * line_gap)
    y = cy - lh * len(lines) / 2
    for ln in lines:
        w = draw.textlength(ln, font=fnt)
        if shadow:
            for dx, dy in ((0, 4), (2, 3), (-2, 3)):
                draw.text((cx - w / 2 + dx, y + dy), ln, font=fnt, fill=(0, 0, 0, 170))
        draw.text((cx - w / 2, y), ln, font=fnt, fill=fill)
        y += lh


def footage(clip, start, dur, text, out, music=None):
    # text overlay PNG (sentence case, clean white, soft shadow) with a gentle dark band behind it
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    band = Image.new('RGBA', (W, H), (0, 0, 0, 0)); bd = ImageDraw.Draw(band)
    bd.rectangle((0, 560, W, 1160), fill=(0, 0, 0, 150)); band = band.filter(ImageFilter.GaussianBlur(70))
    ov = Image.alpha_composite(band, ov); d = ImageDraw.Draw(ov)
    text_block(d, text, W / 2, 860, font('Inter-Bold.ttf', 64), 36)
    png = out.replace('.mp4', '.overlay.png'); ov.save(png)
    vf = (f"[0:v]trim=start={start}:duration={dur},setpts=PTS-STARTPTS,fps={FPS},"
          f"scale=w='trunc({W}*(1.04+0.06*t/{dur})/2)*2':h=-2:eval=frame,crop={W}:{H},"
          f"eq=brightness=-0.06:saturation=0.85:contrast=1.05,vignette=PI/4[v];[v][1:v]overlay=0:0,format=yuv420p[o]")
    cmd = ['ffmpeg', '-y', '-v', 'error', '-i', clip, '-loop', '1', '-i', png]
    if music: cmd += ['-i', music]
    cmd += ['-filter_complex', vf + (f";[2:a]atrim=0:{dur},afade=t=in:d=0.3,afade=t=out:st={dur-0.6}:d=0.6,volume=0.8[a]" if music else ''),
            '-map', '[o]'] + (['-map', '[a]', '-c:a', 'aac', '-b:a', '160k'] if music else ['-an']) + \
           ['-t', str(dur), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-movflags', '+faststart', out]
    subprocess.run(cmd, check=True); os.remove(png)


def reveal(spec, out):
    img = Image.open(spec['image']).convert('RGBA'); dur = spec['dur']; N = int(dur * FPS)
    qf, af, lf = font('InterDisplay-Black.ttf', 86), font('Inter-Bold.ttf', 50), font('InterDisplay-Black.ttf', 40)
    fu, fv = spec.get('focus', [.5, .5]); z0, z1 = spec.get('zoom', [1.0, 1.15]); qt = spec.get('q_until', 3.0)
    p = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-'] +
                         (['-i', spec['music']] if spec.get('music') else []) +
                         ['-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p'] +
                         (['-c:a', 'aac', '-shortest'] if spec.get('music') else ['-an']) + ['-t', str(dur), '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    bg = Image.new('RGB', (W, H), (8, 14, 26))
    for i in range(N):
        t = i / FPS; z = z0 + (z1 - z0) * ease(t / dur); w = int(W * z); h = int(w * img.height / img.width)
        x0 = int(W / 2 - fu * w); y0 = int(H * .5 - fv * h)
        fr = bg.copy(); im = img.resize((w, h), Image.LANCZOS)
        if t < qt:  # question phase: illustration dimmed + blurred behind the question
            k = 1 - ease((t - (qt - .4)) / .4)
            dim = im.filter(ImageFilter.GaussianBlur(14 * k)); fr.paste(dim, (x0, y0), dim)
            fr = Image.blend(fr, Image.new('RGB', (W, H), (0, 0, 0)), .55 * k)
        else:
            fr.paste(im, (x0, y0), im)
        d = ImageDraw.Draw(fr, 'RGBA')
        if t < qt:
            text_block(d, spec['question'], W / 2, 820, qf, 16, fill=(255, 214, 10))
        else:
            for txt, u, v, lx, ly, ts in spec.get('labels', []):
                if t < ts: continue
                k = ease((t - ts) / .3); px, py = x0 + u * w, y0 + v * h
                d.line((px, py, px + (lx - px) * k, py + (ly - py) * k), fill=(255, 255, 255, 230), width=5)
                d.ellipse((px - 10, py - 10, px + 10, py + 10), fill=(255, 255, 255))
                if k > .9:
                    tw = d.textlength(txt, font=lf); d.rounded_rectangle((lx - tw / 2 - 22, ly - 34, lx + tw / 2 + 22, ly + 34), 18, fill=(255, 214, 10))
                    d.text((lx - tw / 2, ly - 26), txt, font=lf, fill=(17, 17, 17))
            ta = spec.get('answer_at', qt + .8)
            if t >= ta and spec.get('answer'):
                ay = spec.get('answer_y', 1460); d.rectangle((0, ay - 170, W, ay + 170), fill=(0, 0, 0, 165)); text_block(d, spec['answer'], W / 2, ay, af, 30)
        # progress-free top banner for a constant loop cue
        p.stdin.write(fr.tobytes())
    p.stdin.close(); p.wait()


if __name__ == '__main__':
    m = sys.argv[1]
    if m == 'footage':
        footage(sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5], sys.argv[6], sys.argv[7] if len(sys.argv) > 7 else None)
    else:
        reveal(json.load(open(sys.argv[2])), sys.argv[3])
    print('wrote', sys.argv[-1] if m == 'reveal' else sys.argv[6])
