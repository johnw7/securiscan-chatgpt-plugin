# Vidéo « Le permis vélo » : Police municipale

- `permis-velo-police-municipale.mp4` : vidéo verticale 1080×1920, 31 s, 30 i/s, avec musique douce (format Reels, Stories, TikTok, Shorts)
- `img/v1.jpg` à `v6.jpg` : scènes générées avec l'IA de Canva à partir du personnage de référence
- `overlays/` et `source/overlays.html` : textes (titre, 4 règles, bravo, écran de fin)

Déroulé : titre « Le permis vélo » · Règle 1 casque · Règle 2 vérifier son vélo · Règle 3 tendre le bras · Règle 4 le stop · Permis réussi · écran de fin.
Montage : zooms lents, textes animés, transitions glissées (ffmpeg). Mention « document de démonstration non officiel · illustrations générées par IA » sur l'écran de fin.

## Version avec dialogues

- `permis-velo-police-municipale-dialogues.mp4` : 56 s, 1080×1920, personnages qui parlent avec bulles de dialogue animées, musique baissée sous les voix
- Voix : synthèse neuronale Microsoft (Rémy pour l'agent, Éloïse pour Léa, Éloïse plus grave pour Tom, chœur pour les enfants), fichiers dans `voix/`
- Script : `SCRIPT-DIALOGUES.md` · montage : `source/build_dialogues.py`, `source/render_dialogues.py`, bulles `source/bulles.html`
