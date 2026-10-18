# EduReel: two reels from the Yasser Al-Huzaimi episode

Edited in the EduReel house style (Cinematic Gold layout recoloured to the EduReel brand: navy, cyan → purple → magenta, Cairo, active caption word in cyan).

| Reel | Source ranges (s) | Length | Cutaways |
|---|---|---|---|
| A: «الناس لا تفرح بسقطة القدوة» | 1498.4–1508.4, 1514.1–1537.15 | 33.1 s | 6 (tear, lines, versus, lines, light lines, word) |
| B: «المجموعة تكافح على الثبات» | 1234.6–1261.5, 1272.45–1284.95, 1285.45–1291.98 | 45.9 s | 7 (word, cards, lines, word, cards, tear, lines) |

Rebuild (MP4s are git-ignored; `.srt` files are in `out/`):
```bash
python3 engine/cut_panel.py SOURCE.mp4 ranges.json A panel_A.mov
PLAYWRIGHT_PATH=/opt/node22/lib/node_modules/playwright bash engine/make_reel.sh reel_A.py panel_A.mov out/EduReel_A_sqtat_alqudwa.mp4
```
`cut_panel.py` accepts a per-range crop (`[start, end, "W:H:X:Y"]`) because the camera angle changes between ranges.
