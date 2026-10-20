#!/bin/bash
# Télécharge les visuels du site letanglaville.fr dans img/ puis prépare assets/ (petites photos agrandies x2 avec netteté).
set -e; cd "$(dirname "$0")"; mkdir -p img assets
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36"; B=https://www.letanglaville.fr/image
for p in bannieres/Master_bandeau_site.png bannieres/2.png illustration_page.jpg village/le_marche_rubrique.png village/acces_carte/eglise.png village/acces_carte/lavoir.png village/acces_carte/fontaine.png village/acces_carte/mairie.png village/acces_carte/monument.png village/acces_carte/venir_elv.png village/patrimoine/le_dolmen_du_cher_arpent.png village/patrimoine/parcours_nabis.png BREVES/breve_expo_md.png CARROUSEL/2026_carroustages_toussaint.png CADRE_DE_VIE/Environnement/recto_beaux_arbres.png logos/ARMES_ETANG-blanc.png logos/L_ETANG_BLEU_test.png; do
  curl -sSf -A "$UA" -o "img/$(basename $p)" "$B/$p"; done
up(){ convert "img/$1" -background white -flatten -filter Lanczos -resize "$2" -unsharp 0x1+0.6+0.02 -quality 90 "assets/$3.jpg"; }
up Master_bandeau_site.png 1600x village; up 2.png 1600x rue; up illustration_page.jpg 1600x fleurs
up le_marche_rubrique.png 200% marche; up eglise.png 200% eglise; up lavoir.png 200% lavoir; up fontaine.png 200% fontaine
up mairie.png 200% mairie; up monument.png 200% monument; up venir_elv.png 200% panneau; up le_dolmen_du_cher_arpent.png 200% dolmen
up parcours_nabis.png 250% nabis; up breve_expo_md.png 160% expo; up 2026_carroustages_toussaint.png 1004x stages
up recto_beaux_arbres.png 1400x arbres
cp img/ARMES_ETANG-blanc.png assets/blason_blanc.png; cp img/L_ETANG_BLEU_test.png assets/logo_texte.png
