"""Build a renderer spec from a reel definition (python file exposing REEL dict)."""
import json, sys, runpy

def phrases(words, dur, max_words=4, max_chars=24, gap=0.6):
    toks = []
    for tok in words.split():
        if tok == '|':
            toks.append(None); continue
        w, t = tok.rsplit('@', 1)
        toks.append({'w': w, 's': float(t)})
    out, cur = [], []
    def flush():
        if cur: out.append(cur[:]); cur.clear()
    for i, tk in enumerate(toks):
        if tk is None: flush(); continue
        if cur and (len(cur) >= max_words or tk['s'] - cur[-1]['s'] > gap + 0.6
                    or len(' '.join(x['w'] for x in cur + [tk])) > max_chars):
            flush()
        cur.append(tk)
    flush()
    res = []
    for i, ph in enumerate(out):
        t0 = ph[0]['s'] - 0.06
        nxt = out[i + 1][0]['s'] - 0.06 if i + 1 < len(out) else dur
        t1 = min(nxt, ph[-1]['s'] + 1.1)
        res.append({'t0': round(t0, 3), 't1': round(t1, 3), 'words': ph})
    return res

if __name__ == '__main__':
    R = runpy.run_path(sys.argv[1])['REEL']
    spec = {
        'duration': R['duration'],
        'panel': {'x': 30, 'y': 300, 'w': 660, 'h': 660},
        'identity': {'name': 'د. ياسر الحزيمي', 'source': 'بودكاست بُوصلة', 'until': 4},
        'headlines': R['headlines'],
        'phrases': phrases(R['words'], R['duration']),
        'cuts': R['cuts'],
    }
    json.dump(spec, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
    # SRT for delivery
    def ts(x):
        ms = int(round(x * 1000)); return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
    with open(sys.argv[2].replace('.json', '.srt'), 'w') as f:
        for i, p in enumerate(spec['phrases'], 1):
            f.write(f"{i}\n{ts(max(0,p['t0']))} --> {ts(p['t1'])}\n{' '.join(w['w'] for w in p['words'])}\n\n")
    print(len(spec['phrases']), 'phrases')
