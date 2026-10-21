#!/bin/bash
# Maison Lumea (spa fictif) : clips Coverr (licence Coverr, usage commercial autorisé) -> séquences 30 i/s ; photos Unsplash (licence Unsplash).
set -e; cd "$(dirname "$0")"; mkdir -p raw/clips assets/clips
clip(){ # nom slug début durée ralenti
  [ -f raw/clips/$2.mp4 ] || curl -sSf -o raw/clips/$2.mp4 "https://cdn.coverr.co/videos/coverr-$2/720p.mp4"
  mkdir -p assets/clips/$1
  if [ "$5" = 1 ]; then F="fps=30"; else F="setpts=$5*PTS,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1"; fi
  ffmpeg -y -loglevel error -ss $3 -t $4 -i raw/clips/$2.mp4 -vf "$F,scale=960:-2" -q:v 4 assets/clips/$1/%03d.jpg
}
clip eau slow-motion-rippling-water-1418 0.0 2.1 2
clip souffle close-up-of-savasana-by-the-sea 1.0 4.2 1
clip verse pouring-water-4814 6.0 2.8 1.5
echo "const NF={$(for d in assets/clips/*/; do n=$(basename $d); echo -n "$n:$(ls $d | wc -l),"; done)};" > assets/clips/nf.js
get(){ curl -sSf -o "assets/$1.jpg" "https://images.unsplash.com/photo-$2?w=1080&q=85"; }
get pierres 1600334089648-b0d9d3028eb2; get massage 1544161515-4ab6ce6db874; get serviette 1540555700478-4be289fbecef; get huile 1515377905703-c4788e51af15
