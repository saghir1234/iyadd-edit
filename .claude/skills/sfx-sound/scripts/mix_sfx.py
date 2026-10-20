#!/usr/bin/env python3
"""SFX for EduReel reels from the user's own library (no synthesised sounds) + an automatic cue sheet from the reel spec.

  python3 mix_sfx.py mix SPEC.json VIDEO.mp4 OUT.mp4    cue every motion from the spec, mix under the speech, remux
"""
import json, os, subprocess, sys, wave
import numpy as np
SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))

LIB = os.environ.get('SFX_LIB', os.path.join(os.path.dirname(HERE), 'sounds'))
# cue -> list of (file, trim_start, trim_end, anchor_in_trimmed_clip); every sound comes from the user's library
KITMAP = {
 'whoosh': [('Whoosh 1.wav', 0, 2.4, .65), ('Whoosh 2.wav', 0, 2.2, .65), ('Whoosh 3.wav', 0, 2.5, .70), ('Whoosh.wav', 0, 2.4, .90), ('imnotcreating sfx Swoosh.mp3', 0, 1.6, .50)],
 'back':   [('Soft Whoosh 01.wav', 0, 1.4, .40), ('Soft Whoosh 02.wav', 0, 1.4, .30), ('Soft Whoosh 03.wav', 0, 2.0, .75), ('Soft Whoosh 05.wav', 0, 1.8, .70)],
 'swish':  [('Clean whoosh.mp4', 0, .7, .25), ('whoosh snap.wav', 0, 1.4, .45)],
 'impact': [('Impact.wav', 0, 1.1, .02), ('Impact Sound Effect.mp3', .3, 1.25, .05)],
 'boom':   [('Bass Drop.mp4', 0, 2.79, .02)],
 'thud':   [('Echo Snap.wav', .12, 1.6, .03), ('imnotcreating sfx Switch.mp3', 0, .7, .02)],
 'pop':    [('imnotcreating sfx Clic souris.wav', .15, .5, .03), ('Digital Camera click.wav', 0, .13, 0), ('Click.wav', 0, .4, 0)],
 'tick':   [('imnotcreating sfx Bip autofocus.wav', 0, .23, 0), ('Digital autofocus.wav', 0, .07, 0)],
 'shimmer':[('Shine.wav', 0, 1.0, .1), ('Glass Shine.mp4', 0, .96, .1), ('Precious Stone 01.wav', 0, 2.2, .1)],
 'riser':  [('Low Rise.mp4', 0, 1.0, .95), ('Riser.wav', 0, 2.3, 1.7), ('Inertia Ramp.mp4', 0, 1.7, 1.1)],
 'flash':  [('Camera Flash.wav', 0, 1.2, .2)],
 'tear':   [('Page Flip.mp4', 0, 1.7, .9)],
 'scroll': [('Clean whoosh.mp4', 0, .7, .25)],
 'down':   [('Glitch.wav', 0, 1.0, .2)],
 'drone':  [('Suspense Riser .wav', 0, 3.0, 0)],
 'gears':  [('imnotcreating sfx Engrenages.wav', 0, .75, 0)],
}
_cache = {}
def load_clip(f, a, b):
    key = (f, a, b)
    if key not in _cache:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(LIB, f), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
        x = np.frombuffer(raw, np.float32).astype(np.float64)[int(a * SR):int(b * SR)].copy()
        x /= (np.abs(x).max() + 1e-9); x *= 10 ** (-1 / 20)
        fo = int(.04 * SR); x[-fo:] *= np.linspace(1, 0, fo); x[:48] *= np.linspace(0, 1, 48)
        _cache[key] = x
    return _cache[key]

GAIN = {'whoosh': -17, 'swish': -18, 'back': -21, 'impact': -11, 'boom': -9, 'thud': -15, 'pop': -17, 'tick': -19, 'shimmer': -19,
        'riser': -18, 'flash': -16, 'tear': -15, 'scroll': -21, 'down': -17, 'drone': -27, 'gears': -19}

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
            c(t0, 'flash') if s.get('trans') == 'flash' else c(t0, 'whoosh')
            if t1 < S['duration'] - .05: c(t1, 'back')
            if ty in ('window',): c(t0 + .05, 'shimmer'); c(t0, 'drone')
            if ty == 'stairs': c(t0, 'drone', 2); c(t0 + 2.6, 'drone', 2)
            if s.get('dimAt') is not None: c(t0 + s['dimAt'], 'down')
            if ty == 'phone':
                c(t0 + .05, 'tick'); [c(t0 + f - .02, 'scroll') for f in s.get('flicks', [])]
            if ty == 'scale' and s.get('tallAt') is not None: c(t0 + s['tallAt'] + .2, 'riser'); c(t0 + s['tallAt'] + .2, 'impact', -4)
            if ty == 'board': [c(t0 + r['at'], 'tick', 3) for r in s.get('rows', [])]; c(t0 + .2, 'thud', -6)
            if ty == 'symbol': c(t0 + .45, 'riser', -2); c(t0 + .5, 'impact')
            if ty == 'pedestal': c(t0 + .45, 'thud'); c(t0 + .6, 'shimmer', -4)
            if ty == 'cards':
                for cd in s.get('cards', []): c(t0 + cd['at'], 'swish'); c(t0 + cd['at'] + .3, 'tick', -2)
            if ty == 'loop':
                c(t0 + .05, 'gears')
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
            t0, t1, ty = k['t0'], k['t1'], k['type']; c(t0, 'whoosh')
            if t1 < S['duration'] - .05: c(t1, 'back')
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
    C = sorted(C)
    for i in range(len(C) - 1, -1, -1):      # the last key hit of the reel becomes the bass drop
        if C[i][1] == 'impact': C[i] = (C[i][0], 'boom', 0); break
    return C

def mix(spec, video, out):
    S = json.load(open(spec)); C = cues(S)
    dur = S['duration']; n = int((dur + 2) * SR); bus = np.zeros(n)
    used = {}
    for t, f, g in C:
        k = used.get(f, 0); used[f] = k + 1
        fn, a0, a1, anc = KITMAP[f][k % len(KITMAP[f])]
        x = load_clip(fn, a0, a1); i = int((t - anc) * SR)
        if i < 0: x = x[-i:]; i = 0
        L = min(len(x), n - i)
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
    {'mix': lambda: mix(*sys.argv[2:5])}[sys.argv[1]]()
