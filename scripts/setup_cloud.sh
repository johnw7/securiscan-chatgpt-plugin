#!/bin/bash
# Script d'installation de l'environnement cloud Claude Code pour E-DUST Clients
# (à coller dans : menu de l'environnement cloud → Edit → Setup script).
# Installe ce qu'il faut pour fabriquer les vidéos : rendu (Chromium/Playwright), ffmpeg, ImageMagick,
# polices, Python audio, voix off française (Piper) et contrôle de prononciation (Whisper).
set -e
export DEBIAN_FRONTEND=noninteractive
command -v ffmpeg >/dev/null && command -v convert >/dev/null || {
  apt-get update -qq
  apt-get install -y -qq ffmpeg imagemagick fonts-dejavu fonts-noto-color-emoji curl bzip2 >/dev/null
}
pip install -q --break-system-packages numpy scipy soundfile piper-tts sherpa-onnx faster-whisper 2>/dev/null \
  || pip install -q numpy scipy soundfile piper-tts sherpa-onnx faster-whisper
npm ls -g playwright >/dev/null 2>&1 || npm install -g playwright@1.56.1 >/dev/null
# voix off française (Piper, voix « siwis ») dans ~/tts
mkdir -p "$HOME/tts"
[ -d "$HOME/tts/vits-piper-fr_FR-siwis-medium" ] || \
  curl -sSL https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-fr_FR-siwis-medium.tar.bz2 \
  | tar -xj -C "$HOME/tts"
echo "Environnement E-DUST prêt"
