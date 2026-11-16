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
- ElevenLabs voice **Brian** (`nPczCjzI2devNBz1zQrb`), model `eleven_v3`, stability 0.0
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

## Sound
- Synthesized effects (no licensing issues), mixed under the voice
- Whoosh on every scene change, blip when a label pops in, plus effects tied to the story (crack, pop, ding, tada…)
- Steam hiss when the doctor boils over
- No background music baked in: add a trending sound in the TikTok app at low volume instead (better for reach)

## Doctor poses
rest (hands at sides) · point (right hand points up at the card) · up (both arms raised, outraged) · shrug · chin (fist at belly)
