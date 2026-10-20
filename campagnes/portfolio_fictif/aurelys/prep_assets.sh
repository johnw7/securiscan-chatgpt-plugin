#!/bin/bash
# Photos Unsplash (licence Unsplash, usage commercial gratuit) pour la démo fictive « Aurelys ».
set -e; cd "$(dirname "$0")"; mkdir -p assets
g(){ curl -sSf --retry 3 -o "assets/$1.jpg" "https://images.unsplash.com/photo-$2?w=1400&q=85"; }
g nuit 1416331108676-a22ccb276e35; g vitrine 1497366216548-37526070297c; g villa 1613490493576-7fde63acd811
g salon_bourgeois 1600210492486-724fe5c67fb0; g demeure 1580587771525-78b9dba3b914; g sejour 1600607687939-ce8a6c25118c
g chambre 1600607687644-c7171b42498f; g terrasse 1600573472550-8090b5e0745e; g equipe 1600880292203-757bb62b4baf
