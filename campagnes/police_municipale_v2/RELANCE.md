# Procédure de relance (autonome)
1. Lire state.json. Si next > 20 → étape Finale.
2. Si les ovNN.png manquent : python3 build.py && NODE_PATH=$(npm root -g) node shot.cjs ov01 … ov20
3. generate-image Canva : prompt_template avec {SCENE} = "officers: " + scène (concepts.py), imageReferences = refs, PORTRAIT_2_3.
   - quota_cooldown → ne rien dire, réarmer send_later 30 min, fin.
4. get-generate-image-job → vignette. python3 prev.py ovNN.png <vignette> <top> pNN.jpg ; viser pieds ≈ y1565, tête sous l'accroche, sujet centré. Raté (coupé, texte bizarre, pas l'uniforme) → noter "retry" et réarmer.
5. create-upload-url + curl ovNN.png → overlay id. read-design open_transaction, add_page 1240x1754 "NN slug", read page id, insert_fill photo (0, top, 1240x1860) puis calque (0,0,1240,1754), commit.
6. state.json : done[NN], next+1, last_update ; git commit + push. Réarmer send_later 30 min.
Finale : export PDF pro (pages 2..21) + PNG ; dossier présentation PDF (deck_modele_v1.html.txt comme base, 20 affiches) ; planche récap ; post LinkedIn (offre gratuite aux polices municipales) en .md ; tout dans out_dir ; SendUserFile + message final ; supprimer le filet de sécurité horaire.
