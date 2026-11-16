# Grumpy Doctor channel: style guide (work in progress)

## Concept
- Faceless, animated TikToks, 9:16, roughly 30–60 seconds
- Niche: human body and medicine facts
- Segments: "What happens if…", "How does it work", "Why does your body…"

## Mascot
- Design **A ("The Classic")**: bald, wild white side hair, giant bushy eyebrows, tiny glasses on a big nose, walrus mustache, red bow tie, lab coat, stethoscope
- Name: still to be decided
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
