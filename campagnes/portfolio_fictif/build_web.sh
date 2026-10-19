#!/bin/bash
# Versions web (9:16, 720x1280, < 4 Mo) + miniatures pour la galerie vidéo du site.
# usage : build_web.sh <source.mp4> <nom-web>
set -e
OUT=livraison/portfolio_site/videos; mkdir -p "$OUT"
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$1")
br=$(python3 -c "print(min(1100, int(3.6*8*1000/$d)))")
ffmpeg -y -v error -i "$1" -vf scale=720:1280 -an -c:v libx264 -preset slow -b:v ${br}k -pass 1 -passlogfile /tmp/web_$2 -f mp4 /dev/null
ffmpeg -y -v error -i "$1" -vf scale=720:1280 -an -c:v libx264 -preset slow -b:v ${br}k -maxrate $((br*3/2))k -bufsize $((br*3))k -pass 2 -passlogfile /tmp/web_$2 -pix_fmt yuv420p -movflags +faststart "$OUT/$2.mp4"
ffmpeg -y -v error -i "$OUT/$2.mp4" -vf "select=eq(n\,0)" -frames:v 1 -q:v 3 "$OUT/$2.jpg"
