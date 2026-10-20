#!/bin/bash
# Photos Unsplash (licence Unsplash, usage commercial autorisé) pour la démo fictive Studio Nacre.
set -e; cd "$(dirname "$0")"; mkdir -p assets
get(){ curl -sSf -o "assets/$1.jpg" "https://images.unsplash.com/photo-$2?w=1080&q=85"; }
get fatigue 1517841905240-472988babdf9; get salon 1521590832167-7bcbfaa6381f; get shampoing 1634449571010-02389ed0f9b0
get outils 1527799820374-dcf8d9d4a388; get brushing 1562322140-8baeececf3df; get boucles 1500917293891-ef795e70e1f6
get sourire 1494790108377-be9c29b29330; get equipe 1559599101-f09722fb4948
