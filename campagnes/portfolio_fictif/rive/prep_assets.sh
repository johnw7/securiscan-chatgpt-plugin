#!/bin/bash
# Clips Coverr (licence Coverr gratuite, usage commercial autorisé) -> séquences d'images 30 i/s dans assets/clips/<nom>/ + nf.js
set -e; cd "$(dirname "$0")"; mkdir -p raw/clips assets/clips
clip(){ # nom slug début durée ralenti
  [ -f raw/clips/$2.mp4 ] || curl -sSf -o raw/clips/$2.mp4 "https://cdn.coverr.co/videos/coverr-$2/720p.mp4"
  mkdir -p assets/clips/$1
  if [ "$5" = 1 ]; then F="fps=30"; else F="setpts=$5*PTS,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1"; fi
  ffmpeg -y -loglevel error -ss $3 -t $4 -i raw/clips/$2.mp4 -vf "$F,scale=960:-2" -q:v 4 assets/clips/$1/%03d.jpg
}
clip rayon browsing-in-a-fashion-store-4162 2.0 3.4 1
clip piece a-view-of-the-intricate-details-of-a-belt-and-jewelry-5806 13.0 3.6 1
clip jour city-stroll-with-a-warm-drink 3.0 2.9 1.5
clip bureau confident-businesswoman-walking-outdoors 2.0 2.9 1.5
clip soiree a-view-of-the-intricate-details-of-a-belt-and-jewelry-5806 2.0 2.2 2
clip cabine looking-in-the-mirror-2261 3.0 3.8 1
echo "const NF={$(for d in assets/clips/*/; do n=$(basename $d); echo -n "$n:$(ls $d | wc -l),"; done)};" > assets/clips/nf.js
