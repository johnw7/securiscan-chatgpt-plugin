#!/bin/bash
# Export CITRON FRESH v2 « agence » : voix + musique, voix + bruitages, musique sans voix, bruitages seuls, sans son, version mail.
# Prérequis : python3 build_v2.py frames ; python3 build_audio.py musique|bruitages [voix] v2
set -e
cd "$(dirname "$0")"
L=../../../livraison/portfolio_fictif/citron_fresh/v2_agence; mkdir -p "$L" out/tmp2
ffmpeg -v error -y -framerate 30 -i out/frames_v2/%04d.jpg -c:v libx264 -crf 21 -maxrate 6M -bufsize 12M -pix_fmt yuv420p -an out/tmp2/video.mp4
ffmpeg -v error -y -i out/frames_v2/0000.jpg -vf "select=eq(n\,0)" -frames:v 1 out/tmp2/miniature.jpg
enc() {  # $1 sortie, $2 audio (vide = sans son)
  if [ -n "$2" ]; then
    ffmpeg -v error -y -i out/tmp2/video.mp4 -i "$2" -i out/tmp2/miniature.jpg -map 0:v -map 1:a -map 2 -c:v copy -c:a aac -b:a 192k \
      -c:v:1 mjpeg -disposition:v:1 attached_pic -t 15 -movflags +faststart "$1"
  else
    ffmpeg -v error -y -i out/tmp2/video.mp4 -i out/tmp2/miniature.jpg -map 0:v -map 1 -c:v copy -c:v:1 mjpeg -disposition:v:1 attached_pic -an -movflags +faststart "$1"
  fi
}
enc "$L/CITRON_FRESH_v2_voix_musique.mp4" out/audio_musique_voix_v2.wav
enc "$L/CITRON_FRESH_v2_voix_bruitages.mp4" out/audio_bruitages_voix_v2.wav
enc "$L/CITRON_FRESH_v2_musique.mp4" out/audio_musique_v2.wav
enc "$L/CITRON_FRESH_v2_bruitages.mp4" out/audio_bruitages_v2.wav
enc "$L/CITRON_FRESH_v2_sans_son.mp4" ""
ffmpeg -v error -y -framerate 30 -i out/frames_v2/%04d.jpg -i out/audio_musique_voix_v2.wav -vf scale=720:1280 -c:v libx264 -b:v 750k -maxrate 950k -bufsize 1500k \
  -pix_fmt yuv420p -c:a aac -b:a 96k -t 15 -movflags +faststart "$L/CITRON_FRESH_v2_voix_mail_720p.mp4"
cp out/tmp2/miniature.jpg "$L/CITRON_FRESH_v2_miniature.jpg"
ls -la "$L"
