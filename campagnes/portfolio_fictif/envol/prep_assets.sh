#!/bin/bash
# Clips Coverr (licence Coverr gratuite, usage commercial autorisé) -> séquences d'images 30 i/s dans assets/clips/<nom>/ + nf.js
set -e; cd "$(dirname "$0")"; mkdir -p raw/clips assets/clips
clip(){ # nom slug début durée ralenti
  [ -f raw/clips/$2.mp4 ] || curl -sSf -o raw/clips/$2.mp4 "https://cdn.coverr.co/videos/coverr-$2/720p.mp4"
  mkdir -p assets/clips/$1
  if [ "$5" = 1 ]; then F="fps=30"; else F="setpts=$5*PTS,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1"; fi
  ffmpeg -y -loglevel error -ss $3 -t $4 -i raw/clips/$2.mp4 -vf "$F,scale=960:-2" -q:v 4 assets/clips/$1/%03d.jpg
}
clip nuit a-woman-working-on-her-computer-late-at-night-3699 0.5 5.0 1
clip fatigue a-girl-working-at-her-office-desk-feeling-tired-2989 3.0 5.2 1
clip rire a-woman-laughing-while-working-at-night-in-her-office-6011 2.0 3.6 1
clip bureau a-cheerful-young-woman-enters-the-office-5506 0.0 3.2 1
clip equipe a-young-woman-bringing-coffee-to-her-coworker-3387 1.0 3.2 1
echo "const NF={$(for d in assets/clips/*/; do n=$(basename $d); echo -n "$n:$(ls $d | wc -l),"; done)};" > assets/clips/nf.js
