"""Cut the speaker panel for one reel: concat source ranges, square-crop, enhance, scale to 990x990.

usage: python cut_panel.py SOURCE.mp4 RANGES.json REEL_ID OUT.mov [--crop W:H:X:Y]
RANGES.json maps reel ids to [[start, end], ...] in source seconds.
The crop must stay above any burned-in subtitles; default fits an 854x480 source.
"""
import argparse, json, subprocess

p = argparse.ArgumentParser()
p.add_argument('source'); p.add_argument('ranges'); p.add_argument('reel'); p.add_argument('out')
p.add_argument('--crop', default='372:372:344:0')
a = p.parse_args()
rs = json.load(open(a.ranges))[a.reel]
fc, ins = [], []
for i, (s, e) in enumerate(rs):
    d = e - s
    ins += ['-ss', f'{max(0, s - 2):.3f}', '-i', a.source]
    pre = min(2, s)
    fc.append(f'[{i}:v]trim=start={pre}:duration={d:.3f},setpts=PTS-STARTPTS,crop={a.crop},hqdn3d=1.5:1.5:6:6,'
              f'scale=990:990:flags=lanczos,unsharp=5:5:0.8:3:3:0.0,eq=contrast=1.04:saturation=1.05,fps=30[v{i}];'
              f'[{i}:a]atrim=start={pre}:duration={d:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={d - 0.04:.3f}:d=0.04[a{i}]')
n = len(rs)
fc.append(''.join(f'[v{i}][a{i}]' for i in range(n)) + f'concat=n={n}:v=1:a=1[v][a]')
subprocess.run(['ffmpeg', '-v', 'error', '-y'] + ins + ['-filter_complex', ';'.join(fc), '-map', '[v]', '-map', '[a]',
                '-c:v', 'libx264', '-crf', '10', '-preset', 'fast', '-c:a', 'pcm_s16le', a.out], check=True)
print('panel written', a.out)
