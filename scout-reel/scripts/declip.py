# Remove burned-in white captions: mask pure-white pixels, widen in time, fill from nearest clean frame in the same shot.
import cv2, numpy as np, sys, subprocess
src, out = sys.argv[1], sys.argv[2]
cap = cv2.VideoCapture(src); F = []
while True:
    ok, f = cap.read()
    if not ok: break
    F.append(f)
F = np.stack(F); N, H, W, _ = F.shape
print("frames", N)
mn = F.min(3)
import os
raw = mn > int(os.environ.get('THRESH', 228))
if os.environ.get('BAND'):  # only look for captions inside this row band (y0,y1)
    y0, y1 = map(int, os.environ['BAND'].split(','))
    raw[:, :y0] = False; raw[:, y1:] = False
# drop glasses glare: blobs in face band that are small
T = np.load(sys.argv[3])
T3 = np.tile(np.eye(3), (N, 1, 1)); T3[:, :2] = T
if os.environ.get('STATIC'): T3[:] = np.eye(3)  # locked-off shot
else: T3[:165] = np.eye(3); T3[195:] = np.median(T3[195:], 0)  # first reel: punch-in ramp at frames 165-195
Tinv = np.linalg.inv(T3)
M = np.zeros((N, H, W), bool)
for i in range(N):
    m = raw[i].astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = np.zeros(n, bool)
    for j in range(1, n):
        x, y, w, h, a = st[j]
        if a < 6: continue
        cx, cy, _ = T3[i] @ [x + w / 2, y + h / 2, 1]
        if 380 < cy < 560 and 280 < cx < 480 and h < 40 and w < 70: continue  # glasses glare
        keep[j] = True
    M[i] = keep[lab]
# group nearby strokes so text lines become solid, then dilate for shadow / anti-alias
Mc = np.zeros_like(M)
for i in range(N):
    m = cv2.dilate(M[i].astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_RECT, (15, 9)))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (25, 15)))
    m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)))
    Mc[i] = m > 0
# temporal widening covers fades
R = 12
Mt = Mc.copy()
for d in range(1, R + 1):
    Mt[d:] |= Mc[:-d]; Mt[:-d] |= Mc[d:]
# shot boundaries
g = F[:, ::8, ::8].mean(3)
diff = np.abs(np.diff(g, axis=0)).mean((1, 2))
cuts = [0, N]
print("cuts", cuts)
shot = np.zeros(N, int)
for s in range(len(cuts) - 1): shot[cuts[s]:cuts[s + 1]] = s
outF = F.copy()
for i in range(N):
    m = Mt[i]
    if not m.any(): continue
    fill = np.zeros((H, W, 3), np.float32); have = np.zeros((H, W), bool)
    cache = {}
    def warped(j):
        if np.allclose(T3[i], T3[j]): return F[j], Mt[j]
        A = (Tinv[i] @ T3[j])[:2]
        return (cv2.warpAffine(F[j], A, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE),
                cv2.warpAffine(Mt[j].astype(np.uint8), A, (W, H), flags=cv2.INTER_NEAREST, borderValue=1) > 0)
    for d in range(1, N):
        for j in (i - d, i + d):
            if 0 <= j < N:
                Fj, Mj = warped(j)
                ok = m & ~have & ~Mj
                if ok.any():
                    fill[ok] = Fj[ok]; have |= ok
        if (have | ~m).all() or d > 240: break
    rest = m & ~have
    img = F[i].copy(); img[have & m] = fill[have & m].astype(np.uint8)
    if rest.any():
        img = cv2.inpaint(img, rest.astype(np.uint8) * 255, 7, cv2.INPAINT_TELEA)
    a = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 2.5)[..., None]
    outF[i] = (img * a + F[i] * (1 - a)).astype(np.uint8)
np.save(out + ".mask.npy", np.packbits(Mt, axis=-1))
p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", os.environ.get("FPS", "30"),
                      "-i", "-", "-i", src, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-crf", "14", "-preset", "medium",
                      "-pix_fmt", "yuv420p", "-c:a", "copy", out], stdin=subprocess.PIPE)
p.stdin.write(outF.tobytes()); p.stdin.close(); p.wait()
