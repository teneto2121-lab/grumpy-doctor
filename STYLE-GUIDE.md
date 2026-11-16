# Grumpy Doctor channel: style guide (work in progress)

## TikTok account
- Handle: **@AngryDoctorExplains** (tiktok.com/@AngryDoctorExplains)
- Display name: **Dr. Grumbles | Body Facts**
- Bio: *50 years a doctor. Still explaining your body. Still annoyed. Not YOUR doctor.*
- Profile picture: `brand/avatar-grumpy.png` (yellow)
- Personal/Creator account, not Business (keeps trending music available)
- Turn on TikTok's "AI-generated content" label when posting (AI voice)

## Concept
- Faceless, animated TikToks, 9:16, roughly 30–60 seconds
- Niche: human body and medicine facts
- Segments: "What happens if…", "How does it work", "Why does your body…"

## Mascot
- Design **A ("The Classic")**: bald, wild white side hair, giant bushy eyebrows, tiny glasses on a big nose, walrus mustache, red bow tie, lab coat, stethoscope
- Name: **Dr. Grumbles**
- Personality: exasperated old doctor who has seen it all and secretly cares
  - Anger is aimed at the body's silly design and the viewer's bad habits, never at sick people
  - Grumpiness level changes from video to video (mild ↔ fully outraged)
- Running disclaimer gag: "I'm not YOUR doctor. Go see one."

## Voice
- **Custom voice "Dr. Grumbles"** (designed for the channel, ElevenLabs voice id `Lm1AZYoA5uOYmafLK77j`), `eleven_v3`, stability 0.0
  - Settings live in `engine/voice/config.json`. Episodes 01–05 used the stock voice Brian; 06 onward use the custom voice.
- ElevenLabs Creator plan (commercial license)
- Emotion tags in scripts: [annoyed], [sighs], [shouting], [grumbling], and so on
- **Pace: faster than the default.** The API speed setting has no effect on v3, so every
  voiceover gets sped up afterwards with ffmpeg `atempo` (pitch-preserving). Default rate: **1.12×** (chosen).

## Content rules
- Explain how the body works, never give treatment advice
- Fact-check every script, and skip claims that are shaky or contested

## Visual style
- Flat 2D vector cartoon with dark outlines, bold Inter Display Black text
- TikTok captions: about 3 words at a time, active word in yellow, thick black outline
- Quick zoom and flash on scene cuts, progress bar at the top

## Explainer card (from ep 02 on)
- Use the shaded props in `engine/anatomy.js` (brain, bloodVessel, headProfile, mouthOpen, intestine, rbc, face)
- Props get cartoon faces whose expressions react to the story (calm, worried, scared, confused, smug, happy, annoyed)
- Every prop gets shading: gradient fill + gloss highlight; the card adds a flat drop shadow automatically
- Fill the card: main subject big and centered, max 2–3 labels on screen at once
- Define `window.SCENES` (scene start times) and `window.TINTS` (card color per scene) to get slide transitions,
  a slow push-in, and tinted backgrounds

## Doctor performance (from ep 06 on)
- **Hook on frame 1:** set `window.HOOK=[['LINE',color,size],...]`; it is fully visible from the first frame
  (that frame is often the thumbnail). Don't also draw the title in the intro content.
- **Punch-ins:** `window.PUNCH=[[start,end],...]` cuts to a big close-up with a speed-burst background.
  Use on every outburst / punchline (1–3 per episode).
- **Jolts:** `window.JOLTS=[seconds,...]` makes him jump with wide eyes (for ZAP!, POP!, surprises).
- **Poses:** rest, point, up, shrug, chin, facepalm, pinch (bridge of nose), cross (arms crossed),
  hips (hands on hips), lean (leans toward camera). Vary them; facepalm/pinch on sighs, cross/hips while waiting.
- He looks up at the card automatically while pointing, and at the camera during punch-ins.
- **Lip sync:** `tools/voice.py` writes `visemes.json` (mouth shapes from letter timings); used automatically.

## Staging & motion (from ep 08 on)
- **Show, don't label:** max 1–2 labels per beat; let props act (faces react, things squash, pile up, shake).
- **Camera inside the card:** `window.CAM=[[t,x,y,zoom],...]` zooms/pans onto the key detail (pinch point,
  the bubble, the broom). Put labels in `window.overlay(t)` so zooms never crop them.
- **Impacts:** `window.SHAKES=[seconds]` shakes the card; use `squash(t,start)` for squash-and-stretch and
  `dust(x,y,t,start)` for a dust puff when something lands.
- **Build-ons:** `drawOn(points, fraction)` draws lines progressively (nerves, paths).

## Retention toolkit (from the reference analysis, see docs/REFERENCE-ANALYSIS.md)
- `window.TEASER=[t,...]`: flashes 4–6 upcoming climaxes (0.28s each) under the hook; payoff first
- Cards drift and push in automatically; `window.FOLLOW_AT` puts the follow banner (default: halfway)
- `window.KEYWORDS=[...]`: those words get a yellow box in the captions (verdicts, NOT, numbers)
- `<episode>/voice.json` `{"speed":1.2}` for faster delivery; aim for ~3+ words/second
- `window.board(t)`: a fixed panel in the card (e.g. the Myth-or-Fact scoreboard)

## Breathing room
- After a question/claim and after a verdict/answer, give the viewer a beat: ~0.8s to guess, ~0.55s to react.
- `python3 tools/pause.py episodes/<ep> 5.92:0.8 6.54:0.55 ...` inserts silence at those story times (pick gaps
  between words). The scene clock holds during each pause while the doctor keeps breathing; author scenes and
  SFX in story time as usual. Longer pauses get soft clock ticks automatically.
- Animations that should keep moving during a pause can use video time: `window.__rt`, `toVideo(storyTime)`.

## Format: MYTH OR FACT? (RETIRED, do not make more)
Retired at the owner's request after ep 12 (not posted). Kept for reference only; engine/mythfact.js stays but isn't used.

- Hook "Myth or fact? [X] edition. And it gets weirder." + teaser
- 5–7 numbered cases: CASE card → claim box → guess window (buttons pulse) → verdict stamp → 1–2 explanation beats
- FACT / MYTH / KINDA board; each verdict drops a tag into its column
- Escalate; the last case is "the one I hate" (wildest), with a punch-in on the verdict

## Batch-2 tools
- `ping(x,y,r,t,{col,lab})`: pulsing target ring on the body part being discussed (+ optional pill label)
- `counter(x,y,t,start,dur,from,to,{fmt})`: live number that counts up/down
- `sharePhone(x,y,s,t,'friend who…',start)`: "SEND TO" share sheet for the share prompt
- `window.ENDING='cut'`: no outro; the video stops mid-sentence (rewatch hook). End the script mid-sentence.
- `person(...)` is now shared in anatomy.js

## Format: 30 DAYS (ep 11 pilot)
- Hook "What happens if you [habit] every day for 30 days?" (3-line HOOK + teaser)
- Week 1 → Week 4 cards with a DAY x/30 + WEEK tracker board; one clear visual per week; ping rings
- Share prompt near the end ("Send this to the friend who…"), then a cut-off ending
- Keep claims modest and sourced; the week framing is a storytelling device

## Endings
- **Signature outro:** `window.OUTRO=true` adds the "NEXT PATIENT!" clipboard slam (voice line in
  `engine/voice/next_patient.wav`; re-record with `python3 tools/voice.py --outro` after a voice change).
- **Loop:** the outro dissolves into the episode's first frame. Write scripts so "Next patient!" flows into
  the opening line (the opening should address the viewer as the next patient, e.g. "You. Yes, you.").

## Sound
- Synthesized effects (no licensing issues), mixed under the voice
- Whoosh on every scene change, blip when a label pops in, plus effects tied to the story (crack, pop, ding, tada…)
- Steam hiss when the doctor boils over
- No background music baked in: add a trending sound in the TikTok app at low volume instead (better for reach)

## Doctor poses
rest (hands at sides) · point (right hand points up at the card) · up (both arms raised, outraged) · shrug · chin (fist at belly)
