"""Full-screen 9:16 speaker cut for the noir style: concat ranges, per-range crop (W:H:X:Y), dim cool grade, 1080x1920."""
import json, subprocess, sys, os
GRADE = os.environ.get('GRADE', 'eq=brightness=-0.035:contrast=1.08:saturation=0.82,colorbalance=bs=0.06:bm=0.03:rh=-0.02,vignette=angle=PI/4.5')
src, ranges, reel, out = sys.argv[1:5]
rs = json.load(open(ranges))[reel]
fc, ins = [], []
for i, (s, e, crop) in enumerate(rs):
    d = e - s; pre = min(2, s)
    ins += ['-ss', f'{s - pre:.3f}', '-i', src]
    fc.append(f'[{i}:v]trim=start={pre}:duration={d:.3f},setpts=PTS-STARTPTS,crop={crop},hqdn3d=1.5:1.5:6:6,'
              f'scale=1080:1920:flags=lanczos,unsharp=5:5:0.7:3:3:0.0,'
              f'{GRADE},fps=30[v{i}];'
              f'[{i}:a]atrim=start={pre}:duration={d:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={d - 0.04:.3f}:d=0.04[a{i}]')
n = len(rs)
fc.append(''.join(f'[v{i}][a{i}]' for i in range(n)) + f'concat=n={n}:v=1:a=1[v][a]')
subprocess.run(['ffmpeg', '-v', 'error', '-y'] + ins + ['-filter_complex', ';'.join(fc), '-map', '[v]', '-map', '[a]',
                '-c:v', 'libx264', '-crf', '12', '-preset', 'fast', '-c:a', 'pcm_s16le', out], check=True)
print('panel written', out)
