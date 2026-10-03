#!/usr/bin/env python3
"""Sound for the app ad: real foley only, placed from the same timeline as the picture.

  python3 scripts/sound.py kit            cut clean clips from sfx/raw/* using sfx/kit.json → sfx/kit/*.wav
  python3 scripts/sound.py mix            timeline.json → public/mix.wav, timeline_short.json → public/mix_short.wav
                                          (with config "voice", the voice-over goes on top and the effects duck 8 dB under it)
  python3 scripts/sound.py scan file.mp3  list a file's transients (to pick "near" for kit.json)
  python3 scripts/sound.py check out.mp4  prove every sound stands out at its cue (in its own band)

No music, and nothing childish (bubble, ding, spring, riser). Needs ffmpeg and numpy.
"""
import json, os, subprocess, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
KIT = os.path.join(ROOT, 'sfx', 'kit')

def load(path):
    b = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(b, np.float32).copy()

def save(name, x, fade=0.03, peak_db=-3):
    x = x.astype(np.float64); n = int(fade * SR)
    if n and len(x) > n: x[-n:] *= np.linspace(1, 0, n) ** 2
    x[:48] *= np.linspace(0, 1, 48)
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)
    os.makedirs(KIT, exist_ok=True)
    with wave.open(os.path.join(KIT, name + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
    print(f'  {name:9s} {len(x) / SR:4.2f} s')

def onset(x, t0, t1, rel=0.2):
    seg = np.abs(x[int(t0 * SR):int(t1 * SR)])
    return t0 + np.argmax(seg > seg.max() * rel) / SR - 0.003

def kit():
    """sfx/kit.json: {"name": {"file": "raw/x.mp3", "near": 1.47, "dur": 0.5, "fade": 0.15}, ...}
    "near" = roughly where the sound is in the file; the clip starts on its real transient."""
    spec = json.load(open(os.path.join(ROOT, 'sfx', 'kit.json')))
    for name, s in spec.items():
        x = load(os.path.join(ROOT, 'sfx', s['file']))
        near = s.get('near', 0.0)
        o = onset(x, max(0, near - 0.06), near + s.get('search', 0.3), s.get('rel', 0.2))
        save(name, x[int(o * SR):int((o + s['dur']) * SR)], fade=s.get('fade', 0.05))
    # the tap on "+": a short, low haptic knock (what a phone's engine sounds like), made here
    t = np.arange(int(0.11 * SR)) / SR
    tock = np.sin(2 * np.pi * 170 * t) * np.exp(-t / 0.016) + 0.5 * np.sin(2 * np.pi * 95 * t) * np.exp(-t / 0.03)
    click = np.convolve(np.random.default_rng(3).normal(0, 1, len(t)) * np.exp(-t / 0.001), np.ones(12) / 12, 'same') * 0.35
    save('tap', tock + click, fade=0.02)

def cues_for(TL):
    C = []
    def c(t, f, g=0, rate=1.0, d=None): C.append({'t': round(t, 3), 'f': f, 'g': g, 'rate': rate, **({'d': round(d, 3)} if d else {})})
    keys = ['key1', 'key2', 'key3', 'key4']
    c(0.0, 'deep', -3); c(TL['pull'][0], 'air', -9)
    nb = 0
    for i, r in enumerate(TL['rounds']):
        if r.get('clear'): c(r['clear'], 'key2', -9, 0.9)
        for j in range(len(r['q'])):
            c(r['type'] + j * r['step'], keys[j % 4], -7 - 2 * (j % 2), 1 + ((j * 7) % 5 - 2) * 0.02, r['step'] * 0.8 if r['step'] < 0.065 else None)
        c(r['enter'], 'key3', -5, 0.84); c(r['cut'] - 0.3, 'dive', -4)
        c(r['tap'], 'tap', -3); c(r['pop'] + 0.03, 'air', -12, 1.3)
        if r['box'] == 'bag':
            c(r['up'], 'bag_rise', -6 if i == 0 else -9); c(r['fall'], 'air', -15, 0.9)
            c(r['in'] - 0.03, 'bag_in', -3); c(r['in'], 'low', -16, 0.9)
        else:
            c(r['up'] + 0.05, 'air', -16, 0.8); c(r['in'] - 0.01, ['box1', 'box2', 'box3'][nb % 3], -3); c(r['in'], 'knock', -11); nb += 1
    P = TL.get('pour')
    if P:
        c(P['move'][0], 'air', -9, 0.85); c(P['bagup'], 'bag_rise', -6)
        for i, t0 in enumerate(P['out']):
            last = i == len(P['out']) - 1
            c(t0 + P['fallDur'] - 0.03, 'bag_in', -1 if last else -3); c(t0 + P['fallDur'], 'low', -12 if last else -16, 0.9)
    c(TL['lift'][0] - 0.03, 'lift', -3); c(TL['whip'][0] - 0.05, 'dive', -7, 1.1)
    c(TL['slash'][0], 'dagger', -3); c(TL['slash'][0] + 0.08, 'low', -14); c(TL['split'][0], 'dagger', -5, 0.9)
    c(TL['endText'] - 0.05, 'deep', -3, 0.94)
    return C

def clip(name, rate):
    p = os.path.join(KIT, name + '.wav')
    if not os.path.exists(p): return None
    with wave.open(p) as w: x = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
    if rate != 1.0:
        n = int(len(x) / rate); x = np.interp(np.arange(n) * rate, np.arange(len(x)), x)
    return x

def mix():
    for tl_name, out in (('timeline.json', 'mix.wav'), ('timeline_short.json', 'mix_short.wav')):
        tl_path = os.path.join(ROOT, 'src', tl_name)
        TL = json.load(open(tl_path))
        C = cues_for(TL); missing = set()
        bus = np.zeros(int(TL['dur'] * SR) + SR)
        for q in C:
            x = clip(q['f'], q['rate'])
            if x is None: missing.add(q['f']); continue
            x = x * 10 ** (q['g'] / 20)
            if 'd' in q:
                x = x[:int(q['d'] * SR)].copy(); m = min(len(x), int(0.012 * SR)); x[-m:] *= np.linspace(1, 0, m)
            i = int(q['t'] * SR); j = min(len(bus), i + len(x)); bus[i:j] += x[:j - i]
        V = json.load(open(os.path.join(ROOT, 'src', 'config.json'))).get('voice') or {}
        voice, held = np.zeros(len(bus)), np.zeros(len(bus))
        for key, at in (('open', 'vo_open'), ('close', 'vo_close')):
            if not V.get(key) or at not in TL: continue
            x = load(os.path.join(ROOT, V[key])).astype(np.float64); hop = SR // 100
            env = np.array([np.sqrt(np.mean(x[k:k + hop] ** 2)) for k in range(0, len(x) - hop, hop)])
            live = np.where(20 * np.log10(env + 1e-9) > 20 * np.log10(env.max()) - 35)[0]
            a, b = live[0] * hop, (live[-1] + 1) * hop
            x = x * (10 ** (-15 / 20) / np.sqrt(np.mean(x[a:b] ** 2)))      # speech at a steady level
            i = int(TL[at] * SR); j = min(len(bus), i + len(x)); voice[i:j] += x[:j - i]
            held[max(0, i + a - int(0.08 * SR)):min(len(bus), i + b + int(0.12 * SR))] = 1
        if voice.any():
            k = int(0.06 * SR); cs = np.cumsum(np.concatenate([[0], held]))   # 60 ms ramps in and out of the duck
            sm = np.concatenate([np.zeros(k // 2), (cs[k:] - cs[:-k]) / k, np.zeros(k - k // 2)])[:len(bus)]
            bus = bus * (1 - (1 - 10 ** (-8 / 20)) * sm) + voice
        bus = bus[:int(TL['dur'] * SR)]
        bus *= min(1.0, 0.89 / (np.abs(bus).max() + 1e-9))                # headroom; loudnorm sets the level after
        raw = os.path.join(ROOT, 'sfx', '.raw_' + out)
        with wave.open(raw, 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(np.stack([bus, bus], 1), -1, 1) * 32767).astype(np.int16).tobytes())
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.84:level=false',
                        '-ar', str(SR), '-c:a', 'pcm_s16le', os.path.join(ROOT, 'public', out)], check=True)
        json.dump(C, open(os.path.join(ROOT, 'sfx', out.replace('.wav', '_cues.json')), 'w'), indent=0)
        TL['hasMix'] = True; json.dump(TL, open(tl_path, 'w'), ensure_ascii=False, indent=1)
        print(f'{out}: {len(C)} cues' + (f'  (missing in sfx/kit: {", ".join(sorted(missing))})' if missing else ''))

def check(video, cues_file='mix_cues.json'):
    C = json.load(open(os.path.join(ROOT, 'sfx', cues_file)))
    def band(af):
        b = subprocess.run(['ffmpeg', '-v', 'error', '-i', video, '-af', af, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
        return np.frombuffer(b, np.float32)
    hi, lo = band('highpass=f=1500,highpass=f=1500'), band('lowpass=f=400,lowpass=f=400')
    bad = []
    for q in C:
        x = lo if q['f'] in ('deep', 'low', 'tap', 'dive') else hi
        i = int(q['t'] * SR); pre = x[max(0, i - int(.06 * SR)):max(1, i - int(.005 * SR))]; post = x[i:i + int(.1 * SR)]
        r = 20 * np.log10((np.sqrt(np.mean(post ** 2)) + 1e-9) / (np.sqrt(np.mean(pre ** 2)) + 1e-9)) if len(pre) else 99
        if r < 3: bad.append((q['t'], q['f'], round(float(r), 1)))
    print(f'{len(C) - len(bad)}/{len(C)} cues stand out in their band')
    if bad: print('look at these (layered sounds and very fast typing are expected here):', bad)

def scan(path):
    x = load(path); hop = SR // 100; n = len(x) // hop
    rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)]); db = 20 * np.log10(rms + 1e-9)
    on = [i for i in range(5, n) if db[i] > -42 and db[i] - db[max(0, i - 5):i].min() > 12]
    keep = [i for k, i in enumerate(on) if k == 0 or i - on[k - 1] > 6]
    print(f'{len(x) / SR:.2f} s, transients at:', ' '.join(f'{i / 100:.2f}({db[i]:.0f}dB)' for i in keep[:40]))

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'kit': kit()
    elif cmd == 'mix': mix()
    elif cmd == 'scan': scan(sys.argv[2])
    elif cmd == 'check': check(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'mix_cues.json')
    else: print(__doc__)
