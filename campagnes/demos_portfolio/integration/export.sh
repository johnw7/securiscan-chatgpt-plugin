#!/bin/bash
# Exports finaux de « Les premières étapes d'un nouvel arrivant » (démo E-DUST) vers livraison/integration/.
# Prérequis : out/video_169_muet.mp4 et out/video_916_muet.mp4 (render.cjs), audio/bande_bruitages.wav et audio/bande_musique.wav (build_audio.py).
# Miniature = image 0 intégrée (attached_pic) ; pas de -shortest avec la miniature intégrée.
set -e
D=$(cd "$(dirname "$0")" && pwd); L="$D/../../../livraison/integration"; mkdir -p "$L"
V="-c:v:0 libx264 -crf 21 -maxrate 6M -bufsize 12M -pix_fmt yuv420p -preset medium"
for F in 169 916; do
  SRC="$D/out/video_${F}_v2_muet.mp4"; [ -f "$SRC" ] || continue
  N="$L/EDUST_integration_${F}"
  ffmpeg -y -v error -i "$SRC" -vf "select=eq(n\,0)" -frames:v 1 "${N}_miniature.png"
  for A in bruitages musique; do
    ffmpeg -y -v error -i "$SRC" -i "$D/audio/bande_${A}.wav" -i "${N}_miniature.png" -map 0:v -map 1:a -map 2 \
      $V -c:a aac -b:a 192k -c:v:1 png -disposition:v:1 attached_pic -movflags +faststart "${N}_voix_${A}.mp4"
  done
  ffmpeg -y -v error -i "$SRC" -i "${N}_miniature.png" -map 0:v -map 1 $V -an -c:v:1 png -disposition:v:1 attached_pic -movflags +faststart "${N}_sans_son.mp4"
done
# version mail < 4 Mo : 480p en deux passes (~165 kb/s vidéo + 40 kb/s audio pour 2 min 29)
P=$(mktemp -d)/passe
ffmpeg -y -v error -i "$D/out/video_169_v2_muet.mp4" -vf scale=854:-2 -c:v libx264 -b:v 165k -pass 1 -passlogfile "$P" -preset slow -an -f null /dev/null
ffmpeg -y -v error -i "$D/out/video_169_v2_muet.mp4" -i "$D/audio/bande_bruitages.wav" -map 0:v -map 1:a -vf scale=854:-2 -c:v libx264 -b:v 165k -pass 2 -passlogfile "$P" \
  -preset slow -pix_fmt yuv420p -c:a aac -b:a 40k -ac 1 -movflags +faststart "$L/EDUST_integration_169_mail_480p.mp4"
ls -la "$L"
