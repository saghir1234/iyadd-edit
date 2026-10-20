#!/bin/bash
# usage: make_full.sh PAGE.html REEL.py PANEL.mov(1080x1920) OUT.mp4
set -e
E=$(cd "$(dirname "$0")" && pwd)
HTML=$1; REEL=$2; PANEL=$3; OUT=$4
W=$(mktemp -d); trap 'rm -rf "$W"' EXIT
count() { ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$1"; }
python3 "$E/build_full.py" "$REEL" "$W/spec.json"
DUR=$(python3 -c "import json;print(json.load(open('$W/spec.json'))['duration'])")
N=$(python3 -c "print(round($DUR*30))")
node "$E/frames_any.js" "$HTML" "$W/spec.json" "$W/frames"
ffmpeg -v error -y -framerate 30 -i "$W/frames/f_%05d.png" -c:v qtrle "$W/ov.mov"
[ "$(count "$W/ov.mov")" = "$N" ] || { echo "overlay frame mismatch"; exit 1; }
# negative-flash transitions: invert the composited frame for 2 frames at each spec "flashes" time
NEG=$(python3 -c "import json;f=json.load(open('$W/spec.json')).get('flashes',[]);print(',negate=enable=\''+'+'.join(f'between(t,{t:.3f},{t+0.066:.3f})' for t in f)+'\'' if f else '')")
ffmpeg -v error -y -i "$PANEL" -i "$W/ov.mov" -filter_complex \
  "[0:v]setpts=PTS-STARTPTS[b];[1:v]setpts=PTS-STARTPTS[o];[b][o]overlay=0:0:shortest=1$NEG,noise=alls=5:allf=t,format=yuv420p[v]" \
  -map "[v]" -map 0:a -c:v libx264 -preset medium -crf 20 -maxrate 10M -bufsize 20M -profile:v high -c:a aac -b:a 192k \
  -movflags +faststart -t "$DUR" "$OUT"
V=$(count "$OUT"); [ "$V" = "$N" ] || { echo "final frame mismatch $V/$N"; exit 1; }
cp "$W/spec.srt" "${OUT%.*}.srt"
echo "OK $OUT ($V frames)"
