# Préparation des voix, du rig et de la bande-son (vidéo de prévention)

Scripts Python ayant produit les fichiers de `public/images/prevention/rig/`, `public/audio/prevention/`
et `src/components/prevention/lipsync.ts`. À relancer seulement si le texte ou les images changent.

Dépendances : `pip install kokoro-onnx soundfile pyworld opencv-contrib-python-headless pillow numpy` et ffmpeg.
Modèle vocal (dans un dossier `voices/`) :
`kokoro-v1.0.onnx` et `voices-v1.0.bin` depuis https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0

1. `python rig.py public/images/prevention` — découpe les personnages en pièces animables
   (corps, tête, main, bouche, paupières fermées).
2. `python lines.py voices` — synthétise les répliques (Kokoro : voix d'homme naturelle pour le policier,
   mélange des styles `ff_siwis` et `am_onyx` sans transformation ; voix française `ff_siwis` rendue plus
   aiguë avec le vocodeur WORLD pour l'enfant). Le texte est dans `lines.py`.
3. `python build_audio.py voices .` — mixe la bande-son (voix + bruitages, sans musique, 58 s),
   calcule la synchronisation labiale et écrit `lipsync.ts` (fins de répliques comprises).

Si les débuts de répliques changent, les reporter à la fois dans `build_audio.py` (CUES) et dans
`src/components/prevention/timeline.ts` (LINES).
