#!/bin/bash
# bash scripts/render.sh → out/final.mp4: picture rendered muted, then the voice + SFX mix (scripts/sound.py) added.
set -e
cd "$(dirname "$0")/.."
mkdir -p out
B=${CHROME_PATH:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}
npx remotion render Reel out/.silent.mp4 --codec h264 --crf 16 --muted --browser-executable "$B" --concurrency 4 --log=error
python3 scripts/sound.py public/talk.mp4 public/mix.wav
ffmpeg -y -v error -i out/.silent.mp4 -i public/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart out/final.mp4
rm -f out/.silent.mp4
echo "✓ out/final.mp4"
