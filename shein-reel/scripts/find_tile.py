#!/usr/bin/env python3
"""python3 scripts/find_tile.py <screen.png> <product_original.(png|webp|jpg)> [x0,y0,x1,y1]

Finds where the product's own photo sits on a results screen, so the cut-out can lift out of its exact place.
Prints the tile rect for config.json ("tile": [x0, y0, x1, y1]) = the object's box, not the whole tile.
Optional search region speeds it up and avoids matching a lookalike. Needs: pip install opencv-python numpy pillow
"""
import sys
import cv2, numpy as np
from PIL import Image
scr = cv2.imread(sys.argv[1])
reg = [int(v) for v in sys.argv[3].split(',')] if len(sys.argv) > 3 else [0, 0, scr.shape[1], scr.shape[0]]
region = scr[reg[1]:reg[3], reg[0]:reg[2]]
o = np.array(Image.open(sys.argv[2]).convert('RGBA'))
a = o[..., 3:4] / 255.0
rgb = (o[..., :3][..., ::-1] * a + 255 * (1 - a)).astype(np.uint8)          # flatten on white, like a tile
best = None
for S in range(120, min(region.shape[1], 900), 2):
    tpl = cv2.resize(rgb, (S, int(S * rgb.shape[0] / rgb.shape[1])), interpolation=cv2.INTER_AREA)
    if tpl.shape[0] > region.shape[0] or tpl.shape[1] > region.shape[1]: continue
    r = cv2.matchTemplate(region, tpl, cv2.TM_CCOEFF_NORMED); _, v, _, loc = cv2.minMaxLoc(r)
    if best is None or v > best[0]: best = (v, S, loc)
v, S, (lx, ly) = best
alpha = o[..., 3]
ys, xs = np.where(alpha > 20) if alpha.min() < 250 else np.where((255 - rgb).sum(2) > 30)
k = S / o.shape[1]
box = [reg[0] + lx + xs.min() * k, reg[1] + ly + ys.min() * k, reg[0] + lx + (xs.max() + 1) * k, reg[1] + ly + (ys.max() + 1) * k]
print(f'match score {v:.3f} (above 0.9 is sure; below 0.8, check by eye: badges and buttons over the photo lower it)')
print('"tile": [' + ', '.join(f'{b:.0f}' for b in box) + ']')
