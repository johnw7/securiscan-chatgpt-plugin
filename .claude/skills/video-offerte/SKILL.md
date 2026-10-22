---
name: video-offerte
description: Crée la vidéo découverte offerte pour un prospect (analyse du site, choix du format, scénario, vidéo 9:16 + 4:5, messages d'envoi, mise à jour du suivi). Utiliser quand Tarik donne l'URL d'un prospect ou demande « fais-moi un modèle / une vidéo pour <entreprise> ».
---
# Vidéo offerte pour un prospect

Argument : URL du site (et éventuellement nom du contact).

1. **Analyse** le site : activité, cible, promesse, couleurs (relever les hex), polices, logo, meilleures photos, ton, réseaux sociaux, ce qui manque dans leur communication. Résume en 6 lignes.
2. **Raconte une histoire (consigne n°1 de CLAUDE.md)** : personnage identifiable, émotion, effet waouh, « on met le paquet ». Écris le mini-scénario en 5 temps (quotidien → déclic → moment fort → nouvelle vie → appel à l'action) avant tout le reste.
2bis. **Choisis le format** dans `projet-clients/03_formats_videos.md` et propose un concept en une phrase d'accroche (ex. « POV : tu viens d'emménager à … »). Écris le scénario : couverture, 6 à 8 scènes (texte court + photo), carte de fin (logo, appel à l'action, site, mention « exemple non officiel · création E-DUST Solutions »).
3. **Fabrique** dans `campagnes/<client>/` en partant du modèle le plus proche (voir CLAUDE.md) : `prep_assets.sh`, page HTML, `build_audio.py`, `.gitignore` (img/ raw/ assets/ audio/ out/).
4. **Contrôle** en stills 9:16 et 4:5 : photos entières, pas de chevauchement, rien sous l'interface Reels, textes lisibles, miniature = 1re image. Corrige avant le rendu.
5. **Rends et exporte** dans `livraison/<client>/` : bruitages sans musique (9:16, 4:5), sans son, avec musique, version mail < 4 Mo, miniatures. Vérifie les durées avec ffprobe.
6. **Messages** : mail + SMS/LinkedIn à partir des modèles de `projet-clients/02_methode_prospection.md`, personnalisés (nom du contact si connu, concept de la vidéo, basé à Saint-Germain-en-Laye).
7. **Suivi** : ajoute/actualise la ligne dans `projet-clients/05_suivi_prospects.csv` (statut « vidéo prête »).
8. **Commit + push** des sources et du suivi ; envoie les vidéos à Tarik ; termine par « Prochaine action : … ».
