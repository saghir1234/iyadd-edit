#!/bin/bash
# bash scripts/render.sh [short]  → out/final.mp4 (or out/final_short.mp4): picture rendered muted, then the mix added.
set -e
cd "$(dirname "$0")/.."
if [ "$1" = short ]; then COMP=AppAdShort; MIX=public/mix_short.wav; OUT=out/final_short.mp4; else COMP=AppAd; MIX=public/mix.wav; OUT=out/final.mp4; fi
mkdir -p out
npx remotion render $COMP out/.silent.mp4 --codec h264 --video-bitrate 14M --image-format png --muted --color-space bt709 --log=error
if [ -f "$MIX" ]; then
  ffmpeg -y -v error -i out/.silent.mp4 -i "$MIX" -map 0:v -map 1:a -c:v copy \
    -bsf:v "h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0" \
    -c:a aac -b:a 256k -shortest "$OUT"
else
  cp out/.silent.mp4 "$OUT"; echo "no $MIX yet: delivered without sound (run: python3 scripts/sound.py mix)"
fi
rm -f out/.silent.mp4
# contact sheet from the final file: a frame every half second
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT"); ROWS=$(python3 -c "import math;print(math.ceil(float('$DUR')*2/8))")
ffmpeg -y -v error -i "$OUT" -vf "fps=2,scale=216:-1,tile=8x${ROWS}" -frames:v 1 "${OUT%.mp4}_contact.png"
echo "✓ $OUT  +  ${OUT%.mp4}_contact.png"
