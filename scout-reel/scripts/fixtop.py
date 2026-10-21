# Replace masked pixels in the static upper area with a per-shot clean plate (median of caption-free frames).
import cv2, numpy as np, sys, subprocess
src, clean, out = sys.argv[1:4]
def load(p):
    c = cv2.VideoCapture(p); L = []
    while True:
        ok, f = c.read()
        if not ok: break
        L.append(f)
    return np.stack(L)
S = load(src); C = load(clean); N, H, W, _ = S.shape
M = np.unpackbits(np.load(clean + ".mask.npy"), axis=-1)[..., :W].astype(bool)
YT = 395  # rows above the speaker's head (zoomed shot: head top ~ y 405)
def plate(rng):
    idx = [i for i in rng if not M[i, :YT].any()]
    print(len(idx), "clean frames for plate")
    return np.median(S[idx, :YT], 0).astype(np.uint8)
segs = [(range(0, 165), plate(range(20, 165))), (range(195, N), plate(range(195, N)))]
for rng, P in segs:
    for i in rng:
        m = M[i, :YT]
        if not m.any(): continue
        a = cv2.GaussianBlur(cv2.dilate(m.astype(np.uint8), np.ones((71, 71))).astype(np.float32), (0, 0), 12)[..., None]
        C[i, :YT] = (P * a + C[i, :YT] * (1 - a)).astype(np.uint8)
p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "30",
                      "-i", "-", "-i", src, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-crf", "14",
                      "-pix_fmt", "yuv420p", "-c:a", "copy", out], stdin=subprocess.PIPE)
p.stdin.write(C.tobytes()); p.stdin.close(); p.wait()
