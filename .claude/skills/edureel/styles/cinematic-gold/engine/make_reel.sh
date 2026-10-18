#!/bin/bash
# usage: make_reel.sh REEL.py PANEL.mov OUT.mp4
# Builds the spec, renders 1080x1920 MG frames, converts them to an alpha video (avoids ffmpeg 6 image2 frame drops),
# composites over the speaker panel and refuses to finish unless the frame count is exact.
set -e
E=$(cd "$(dirname "$0")" && pwd)
REEL=$1; PANEL=$2; OUT=$3
W=$(mktemp -d); trap 'rm -rf "$W"' EXIT
count() { ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$1"; }
python3 "$E/build.py" "$REEL" "$W/spec.json"
DUR=$(python3 -c "import json;print(json.load(open('$W/spec.json'))['duration'])")
N=$(python3 -c "print(round($DUR*30))")
node "$E/frames.js" "$W/spec.json" "$W/frames" 2>&1 | tail -1
ffmpeg -v error -y -framerate 30 -i "$W/frames/f_%05d.png" -c:v qtrle "$W/ov.mov"
[ "$(count "$W/ov.mov")" = "$N" ] || { echo "overlay frame mismatch"; exit 1; }
ffmpeg -v error -y -i "$PANEL" -i "$W/ov.mov" -filter_complex \
  "[0:v]setpts=PTS-STARTPTS,pad=1080:1920:45:450:black[b];[1:v]setpts=PTS-STARTPTS[o];[b][o]overlay=0:0:shortest=1,noise=alls=4:allf=t,format=yuv420p[v]" \
  -map "[v]" -map 0:a -c:v libx264 -preset medium -crf 18 -maxrate 14M -bufsize 28M -profile:v high -c:a aac -b:a 256k \
  -movflags +faststart -t "$DUR" "$OUT"
V=$(count "$OUT"); [ "$V" = "$N" ] || { echo "final frame mismatch $V/$N"; exit 1; }
cp "$W/spec.srt" "${OUT%.*}.srt"
echo "OK $OUT ($V frames)"
