# Scout reels

Two compositions: `Reel` (src/Reel.tsx, scouting law) and `Survival` (src/Survival.tsx, the rule of threes).

Arabic talking-head reel (scouting law: «الكشاف طاهر الفكر والقول والعمل») with reference-style motion graphics.

Pipeline (scripts/):
1. `transcribe.py src.mp4` → `src/words.json` (faster-whisper medium, Arabic, word timings)
2. `align.py src.mp4 T.npy` → per-frame zoom transform of the source (it has a digital punch-in at ~5.5 s)
3. `declip.py src.mp4 clean.mp4 T.npy` (reel 2: `STATIC=1 BAND=630,730 THRESH=205`, then upscaled to 1080×1920 into public/survival/talk.mp4) → removes the old burned-in captions (white-text mask, widened in time, filled from the nearest clean frame)
4. `fixtop.py src.mp4 clean.mp4 public/talk.mp4` → the titles over the wall are replaced by a clean background plate (removes their shadow too)
5. `bash scripts/render.sh [survival]` → Remotion picture + `sound.py` voice/SFX mix (user's SFX library, ducked under the voice) → `out/final.mp4`

`node scripts/stills.mjs 3.5 12.9 …` renders preview stills to `out/stills/`.
`public/scout.png` is the AI-generated Lebanese scouts photo, animated in code (push-in, waving flag, light leak).
