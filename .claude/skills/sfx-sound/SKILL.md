---
name: sfx-sound
description: The user's own sound-effects library (58 files: whooshes, soft whooshes, impacts, bass drop, clicks/UI, camera flash/shutter, shine, risers, page flip, glitch, typing) with a catalog of what each sound is, its length and the exact peak to sync on, plus a mixer that puts a sound on every motion of a reel. Use whenever the user asks to add SFX / sound effects / "sfx sound" to a video or reel, wants sounds between shots or on motion graphics, or mentions their SFX library. Only use sounds from this library — never synthesise or download others.
---

# SFX Sound: the user's library

All sounds are in `sounds/` (from the user's "sfx effects" folder). **Use only these files.** Do not synthesise sounds or fetch other libraries.

`catalog.json` lists every file with:
- `category`: transition, transition-short, soft-transition, impact, impact-big, impact-light, click-ui, camera, shine, riser, paper, glitch, typing, meme
- `dur`, `onset` (first sound), `peak` (loudest point, in seconds), `peak_dbfs`
- `use`: what it's good for

## How to place a sound
1. Pick by category (table below).
2. **Sync the peak, not the file start**: start the sound at `motion_time − peak`. A whoosh peaks on the cut, a riser lands on the reveal, a click starts on the pop-in.
3. Normalise every clip (several files peak above 0 dBFS, some are very quiet, e.g. Shine −18, Impact.wav −12, Suspense Riser −22), then set the level.
4. Keep the voice on top: side-chain duck the SFX bus under the speech.
5. Rotate variants (Whoosh 1 → 2 → 3 …) so repeats don't sound identical.
6. Files with several sounds inside must be trimmed to one: `Impact Sound Effect.mp3` (4 hits), `Whoosh Sound Effect.mp3` (7 whooshes), `imnotcreating sfx Swoosh.mp3` (2), `Camera Shutter Sound Effect.mp3` (several).

| Motion | Sounds | Level (after normalising to −1 dBFS) |
|---|---|---|
| Cut into a full-screen motion graphic | Whoosh 1/2/3, Whoosh.wav, Swoosh (first half) | −17 dB |
| Back from motion to the speaker | Soft Whoosh 01/02/03/05 | −21 dB |
| Card / text slide, tag word, slash line | Clean whoosh, whoosh snap | −18 dB |
| Key word punch-in | Impact.wav, Impact Sound Effect (one hit) | −11 dB |
| Final payoff / hook line | Bass Drop (once per reel), Thunder opener | −9 dB |
| Stamp (calligraphy card), tag | Echo Snap, Switch | −15 dB |
| Word pop-in | Clic souris, Digital Camera click, Click.wav | −17 dB |
| Checkmark, counter, step highlight | Bip autofocus, Digital autofocus, Menu UI | −19 dB |
| Loop / process | Engrenages | −19 dB |
| Glow, light, highlight | Shine, Glass Shine, Precious Stone 01 | −19 dB |
| Build-up into a reveal | Low Rise, Riser.wav, Inertia Ramp, Riser verre, silex riser | −18 dB |
| Flash to white | Camera Flash (shutter discret for a freeze-frame) | −16 dB |
| Paper tear / page | Page Flip | −15 dB |
| Light flicker / error | Glitch | −17 dB |
| Tension bed | Suspense Riser | −27 dB |
| On-screen typing | phone typing, typing perso, Computer Keyboard (trim) | −22 dB |

Playful sounds (Ding, Cash Register, Drum Roll, Fahh) only when the user asks for a comedic tone.

## Mixer
`scripts/mix_sfx.py mix SPEC.json VIDEO.mp4 OUT.mp4` reads a reel spec from the EduReel engines (Cinematic Gold `headlines/cuts`, or the full-screen Noir / Amber `overlays/scenes`), puts a sound on every motion using the table above (peak-aligned, rotating variants), ducks the SFX under the voice and remuxes the video without re-encoding. It writes the cue list next to the output (`*.sfx.json`). `SFX_LIB` can point to another copy of `sounds/`.

Only mix when the user asks for it; adding the library to a reel is a separate request from storing it.
