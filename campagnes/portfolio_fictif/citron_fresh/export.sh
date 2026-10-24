#!/bin/bash
# Export CITRON FRESH : musique + bruitages, bruitages seuls, sans son, version mail (< 4 Mo). Miniature = image 0 intégrée.
# Prérequis : python3 build.py frames ; python3 build_audio.py bruitages ; python3 build_audio.py musique
set -e
cd "$(dirname "$0")"
L=../../../livraison/portfolio_fictif/citron_fresh; mkdir -p "$L" out/tmp
ffmpeg -v error -y -framerate 30 -i out/frames/%04d.jpg -c:v libx264 -crf 21 -maxrate 6M -bufsize 12M -pix_fmt yuv420p -an out/tmp/video.mp4
ffmpeg -v error -y -i out/frames/0000.jpg -vf "select=eq(n\,0)" -frames:v 1 out/tmp/miniature.jpg
enc() {  # $1 sortie, $2 audio (vide = sans son)
  if [ -n "$2" ]; then
    ffmpeg -v error -y -i out/tmp/video.mp4 -i "$2" -i out/tmp/miniature.jpg -map 0:v -map 1:a -map 2 -c:v copy -c:a aac -b:a 192k \
      -c:v:1 mjpeg -disposition:v:1 attached_pic -t 15 -movflags +faststart "$1"
  else
    ffmpeg -v error -y -i out/tmp/video.mp4 -i out/tmp/miniature.jpg -map 0:v -map 1 -c:v copy -c:v:1 mjpeg -disposition:v:1 attached_pic -an -movflags +faststart "$1"
  fi
}
enc "$L/CITRON_FRESH_reel_9x16_musique.mp4" out/audio_musique.wav
enc "$L/CITRON_FRESH_reel_9x16_bruitages.mp4" out/audio_bruitages.wav
enc "$L/CITRON_FRESH_reel_9x16_sans_son.mp4" ""
ffmpeg -v error -y -framerate 30 -i out/frames/%04d.jpg -i out/audio_musique.wav -vf scale=720:1280 -c:v libx264 -b:v 700k -maxrate 900k -bufsize 1400k \
  -pix_fmt yuv420p -c:a aac -b:a 96k -t 15 -movflags +faststart "$L/CITRON_FRESH_reel_mail_720p.mp4"
cp out/tmp/miniature.jpg "$L/CITRON_FRESH_miniature.jpg"
ls -la "$L"
