#!/usr/bin/env python3
"""build_audio.py <a.json> <src> <spec.json> <out_dir>

Cuts the reel audio from the original source (48 kHz, untouched gain), shortening
long pauses inside each kept range, and maps word timings onto the new timeline.

spec.json: {"ranges": [[s, e], ...], "fixes": {"old": "new"}, "max_pause": 0.65, "keep_pause": 0.38}
Writes: voice.wav, words.json (reel time), cut.json (source↔reel segments).
"""
import json, subprocess, sys, os
import numpy as np

a_json, src, spec_path, out = sys.argv[1:5]
os.makedirs(out, exist_ok=True)
spec = json.load(open(spec_path))
SR = 48000
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vn', '-ac', '2', '-ar', str(SR), '-f', 's32le', '-'],
                     capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.int32).reshape(-1, 2).astype(np.float64) / 2**31
mono = x.mean(1)

HOP = 0.01
def db_at(t0, t1):
    seg = mono[int(t0 * SR):int(t1 * SR)]
    return 20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-12) if len(seg) else -120

words = []
for s in json.load(open(a_json))['segments']:
    words += [{'w': w['word'].strip(), 's': w['start'], 'e': w['end']} for w in s['words']]

max_pause = spec.get('max_pause', 0.65)
keep_pause = spec.get('keep_pause', 0.38)
thr = spec.get('silence_db', -55)

# 1) split each range into speech segments by removing long silences
segs = []
for r0, r1 in spec['ranges']:
    frames = np.arange(r0, r1, HOP)
    quiet = np.array([db_at(t, t + HOP) < thr for t in frames])
    cur = r0
    i = 0
    while i < len(frames):
        if quiet[i]:
            j = i
            while j < len(frames) and quiet[j]:
                j += 1
            q0, q1 = frames[i], frames[j - 1] + HOP
            if q1 - q0 > max_pause and q0 > r0 and q1 < r1:
                half = keep_pause / 2
                segs.append([cur, q0 + half])
                cur = q1 - half
            i = j
        else:
            i += 1
    segs.append([cur, r1])

# 2) assemble with 12 ms crossfades at every joint
FADE = int(0.012 * SR)
pieces, cut, t_out = [], [], 0.0
for s0, s1 in segs:
    p = x[int(s0 * SR):int(s1 * SR)].copy()
    ramp = np.linspace(0, 1, FADE)[:, None]
    p[:FADE] *= ramp
    p[-FADE:] *= ramp[::-1]
    pieces.append(p)
    cut.append({'src': [round(s0, 3), round(s1, 3)], 'out': [round(t_out, 3), round(t_out + (s1 - s0), 3)]})
    t_out += s1 - s0
y = np.concatenate(pieces)
pcm24 = (np.clip(y, -1, 1) * (2**31 - 1)).astype('<i4').tobytes()
subprocess.run(['ffmpeg', '-v', 'error', '-f', 's32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s24le', '-y', out + '/voice.wav'],
               input=pcm24, check=True)

# 3) map words (only words whose midpoint sits inside a kept segment)
def map_t(t):
    for c in cut:
        if c['src'][0] - 1e-6 <= t <= c['src'][1] + 1e-6:
            return c['out'][0] + (t - c['src'][0])
    return None

fixes = spec.get('fixes', {})
mapped = []
for w in words:
    # anchor on the word's end: transcriber start times often swallow the preceding pause
    end = w['e'] - 0.02
    seg = next((c for c in cut if c['src'][0] - 1e-6 <= end <= c['src'][1] + 1e-6), None)
    if seg is None:
        continue
    s0 = max(w['s'], seg['src'][0])
    if min(w['e'], seg['src'][1]) - s0 < 0.06:  # only a sliver of the word survived the cut
        continue
    s = seg['out'][0] + (s0 - seg['src'][0])
    e = seg['out'][0] + (min(w['e'], seg['src'][1]) - seg['src'][0])
    mapped.append({'w': fixes.get(w['w'], w['w']), 's': round(s, 3), 'e': round(e, 3), 'src': round(w['s'], 3)})

json.dump(mapped, open(out + '/words.json', 'w'), ensure_ascii=False, indent=0)
json.dump({'segments': cut, 'duration': round(t_out, 3)}, open(out + '/cut.json', 'w'), indent=1)
removed = sum(r1 - r0 for r0, r1 in spec['ranges']) - t_out
print(f'voice.wav {t_out:.2f}s · {len(segs)} pieces · {removed:.2f}s of pauses removed · {len(mapped)} words')
