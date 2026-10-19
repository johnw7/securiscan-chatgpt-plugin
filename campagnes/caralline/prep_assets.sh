#!/bin/bash
# Télécharge les photos du site carallinepatisserie.fr et les prépare (jpg ≤1080 px, non recadrées).
set -e
cd "$(dirname "$0")"; mkdir -p assets
S=https://carallinepatisserie.fr; P=https://atelier-api.beimin.fr/uploads/products/11111111-1111-1111-1111-111111111111
get(){ curl -sSfL -A "Mozilla/5.0" -o "/tmp/car_$1.webp" "$2" && convert "/tmp/car_$1.webp" -resize '1080x1080>' -quality 88 "assets/$1.jpg"; }
get devanture  $S/about/Caralline.webp
get carine     $S/about/Carine.webp
get allan      $S/about/Allan.webp
get terrasse   $S/hero/hero-accueil.webp
get the        $S/hero/DSC_0901.webp
get brunch     $S/brunch/brunch-eggs-overhead.webp
get oeuf       $S/accueil/sale.webp
get vitrine    $S/accueil/patisserie.webp
get pecan      $P/d24ff371-d728-43cd-af31-d50007fde3da-1200.webp
get chocolat   $P/f6125696-c483-433a-8087-0c511ad159dc-1200.webp
get fraisier   $P/2819d0c3-cf67-40f0-90b0-df6b6d3aeb17-1200.webp
get fraises    $P/f73d9acd-6a3a-4c97-b100-bd92056f414b-1200.webp
get tartelette $P/3f3c7a8c-cb33-4c03-80ce-f74ff3a29881-1200.webp
get framboise  $P/5dcc5b5b-e95c-426f-8528-941b0a2990bf-1200.webp
get cookie1    $P/2cbdfe4b-7951-4ad1-a670-aa3d30533bc9-1200.webp
get cookie2    $P/7afa5088-6fa3-4555-88de-f1a4b5ce1c2e-1200.webp
get cookie3    $P/70f00afb-019f-46b3-ae0f-df5e7ef04752-1200.webp
get abricot    $P/d4230432-d6f8-434a-9f98-547bd0e3f118-1200.webp
curl -sSfL -o assets/logo.png $S/images/logo.png
convert assets/logo.png -fill '#fbe2d3' -colorize 100 assets/logo_creme.png
