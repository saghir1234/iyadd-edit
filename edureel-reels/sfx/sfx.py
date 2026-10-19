#!/usr/bin/env python3
"""Synthesised SFX for EduReel reels + automatic cue sheet from a reel spec.

  python3 sfx.py kit                               build kit/*.wav
  python3 sfx.py mix SPEC.json VIDEO.mp4 OUT.mp4    cue every motion from the spec, mix under the speech, remux
"""
import json, os, subprocess, sys, wave
import numpy as np
SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__)); KIT = os.path.join(HERE, 'kit')
rng = np.random.default_rng(7)
t_ = lambda d: np.arange(int(d * SR)) / SR

def bandnoise(n, f_lo, f_hi):
    X = np.fft.rfft(rng.normal(0, 1, n)); f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < f_lo) | (f > f_hi)] = 0; return np.fft.irfft(X, n)
def sweep_noise(d, f0, f1, q=0.35):
    """noise through a moving band-pass (frame-wise FFT filter)"""
    n = int(d * SR); hop = 256; N = 4 * hop; out = np.zeros(n + N); win = np.sqrt(np.hanning(N + 1)[:-1])
    src = rng.normal(0, 1, n + N)
    for i in range(0, n, hop):
        p = i / n; fc = f0 * (f1 / f0) ** p
        seg = src[i:i + N] * win; X = np.fft.rfft(seg); f = np.fft.rfftfreq(N, 1 / SR)
        X *= np.exp(-((np.log2(np.maximum(f, 1) / fc)) / q) ** 2); y = np.fft.irfft(X, N) * win
        out[i:i + N] += y
    return out[N // 2:N // 2 + n] / 2
def env(n, a, d_shape):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na) ** 2
    return e * d_shape
def norm(x, db=-1): return x / (np.abs(x).max() + 1e-9) * 10 ** (db / 20)
def save(name, x):
    os.makedirs(KIT, exist_ok=True); x = norm(x); x[:32] *= np.linspace(0, 1, 32); x[-256:] *= np.linspace(1, 0, 256)
    with wave.open(os.path.join(KIT, name + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())

def kit():
    # whoosh: air sweeping up then away (transitions)
    d = .55; t = t_(d); x = sweep_noise(d, 300, 4200, .45); x *= np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.6 * (t / d) ** .3; save('whoosh', x)
    # swish: short fast swipe (cards, text slides)
    d = .26; t = t_(d); x = sweep_noise(d, 900, 6000, .5); x *= np.sin(np.pi * t / d) ** 2; save('swish', x)
    # back: reverse-ish whoosh returning to the speaker
    d = .45; t = t_(d); x = sweep_noise(d, 3500, 400, .45); x *= np.sin(np.pi * t / d) ** 1.8; save('back', x)
    # impact: sub drop + transient + short tail (key words, endings)
    d = 1.4; t = t_(d); f = 70 * np.exp(-t * 2.2) + 32; ph = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(ph) * np.exp(-t / .38); hit = bandnoise(len(t), 60, 3500) * np.exp(-t / .025)
    tail = bandnoise(len(t), 200, 2000) * np.exp(-t / .25) * .12; save('impact', sub + .55 * hit + tail)
    # thud: lighter body hit (stamps, drops)
    d = .45; t = t_(d); sub = np.sin(2 * np.pi * (110 * np.exp(-t * 6) + 55) * t) * np.exp(-t / .09)
    cl = bandnoise(len(t), 800, 7000) * np.exp(-t / .006); save('thud', sub + .5 * cl)
    # pop: soft text pop-in
    d = .16; t = t_(d); x = np.sin(2 * np.pi * (520 + 380 * np.exp(-t * 40)) * t) * np.exp(-t / .035) + .25 * bandnoise(len(t), 2000, 9000) * np.exp(-t / .004); save('pop', x)
    # tick: UI tick / check / counter
    d = .09; t = t_(d); x = np.sin(2 * np.pi * 1750 * t) * np.exp(-t / .012) + .4 * np.sin(2 * np.pi * 3500 * t) * np.exp(-t / .006); save('tick', x)
    # shimmer: glow / light / flare
    d = 1.6; t = t_(d); x = np.zeros(len(t))
    for k in range(14):
        f0 = rng.uniform(1800, 6500); st = rng.uniform(0, .35); tt = np.clip(t - st, 0, None)
        x += np.sin(2 * np.pi * f0 * tt) * np.exp(-tt / rng.uniform(.25, .6)) * (t > st) * rng.uniform(.4, 1)
    x *= env(len(t), .05, 1); x += .3 * sweep_noise(d, 5000, 9000, .6) * np.exp(-t / .5); save('shimmer', x)
    # riser: tension up into a reveal
    d = 1.0; t = t_(d); f = 180 * (6 ** (t / d)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / d) ** 2 * .6 + sweep_noise(d, 500, 7000, .5) * (t / d) ** 2.5; save('riser', x)
    # flash: camera-like white flash
    d = .5; t = t_(d); x = bandnoise(len(t), 2500, 12000) * np.exp(-t / .07) + .5 * sweep_noise(d, 6000, 2000, .5) * np.exp(-t / .2); save('flash', x)
    # tear: paper rip
    d = .7; t = t_(d); x = np.zeros(len(t)); n = bandnoise(len(t), 1200, 8000)
    for k in range(60):
        c = int(rng.uniform(0, .55) * SR); L = int(rng.uniform(.004, .02) * SR); x[c:c + L] += n[c:c + L] * rng.uniform(.3, 1)
    x *= np.sin(np.pi * t / d) ** .5; save('tear', x)
    # scroll: soft finger flick on glass
    d = .2; t = t_(d); x = sweep_noise(d, 1500, 3500, .6) * np.sin(np.pi * t / d) ** 2 * .7 + np.sin(2 * np.pi * 900 * t) * np.exp(-t / .01) * .4; save('scroll', x)
    # down: light going out (falling tone + low swell)
    d = 1.5; t = t_(d); f = 700 * (0.25 ** (t / d)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .7) * .6 + bandnoise(len(t), 40, 160) * np.exp(-t / .6); save('down', x)
    # drone: airy low bed for surreal scenes
    d = 3.0; t = t_(d); x = bandnoise(len(t), 70, 420) * .8 + np.sin(2 * np.pi * 55 * t) * .3; x *= np.minimum(1, t / .6) * np.minimum(1, (d - t) / .8); save('drone', x)
    print('kit:', sorted(os.listdir(KIT)))

def load(name):
    with wave.open(os.path.join(KIT, name + '.wav')) as w: return np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32767

GAIN = {'whoosh': -14, 'swish': -15, 'back': -19, 'impact': -8, 'thud': -11, 'pop': -14, 'tick': -15, 'shimmer': -16,
        'riser': -16, 'flash': -14, 'tear': -13, 'scroll': -14, 'down': -14, 'drone': -22}

def cues(S):
    C = []
    def c(t, f, g=0):
        if t >= 0: C.append((round(t, 3), f, g))
    style = 'gold' if 'headlines' in S else 'full'
    if style == 'full':
        for o in S.get('overlays', []):
            for w in o.get('words', []): c(w['at'] - .02, 'impact' if w.get('color') == 'gold' and w.get('size', 60) >= 70 else 'pop', -6 if w.get('color') == 'gold' and w.get('size', 60) >= 70 else 0)
            for x in o.get('texts', []): c(x['at'] - .02, {'key': 'impact', 'soft': 'pop', 'small': 'tick'}[x.get('kind', 'key')], -6 if x.get('kind', 'key') == 'key' else 0)
            if o.get('tag'): c(o['tag']['at'] - .01, 'thud'); c(o['tag']['at'] + .05, 'swish', -4)
            if o.get('curve'): c(o['curve']['at'], 'swish', -2)
        for s in S.get('scenes', []):
            t0, t1, ty = s['t0'], s['t1'], s['type']
            c(t0 - .05, 'flash') if s.get('trans') == 'flash' else c(t0 - .3, 'whoosh')
            if t1 < S['duration'] - .05: c(t1 - .2, 'back')
            if ty in ('window',): c(t0 + .05, 'shimmer'); c(t0, 'drone')
            if ty == 'stairs': c(t0, 'drone', 2); c(t0 + 2.6, 'drone', 2)
            if s.get('dimAt') is not None: c(t0 + s['dimAt'], 'down')
            if ty == 'phone':
                c(t0 + .05, 'tick'); [c(t0 + f - .02, 'scroll') for f in s.get('flicks', [])]
            if ty == 'scale' and s.get('tallAt') is not None: c(t0 + s['tallAt'] - .9, 'riser'); c(t0 + s['tallAt'] + .2, 'impact', -4)
            if ty == 'board': [c(t0 + r['at'], 'tick', 3) for r in s.get('rows', [])]; c(t0 + .2, 'thud', -6)
            if ty == 'symbol': c(t0 - .1, 'riser', -2); c(t0 + .5, 'impact')
            if ty == 'pedestal': c(t0 + .45, 'thud'); c(t0 + .6, 'shimmer', -4)
            if ty == 'cards':
                for cd in s.get('cards', []): c(t0 + cd['at'], 'swish'); c(t0 + cd['at'] + .3, 'tick', -2)
            if ty == 'loop':
                c(t0 + .05, 'whoosh', -6)
                for k in s.get('counts', []): c(t0 + k['at'], 'tick', 3)
            for w in s.get('words', []) or []:
                if w.get('drop'): c(t0 + w['at'] + .12, 'thud', 2)
                elif w.get('stamp') or (ty == 'card' and w.get('mode', 'stamp') == 'stamp'): c(t0 + w['at'], 'thud'); c(t0 + w['at'] + .01, 'impact', -10)
                else: c(t0 + w['at'] - .02, 'impact' if w.get('color') in ('red', 'redink') else 'pop', -5 if w.get('color') in ('red', 'redink') else 0)
            for x in s.get('texts', []) or []: c(t0 + x['at'] - .02, {'key': 'impact', 'soft': 'pop', 'small': 'tick'}[x.get('kind', 'key')], -6 if x.get('kind', 'key') == 'key' else 0)
    else:  # cinematic-gold spec
        for h in S['headlines']:
            c(h['t0'] - .05, 'swish', -2)
            ats = h.get('ats') or []
            if ats: c(ats[-1] - .02, 'impact', -8)
            else: c(h['t0'] + .3, 'pop')
        for k in S.get('cuts', []):
            t0, t1, ty = k['t0'], k['t1'], k['type']; c(t0 - .3, 'whoosh')
            if t1 < S['duration'] - .05: c(t1 - .2, 'back')
            if ty == 'word': c(t0 + .05, 'thud'); c(t0 + .3, 'impact', -4); c(t0 + k.get('subAt', .9), 'pop') if k.get('sub') else None
            if ty == 'tear': c(t0 + .05, 'thud', -4); c(t0 + k['tearAt'], 'tear')
            if ty == 'lines': [c(t0 + L['at'], 'impact' if not L.get('plain') else 'pop', -6 if not L.get('plain') else 0) for L in k['lines']]
            if ty == 'versus':
                c(t0 + .1, 'swish'); [c(t0 + L['at'], 'pop') for L in k['left'] + k['right']]
                if k.get('bottom'): c(t0 + k['bottom']['at'], 'impact', -6)
            if ty == 'cards':
                for cd in k['cards']:
                    c(t0 + cd['at'], 'swish'); c(t0 + cd['at'] + .35, 'thud', -6)
                    if cd.get('flash'): c(t0 + cd['at'] + cd['flash'], 'shimmer', -4)
            if ty == 'counter': c(t0 + .1, 'impact', -6)
            if k.get('kicker'): c(t0 + .15, 'tick', -3)
    return sorted(C)

def mix(spec, video, out):
    S = json.load(open(spec)); C = cues(S)
    dur = S['duration']; n = int((dur + 2) * SR); bus = np.zeros(n)
    cache = {}
    for t, f, g in C:
        x = cache.setdefault(f, load(f)); i = int(t * SR); L = min(len(x), n - i)
        if L > 0: bus[i:i + L] += x[:L] * 10 ** ((GAIN[f] + g) / 20)
    bus = bus[:int(dur * SR)]
    tmp = out + '.sfx.wav'
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(bus, -1, 1) * 32767).astype(np.int16).tobytes())
    # speech stays on top: sfx bus is side-chain ducked by the voice, then summed and limited
    fc = ('[0:a]aresample=48000,asplit=2[v][vk];[1:a]aformat=channel_layouts=stereo[s];'
          '[s][vk]sidechaincompress=threshold=0.06:ratio=2:attack=8:release=200[sd];'
          '[v][sd]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-i', tmp, '-filter_complex', fc, '-map', '0:v', '-map', '[a]',
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out], check=True)
    os.remove(tmp); print(f'{out}: {len(C)} sfx cues')
    json.dump(C, open(out.rsplit('.', 1)[0] + '.sfx.json', 'w'))

if __name__ == '__main__':
    {'kit': lambda: kit(), 'mix': lambda: mix(*sys.argv[2:5])}[sys.argv[1]]()
