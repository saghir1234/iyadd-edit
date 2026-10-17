#!/usr/bin/env python3
"""Scene plan for reel 1 «اللوحة التي نرسمها معًا». Writes src/reels/reel1.json.

Lines and cards point at words by phrase (searched from a time onward), so the plan
survives small timing corrections in words.json.
"""
import json, sys

words = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
VOICE = float(sys.argv[3])  # voice.wav duration
TAIL = 0.9


def find(phrase, after=0.0):
    toks = phrase.split()
    for i in range(len(words) - len(toks) + 1):
        if words[i]['s'] >= after - 0.05 and all(words[i + j]['w'] == toks[j] for j in range(len(toks))):
            return i, i + len(toks) - 1
    raise SystemExit(f'phrase not found: {phrase} after {after}')


def L(phrase, after, st, y, size=None, rules=False, show=None):
    i0, i1 = find(phrase, after)
    d = {'i0': i0, 'i1': i1, 'st': st, 'y': y}
    if size: d['size'] = size
    if rules: d['rules'] = True
    if show: d['show'] = show
    return d


def t(phrase, after=0.0):
    return words[find(phrase, after)[0]]['s']


SHEET = {'x': 540, 'y': 1150, 'w': 560, 'h': 700, 'rot': -2}

strokes = [
    {'at': t('فيرسم'), 'dur': 1.0, 'color': 'ink', 'pts': [[60, 520], [140, 430], [230, 470], [300, 380], [360, 300]]},
    {'at': t('فأرسم'), 'dur': 0.9, 'color': 'gold', 'width': 8, 'pts': [[540, 560], [470, 470], [390, 500], [330, 410], [300, 330]]},
    {'at': t('رسم'), 'dur': 0.8, 'color': 'ink', 'pts': [[300, 330], [230, 250], [260, 160], [340, 150], [380, 230], [330, 300]]},
    {'at': t('استكمال'), 'dur': 1.0, 'color': 'gold', 'width': 8, 'pts': [[90, 640], [200, 600], [300, 630], [400, 590], [520, 630]]},
    {'at': t('نستكملها'), 'dur': 0.9, 'color': 'ink', 'pts': [[150, 190], [200, 125], [262, 100]]},
    {'at': t('نستكملها') + 0.15, 'dur': 0.9, 'color': 'gold', 'width': 8, 'pts': [[450, 190], [400, 125], [338, 100]]},
    {'at': t('كملنا'), 'dur': 0.85, 'color': 'gold', 'width': 9, 'pts': [[110, 700], [210, 676], [300, 690], [390, 672], [490, 700]]},
]

S = []
# 1 hook
S.append({'s': 0.0, 'e': t('واللبس'), 'bg': 'light', 'orbits': True, 'lines': [
    L('لما يعتقد الإنسان', 0, 'small', 600, rules=True),
    L('أن الابتسامة', 0, 'gold', 800, 190)]})
S.append({'s': t('واللبس'), 'e': t('لا'), 'bg': 'warm', 'lines': [
    L('واللبس الزين', 0, 'white', 620, 150),
    L('والأسلوب الجيد', 0, 'gold', 820, 150),
    L('يبني علاقة جيدة', 0, 'small', 1000, 70)]})
S.append({'s': t('لا'), 'e': t('هذه'), 'bg': 'light', 'kind': 'slam', 'slam': dict(zip(('i0', 'i1'), find('لا')))})
S.append({'s': t('هذه'), 'e': t('ففي'), 'bg': 'black', 'lines': [
    L('هذه', 0, 'small', 760, 70),
    L('مهارات الاتصال', 0, 'plate', 930, 150)]})
S.append({'s': t('ففي'), 'e': t('فنعطيك'), 'bg': 'light', 'orbits': True, 'lines': [
    L('ففي فرق بين', 0, 'small', 560, rules=True),
    L('العلاقات', 0, 'big', 780, 190),
    L('والاتصال', 0, 'gold', 1010, 190)]})
# 2 the flight
S.append({'s': t('فنعطيك'), 'e': t('شوف'), 'bg': 'slate', 'grid': True,
          'props': [{'src': 'plane.png', 'x': 600, 'y': 1260, 'w': 900, 'from': 'bottom', 'at': t('المضيف'), 'rot': -6, 'drift': 140}],
          'lines': [
              L('فنعطيك مثال بسيط', 0, 'small', 380, rules=True),
              L('أنا الآن مع المضيف', 0, 'white', 560, 115),
              L('في الطائرة', 0, 'gold', 730, 160),
              L('قال لي', 0, 'small', 890)]})
S.append({'s': t('شوف'), 'e': t('فهو'), 'bg': 'light',
          'sheet': {**SHEET, 'enterAt': t('وورقة')},
          'lines': [
              L('شوف كل واحد في اللقاء الأول', 0, 'small', 300, 62),
              L('كل واحد معه', 21.4, 'big', 470, 130),
              L('قلم وورقة', 0, 'gold', 650, 170)]})
# 3 the shared drawing
a = t('فهو')
S.append({'s': a, 'e': t('والدليل'), 'bg': 'light', 'push': 0.06,
          'sheet': {**SHEET, 'pen': True},
          'lines': [
              L('فهو يقول لي', 0, 'small', 300, show=[a, t('وأنا')]),
              L('السلام عليكم', 0, 'big', 460, 140, show=[a, t('وأنا')]),
              L('فيرسم شي في الورقة حقته', 0, 'small', 640, 66, show=[a, t('وأنا')]),
              L('وأنا أرد عليه', 0, 'big', 420, 130, show=[t('وأنا'), t('ففي', 30)]),
              L('فأرسم شي', 0, 'gold', 610, 140, show=[t('وأنا'), t('ففي', 30)]),
              L('ففي كل عملية التواصل', 30, 'small', 360, show=[t('ففي', 30), t('لوحاتنا')]),
              L('يتم رسم استكمال اللوحة', 0, 'gold', 540, 110, show=[t('ففي', 30), t('لوحاتنا')]),
              L('لوحاتنا', 0, 'gold', 400, 170, show=[t('لوحاتنا'), 99]),
              L('نستكملها مع بعض', 0, 'big', 610, 110, show=[t('لوحاتنا'), 99])]})
# 4 meeting again
S.append({'s': t('والدليل'), 'e': t('بعد'), 'bg': 'slate',
          'props': [{'src': 'plane.png', 'x': 540, 'y': 1180, 'w': 820, 'from': 'right', 'at': t('الرحلة'), 'rot': 4, 'drift': 60}],
          'lines': [
              L('والدليل', 0, 'small', 520, 70, rules=True),
              L('أني في الرحلة أخرى', 0, 'white', 700, 130)]})
S.append({'s': t('بعد'), 'e': t('قابلته'), 'bg': 'slate', 'grid': True, 'kind': 'cards',
          'cards': [dict(zip(('i0', 'i1'), find('بعد يمكن ثلاث سنوات'))), dict(zip(('i0', 'i1'), find('أو ثلاثة أشهر')))]})
S.append({'s': t('قابلته'), 'e': t('كملنا'), 'bg': 'light', 'orbits': True, 'lines': [
    L('قابلته', 0, 'small', 640, 70, rules=True),
    L('كيف حالك', 0, 'big', 830, 170),
    L('كيف حالك', 44.2, 'gold', 1040, 170)]})
S.append({'s': t('كملنا'), 'e': t('طيب'), 'bg': 'light',
          'sheet': {**SHEET, 'pen': True},
          'lines': [
              L('كملنا الرسمة', 0, 'gold', 400, 150),
              L('احنا ما نبدأ من جديد', 0, 'big', 610, 100)]})
# 5 the tear
S.append({'s': t('طيب'), 'e': t('أو', 51.5), 'bg': 'warm', 'lines': [
    L('طيب لو أنا كلمته', 0, 'small', 640),
    L('وهو ما رد علي', 0, 'white', 820, 140),
    L('بطريقة جيدة', 0, 'gold', 1010, 140)]})
S.append({'s': t('أو', 51.5), 'e': t('أنا', 53.9), 'bg': 'black', 'lines': [
    L('أو أنا ما احتفيت فيه', 51.5, 'white', 860, 125)]})
S.append({'s': t('أنا', 53.9), 'e': t('هنا', 56.5), 'bg': 'black', 'lines': [
    L('أنا هنا قررت', 53.9, 'small', 660, 72),
    L('لي ما أكمل الرسمة', 0, 'white', 900, 130)]})
S.append({'s': t('هنا', 56.5), 'e': t('انتهت'), 'bg': 'light', 'push': 0.05,
          'sheet': {**SHEET, 'tearAt': t('تمزيق') + 0.1},
          'lines': [
              L('هنا يتم', 56.5, 'small', 380, 72),
              L('تمزيق الورقة', 0, 'big', 570, 160)]})
S.append({'s': t('انتهت'), 'e': round(VOICE + TAIL, 3), 'bg': 'light', 'kind': 'slam', 'slam': dict(zip(('i0', 'i1'), find('انتهت العلاقة')))})

spec = {'id': 'reel1', 'audio': 'reel1.wav', 'duration': round(VOICE + TAIL, 3), 'words': [{k: w[k] for k in ('w', 's', 'e')} for w in words],
        'strokes': strokes, 'scenes': S}
# contiguity check (rule 25: no gaps or overlaps)
for x, y in zip(S, S[1:]):
    assert abs(x['e'] - y['s']) < 1e-6, (x['s'], x['e'], y['s'])
    assert x['e'] > x['s'], x
json.dump(spec, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(f"{len(S)} scenes · {spec['duration']}s · shortest {min(s['e']-s['s'] for s in S):.2f}s")
