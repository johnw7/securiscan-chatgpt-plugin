#!/bin/bash
# Chaîne complète de « Les premières étapes d'un nouvel arrivant » (démo E-DUST) :
#  1. voix off (audio/voix_blocs/bloc1…6 si présents, sinon Piper) → timeline.js
#  2. bandes-son (voix + bruitages doux ; variante avec nappe musicale)
#  3. montage des séquences vidéo Adobe Stock calé sur la voix → out/base_169.mp4
#  4. calque animé (titres, cartes, infographies, sous-titres) superposé, en 16:9 puis 9:16
#  5. exports dans livraison/integration/
# Prérequis : serveur local à la racine du dépôt (python3 -m http.server 8765 --bind 127.0.0.1), clips/ (séquences converties).
set -e
D=$(cd "$(dirname "$0")" && pwd); cd "$D"
python3 voix.py "${1:-$HOME/tts/vits-piper-fr_FR-siwis-medium}"
python3 build_audio.py bruitages && python3 build_audio.py musique
python3 montage.py
cd .. && export NODE_PATH=$(npm root -g) PAGE=integration/video.html
node render_calque.cjs 169 integration/out/base_169.mp4 integration/out/video_169_v2_muet.mp4 25
node render_calque.cjs 916 integration/out/base_169.mp4 integration/out/video_916_v2_muet.mp4 25
cd integration && ./export.sh
