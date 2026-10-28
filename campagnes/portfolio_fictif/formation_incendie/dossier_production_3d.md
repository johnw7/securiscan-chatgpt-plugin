# « Incendie en entreprise : que faire en cas de départ de feu ? »
Formation animée 3D — dossier de production (démo E-DUST, entreprise fictive « Atelier Norvan »)

> Ce dossier sert de cahier des charges pour fabriquer la vidéo dans un générateur vidéo IA à personnages constants
> (Kling, Runway Gen-4 References, Google Veo, Higgsfield…) ou chez un studio 3D (Blender, Unreal, Maya).
> Le montage final, la voix française, les sous-titres, les bruitages et les exports se font ensuite dans ce dépôt.
> Le contenu de sécurité ci-dessous reprend les consignes générales françaises (INRS, sapeurs-pompiers).
> **Pour une vente à une entreprise, il doit être relu par son responsable sécurité** : le numéro interne,
> le point de rassemblement et l'organisation des guides-files et serre-files sont propres à chaque site.

---

## 1. Fiche technique
| | |
|---|---|
| Durée | 2 min 30 environ (19 plans de 5 à 10 s) |
| Formats | 16:9 1920×1080 (formation, LMS, intranet) + 9:16 1080×1920 (teaser 30 s) |
| Style | 3D semi-réaliste premium, éclairage cinéma, bureau moderne lumineux (bois clair, verre, plantes) |
| Personnages | Thomas, Sophie, Marc — mêmes modèles 3D du premier au dernier plan |
| Son | voix off française + répliques courtes, bruitages (alarme, porte, pas, extincteur), version sans musique |
| Mentions | « Démonstration — entreprise et personnages fictifs » au générique ; « Consignes générales : suivez le plan d'évacuation de votre site » |

## 2. Mini-scénario en 5 temps (consigne storytelling)
1. **Quotidien** — Mardi, 15 h. Thomas, arrivé depuis deux semaines, travaille près de la salle de reprographie. Tout est calme.
2. **Déclic** — Une odeur de brûlé. De la fumée sort de derrière l'imprimante. Thomas se fige : « Je fais quoi, là ? »
3. **Moment fort** — Il ne panique pas : il donne l'alerte, Sophie appelle les secours, Marc (formé à l'extincteur) intervient, puis tout le monde évacue calmement.
4. **Nouvelle vie** — Au point de rassemblement, Sophie compte tout le monde. Personne ne manque. Thomas respire : il savait quoi faire.
5. **Appel à l'action** — « Et vous, savez-vous où est le déclencheur d'alarme le plus proche ? »

On peut s'y reconnaître : tout le monde s'est déjà demandé « et si ça arrivait ici ? ».

## 3. Les trois personnages — bible de référence 3D
Règle absolue : **une seule fiche par personnage, réutilisée comme image de référence dans chaque plan**.
Aucune description ne change d'un plan à l'autre. On copie toujours le même bloc de texte.

### THOMAS — le nouvel arrivant (personnage principal, celui à qui l'on s'identifie)
- 27 ans, 1,80 m, silhouette mince, peau claire légèrement mate, cheveux châtain foncé courts, ondulés sur le dessus, barbe de trois jours.
- Yeux noisette, sourcils marqués, visage ouvert.
- Pull col rond bleu marine sur t-shirt blanc, pantalon chino beige, baskets blanches, montre noire au poignet gauche, badge bleu sur cordon.
- Caractère : attentif, un peu hésitant au début, puis sûr de lui.

### SOPHIE — la responsable d'équipe (serre-file)
- 42 ans, 1,68 m, peau noire, cheveux bouclés naturels attachés en chignon haut, petites boucles d'oreilles dorées.
- Yeux marron foncé, sourire chaleureux, regard calme.
- Blazer moutarde sur chemisier blanc, pantalon noir droit, chaussures plates noires, badge rouge « Serre-file » au cou pendant l'évacuation.
- Caractère : posée, rassurante, organisée.

### MARC — le collègue formé (équipier de première intervention et guide-file)
- 50 ans, 1,85 m, carrure solide, peau claire, cheveux poivre et sel coupés court, lunettes à monture fine noire, moustache courte grise.
- Yeux bleus, rides d'expression.
- Chemise chambray bleu clair manches retroussées, pantalon gris anthracite, chaussures de sécurité noires, brassard orange « Guide-file » mis pendant l'évacuation.
- Caractère : calme, précis, protecteur.

### Prompt « fiche de référence » (à générer une fois par personnage, puis à réutiliser)
```
Character turnaround reference sheet, premium semi-realistic 3D animated film style, studio quality,
same character shown three times on a neutral light grey background: front view, three-quarter view, side profile view,
full body head to toe, neutral A-pose, soft studio lighting, detailed skin texture, expressive eyes,
[COLLER ICI LA DESCRIPTION COMPLÈTE DU PERSONNAGE, EN ANGLAIS],
consistent proportions across views, no text, no watermark, 16:9
```
Descriptions en anglais à coller :
- **Thomas** : `27-year-old man, 1.80 m, slim build, light olive skin, short dark brown hair wavy on top, light stubble, hazel eyes, navy blue crew-neck sweater over white t-shirt, beige chino trousers, white sneakers, black watch on left wrist, blue lanyard badge`
- **Sophie** : `42-year-old Black woman, 1.68 m, natural curly hair in a high bun, small gold earrings, dark brown eyes, warm smile, mustard yellow blazer over white blouse, straight black trousers, black flat shoes, red lanyard badge`
- **Marc** : `50-year-old man, 1.85 m, solid build, fair skin, short salt-and-pepper hair, thin black-framed glasses, short grey moustache, blue eyes, light blue chambray shirt with rolled-up sleeves, charcoal grey trousers, black safety shoes`

Contrôle avant chaque plan : visage, coiffure, vêtements, accessoires identiques à la fiche — sinon on régénère le plan.

## 4. Découpage plan par plan (narration + action + prompt vidéo)
Préfixe à mettre **devant chaque prompt** :
`Premium semi-realistic 3D animated film, studio quality, cinematic lighting, natural shadows, detailed textures, modern bright office with light wood, glass walls and plants, smooth realistic continuous motion, 16:9.`
Joindre à chaque plan la ou les fiches des personnages présents.

| # | Durée | Narration / réplique (VO française) | Action et caméra | Prompt (après le préfixe) |
|---|---|---|---|---|
| 1 | 6 s | VO : « Mardi, quinze heures. Une journée comme les autres. » | Plan large du plateau de bureaux, travelling lent vers Thomas qui tape au clavier et sourit à un message. | `Slow dolly-in across an open-plan office toward THOMAS typing at his desk near a print room, he smiles at his screen, colleagues working in background, calm afternoon light.` |
| 2 | 5 s | — | Thomas lève la tête, renifle, fronce les sourcils, tourne la tête vers la reprographie. | `Medium close-up of THOMAS, he stops typing, sniffs the air, frowns and slowly turns his head toward the print room door, subtle worried expression.` |
| 3 | 6 s | VO : « Une odeur de brûlé. Puis de la fumée. » | Derrière l'imprimante, une fine fumée grise monte d'une prise multiple ; petite flamme. | `Close-up behind a large office printer, thin grey smoke rising from an overheated power strip, a small flame appears, dramatic side lighting, no people.` |
| 4 | 5 s | Thomas (à voix basse) : « Je fais quoi, là ? » | Gros plan sur Thomas qui se fige, respiration rapide, puis son regard se fixe sur un boîtier rouge au mur. | `Close-up of THOMAS frozen in surprise, quick breathing, then his eyes lock on a red manual fire alarm call point on the wall, determination appears on his face.` |
| 5 | 7 s | VO : « Premier réflexe : donner l'alerte. » | Thomas marche vite (sans courir) jusqu'au déclencheur manuel rouge, appuie fermement ; voyant qui clignote. | `THOMAS walks quickly (not running) to a red manual fire alarm call point on the wall and presses it firmly with his palm, a light starts flashing, close shot of his hand then his face.` |
| 6 | 5 s | (alarme) | Le plateau réagit : les collègues lèvent la tête, Sophie se lève de son bureau. | `Wide shot of the office as the fire alarm sounds, colleagues look up, SOPHIE stands up from her desk calmly and looks around.` |
| 7 | 8 s | Thomas : « Sophie ! Il y a de la fumée à la reprographie ! » — Sophie : « Je préviens les secours. » | Thomas rejoint Sophie et désigne la reprographie ; Sophie décroche son téléphone. | `THOMAS walks up to SOPHIE and points toward the print room while speaking, SOPHIE nods, picks up her desk phone and starts a calm call.` |
| 8 | 6 s | VO : « Les secours : le 18 ou le 112, et le numéro d'urgence interne de votre entreprise. » | Gros plan sur Sophie au téléphone, voix posée ; incrustation « 18 · 112 · n° interne ». | `Close-up of SOPHIE on the phone, calm and precise, she speaks clearly giving the address, steady eye contact, slight nod.` |
| 9 | 8 s | VO : « Si le feu est petit et que vous êtes formé, vous pouvez l'attaquer avec l'extincteur adapté. » | Marc décroche un extincteur CO2 mural, retire la goupille, s'approche à bonne distance. | `MARC takes a CO2 fire extinguisher off its wall bracket, pulls the safety pin, and approaches the print room carefully, keeping a safe distance, focused expression.` |
| 10 | 7 s | VO : « On vise la base des flammes. Jamais seul, et toujours avec une issue derrière soi. » | Marc vise la base des flammes près de la prise ; la flamme s'éteint ; fumée résiduelle. | `MARC sprays the CO2 extinguisher at the base of the small flame near the printer power strip, the flame goes out, residual smoke, the door behind him stays open as an exit.` |
| 11 | 6 s | VO : « Au moindre doute, on n'intervient pas : on évacue. » | Marc recule, ferme la porte de la reprographie derrière lui sans la verrouiller. | `MARC steps back out of the print room and closes the door behind him without locking it, then turns to the team and raises his arm to gather them.` |
| 12 | 8 s | Marc (avec brassard orange) : « Tout le monde me suit, on laisse ses affaires ! » | Marc enfile le brassard « Guide-file » et ouvre la marche ; collègues qui se lèvent et laissent leurs affaires. | `MARC puts on an orange armband and leads the way, colleagues stand up and leave their bags and laptops on their desks, orderly calm movement toward the green emergency exit sign.` |
| 13 | 6 s | VO : « On suit le balisage vert. Et on ne prend jamais l'ascenseur. » | Le groupe passe devant l'ascenseur ; Thomas hésite, Marc lui indique l'escalier d'un geste. | `The group walks past the elevator, THOMAS hesitates near the elevator button, MARC gently gestures toward the stairwell door with the green exit sign, THOMAS follows him.` |
| 14 | 7 s | VO : « Avant d'ouvrir une porte, on vérifie qu'elle n'est pas chaude. » | Marc touche la porte de l'escalier du dos de la main, puis l'ouvre ; descente dans l'escalier, main sur la rampe. | `MARC touches the stairwell door with the back of his hand to check for heat, then opens it, the group goes down the stairs in single file holding the handrail.` |
| 15 | 6 s | VO : « S'il y a de la fumée, on se baisse : l'air est plus respirable près du sol. » | Couloir avec un léger voile de fumée au plafond ; le groupe se baisse en avançant. | `In a corridor with a light layer of smoke near the ceiling, the group walks bent down low, THOMAS covers his mouth with his sleeve, steady pace.` |
| 16 | 7 s | Sophie (badge rouge) : « Je ferme la marche, je vérifie que personne ne reste. » | Sophie, serre-file, jette un œil dans les bureaux et les toilettes, ferme les portes, suit le groupe. | `SOPHIE wearing a red badge checks the empty offices and the restroom door, closes each door behind her, then follows the group last.` |
| 17 | 8 s | VO : « Direction le point de rassemblement. Et on n'y retourne pas. » | Extérieur : le groupe sort, marche vers un panneau vert « Point de rassemblement » sur le parking ; camion de pompiers qui arrive au loin. | `Exterior of a modern office building, the group exits and walks to a green assembly point sign in the parking lot, a fire truck arrives in the distance with flashing lights, sunny afternoon.` |
| 18 | 8 s | Sophie : « … douze, treize, quatorze. Tout le monde est là. » | Sophie compte avec sa liste ; Thomas expire, Marc lui pose la main sur l'épaule ; échange de sourires. | `SOPHIE counts colleagues with a clipboard at the assembly point and nods, THOMAS exhales in relief, MARC places a reassuring hand on THOMAS's shoulder, they share a smile.` |
| 19 | 8 s | VO : « Ce jour-là, Thomas savait quoi faire. Et vous ? Savez-vous où est le déclencheur d'alarme le plus proche ? » | Retour au bureau vide, travelling lent vers le déclencheur rouge ; titre final, récapitulatif, logo. | `Slow dolly-in through the empty office toward the red manual fire alarm call point on the wall, warm cinematic light, peaceful atmosphere.` |

## 5. Récapitulatif affiché à la fin (texte à l'écran, charte de la vidéo)
1. **J'alerte** : déclencheur manuel + 18 / 112 + numéro interne.
2. **J'interviens seulement si** le feu est petit, que je suis formé et que j'ai une issue derrière moi.
3. **J'évacue** : je laisse mes affaires, je ferme les portes, je suis le balisage vert.
4. **Jamais l'ascenseur.** Fumée : je me baisse.
5. **Point de rassemblement** : je me signale et je n'y retourne pas.

## 6. Bruitages (version par défaut, sans musique)
Ambiance bureau légère · clavier · grésillement électrique · alarme incendie (son d'évacuation type) · pas pressés · porte coupe-feu · goupille et jet de CO2 · escalier · extérieur, oiseaux, sirène de pompiers au loin.

## 7. Fabrication et contrôle
- **Ordre** : 1) les 3 fiches de référence, 2) un plan test par personnage, validé, 3) les 19 plans, 4) le montage ici (voix, sous-titres, bruitages, titres, exports 16:9, 9:16, sans son, mail).
- **Contrôle continuité** à chaque plan : visage, cheveux, vêtements, accessoires, taille relative (Marc > Thomas > Sophie).
- **Contrôle sécurité** à chaque plan : personne ne court, personne ne prend l'ascenseur, l'extincteur n'est utilisé que sur une petite flamme, les portes sont fermées et non verrouillées.
- **Plans rejetés** si : visage qui change, mains déformées, texte illisible sur les panneaux (on préfère des panneaux sans texte et on ajoute le texte au montage).
