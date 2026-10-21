#!/bin/bash
# Clips Mixkit (licence Mixkit gratuite, usage commercial autorisé) -> séquences d'images 30 i/s dans assets/clips/<nom>/ + nf.js
set -e; cd "$(dirname "$0")"; mkdir -p raw/clips assets/clips
clip(){ # nom id début durée ralenti
  [ -f raw/clips/$2.mp4 ] || curl -sSf -o raw/clips/$2.mp4 "https://assets.mixkit.co/videos/$2/$2-720.mp4"
  mkdir -p assets/clips/$1
  if [ "$5" = 1 ]; then F="fps=30"; else F="setpts=$5*PTS,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1"; fi
  ffmpeg -y -loglevel error -ss $3 -t $4 -i raw/clips/$2.mp4 -vf "$F,scale=960:-2" -q:v 4 assets/clips/$1/%03d.jpg
}
clip choix 28938 1.0 3.8 1
clip compo 15122 2.0 4.0 1
clip petales 169 2.0 2.6 1.5
clip remise 15115 5.0 3.8 1
clip emotion 42596 0.5 2.6 1.5
echo "const NF={$(for d in assets/clips/*/; do n=$(basename $d); echo -n "$n:$(ls $d | wc -l),"; done)};" > assets/clips/nf.js
