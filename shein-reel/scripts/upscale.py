#!/usr/bin/env python3
"""python3 scripts/upscale.py <in.png> <out.png>   (optional, only for small assets you will show big)

4x upscale with Real-ESRGAN. The alpha channel is upscaled separately and re-sharpened, and edge colours are
pushed outward first so no background tint bleeds into the edge.
Setup once:  pip install torch spandrel opencv-python pillow
             curl -L -o models/RealESRGAN_x4plus.pth https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth
"""
import os, sys
import numpy as np, cv2, torch, spandrel
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = np.array(Image.open(sys.argv[1]).convert('RGBA')).astype(np.float32)
rgb, a = src[..., :3], src[..., 3] / 255
m = (a > 0.6).astype(np.uint8)
fill = cv2.inpaint(rgb.astype(np.uint8), (1 - m) * 255, 5, cv2.INPAINT_TELEA)
model = spandrel.ModelLoader().load_from_file(os.path.join(ROOT, 'models', 'RealESRGAN_x4plus.pth')).eval()
dev = 'mps' if torch.backends.mps.is_available() else ('cuda' if torch.cuda.is_available() else 'cpu')
model.to(dev)
t = torch.from_numpy(fill.astype(np.float32) / 255).permute(2, 0, 1)[None].to(dev)
with torch.no_grad(): up = model(t)[0].clamp(0, 1).permute(1, 2, 0).cpu().numpy()
H, W = up.shape[:2]
al = cv2.GaussianBlur(cv2.resize(a, (W, H), interpolation=cv2.INTER_CUBIC), (0, 0), 1.2)
al = np.clip((al - 0.5) * 2.2 + 0.5, 0, 1)
Image.fromarray(np.dstack([up * 255, al * 255]).astype(np.uint8), 'RGBA').save(sys.argv[2])
print('saved', sys.argv[2], W, 'x', H)
