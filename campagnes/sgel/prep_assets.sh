#!/bin/bash
# Prépare les photos du site saintgermainenlaye.fr (téléchargées dans img/ : plus grande version de chaque image) et le logo.
set -e
cd "$(dirname "$0")"; mkdir -p assets
p(){ convert "img/$2" -resize '1080x1080>' -quality 88 "assets/$1.jpg"; }
p chateau Chateau_ext.jpg; p cour Chateau_2.jpg; p facade Chateau_1.jpg; p terrasse Parc.jpg
p rue coeurdeville3.jpg; p cafes un_passe_royal_5.jpg; p place Place_de_la_Victoire.jpg; p mairie Hotel_de_ville_20160720-0008.jpg
p foret Vignettes_foret_domaniale.jpg; p mare La_Mare_aux_canes.jpg; p course Sport_axe_2.jpg; p jeunes Sport_axe_1.jpg
p noailles Hotel_de_Noailles_2.jpg; p tulipes chateau.jpg; p patrimoine histoire_et_patrimoine_vignette.jpeg; p banc Vignettes_square_et_jardins.jpg
convert raw/logo.png -trim +repage -resize 600x assets/logo.png
convert assets/logo.png -fill white -colorize 100 assets/logo_blanc.png
