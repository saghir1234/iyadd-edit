#!/bin/bash
# bash scripts/shrink.sh [in.mp4] [MB]  → <in>_dl.mp4 under MB (default 28): a copy small enough to download from the app.
# Two-pass x264 at the bitrate that fits the size budget; same resolution and frame rate, audio at 160k.
set -e
cd "$(dirname "$0")/.."
IN=${1:-out/final.mp4}; MB=${2:-28}; OUT="${IN%.mp4}_dl.mp4"; AK=160
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
# total kbit budget, 3% kept back for the container, minus the audio
VK=$(python3 -c "print(int($MB*8192*0.97/float('$DUR') - $AK))")
[ "$VK" -lt 500 ] && { echo "$MB MB is too small for ${DUR}s (would be ${VK}k video): split it or raise MB"; exit 1; }
LOG=$(mktemp -d)/pass
ffmpeg -y -v error -i "$IN" -c:v libx264 -preset slow -b:v ${VK}k -pass 1 -passlogfile "$LOG" -an -f mp4 /dev/null
ffmpeg -y -v error -i "$IN" -c:v libx264 -preset slow -b:v ${VK}k -pass 2 -passlogfile "$LOG" \
  -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a ${AK}k -movflags +faststart "$OUT"
rm -rf "$(dirname "$LOG")"
echo "✓ $OUT  $(du -h "$OUT" | cut -f1)  (video ${VK}k)"
