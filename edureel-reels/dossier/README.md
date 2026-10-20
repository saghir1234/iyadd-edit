# Reels 5 and 6

| Reel | Style | Source ranges (s) | Length | Motion | SFX |
|---|---|---|---|---|---|
| 5: «أنت لا تعرف حتى جسدك» (٨٦٪ لم يتعرفوا على أيديهم) | Red Dossier, EduReel colours | see `ranges_new.json` → R5 | 44.2 s | 7 code-drawn scenes (walk, face, study title, hands shuffle, 86 % counter, voice waveform, outro) + 6 chest-keyword overlays, negative-flash cuts, slide-ups, speaker punch-ins | 69 cues |
| 6: «ليش تتأدّب وأنت لحالك؟» (الغزالي) | Cinematic Gold layout, EduReel colours | `ranges_r6.json` | 48.5 s | 6 cutaways (ليش؟ disc, light quote card, tear, lines, versus, final disc) + 5 headlines; bottom captions hide during cutaways | 48 cues |

SFX: only the user's `sfx-sound` library, mixed with `mix_dossier.py` (adds Red Dossier cue rules to the skill's `mix_sfx.py`).
No image generation: every scene is drawn in `mg_dossier.html` / `engine/mg.html`.
