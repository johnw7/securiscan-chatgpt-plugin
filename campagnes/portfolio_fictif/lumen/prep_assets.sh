#!/bin/bash
# Photos Unsplash (licence Unsplash, usage commercial gratuit) pour la démo fictive « Lumen Immobilier ».
set -e; cd "$(dirname "$0")"; mkdir -p assets
g(){ curl -sSf --retry 3 -o "assets/$1.jpg" "https://images.unsplash.com/photo-$2?w=1400&q=85"; }
g maison 1600596542815-ffad4c1539a9; g facade 1570129477492-45c003edd2be; g salon 1600566753086-00f18fb6b3ea
g cuisine 1600121848594-d8644e57abab; g chambre 1617104678098-de229db51175; g bain 1600566752355-35792bedcfea
g jardin 1600607688969-a5bfcd646154; g palmier 1564013799919-ab600027ffc6; g moderne 1600585154526-990dced4db0d
g blanche 1523217582562-09d0def993a6; g cles 1560518883-ce09059eeffa
