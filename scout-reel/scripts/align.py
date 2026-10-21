import cv2, numpy as np, sys
cap = cv2.VideoCapture(sys.argv[1]); G = []
while True:
    ok, f = cap.read()
    if not ok: break
    G.append(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY))
orb = cv2.ORB_create(3000)
ref = G[0]; kr, dr = orb.detectAndCompute(ref, None)
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
T = []
for i, g in enumerate(G):
    k, d = orb.detectAndCompute(g, None)
    m = bf.match(d, dr)
    src = np.float32([k[x.queryIdx].pt for x in m]); dst = np.float32([kr[x.trainIdx].pt for x in m])
    A, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=2)
    T.append(A)
    if i % 15 == 0: print(i, round(np.hypot(A[0,0], A[1,0]), 3), A[:, 2].round(1), int(inl.sum()))
np.save(sys.argv[2], np.array(T))
