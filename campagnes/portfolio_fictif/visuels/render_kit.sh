#!/bin/bash
# Rend le kit de visuels : ./render_kit.sh <dossier sortie> [marques…]  (serveur http.server 8765 à la racine requis)
OUT=$(realpath -m "$1"); shift; BRANDS=${@:-vyrox noir velocity}
cd "$(dirname "$0")/../../demos_portfolio"; export NODE_PATH=$(npm root -g)
for b in $BRANDS; do for f in post story carre banner c1 c2 c3; do
  case $f in story) a=916;; carre) a=11;; banner) a=169;; *) a=45;; esac
  T=$OUT/tmp_${b}_$f; mkdir -p "$T"
  PAGE="../portfolio_fictif/visuels/kit.html?b=$b&f=$f" node render.cjs $a stills "$T" 0 >/dev/null 2>&1
  mv "$T"/*.png "$OUT/${b}_$f.png" 2>/dev/null || mv "$T"/.*.png "$OUT/${b}_$f.png"; rmdir "$T"
done; done; ls "$OUT"
