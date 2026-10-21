#!/bin/bash
# Clips Mixkit (licence Mixkit gratuite) et Coverr (licence Coverr gratuite), usage commercial autorisé
# -> séquences d'images 30 i/s dans assets/clips/<nom>/ + assets/clips/nf.js
set -e; cd "$(dirname "$0")"; mkdir -p raw/clips assets/clips
mk(){ [ -f raw/clips/mk$1.mp4 ] || curl -sSf -o raw/clips/mk$1.mp4 "https://assets.mixkit.co/videos/$1/$1-720.mp4"; echo raw/clips/mk$1.mp4; }
cv(){ [ -f raw/clips/$1.mp4 ] || curl -sSf -o raw/clips/$1.mp4 "https://cdn.coverr.co/videos/coverr-$1/720p.mp4"; echo raw/clips/$1.mp4; }
seq(){ # nom fichier début durée
  mkdir -p assets/clips/$1; ffmpeg -y -loglevel error -ss $3 -t $4 -i $2 -vf "fps=30,scale=960:-2" -q:v 4 assets/clips/$1/%03d.jpg; }
seq voyant "$(mk 33464)" 1.0 2.9
seq scan "$(cv man-pressing-buttons-on-a-machine-9493)" 0.5 3.5
seq pneus "$(mk 13260)" 2.0 3.7
seq vidange "$(cv checking-the-oil-level-of-a-car-6558)" 3.0 3.3
seq moteur "$(mk 13270)" 0.5 3.1
seq niveaux "$(mk 4716)" 1.0 3.1
seq capot "$(cv closing-the-bonnet-of-a-car-3343)" 7.0 3.9
seq explique "$(mk 23751)" 1.0 3.3
seq route "$(cv car-driving-on-a-curvy-road-9744)" 1.0 3.5
seq meca "$(mk 13180)" 0.5 5.0
echo "const NF={$(for d in assets/clips/*/; do n=$(basename $d); echo -n "$n:$(ls $d | wc -l),"; done)};" > assets/clips/nf.js
