# Préparation des voix, du rig et de la bande-son (vidéo de prévention)

Scripts Python ayant produit les fichiers de `public/images/prevention/rig/`, `public/audio/prevention/`
et `src/components/prevention/lipsync.ts`. À relancer seulement si le texte ou les images changent.

Dépendances : `pip install kokoro-onnx soundfile pyworld opencv-contrib-python-headless pillow numpy` et ffmpeg.
Modèle vocal (dans un dossier `voices/`) :
`kokoro-v1.0.onnx` et `voices-v1.0.bin` depuis https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0

1. Pose du policier « bras décroisés » (dossier de travail `pose-work`) :
   `python pose_masks.py public/images/prevention pose-work` (masques de l'avant-bras et des doigts),
   `python torso.py public/images/prevention pose-work` (buste reconstruit sous les bras),
   `python pose_arms.py public/images/prevention pose-work` (avant-bras « geste » et « ceinture »).
   Puis `python rig.py public/images/prevention pose-work` — découpe les personnages en pièces animables
   (corps, tête, mains, avant-bras, bouche, paupières fermées).
2. `python lines.py voices` — synthétise les répliques (voix française Kokoro `ff_siwis`, transformée
   avec le vocodeur WORLD : grave pour le policier, aiguë pour l'enfant). Le texte est dans `lines.py`.
3. `python build_audio.py voices .` — mixe la bande-son (voix + bruitages, sans musique, 58 s),
   calcule la synchronisation labiale et écrit `lipsync.ts` (fins de répliques comprises).

Si les débuts de répliques changent, les reporter à la fois dans `build_audio.py` (CUES) et dans
`src/components/prevention/timeline.ts` (LINES).
