#!/bin/bash
# Télécharge les photos du site lafabrique-cookies.fr et les prépare (jpg ≤1080 px, non recadrées).
set -e
cd "$(dirname "$0")"; mkdir -p assets
B=https://www.lafabrique-cookies.fr/cdn/shop/files
get(){ curl -sSfL --retry 4 --retry-all-errors -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36" -o "/tmp/lfc_$1" "$B/$2?width=1400" && convert "/tmp/lfc_$1[0]" -background white -flatten -resize '1080x1080>' -quality 88 "assets/$1.jpg"; }
get comptoir  ok_3.png
get stack     LA_FABRIQUES_COOKIES_NEW_COOKIES_12_2025___MARY_DEVINAT_30.jpg
get fondant1  LA_FABRIQUE_COOKIE_03_2026_COOKIES___MARY_DEVINAT_10.jpg
get fondant2  LA_FABRIQUE_COOKIE_03_2026_COOKIES___MARY_DEVINAT_9.jpg
get volants   LA_FABRIQUES_COOKIES_NEW_COOKIES_12_2025___MARY_DEVINAT_13_1_2b4cae46-27de-4681-9552-568e8c512ece.jpg
get boite6    BOITE6PARFUMSDIVERS_7cccde5a-2adb-4014-8e09-f3a1449d4888.jpg
get coffret10 COFFRETDE10_2_e7e8487b-fddb-40ea-8c62-be0b59d75608.jpg
get cuillere  LA_FABRIQUES_COOKIES_ST_VALENTIN_12_2025___MARY_DEVINAT_23.jpg
get boissons  LA_FABRIQUE_COOKIE_BOISSONS_CHAUDES_2025___MARY_DEVINAT_3.jpg
get cafe      LA_FABRIQUE_COOKIE_BOISSONS_CHAUDES_2025___MARY_DEVINAT_59.jpg
get eloy      LFC_07_2026_COOKIE_ELOI_SPINNLER___MARY_DEVINAT_13.jpg
get minis     MINICOOKIESDIVERS_9604867f-fcf8-493f-9c6f-e9a770e06d12.jpg
get pistache  LFC_Juillet_Studio_2025_Sebastien_Dray_65.jpg
get noisette  LFCJuillet_2025_Sebastien_Dray_64.jpg
get boutique  Ouverture_boutique_Lyon.png
curl -sSfL --retry 4 -A "Mozilla/5.0" -o /tmp/lfc_logo.png "$B/logo-checkouts_49c2b5a4-565c-4485-a062-b8137052c671.png"
convert /tmp/lfc_logo.png -trim +repage -fill '#2E4B9B' -colorize 100 assets/logo_bleu.png
convert /tmp/lfc_logo.png -trim +repage -fill '#FBBC04' -colorize 100 assets/logo_jaune.png
