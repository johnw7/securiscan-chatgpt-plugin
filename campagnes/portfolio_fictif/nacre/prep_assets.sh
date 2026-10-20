#!/bin/bash
# Photos Unsplash (licence Unsplash, usage commercial autorisé) pour la démo fictive Studio Nacre.
set -e; cd "$(dirname "$0")"; mkdir -p assets
get(){ curl -sSf -o "assets/$1.jpg" "https://images.unsplash.com/photo-$2?w=1080&q=85"; }
get fatigue 1517841905240-472988babdf9; get salon 1521590832167-7bcbfaa6381f; get shampoing 1634449571010-02389ed0f9b0
get outils 1527799820374-dcf8d9d4a388; get brushing 1562322140-8baeececf3df; get boucles 1500917293891-ef795e70e1f6
get sourire 1494790108377-be9c29b29330; get equipe 1559599101-f09722fb4948
# Clips vidéo Mixkit (licence Mixkit gratuite, usage commercial autorisé) -> séquences d'images 30 i/s dans assets/clips/<nom>/
mkdir -p raw/clips assets/clips
clip(){ # nom id début durée ralenti(1=normal, 2=deux fois plus lent)
  [ -f raw/clips/$2.mp4 ] || curl -sSf -o raw/clips/$2.mp4 "https://assets.mixkit.co/videos/$2/$2-720.mp4"
  mkdir -p assets/clips/$1
  if [ "$5" = 1 ]; then F="fps=30"; else F="setpts=$5*PTS,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1"; fi
  ffmpeg -y -loglevel error -ss $3 -t $4 -i raw/clips/$2.mp4 -vf "$F,scale=960:-2" -q:v 4 assets/clips/$1/%03d.jpg
}
clip shampoing 33099 0.3 2.2 2
clip coupe 11615 0.4 1.6 1
clip ciseaux 13123 1.0 1.6 1
clip sechage 11615 7.4 2.2 2
clip flip 41617 3.0 4.4 1
