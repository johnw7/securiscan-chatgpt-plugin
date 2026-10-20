#!/bin/bash
# Télécharge les photos du site avenir-investissement.fr dans img/ puis prépare assets/ (≤1400 px, non recadrées).
set -e; cd "$(dirname "$0")"; mkdir -p img assets
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36"
B=https://www.avenir-investissement.fr/office5/avenirinvest_040425/catalog/images; V=https://v2.immo-facile.com/office5/avenirinvest_040425/catalog/images/perso
get(){ curl -sSfL -A "$UA" -o "img/$(basename $1)" "$1"; }
for p in 6/0/5/3/9/3/1/3/60539313b 5/8/3/6/8/3/4/9/58368349a 6/1/6/3/4/4/7/2/61634472a 6/1/6/3/4/4/7/2/61634472b 6/0/8/2/7/4/2/7/60827427a 6/1/4/7/0/2/5/4/61470254a 6/0/5/3/9/3/1/3/60539313e 6/0/5/3/9/3/1/3/60539313c 6/1/4/0/2/5/6/9/61402569a 6/0/6/8/4/3/6/4/60684364a 6/1/5/4/2/8/2/6/61542826b 6/1/5/7/1/7/3/2/61571732a; do get $B/pr_p/$p.jpg; done
get $B/poster1-min.jpg; get $B/logo_white.png
for n in vitrine_avenir_investissement.jpg agence_interieur_plantes.jpg equipe_2026.jpg; do get $V/$n; done
for k in poster1-min:nuit 60539313b:villa 58368349a:demeure 61634472a:piscine_nuit 61634472b:tennis 60827427a:salon_bourgeois 61470254a:salon_lyon6 60539313e:chambre 60539313c:sejour 61402569a:terrasse 60684364a:olivier 61542826b:jardin_piscine vitrine_avenir_investissement:vitrine equipe_2026:equipe agence_interieur_plantes:agence 61571732a:patio; do
  convert img/${k%%:*}.jpg -resize '1400x1400>' -quality 88 assets/${k#*:}.jpg; done
cp img/logo_white.png assets/logo_blanc.png
