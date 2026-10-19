#!/bin/bash
# Télécharge les photos du site apmparis.fr et les prépare (jpg ≤1080 px, non recadrées).
set -e
cd "$(dirname "$0")"; mkdir -p assets
B=https://apmparis.fr/wp-content/uploads
get(){ curl -sSfL --retry 4 --retry-all-errors -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36" -e https://apmparis.fr/ -o "/tmp/apm_$1" "$2" && convert "/tmp/apm_$1[0]" -background white -flatten -resize '1080x1080>' -quality 88 "assets/$1.jpg"; }
get showroom  "$B/2026/01/essayage-robe-mariee-privatise-saint-germain-en-laye-apmparis.webp.jpeg"
get sirene    "$B/2026/01/6C03_DAGOL_AIRE_BARCELONA_1.jpg"
get princesse "$B/2026/01/ozen_b_1.webp"
get boheme    "$B/2026/01/u-1.webp"
get dentelle  "$B/2026/01/img-robe.jpg"
get dentelle2 "$B/2026/02/Luce_Lviv_247838-scaled.webp"
get dosnu     "$B/2026/01/9C51_VIONA_AIRE_BARCELONA_4.jpg"
get perles    "$B/2026/06/Cleophee-1b.png"
get atelier   "$B/2026/05/generated_yEEQfndPW07gjBQeHqAj4_1-scaled.jpg"
get chateau   "$B/2026/01/Design-sans-titre-13.png"
get accessoires "$B/2026/01/image-site.jpg"
get canape    "$B/2026/01/image-robe1.jpg"
get fendue    "$B/2026/01/9H20_UMBERT_AIRE_BARCELONA_3.jpg"
get mer       "$B/2026/01/dominique_k_nq2o8y5pmqmospyq-1.webp"
get florina   "$B/2026/01/florina_b.webp"
get octavia   "$B/2026/01/octavia_b_1.webp"
curl -sSfL --retry 4 --retry-all-errors -A "Mozilla/5.0" -e https://apmparis.fr/ -o assets/logo.png "$B/2026/01/APM-1.png"
