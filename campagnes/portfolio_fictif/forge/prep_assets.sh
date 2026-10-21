#!/bin/bash
# Clips Coverr (licence Coverr gratuite, usage commercial autorisé) -> séquences d'images 30 i/s dans assets/clips/<nom>/ + nf.js
set -e; cd "$(dirname "$0")"; mkdir -p raw/clips assets/clips
clip(){ # nom slug début durée ralenti
  [ -f raw/clips/$2.mp4 ] || curl -sSf -o raw/clips/$2.mp4 "https://cdn.coverr.co/videos/coverr-$2/720p.mp4"
  mkdir -p assets/clips/$1
  if [ "$5" = 1 ]; then F="fps=30"; else F="setpts=$5*PTS,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1"; fi
  ffmpeg -y -loglevel error -ss $3 -t $4 -i raw/clips/$2.mp4 -vf "$F,scale=960:-2" -q:v 4 assets/clips/$1/%03d.jpg
}
clip entree man-tying-his-shoelaces-5259 1.0 3.8 1
clip cordes battle-rope-workout-9563 2.0 3.6 1
clip discipline man-starting-his-squatting-workout-4958 11.5 3.8 1
clip souleve weight-lifting-in-the-gym-7769 3.0 2.0 2
clip souffle man-out-of-breath-after-cardio-3821 2.0 4.6 1
clip pneu athlete-doing-a-tire-flip-exercise-6897 2.4 0.5 1
echo "const NF={$(for d in assets/clips/*/; do n=$(basename $d); echo -n "$n:$(ls $d | wc -l),"; done)};" > assets/clips/nf.js
