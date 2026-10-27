#!/bin/bash
# Fabrication rapide de la version 16:9 (voix + bruitages) pour validation : voix Chatterbox → minutage → audio → montage → calque → export.
set -e
D=$(cd "$(dirname "$0")" && pwd); cd "$D"
"${PY_CB:-python3}" voix_chatterbox.py "${EX:-.85}" "${CFG:-.3}"
python3 voix.py && python3 build_audio.py bruitages && python3 montage.py
cd .. && NODE_PATH=$(npm root -g) PAGE=integration/video.html node render_calque.cjs 169 integration/out/base_169.mp4 integration/out/video_169_v2_muet.mp4 25 && cd integration
L="$D/../../../livraison/integration"; N="$L/EDUST_integration_169"
ffmpeg -y -v error -i out/video_169_v2_muet.mp4 -vf "select=eq(n\,0)" -frames:v 1 "${N}_miniature.png"
ffmpeg -y -v error -i out/video_169_v2_muet.mp4 -i audio/bande_bruitages.wav -i "${N}_miniature.png" -map 0:v -map 1:a -map 2 \
  -c:v:0 libx264 -crf 21 -maxrate 6M -bufsize 12M -pix_fmt yuv420p -preset medium -c:a aac -b:a 192k -c:v:1 png -disposition:v:1 attached_pic -movflags +faststart "${N}_voix_bruitages.mp4"
echo "fini $(ffprobe -v error -show_entries format=duration -of csv=p=0 "${N}_voix_bruitages.mp4") s"
