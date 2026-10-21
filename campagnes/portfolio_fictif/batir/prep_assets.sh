#!/bin/bash
# Clips Coverr (licence Coverr gratuite, usage commercial autorisé) -> séquences d'images 30 i/s dans assets/clips/<nom>/ + nf.js,
# et deux images fixes (avant / après) tirées des clips.
set -e; cd "$(dirname "$0")"; mkdir -p raw/clips assets/clips
dl(){ [ -f raw/clips/$1.mp4 ] || curl -sSf -o raw/clips/$1.mp4 "https://cdn.coverr.co/videos/coverr-$1/720p.mp4"; }
clip(){ # nom slug début durée ralenti
  dl $2; mkdir -p assets/clips/$1
  if [ "$5" = 1 ]; then F="fps=30"; else F="setpts=$5*PTS,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1"; fi
  ffmpeg -y -loglevel error -ss $3 -t $4 -i raw/clips/$2.mp4 -vf "$F,scale=960:-2" -q:v 4 assets/clips/$1/%03d.jpg
}
still(){ dl $2; ffmpeg -y -loglevel error -ss $3 -i raw/clips/$2.mp4 -frames:v 1 -q:v 2 assets/$1.jpg; }
clip fuite dripping-tap-8483 2.0 1.7 2
clip client man-standing-in-an-empty-bathroom-1659 3.0 3.4 1
clip demolition interior-renovation-6673 1.0 1.4 1
clip percage screwdriver-drill-at-work-9243 2.0 1.4 1
clip scie carpenter-works-with-a-miter-saw-7315 4.0 1.4 1
clip peinture woman-painting-white-walls-8969 3.0 2.0 1
clip pose carrying-a-ceramic-toilet-7875 2.0 1.4 1
clip apres bathroom-interior-design-4234 0.0 3.6 1
still avant dripping-faucet-5085 3.0
still apres bathroom-interior-design-4234 0.6
echo "const NF={$(for d in assets/clips/*/; do n=$(basename $d); echo -n "$n:$(ls $d | wc -l),"; done)};" > assets/clips/nf.js
