#!/bin/bash
# Assemblage de la formation incendie 3D (démo E-DUST) une fois les images rendues (film.py rendu → frames/).
#  1. images 960×540 → film 1920×1080 24 i/s (agrandissement lanczos + léger renforcement)
#  2. calque HTML (titre, consignes, dialogues, récapitulatif, générique) superposé (render_calque.cjs)
#  3. bruitages (build_audio.py), miniature = image 0 intégrée, version sans son, version mail < 4 Mo
set -e
D=$(cd "$(dirname "$0")" && pwd); L="$D/../../../livraison/formation_incendie"; mkdir -p "$L" "$D/out"
ffmpeg -y -v error -framerate 24 -i "$D/frames/%05d.jpg" -vf "scale=1920:1080:flags=lanczos,unsharp=5:5:0.6" -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p "$D/out/film_3d.mp4"
(curl -s -o /dev/null http://127.0.0.1:8765/ || (cd "$D/../../.." && setsid python3 -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1 &)); sleep 1
(cd "$D/../../demos_portfolio" && NODE_PATH=$(npm root -g) PAGE=../portfolio_fictif/formation_incendie/calque.html node render_calque.cjs 169 "$D/out/film_3d.mp4" "$D/out/film_calque.mp4" 24)
python3 "$D/build_audio.py"
N="$L/EDUST_formation_incendie_3D_169"; SRC="$D/out/film_calque.mp4"
V="-c:v:0 libx264 -crf 20 -maxrate 6M -bufsize 12M -pix_fmt yuv420p -preset medium"
ffmpeg -y -v error -i "$SRC" -vf "select=eq(n\,0)" -frames:v 1 "${N}_miniature.png"
ffmpeg -y -v error -i "$SRC" -i "$D/audio/bande_bruitages.wav" -i "${N}_miniature.png" -map 0:v -map 1:a -map 2 $V -c:a aac -b:a 192k \
  -c:v:1 png -disposition:v:1 attached_pic -movflags +faststart "${N}_bruitages.mp4"
ffmpeg -y -v error -i "$SRC" -i "${N}_miniature.png" -map 0:v -map 1 $V -an -c:v:1 png -disposition:v:1 attached_pic -movflags +faststart "${N}_sans_son.mp4"
P=$(mktemp -d)/passe
ffmpeg -y -v error -i "$SRC" -vf scale=854:-2 -c:v libx264 -b:v 230k -pass 1 -passlogfile "$P" -preset slow -an -f null /dev/null
ffmpeg -y -v error -i "$SRC" -i "$D/audio/bande_bruitages.wav" -map 0:v -map 1:a -vf scale=854:-2 -c:v libx264 -b:v 230k -pass 2 -passlogfile "$P" \
  -preset slow -pix_fmt yuv420p -c:a aac -b:a 40k -ac 1 -movflags +faststart "$L/EDUST_formation_incendie_3D_mail_480p.mp4"
ls -la "$L"
