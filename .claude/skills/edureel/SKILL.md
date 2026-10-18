---
name: edureel
description: EduReel (إديوريل, @edureel.studio) house style for editing vertical reels. It holds the EduReel brand kit (neon cyan/purple/magenta on deep navy, Cairo + Comfortaa fonts, caption theme) and four saved motion-graphics styles — Cinematic Gold (with a working 1080×1920 renderer), Crimson Kinetic, Noir Surreal and Amber Cinematic. Use whenever the user asks to edit a video or reel for EduReel, mentions "edureel", "my brand colours", "my style", or names one of these styles (cinematic gold, crimson kinetic, noir surreal, amber cinematic), or wants motion graphics or captions "like before".
---

# EduReel house style

Brand kit + four motion-graphics styles for Arabic (and English) 9:16 reels. All paths below are relative to this skill folder.

## 1. Pick the look
Ask once if the user hasn't said which style or whether to use the brand colours. Default: **Cinematic Gold** layout with **EduReel colours**.

| Style | Folder | Look | Ready to render? |
|---|---|---|---|
| Cinematic Gold | `styles/cinematic-gold/` | dark charcoal + animated gold serif headlines, speaker in a framed square panel, full-screen cutaways (word disc, cards, counter, split, torn paper, typographic lines) | **Yes**: `engine/` |
| Crimson Kinetic | `styles/crimson-kinetic/` | full-screen speaker ↔ crimson scenes, glowing pink sphere, Quranic verse, big glowing white words with motion blur, stacked word sizes, pale-pink flash beat | Spec + reference; adapt the engine |
| Noir Surreal | `styles/noir-surreal/` | dark moody speaker shots, surreal silhouette / stairs scenes, white card with black brush calligraphy + red punch word, gold stacked words + white silhouette figure | Spec + reference; needs images |
| Amber Cinematic | `styles/amber-cinematic/` | teal/orange grade, glossy 3D props on burnt orange, italic script + bold orange key word, UI cards, lens flares | Spec + reference; needs images |

Read the chosen style's `STYLE.md` (palette, typography, scene types, motion) and look at its `contact-sheet` before designing. The reference clips and frames are other creators' work: use them as reference only, never in output.

## 2. Brand kit (`brand/`)
- `theme.json`: colour tokens, gradients, glow values, fonts, motion notes
- `edureel.css`: CSS variables and classes (`.er-bg-glow`, `.er-grad-text`, `.er-neon-cyan|purple|magenta`, `.er-caption`, `.er-frame`, `.er-ring`, `.er-rule`)
- `captions-theme.json`: arabic-reels caption theme (white Cairo, black outline, active word `#3FE0F0`, one line, no box)
- `fonts/`: Cairo (Arabic), Comfortaa (Latin), both OFL
- Core colours: bg `#0B0E14`, cyan `#3FE0F0`, purple `#9854C1`, violet `#7849B8`, magenta `#D47EE5`; gradient cyan → purple → magenta.

To apply EduReel colours to Cinematic Gold, override the gold tokens in `engine/mg.html` (`--gold`, `#E2C47C` lines, scene backgrounds) with the brand gradient and glows, and use the navy background.

## 3. Workflow (talking-head source → reels)
Use the `arabic-reels` skill for choosing clips and the editorial rules if it is available. The mechanics that worked:

1. **Source**: YouTube downloads are often blocked from cloud sessions (403 / "not a bot"). Ask for the file (a Google Drive link "anyone with the link" works with `drive.usercontent.google.com/download?id=…&export=download&confirm=t`).
2. **Transcript**: YouTube auto-subs (word-timed VTT) plus faster-whisper `large-v3` on just the clip windows (load WAV as numpy; this PyAV is incompatible with file paths). Settle any disagreement with the video's burned-in subtitles when present. Fix spelling (hamza, ة) but keep the dialect.
3. **Cuts**: confirm every boundary on audio energy (RMS per 20 ms) so no word is clipped. Hide joins under a cutaway.
4. **Panel**: `python engine/cut_panel.py SOURCE.mp4 ranges.json rN panel.mov [--crop W:H:X:Y]` (square crop above any burned-in subtitles → 990×990, denoise + lanczos + light sharpen).
5. **Reel definition**: a Python file with `REEL = {duration, words, headlines, cuts}`. See `styles/cinematic-gold/examples/r1–r6.py` and the scene-type table in `styles/cinematic-gold/STYLE.md`. `words` is `word@seconds`, with `|` to force a caption break.
6. **Preview stills** before rendering: `node engine/render.js spec.json panel.mov x --frames 1.5,6.5 --png-dir previews` (build `spec.json` first with `python engine/build.py reel.py spec.json`).
7. **Render**: `PLAYWRIGHT_PATH=… bash engine/make_reel.sh reel.py panel.mov out.mp4`. This gives 1080×1920, CRF 18, ≤14 Mbps, AAC 256k, plus an `.srt`, and it fails unless the frame count is exact.
8. **Check**: sample frames at the cutaways and the final frame, decode the whole file, and send each reel as soon as it passes.

## Pitfalls already hit
- ffmpeg 6.1 drops frames when a PNG sequence feeds `overlay` directly. Always convert to qtrle alpha `.mov` first (`make_reel.sh` does this).
- Gold `background-clip:text` must sit on each word span, not on the parent.
- A cutaway that ends the reel must not fade out; back-to-back cutaways must overlap.
- Gold on light scenes needs the darker bronze gradient.
- Keep captions out of cutaway text zones (captions y≈1560–1740 at 1080p).
