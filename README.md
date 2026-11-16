# Grumpy Doctor 🩺

Animated TikToks about the human body and medicine, hosted by a grumpy old doctor.
Each video is code: a voiceover from ElevenLabs plus a scene file that draws every frame.

## Folder layout
```
STYLE-GUIDE.md        decisions about character, voice, tone, content rules, visuals
engine/core.js        shared parts: the doctor, props (bones, gauge, trophy…), captions, renderer, scene transitions
engine/voice/         voice config + the "Next patient!" outro line
engine/anatomy.js     shaded anatomy props with cartoon faces (brain, blood vessel, head, mouth, intestine…)
episodes/<name>/
  script.txt          the narration, with emotion tags like [annoyed] [sighs] [shouting]
  scene.html          this episode's timeline: doctor's mood + poses, and what appears on the card
  voice.wav           generated voice (sped up to 1.12×)
  words.json          word timestamps (captions and timing)
  env.json            loudness per frame (mouth movement)
  <name>.mp4          the finished video
design/               character design explorations
tools/voice.py        script.txt  ->  voice.wav + words.json + env.json + visemes.json   (--outro: signature line)
tools/render.js       scene.html  ->  <name>.mp4  (or preview stills); mixes in sound effects
tools/make_sfx.py     synthesizes the sound-effect library into engine/sfx/
tools/mix.py          mixes voice + effect cues (called by render.js)
```

## Making a new episode
1. Copy an existing episode folder, then rename it (`episodes/ep02-...`).
2. Write `script.txt`: fact-check it, and keep it to how the body works, never treatment advice.
3. Generate the voice: `python3 tools/voice.py episodes/ep02-...`
   (prints a timestamp for each word)
4. Edit `scene.html` using those timestamps:
   - `MOOD`: keyframes `[seconds, 0..1]` (0 = mildly grumpy, 1 = red-faced with steam)
   - `POSES`: keyframes `[seconds, 'rest'|'point'|'up'|'shrug'|'chin']`
   - `content(t)`: what's on the explainer card at time `t`
   - `window.HOOK`, `window.PUNCH`, `window.JOLTS`, `window.OUTRO`: see STYLE-GUIDE.md (Doctor performance / Endings)
   - `window.SFX`: sound cues `[seconds, name, volume]`. Available: crack, pop, blip, ding, whoosh,
     stamp, sparkle, fall, tick, beep, tada, steam
5. Check a few frames: `node tools/render.js episodes/ep02-... stills 3 15 30`,
   then `python3 tools/sheet.py episodes/ep02-... sheet.jpg` for a contact sheet
6. Render the video: `node tools/render.js episodes/ep02-...`

## Requirements
- Node 18+ with Playwright (Chromium), Python 3 with numpy + scipy, ffmpeg
- The Inter Display font installed (for captions and text)
- An ElevenLabs API key (`ELEVENLABS_API_KEY`, or saved as a network secret in a Claude cloud environment)

## Episodes
| # | Topic | Length |
|---|-------|--------|
| 01 | Why do your knuckles crack? | 47s |
| 02 | Why do you get brain freeze? | 43s |
| 03 | What happens if you swallow gum? | 46s |
| 04 | Why can't you tickle yourself? | 41s |
| 05 | Why does your funny bone hurt? | 40s |
| 06 | Why do we hiccup? | 40s |
| 07 | Why do we get goosebumps? | 35s |

Captions, hashtags and posting steps: see `POSTING.md`.
