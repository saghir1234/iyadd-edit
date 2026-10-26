#!/usr/bin/env python3
"""Voice + SFX mix. Every sound comes from the user's SFX library (sfx-sound skill): peak-aligned, normalised,
levelled per the skill's table, and side-chain ducked under the voice.

  python3 scripts/sound.py public/talk.mp4 public/mix.wav                       (reel 1)
  python3 scripts/sound.py public/survival/talk.mp4 public/survival/mix.wav survival   (reel 2)
"""
import importlib.util, json, os, subprocess, sys, wave
import numpy as np

SKILL = os.environ.get('SFX_SKILL', '/root/.claude/skills/synced/c7313967-e005-4d5f-8994-9c27b98a9c8b_a62f3d0a-2a1b-4c23-b6e0-089e97395e00/sfx-sound')
spec = importlib.util.spec_from_file_location('mix_sfx', os.path.join(SKILL, 'scripts', 'mix_sfx.py'))
K = importlib.util.module_from_spec(spec); spec.loader.exec_module(K)
HERE = os.path.dirname(os.path.abspath(__file__))
REEL = sys.argv[3] if len(sys.argv) > 3 else 'scout'
W = json.load(open(os.path.join(HERE, '..', 'src', 'words.json' if REEL == 'scout' else 'words_survival.json')))
at = lambda i: W[i]['s']

def cues():
    C = []
    c = lambda t, f, g=0: C.append((round(t, 3), f, g))
    for t in (0.27, 0.57, 0.87): c(t, 'pop')                        # notifications drop in
    for t in (1.25, 1.4, 1.55): c(t, 'swish', -4)                   # question marks
    c(2.5, 'whoosh'); c(at(7), 'shimmer', -2)                        # question card, "نقاء تفكيره"
    c(at(11), 'down'); c(at(11), 'impact', -4)                       # glitch on "تشويش"
    c(6.25, 'back')
    c(6.72, 'thud'); c(6.75, 'swish', -4)                            # scouts tag
    c(7.95, 'riser', -2); c(7.98, 'impact', -6); c(at(15), 'shimmer') # golden medallion lands
    c(at(18) + 0.15, 'swish'); c(at(18), 'pop')                      # coin flips: "قانون كشفي"
    c(at(22), 'shimmer', -2)
    c(12.3, 'flash'); c(12.3, 'whoosh', -2)                          # flash into the scout photo
    c(at(24), 'pop'); c(at(25), 'impact', -6)
    for i in (26, 27, 28): c(at(i), 'swish', -2); c(at(i) + 0.3, 'tick')
    c(15.62, 'back')
    c(at(32) - 0.1, 'pop'); c(at(33) + 0.2, 'swish', -2)             # "مثالية خيالية" struck out
    c(at(36), 'impact', -4); c(at(37), 'shimmer')                    # "نظافة روحية"
    c(19.0, 'back', -2)
    c(20.0, 'swish'); c(at(48) + 0.9, 'riser', -4)                   # growth chart
    c(at(51), 'impact', -6)                                          # "الهدم"
    c(23.8, 'back', -2)
    c(at(54), 'thud'); c(at(54) + 0.01, 'impact', -8)                # stamp "بإتقان"
    c(at(55), 'pop'); c(at(58), 'swish', -4)                         # eye, slash
    c(27.12, 'whoosh'); c(27.12, 'flash', -6)                        # peace meter
    for k in range(5): c(at(61) + k * 0.18, 'tick', -2)
    c(at(63), 'impact', -4); c(at(63) + 0.05, 'shimmer')             # gold burst
    c(29.62, 'whoosh'); c(29.68, 'thud', -4)                         # shield
    for i in range(10): c(29.62 + 0.7 + i * 0.22, 'pop', -3)         # icons bounce off
    c(at(69), 'boom')                                                # "السوشال ميديا": the one bass drop
    return sorted(C)

def cues_survival():
    C = []
    c = lambda t, f, g=0: C.append((round(t, 3), f, g))
    c(0.05, 'swish', -2); c(0.1, 'riser', -8)                        # ECG line + title
    c(at(5) + 0.2, 'impact', -6); c(at(5), 'shimmer')                # golden "3" coin lands
    c(at(8) + 0.1, 'swish'); c(at(8), 'pop')                         # coin flips: "القاعدة الثلاثية"
    c(3.92, 'whoosh')
    for i in (12, 16, 20): c(at(i) - 0.1, 'swish'); c(at(i) + 0.05, 'pop'); c(at(i + 2), 'tick')  # air / water / food cards
    c(9.45, 'whoosh'); c(9.8, 'drone')                               # cards fly out, tension
    for k in range(4): c(at(28) + k * 0.3, 'tick', 3)                # stopwatch 3 → 0
    c(at(28), 'impact', -4)
    c(11.95, 'back')
    c(at(32), 'down'); c(at(32), 'impact', -4)                       # glitch on "أعصابك"
    c(at(31), 'thud', -2)                                            # warning sign
    c(at(34), 'impact', -8); c(at(35), 'impact', -8)                 # panic chips
    c(15.24, 'swish'); c(at(37), 'gears', -2)                        # pressure gauge
    c(16.56, 'back'); c(at(38) + 0.2, 'gears'); c(at(39) + 0.4, 'shimmer')  # control dial turns calm
    c(18.3, 'whoosh'); c(18.4, 'riser', -4); c(at(42), 'shimmer')    # the key
    c(at(43), 'boom')                                                # "الأول": the one bass drop
    c(19.85, 'swish'); c(19.95, 'tick'); c(at(46) - 0.1, 'pop')      # priority list
    return sorted(C)

def main(video, out, *_):
    C = cues() if REEL == 'scout' else cues_survival()
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], capture_output=True, text=True).stdout)
    n = int((dur + 2) * K.SR); bus = np.zeros(n); used = {}
    for t, f, g in C:
        k = used.get(f, 0); used[f] = k + 1
        fn, a0, a1, anc = K.KITMAP[f][k % len(K.KITMAP[f])]
        x = K.load_clip(fn, a0, a1); i = int((t - anc) * K.SR)
        if i < 0: x = x[-i:]; i = 0
        L = min(len(x), n - i)
        if L > 0: bus[i:i + L] += x[:L] * 10 ** ((K.GAIN[f] + g) / 20)
    bus = bus[:int(dur * K.SR)]
    tmp = out + '.sfx.wav'
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(K.SR); w.writeframes((np.clip(bus, -1, 1) * 32767).astype(np.int16).tobytes())
    fc = ('[0:a]aresample=48000,asplit=2[v][vk];[1:a]aformat=channel_layouts=stereo[s];'
          '[s][vk]sidechaincompress=threshold=0.06:ratio=2:attack=8:release=200[sd];'
          '[v][sd]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-i', tmp, '-filter_complex', fc, '-map', '[a]', '-ar', '48000', out], check=True)
    os.remove(tmp)
    json.dump(C, open(os.path.join(HERE, '..', 'out', f'sfx_cues_{REEL}.json'), 'w'), indent=0)
    print(f'{out}: {len(C)} sfx cues')

if __name__ == '__main__':
    main(*sys.argv[1:])
