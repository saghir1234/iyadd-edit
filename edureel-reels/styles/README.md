# Noir Surreal + Amber Cinematic reels (EduReel colours)

Two new reels from the same Al-Huzaimi episode, both recoloured to the EduReel brand (navy, cyan → purple → magenta, Cairo, cyan active caption word).
Bottom captions are hidden whenever text is on screen in the middle, so words never appear twice.

| Reel | Style | Source ranges (s) | Length | Motion scenes |
|---|---|---|---|---|
| N: «السوشال ميديا عزلتنا عن أنفسنا» | Noir Surreal | 194.55–204.45, 213.95–225.05, 227.6–257.1, 263.5–269.2 | 56.2 s | 6 full-screen (silhouette head ×2, phone feed, white card ×2, stairs) + 6 speaker overlays |
| M: «التبرير عدو التغيير» + أعرف/أعترف/أقرر/أكرر | Amber Cinematic | see `ranges_new.json` | 45.8 s | 6 full-screen (pinned note, glossy ٤, cube pedestal, step cards ×2, repeat loop) + 5 text pairs |

Rebuild:
```bash
python3 cut_full.py SOURCE.mp4 ranges_new.json N full_N.mov        # amber: GRADE="eq=contrast=1.07:saturation=0.92,colorbalance=bs=0.12:bm=0.05:rh=0.05:rm=0.02:gh=-0.01,vignette=angle=PI/5"
PLAYWRIGHT_PATH=/opt/node22/lib/node_modules/playwright bash make_full.sh mg_noir.html reel_N.py full_N.mov out/EduReel_N_noir_surreal.mp4
```
Symbolic images (silhouettes, stairs, props) are drawn as vector shapes in the templates; card images are stills from the episode.
