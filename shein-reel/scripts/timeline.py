#!/usr/bin/env python3
"""python3 scripts/timeline.py → src/timeline.json (the film) and src/timeline_short.json (the short cut).

Reads src/config.json. One timeline drives the picture (Remotion) and the sound mix (scripts/sound.py),
so a sound can never drift from its action. Change a pace here, never by hand in the JSON.
"""
import json, os, struct, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(ROOT, 'src', 'config.json')))

def png_size(rel):
    with open(os.path.join(ROOT, 'public', rel), 'rb') as f:
        head = f.read(24)
    if head[:8] != b'\x89PNG\r\n\x1a\n':
        sys.exit(f'{rel}: product and container images must be PNG with transparency')
    return list(struct.unpack('>II', head[16:24]))

def r3(v):
    if isinstance(v, float): return round(v, 3)
    if isinstance(v, list): return [r3(x) for x in v]
    if isinstance(v, dict): return {k: r3(x) for k, x in v.items()}
    return v

def speech(rel, gap=0.22):
    """A voice-over file → (onsets of its spoken parts split on pauses ≥ gap, [(word-start guess, dip depth)], end of speech)."""
    import numpy as np
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(ROOT, rel), '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32); hop = 960                       # 20 ms frames
    db = np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + hop] ** 2)) + 1e-9) for i in range(0, len(x) - hop, hop)])
    live = db > db.max() - 35; idx = np.where(live)[0]
    parts, dips = [idx[0] * 0.02], []
    for a, b in zip(idx[:-1], idx[1:]):
        if (b - a) * 0.02 >= gap: parts.append(b * 0.02)
    for i in range(idx[0] + 3, idx[-1] - 5):                            # a word starts where the level climbs out of a dip
        if db[i] < db.max() - 14 and db[i + 1] - db[i] > 6: dips.append(((i + 1) * 0.02, db.max() - db[i]))
    return parts, dips, (idx[-1] + 1) * 0.02

def build(short):
    items = CFG['items']
    bags = [i for i in items if i.get('into', 'bag') == 'bag']
    baskets = [i for i in items if i.get('into') == 'basket']
    if items != bags + baskets:
        sys.exit('config.items: put every "into": "bag" item before the "basket" ones (the basket pours into the bag at the end)')
    if short:
        items = bags[:1] + baskets if baskets else bags[:1] + bags[-1:]
    words = len(CFG['opening']['question'].split())
    w0, wstep = (0.15, 0.15) if short else (0.2, 0.18)
    V = CFG.get('voice') or {}
    if V.get('open'):                                   # each word of the question lands on its spoken word
        parts, dips, end = speech(V['open'])
        best = sorted((d for d in dips if d[0] > parts[0] + 0.1), key=lambda d: -d[1])[:words - 1]   # the deepest dips = word breaks
        ons = V.get('openWords') or [parts[0]] + sorted(t for t, _ in best)                        # or measure by ear and set them
        while len(ons) < words: ons.append(ons[-1] + 0.15)
        v0 = max(0.0, w0 - ons[0])
        TL = {'vo_open': v0, 'words': [v0 + o for o in ons]}
        pull0 = v0 + end + 0.08
        if V.get('openSub') is not None: TL['subAt'] = v0 + V['openSub']
    else:
        TL = {'words': [w0 + i * wstep for i in range(words)]}
        pull0 = w0 + (words - 1) * wstep + (0.45 if short else 0.64)
    TL['pull'] = [pull0, pull0 + (0.6 if short else 0.75)]
    R = []
    # hold = how long a product stays big before it drops: long enough to be seen (about a second in the film)
    bag_t = (0.62, 0.76, 0.3, 0.25, 0.3) if short else (0.76, 0.94, 0.35, 0.27, 0.38)
    basket_t = (0.6, 0.7, 0.3, 0.25) if short else (0.62, 0.74, 0.34, 0.32)
    for n, it in enumerate(items):
        q = it['query']
        r = {'id': it['id'], 'q': q, 'box': it.get('into', 'bag')}
        fast = r['box'] == 'basket'
        if n == 0:
            r['type'] = TL['pull'][1] + 0.15; r['step'] = 0.1 if short else 0.13
            r['enter'] = r['type'] + len(q) * r['step'] + 0.05
            r['cut'] = r['enter'] + 0.2; r['tap'] = r['cut'] + (0.33 if short else 0.54); r['pop'] = r['tap'] + 0.04
        else:
            S = R[-1]['end']
            step = max(0.05, (0.07 if short else 0.08) if fast else (0.1 if short else 0.12) - 0.01 * min(3, len(q) // 3))
            if len(q) > 6: step = min(step, 0.065)
            r.update(start=S, clear=S + (0.05 if short else 0.06), type=S + (0.11 if short else (0.13 if fast else 0.16)), step=step)
            r['enter'] = r['type'] + len(q) * step + 0.05
            r['cut'] = r['enter'] + (0.16 if short else (0.18 if fast else 0.2))
            r['tap'] = r['cut'] + (0.28 if short else (0.32 if fast else 0.36)); r['pop'] = r['tap'] + 0.04
        if r['box'] == 'bag':
            up, fall, close, inn, end = bag_t
            r.update(up=r['pop'] + up, fall=r['pop'] + fall); r['close'] = r['fall'] + close; r['in'] = r['close'] + inn; r['end'] = r['in'] + end
        else:
            up, fall, inn, end = basket_t
            r.update(up=r['pop'] + up, fall=r['pop'] + fall); r['in'] = r['fall'] + inn; r['end'] = r['in'] + end
        R.append(r)
    P0 = R[-1]['end']
    if any(r['box'] == 'basket' for r in R):
        nb = sum(1 for r in R if r['box'] == 'basket')
        fall, gap, first, move = (0.32, 0.08, 0.27, 0.45) if short else (0.36, 0.09, 0.3, 0.5)
        TL['pour'] = {'start': P0, 'move': [P0, P0 + move], 'bagup': P0 + 0.04, 'out': [P0 + first + i * gap for i in range(nb)],
                      'fallDur': fall, 'exit': [P0 + move + 0.05, P0 + move + 0.45]}
        last_in = TL['pour']['out'][-1] + fall
    else:
        TL['pour'] = None
        last_in = P0 - 0.2
    after = 0.2 if short else 0.3
    hold = (CFG.get('final') or {}).get('holdSec', 1.3) * (0.58 if short else 1)
    TL['lift'] = [last_in + after, last_in + after + 0.45]
    TL['whip'] = [TL['lift'][0] + 0.3, TL['lift'][0] + 0.64]
    TL['final'] = [TL['whip'][1], TL['whip'][1] + hold]
    TL['slash'] = [TL['final'][1], TL['final'][1] + 0.28]
    TL['split'] = [TL['slash'][1], TL['slash'][1] + 0.44]
    TL['endText'] = TL['split'][0] + 0.3
    n_lines = len(CFG['ending']['lines'])
    TL['endLines'] = [TL['endText'] + i * 0.14 for i in range(n_lines)]
    tail = 0.0
    if V.get('close'):                                  # each closing line appears as the voice says it
        parts, _, end = speech(V['close'])
        TL['vo_close'] = TL['endText'] - parts[0]
        marks = V.get('closeLines') or parts
        for i in range(min(n_lines, len(marks))): TL['endLines'][i] = TL['vo_close'] + marks[i]
        tail = TL['vo_close'] + end
    TL['accounts'] = TL['endLines'][-1] + (0.45 if V.get('close') else 0.26)
    TL['dur'] = round(max(TL['accounts'] + (1.7 if short else 2.4), tail + (0.9 if short else 1.5)), 2)
    TL['rounds'] = R
    TL['sizes'] = {i['id']: png_size(i['image']) for i in CFG['items']}
    TL['sizes']['__bag'] = png_size(CFG['bag']['image'])
    return r3(TL)

for short, name in ((False, 'timeline.json'), (True, 'timeline_short.json')):
    path = os.path.join(ROOT, 'src', name)
    old = json.load(open(path)) if os.path.exists(path) else {}
    TL = build(short)
    TL['hasMix'] = old.get('hasMix', False)            # set by scripts/sound.py once the mix exists
    json.dump(TL, open(path, 'w'), ensure_ascii=False, indent=1)
    print(f"{name}: {TL['dur']} s  |  " + '  '.join(f"{r['q']}→{r['end']}" for r in TL['rounds']))
