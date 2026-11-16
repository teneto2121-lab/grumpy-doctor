# Reference video analysis (5 videos from the FYP)

Analysed with `tools/analyze_video.py`: every frame measured (motion, cuts, palette), word-timed
transcripts, contact sheets of the whole video, and every frame of the hook, cuts and ending.

| Ref | What it is | Length | Speech (words/s) |
|---|---|---|---|
| 1 | Motivational speech, white kinetic text on black (landscape) | 58s | 2.6 |
| 2 | "The most famous prison escape in history": Alcatraz story, moody 3D scenes | 6m01s | 3.8 |
| 3 | "Is it self-defense? But it gets harder": 7 numbered law cases, stick figures | 62s | **4.2** |
| 4 | Ice cream truck horror story for kids, Roblox-style 3D | 2m28s | 2.7 |
| 5 | CapCut tutorial (screen recording, landscape) | 7m54s | 3.4 |
| ours | Ep 06 / 08 / 09 | 36–42s | **2.4–3.1** |

## What the successful ones do (and we don't yet)

1. **Hook = the payoff first.** Ref 3 flashes 5 of its most extreme scenes in the first 1.8s (a new image
   every ~0.2s) under one line of text. Ref 2 opens on the most shocking detail ("the head fell to the floor").
   Ref 5 shows the finished result before explaining. *Ours: the doctor standing under a question.*
2. **The camera never stops moving** (refs 2 and 4): slow dollies, pans, fly-overs in every shot.
   *Ours: mostly static cards with a 3.5% push-in.*
3. **A new picture for every sentence** (ref 3 ≈ every 1–1.5s, ref 4 ≈ every 2s). *Ours: a scene every 4–8s.*
4. **Participation format** (ref 3): three verdict buttons (SELF-DEFENSE / IT DEPENDS / MURDER) are on screen
   the whole time, so viewers guess before every reveal, and a **scoreboard fills up** as each case is decided,
   which makes people stay to see it completed.
5. **Escalation + numbering:** "But it gets harder", "Case 1…7", "three rules". The structure promises more.
6. **Open loop:** ref 2 plants "one question nobody has been able to answer" in the first 20s and pays it off at the end.
7. **Faster narration:** ref 3 speaks at 4.2 words/s, ref 2 at 3.8; ours at 2.4–3.1 (pauses from emotion tags).
8. **Mid-video follow prompt:** ref 3 slides in "FOLLOW FOR MORE FUN LAW" at the halfway point.
9. **Endings:** ref 3 just stops on the last line (instant loop); ref 4 ends on a cliffhanger ("but who's going to free me?").
10. **Captions:** ref 4 shows one huge word at a time; ref 2 uses karaoke (dim → white) and boxes key words.
11. **Length:** the strong performers run 60s+, carried by structure (numbered cases, a story with an open loop).

## The big lesson
Ref 3 is the closest to us and has the *least* animation of all (simple stick figures, nearly static images,
motion score 1.2 vs our 4.2). Its success comes from **format and writing**: payoff-first hook, guessing game,
escalation, fast pace, a new image per sentence. Polish isn't what's holding us back.

## Plan
**Engine (applies to every new episode):**
- `TEASER`: flash 4–6 upcoming climax frames in the first ~1.5s under the hook text
- Continuous camera drift on every card scene (alternating pans + stronger push-in)
- Mid-video follow banner (`FOLLOW FOR MORE ANGRY MEDICINE`)
- Keyword highlight boxes in captions
- Faster delivery: tighter scripts, fewer pause tags, speed ≈ 1.2×

**New format to test: "Myth or Fact?" cases** (60–70s)
- Hook: "Is it a myth? But it gets weirder." + teaser flashes
- 5–7 numbered cases ("Case 1"), a picture per sentence
- Bottom panel with **FACT / MYTH / KINDA** buttons the whole time; each verdict drops a card into its column
- Dr. Grumbles stamps each verdict; escalating weirdness; last case = the wildest (open loop from the start)
