import json, os
def words(n, fix, times={}, breaks_after=(), extra_after={}):
    ws = json.load(open(os.path.join(os.path.dirname(__file__), f'pr_{n}.json'))); out = []
    for i, (w, s, e) in enumerate(ws):
        if fix.get(i, '') is None: continue
        out.append(f'{fix.get(i, w)}@{times.get(i, s):.2f}')
        if i in extra_after: out.append(extra_after[i])
        if i in breaks_after: out.append('|')
    return ' '.join(out)
