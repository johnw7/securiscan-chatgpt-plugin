#!/bin/bash
# Clips Coverr (licence Coverr gratuite, usage commercial autorisé) -> séquences d'images 30 i/s dans assets/clips/<nom>/ + nf.js
set -e; cd "$(dirname "$0")"; mkdir -p raw/clips assets/clips
clip(){ # nom slug début durée ralenti
  [ -f raw/clips/$2.mp4 ] || curl -sSf -o raw/clips/$2.mp4 "https://cdn.coverr.co/videos/coverr-$2/720p.mp4"
  mkdir -p assets/clips/$1
  if [ "$5" = 1 ]; then F="fps=30"; else F="setpts=$5*PTS,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1"; fi
  ffmpeg -y -loglevel error -ss $3 -t $4 -i raw/clips/$2.mp4 -vf "$F,scale=960:-2" -q:v 4 assets/clips/$1/%03d.jpg
}
clip pop popcorn-flying-from-a-box-with-a-red-background-9217 0.0 1.6 2
clip canape a-blonde-guy-sits-down-on-his-couch-and-uses-his-smartphone-7823 0.2 3.8 1
clip femme a-woman-watching-tv-3282 2.0 3.8 1
clip couple a-couple-relaxing-at-home-2553 1.0 3.8 1
clip ailleurs couple-hugging-and-looking-on-phone-8638 1.0 3.8 1
clip nuit a-man-looking-at-his-phone-in-his-home-late-at-night-631 1.0 4.4 1
echo "const NF={$(for d in assets/clips/*/; do n=$(basename $d); echo -n "$n:$(ls $d | wc -l),"; done)};" > assets/clips/nf.js
# --- version histoire (Léa et Tom) ---
clip ecrans couple-spending-time-together-5136 1.0 3.9 1
clip sofa couple-sitting-on-the-couch-together-3352 2.0 3.9 1
clip rire couple-playing-video-games-together-7907 10.6 2.3 2
clip mardi couple-relaxing-on-a-couch-8000 1.0 3.9 1
clip mains couple-sitting-on-the-couch-1286 1.0 3.9 1
echo "const NF={$(for d in assets/clips/*/; do n=$(basename $d); echo -n "$n:$(ls $d | wc -l),"; done)};" > assets/clips/nf.js
