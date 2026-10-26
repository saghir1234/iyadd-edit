#!/bin/bash
# bash scripts/render.sh [survival] → out/final.mp4 (or out/final_survival.mp4): picture rendered muted, then the voice + SFX mix (scripts/sound.py).
set -e
cd "$(dirname "$0")/.."
mkdir -p out
B=${CHROME_PATH:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}
if [ "$1" = survival ]; then COMP=Survival; DIR=public/survival; OUT=out/final_survival.mp4; REEL=survival; else COMP=Reel; DIR=public; OUT=out/final.mp4; REEL=scout; fi
npx remotion render $COMP out/.silent.mp4 --codec h264 --crf 16 --muted --browser-executable "$B" --concurrency 4 --log=error
python3 scripts/sound.py $DIR/talk.mp4 $DIR/mix.wav $REEL
ffmpeg -y -v error -i out/.silent.mp4 -i $DIR/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart $OUT
rm -f out/.silent.mp4
echo "✓ $OUT"
