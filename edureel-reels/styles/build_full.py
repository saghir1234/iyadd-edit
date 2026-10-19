"""Build a spec for the full-screen styles (noir / amber): REEL = {duration, identity, words, overlays, scenes}."""
import json, sys, runpy, os
sys.path.insert(0, os.path.dirname(__file__))
from build_base import phrases
R = runpy.run_path(sys.argv[1])['REEL']
spec = {'duration': R['duration'], 'identity': R['identity'], 'phrases': phrases(R['words'], R['duration']),
        'overlays': R.get('overlays', []), 'scenes': R.get('scenes', [])}
json.dump(spec, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
def ts(x):
    ms = int(round(x * 1000)); return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
with open(sys.argv[2].replace('.json', '.srt'), 'w') as f:
    for i, p in enumerate(spec['phrases'], 1):
        f.write(f"{i}\n{ts(max(0,p['t0']))} --> {ts(p['t1'])}\n{' '.join(w['w'] for w in p['words'])}\n\n")
print(len(spec['phrases']), 'phrases')
