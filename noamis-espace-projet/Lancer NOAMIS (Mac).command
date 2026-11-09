#!/bin/bash
# NOAMIS — Espace Projet : lanceur pour Mac (double-clic)
cd "$(dirname "$0")" || exit 1
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
clear
echo "NOAMIS — Espace Projet"
echo "======================"
echo
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js n'est pas installé sur cet ordinateur."
  echo "La page de téléchargement va s'ouvrir : installez la version « LTS »,"
  echo "puis double-cliquez de nouveau sur ce lanceur."
  open "https://nodejs.org/fr/download"
  read -r -p "Appuyez sur Entrée pour fermer..."
  exit 1
fi
if ! node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)"; then
  echo "Votre version de Node.js ($(node -v)) est trop ancienne : il faut la version 22.13 ou plus récente."
  open "https://nodejs.org/fr/download"
  read -r -p "Appuyez sur Entrée pour fermer..."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "Première utilisation : installation (1 à 2 minutes, connexion internet nécessaire)..."
  if ! npm install --omit=dev --no-audit --no-fund; then
    echo "L'installation a échoué. Vérifiez votre connexion internet puis réessayez."
    read -r -p "Appuyez sur Entrée pour fermer..."
    exit 1
  fi
fi
OPEN_BROWSER=1 node --disable-warning=ExperimentalWarning server.js
echo
read -r -p "Application arrêtée. Appuyez sur Entrée pour fermer..."
