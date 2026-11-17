# HANDOVER: one Claude Code session on the Mac for both TikTok channels

This file lets a new Claude Code session on the user's MacBook Air (M3) continue exactly where the cloud session stopped.
**Claude: read this whole file first.** Then copy it to the workspace root as `CLAUDE.md` so every future session loads it automatically.

---

## 0. First-run checklist (Claude does this, asks the user only where marked)

Workspace layout: one folder (e.g. `~/Documents/tiktok/`) containing both repos side by side.

```
~/Documents/tiktok/
  CLAUDE.md                 <- copy of this file
  philosophy-animations/    <- life / emotional channel (PRIVATE repo)
  grumpy-doctor/            <- doctor channel (public repo)
```

1. **Homebrew** (if `brew` is missing, the user runs the installer from https://brew.sh; it needs their Mac password).
2. Install tools:
   ```
   brew install node python ffmpeg gh git
   brew install --cask blender font-inter
   python3 -m pip install --user numpy scipy
   ```
   Inter Display: `font-inter` (v4) includes Inter Display. Check in Font Book that "Inter Display" is listed.
   If missing, download Inter from https://rsms.me/inter/ and install the "Inter Display" fonts.
3. **GitHub access** (the life repo is private): **user runs** `gh auth login` (GitHub.com → HTTPS → log in with browser).
   Then:
   ```
   gh repo clone teneto2121-lab/philosophy-animations
   gh repo clone teneto2121-lab/grumpy-doctor
   ```
4. **Playwright + Chromium** in each repo (render.js uses `require('playwright')`):
   ```
   cd philosophy-animations && npm install --no-save playwright && npx playwright install chromium && cd ..
   cd grumpy-doctor && npm install --no-save playwright && npx playwright install chromium && cd ..
   ```
   (`node_modules/` is gitignored.)
5. **ElevenLabs key**: `tools/voice.py` reads the env var `ELEVENLABS_API_KEY`.
   **The user** makes a NEW key at elevenlabs.io → Settings → API Keys (and deletes the old one that was pasted in a chat once),
   then adds it themselves, so the key never appears in the chat:
   ```
   echo 'export ELEVENLABS_API_KEY="paste-key-here"' >> ~/.zshrc && source ~/.zshrc
   ```
   Claude must **never print, echo, log or commit the key**. Check only with `test -n "$ELEVENLABS_API_KEY" && echo set`.
   The music API (`/v1/music`) uses the same key.
6. Smoke test: `cd philosophy-animations && node tools/render.js episodes/ep22-alone-not-lonely stills 3 15 30` should write stills without errors.
7. Optional extras:
   - Openverse (CC images/audio) MCP: `claude mcp add --transport http openverse https://gateway.pipeworx.io/openverse/mcp` (third-party gateway).
   - Manim: `brew install pango cairo pkg-config && python3 -m pip install --user manim` (demo in `philosophy-animations/manim-test/`).
   - 3D assets (gitignored, re-download when needed): see section 6.

---

## 1. Who / what

- The user runs two TikTok channels. Claude writes the scripts, makes the voice, animates, renders, and writes captions.
- **Life channel:** @beginyourdream (the user's own old account; went viral years ago with quote carousels). Repo `teneto2121-lab/philosophy-animations` (private).
- **Doctor channel:** "Dr. Grumbles", @AngryDoctorExplains. Repo `teneto2121-lab/grumpy-doctor` (public).
- **The problem right now:** almost every video stalls around ~200 views. See `philosophy-animations/RESEARCH.md` (full report). Short version:
  1. ~200 views = failing TikTok's first test batch, not a ban.
  2. Topic and how the claim is framed matter more than the animation.
  3. Winners all have: a steady music bed (~-22 dB under the voice), 60–75s length (emotional), and a specific personal stake on frame 1.
  4. Doctor niche winners (@smart.doctor 3M, Zack D. Films) make the **body itself** fill the screen, full-screen / 3D. Our old format had a big talking cartoon.
  5. Spanish versions did well in the sample. Video gets far more reach than carousels in 2026.
- **14-day plan (RESEARCH.md §8):** one video a day per channel in the new formats; anything passing ~1,000 views → make 3 more like it right away.
  Days 8–14: double down on what worked + Spanish versions of the top 3 on a test account. Later options: a fresh account for the emotional format; small paid Promote.

## 2. The user: preferences (important)

- **Life channel = sad / warm / nostalgic / thought-provoking. NOT motivation.** ("stop doing motivation ones"). Their own data: emotional did slightly better.
- **Engaging, not teaching.** Should never feel like a lesson.
- Quality matters: uncropped on a phone (keep everything inside the safe area), sharp, smooth (60fps life channel).
- They get frustrated with slowness and low views. Be quick, show results early, send finished files **in posting order**, keep things organised.
- Short, simple explanations. British English ("mum", "favourite").
- They tried voices: too timid/smooth was bad; heavy music was "over the top". Katie (below) is the one they liked for life.
- Git: commit with clear messages and push; **never create pull requests unless asked**. No AI model names in commits.
- Don't share the user's email or personal details with outside services.
- Don't try to dodge bot detection when scraping (TikTok etc.). Use public/SSR data only.

## 3. Life channel (philosophy-animations)

**Pipeline** (per episode folder `episodes/epNN-slug/`):
1. `script.txt` (ElevenLabs v3 tags allowed, e.g. `[softly]`, `[pause]`).
2. `python3 tools/voice.py episodes/epNN-slug` → voice.wav, words.json, env.json, visemes.json.
3. `python3 tools/tighten.py episodes/epNN-slug [max_gap=0.45] [word_index:keep_gap ...]` trims dead air; `python3 tools/pause.py episodes/epNN-slug 5.3:0.9 ...` adds pauses where a beat needs to land.
4. Write `scene.html` using `engine/mono.js` (copy the newest episode, e.g. ep22, as the template). Time beats from `words.json`.
5. Check: `node tools/render.js episodes/epNN-slug stills 3 15 30` then `python3 tools/sheet.py episodes/epNN-slug sheet.jpg` (contact sheet; look for overlaps / crops).
6. Render: `node tools/render.js episodes/epNN-slug` → `epNN-slug.mp4`.
7. Music copy: `python3 tools/add_music.py episodes/epNN-slug/epNN-slug.mp4 engine/music/life-bed-01.mp3 14` → `-music.mp4` (bed 14 dB under voice). New beds can be made with the ElevenLabs music API (steady, soft piano/ambient; no big swells).
8. Add caption + pinned comment + sources to `POSTING.md`; copy to `ready-to-post/` with a numbered name (folder is gitignored).

**Style rules:**
- Black background, white/glow line art (`mono.js` kit): `SAFE_SCALE .88`, `GRAIN=false`, `window.OUT_FPS=60`.
- Voice **Katie** `YyRJWuwyhKdMZRRnm464`, eleven_v3, speed 1.0, stability 0.5 (`engine/voice/config.json`; per-episode overrides in `voice.json`).
- 60–75s. **Frame 1 already shows the hook headline** (`heads()` keys < 0 = fully visible on frame 1). No flash on frame 1.
- Dense scenes: something changes every 2–3s. Props available in mono.js: pawn(enter), glide, house, car, mug, speech, dotField, clockIcon, coinStack, axes, curve, bed, pawnLying, dog, hourglass, scale2, couch, ball, sun, phoneFrame, msg, voiceNote, polaroid, carry, handInHand, heartShape, iconCircle, island, pill, label, bigText.
- Script shape: **claim (0–3s) → concrete example (3–40s) → twist / reframe (40–60s) → a quotable last line**. Loop endings help.
- Upload notes for the user: turn on "AI-generated content"; pinned comment invites a reply; if posting the no-music version, add a soft piano sound from TikTok at 10–20%.

**Inventory (life):**
- `ready-to-post/01…10` = ep11–ep20, numbered in posting order (see `READY-TO-POST.md` for captions).
- ep21 "Last photo together" (64.2s) and ep22 "Alone, not lonely" (63.7s): `.mp4` + `-music.mp4`, captions in POSTING.md. (ep22 cites Wilson et al., *Science* 2014.)
- Older: ep01–ep10 (mixed styles, some philosophy). Quote carousels 01–04 in `quotes/carousels/` (Met Museum CC0 paintings; renderer `quotes/render_carousels.js`).
- Topic bank for next videos: RESEARCH.md §6 (Lane A sad/nostalgic, Lane B sharp life claims; skip anything motivational).

## 4. Doctor channel (grumpy-doctor)

- Same pipeline (`tools/voice.py`, `tighten.py`, `pause.py`, `render.js`, `sheet.py`). Engine `engine/core.js` (+ anatomy.js, mythfact.js).
- Voice **Dr. Grumbles** (custom) `Lm1AZYoA5uOYmafLK77j`, eleven_v3, speed 1.12, stability 0.
- **New format = FULLSCREEN** (first used in ep19 Phineas Gage): `window.FULLSCREEN=true`; `window.stage(s,t)` draws the whole frame; the doctor sits small in a corner (`window.DOC_CORNER=[190,1640,.5]`), captions at `window.CAP_Y` (1380). Cold open, cut-off ending, 45–60s.
- Topics: dramatic TRUE medical stories / "what happens if" (topic bank in RESEARCH.md §5). **Every fact must be sourced** in POSTING.md ("Fact sources" section) before rendering.
- Small gotchas: `ping` colours must be 6-digit hex (not `#fff`); define local helpers you use (ep18 broke on an undefined `fin`).
- Inventory: ep01–ep18 (old talking-doctor format; ep16–18 are the latest of those), **ep19 Phineas Gage (FULLSCREEN, 62.3s)**. Captions in POSTING.md and the README table.

## 5. 3D (Blender) – the next quality step for the doctor channel

- Test shot: `grumpy-doctor/experiments/3d-skull/` – a realistic skull with the iron rod for the Phineas Gage story (Cycles, OIDN denoise, AgX look, camera push-in + orbit, impact at frame 60, 8s/240 frames).
  Details and commands: `experiments/3d-skull/HANDOVER-MAC.md`. On the Mac:
  ```
  cd grumpy-doctor/experiments/3d-skull
  GPU=1 /Applications/Blender.app/Contents/MacOS/Blender -b --python shot.py -- frames x 48 100
  ffmpeg -framerate 30 -i frames/f%04d.png -c:v libx264 -crf 16 -pix_fmt yuv420p skull-3d.mp4
  ```
  `GPU=1` picks Metal on Apple Silicon. The cloud CPU managed ~15–20 s/frame at 67% res / 16 samples; the M3 GPU should be far faster.
- Plan: use 3D shots as the full-screen visual inside FULLSCREEN episodes (render the 3D clip, then play it as a background video / image sequence in `stage()`), starting with a re-cut of ep19.

## 6. Free asset sources (and licences)

- **NIH 3D** skull, entry 849 (public domain): GLB at
  `https://3d.nih.gov/api/submissions/32081/runs/70d47dba-4d66-4e41-929e-fcd73406947d/output-files/953714` → `experiments/3d-skull/model/skull.glb`.
- **BodyParts3D** organs (CC BY-SA 2.1 JP – credit "Anatomy models: BodyParts3D, (c) DBCLS" in the caption): zip
  `https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_BP3D_4.0_obj_99.zip` → unzip into `grumpy-doctor/assets/anatomy/obj/`. `assets/anatomy/organs.json` maps names → files.
- **Poly Haven** (CC0) HDRIs/textures: `python3 tools/polyhaven.py search hdris studio`, `python3 tools/polyhaven.py get studio_small_09 2k`.
- **Met Museum Open Access** (CC0 paintings): search `https://collectionapi.metmuseum.org/public/collection/v1.1/search?...`, objects via `/v1/objects/<id>`. (Wikimedia rate-limits.)
- Openverse via the MCP above.

## 7. Where things stood at handover (2026-11-17)

- Done: RESEARCH.md; ep19 doctor (FULLSCREEN); life ep21 + ep22 (+ music versions); tools installed; 3D test shot pipeline working.
- The cloud render of the 3D test shot (`experiments/3d-skull/skull-3d-test.mp4`, 67% res, 16 samples) was still running at handover; if it's not in the repo, re-render it on the Mac with the GPU command above (full res).
- **Next up:**
  1. Render the 3D skull shot on the Mac GPU and show the user.
  2. Keep the 14-day plan going: 1 life video a day (sad/warm, Lane A/B from RESEARCH.md §6) + 1 doctor video a day (FULLSCREEN, topics 2–7 from §5), each with a music version.
  3. Ask the user for view counts every few days and double down on anything over ~1,000 views.
  4. Spanish versions of the best performers (re-voice with ElevenLabs, re-render text).
