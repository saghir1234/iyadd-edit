"""SFX for Red Dossier reels, using the sfx-sound skill's library + mixer (only the user's sounds)."""
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location('m', '/root/.claude/skills/synced/c7313967-e005-4d5f-8994-9c27b98a9c8b_a62f3d0a-2a1b-4c23-b6e0-089e97395e00/sfx-sound/scripts/mix_sfx.py'); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

def cues(S):
    C = []
    def c(t, f, g=0):
        if 0 <= t < S['duration']: C.append((round(t, 3), f, g))
    fl = S.get('flashes', [])
    for t in fl: c(t, 'down', 2); c(t + .02, 'whoosh', -3)
    def txt(x, base):
        t = base + x['at']
        if x.get('color') == 'mag' or x.get('pop'): c(t - .02, 'impact', -4)
        elif x.get('size', 60) >= 70: c(t - .02, 'impact', -8)
        else: c(t - .02, 'pop')
    for o in S.get('overlays', []):
        for x in o['texts']: txt(x, 0)
    sc = S.get('scenes', [])
    for i, s in enumerate(sc):
        t0, t1, T = s['t0'], s['t1'], s['type']
        if s.get('slideIn'): c(t0 + .15, 'swish')
        elif not any(abs(t0 - f) < .05 for f in fl): c(t0, 'whoosh')
        nxt = sc[i + 1] if i + 1 < len(sc) else None
        if t1 < S['duration'] - .05 and not (nxt and nxt.get('slideIn') and abs(nxt['t0'] - t1) < .05) and not any(abs(t1 - f) < .05 for f in fl): c(t1, 'back')
        for x in s.get('texts', []): txt(x, t0)
        if s.get('depth'): c(t0 + s['depth']['at'], 'swish', -4)
        if T == 'walk' and s.get('ghostAt') is not None: c(t0 + s['ghostAt'], 'shimmer'); c(t0 + s['ghostAt'] + .35, 'impact', -6)
        if T == 'face':
            if s.get('blurAt') is not None: c(t0 + s['blurAt'], 'down', -6)
            if s.get('qAt') is not None: c(t0 + s['qAt'], 'impact', -3)
        if T == 'hands':
            for k in range(4): c(t0 + .12 + k * .17, 'tick', -2)
            if s.get('shuffleAt') is not None: c(t0 + s['shuffleAt'], 'gears'); c(t0 + s['shuffleAt'] + .7, 'gears', -3)
            if s.get('hlAt') is not None: c(t0 + s['hlAt'], 'shimmer'); c(t0 + s['hlAt'], 'tick')
        if T == 'counter':
            ca, cd = s.get('countAt', 0), s.get('countDur', 1)
            for k in range(8): c(t0 + ca + cd * (1 - (1 - k / 8) ** 0.5), 'tick', -1)
            c(t0 + ca + cd, 'impact', -2)
        if T == 'voice': c(t0 + .05, 'pop', 2)
        if T == 'outro': c(t0 + .15, 'whoosh', -4); c(t0 + .6, 'shimmer', 2); [c(t0 + .7 + k * .12, 'pop', -6) for k in range(6)]
    C = sorted(C)
    for i in range(len(C) - 1, -1, -1):          # the payoff hit becomes the bass drop
        if C[i][1] == 'impact' and C[i][2] >= -4: C[i] = (C[i][0], 'boom', 0); break
    return C

if __name__ == '__main__':
    S = json.load(open(sys.argv[1]))
    if 'headlines' not in S: m.cues = cues
    m.mix(*sys.argv[1:4])
