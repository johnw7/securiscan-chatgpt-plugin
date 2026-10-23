# NOIR ABSOLU — pub parfum 20 s (marque fictive, démo E-DUST Solutions)

Référence unique : `source/reference.webp` (influenceuse blonde + flacon NOIR ABSOLU, image générée par IA).
Mention obligatoire à l'image : « Démo conceptuelle · NOIR ABSOLU est un parfum fictif · image générée par IA ».

## 1. Storyboard chronométré (9:16, 1080×1920)

| Temps | Plan | Jeu / animation | Voix | Son |
|---|---|---|---|---|
| 0–4 s | Gros plan visage, léger push-in | Regard caméra, sourire qui s'installe, clignement ~1,9 s, petits hochements de tête, respiration | « Vous cherchez un parfum qui fait vraiment la différence ? » (0,7 s) | Nappe chaude, particules dorées |
| 4–9 s | Le cadre s'ouvre (plan poitrine) | Elle **lève le flacon**, le **tourne** légèrement (poignet), regard flacon → caméra, main libre qui présente | « Je vous présente… NOIR ABSOLU. » (4,4 s) | Whoosh d'ouverture, scintillement au lever du flacon, tics discrets pendant la rotation |
| 9–15 s | Plan poitrine, rapprochement très lent | Enthousiasme, gestes fluides, sourire subtil, regard direct, glissement du regard vers le flacon | « Une fragrance élégante, intense, avec ce petit quelque chose qui ne passe pas inaperçu. » (8,0 s) | Basse douce qui entre, montée (riser) avant la coupe |
| 15–20 s | Coupe dorée → **macro flacon**, arrière-plan flou | Reflets qui balayent le verre, particules, apparition du slogan | « NOIR ABSOLU. Laissez votre empreinte. » (15,7 s) | Impact léger + scintillements, voix sur musique, fin en fondu |
| Texte | « NOIR ABSOLU » (serif, 16 s) · filet doré · « LAISSEZ VOTRE EMPREINTE. » (17,2 s) · mention démo (18,4 s) | | | |

Direction artistique : teintes champagne / noir / or, éclairage chaud, flou d'arrière-plan, bloom sur les hautes lumières, grain fin, vignette douce.

## 2. Prompts de génération vidéo (image → vidéo) — pour Runway Gen‑4 / Kling / Veo / Luma / Hailuo

À utiliser **avec `source/reference.webp` comme première image** (mode image‑to‑video, 5 s par plan, 9:16). Ajouter à chaque prompt la ligne « Same woman, same face, same perfume bottle with unchanged label NOIR ABSOLU, no morphing ».

**Plan 1 (0–4 s)**
> Cinematic close-up of the blonde woman, warm golden interior light, she looks into the camera, a natural smile grows, she starts speaking French, subtle head tilts, natural blinks, gentle breathing, soft hair movement, shallow depth of field, slow push-in, photoreal skin texture, premium perfume commercial.

**Plan 2 (4–9 s)**
> Medium shot, she lifts the amber perfume bottle toward the camera and gently rotates her wrist to show the label, her gaze moves from the bottle to the camera, her free hand makes a smooth presenting gesture, golden bokeh lights behind, elegant luxury interior, stable bottle shape and label, no deformed fingers.

**Plan 3 (9–15 s)**
> She keeps presenting with enthusiasm, natural fluid hand gestures, subtle smile, direct eye contact, small shoulder movement, very slow cinematic dolly-in, warm champagne and black tones, shallow depth of field, photoreal.

**Plan 4 (15–20 s)**
> Elegant macro close-up of the perfume bottle held in her hand, background softly out of focus, golden light, subtle glints sliding across the glass, floating golden dust particles, slow push-in, premium commercial look, label text unchanged.

Prompt négatif commun : `deformed hands, extra fingers, morphing face, changing bottle, melted label, plastic skin, jitter, text artifacts, cartoon`.

## 3. Synchronisation labiale (outil dédié)

1. Générer la voix (ElevenLabs « Clémence – Advertising » ou « Chloé – UGC », modèle `eleven_v4`) avec le script ci‑dessous, balises `[warm, confident]`, pauses « ... ».
2. Plans 1 à 3 : passer **chaque clip vidéo + son segment de voix** dans HeyGen *Video Translate / Lip‑sync*, Sync Labs (`lipsync-2`), Kling *Lip Sync* ou Hedra. Réglages : visage unique, intensité naturelle, garder les yeux/clignements du clip d'origine.
3. Contrôle image par image : lèvres sur les « m / b / p » (NOIR ABSOLU, parfum), dents stables, absence de flou autour de la bouche. Si défaut → regénérer le plan (4 s max par passe est plus stable que 8 s).
4. Plan 4 (macro flacon) : pas de visage net → pas de synchro, voix off seule.

Script : « Vous cherchez un parfum qui fait vraiment la différence ? … Je vous présente NOIR ABSOLU. … Une fragrance élégante, intense, avec ce petit quelque chose qui ne passe pas inaperçu. … NOIR ABSOLU. Laissez votre empreinte. »

## 4. Montage, transitions, sound design

- Plans 1→2→3 : mouvement de caméra continu (pas de coupe sèche), micro‑tremblé main < 3 px.
- Coupe 3→4 à 15,0 s : flash doré de 5 images + riser de 1 s avant, impact doux sur la coupe.
- Sons : scintillement (gamme pentatonique aiguë) au lever du flacon, 3–4 tics discrets pendant la rotation, whoosh à l'ouverture du cadre. Musique : nappe + pluck à 84 bpm, basse/kick très discrets à partir de 4 s, ducking −5 dB sous la voix (voix toujours intelligible), fade‑out 1,2 s.
- Étalonnage : champagne (R +3 %, B −6 %), bloom sur les hautes lumières, vignette, grain 3 %.
- Versions livrées : voix + effets (sans musique, pour choisir sa musique), avec musique, sans son, mail < 4 Mo.

## 5. Ce qui a réellement été produit ici

Aucun générateur image‑vers‑vidéo ni outil de synchronisation labiale n'est connecté à cette session. La vidéo livrée est donc une **animation 2,5D de la photo de référence** (déformations locales pilotées par les points du visage et par l'enveloppe de la voix : bouche, paupières, regard, tête, respiration, mains, flacon) + caméra virtuelle, lumière et sons. Le visage et le flacon restent strictement ceux de la photo. Pour un rendu de film (vrais gestes, flacon qui tourne en 3D), utiliser les prompts ci‑dessus dans un générateur image‑vers‑vidéo.
