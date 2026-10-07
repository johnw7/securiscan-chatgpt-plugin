# E-DUST INTERVENTION

Démonstrateur commercial **E-DUST Solutions** : une application métier de gestion d'interventions
pour TPE/PME (artisans, électriciens, plombiers, chauffagistes, maintenance, nettoyage, BTP, garages,
espaces verts…) qui remplace fichiers Excel, planning papier, WhatsApp, e-mails et appels.

> Démonstration E-DUST Solutions — entreprises, personnes, adresses, données financières et
> interventions **entièrement fictives** (téléphones dans les plages ARCEP réservées à la fiction,
> e-mails en `.example`).

## Démarrage

```bash
npm install
npm run dev          # http://localhost:3000
```

Production :

```bash
npm run build && npm start
```

Contrôles qualité : `npm run typecheck` · `npm run lint`.

## Mettre la démo en ligne

### GitHub Pages (configuré)

Le workflow `.github/workflows/deploy-pages.yml` construit un export statique et le publie à chaque
push sur la branche de démonstration (ou `main`).

1. **Une seule fois** : dans GitHub, *Settings → Pages → Build and deployment → Source* : **GitHub Actions**.
2. Relancer le workflow (*Actions → Déployer la démo sur GitHub Pages → Run workflow*) ou pousser un commit.
3. La démo est disponible sur `https://<compte>.github.io/<dépôt>/` — ajouter `?demo=1` pour démarrer la visite guidée.

En export statique, les routes `/api/*` sont retirées (hébergement sans serveur) et les fiches des éléments
créés pendant la démo utilisent des emplacements pré-générés (`INT-2026-066` à `INT-2026-125`,
`cli-new-1` à `cli-new-30`).

Test local de l'export : `GITHUB_PAGES=true NEXT_PUBLIC_BASE_PATH=/<dépôt> npm run build` (routes API retirées au préalable).

### Vercel

Importer le dépôt sur vercel.com : aucune configuration nécessaire (mode serveur complet, routes API incluses).

## Enregistrer la démo LinkedIn (30 à 60 s)

1. Ouvrir l'application (idéalement en 1440 × 900) et lancer l'enregistrement d'écran.
2. Cliquer sur **MODE DÉMO** (en haut à droite) — ou ouvrir directement `/?demo=1`.
   Les données sont réinitialisées sur le scénario de démonstration.
3. Avancer avec **Suivant →** ou la **flèche droite** du clavier (← pour revenir, Échap pour quitter) :

| Étape | Écran | Action suggérée |
|---|---|---|
| 1 | Tableau de bord | Montrer les indicateurs et le planning du jour |
| 2 | Création d'une intervention | Le formulaire est pré-rempli : cliquer **CRÉER L'INTERVENTION** |
| 3 | Planning | La nouvelle intervention apparaît (Clinique du Parc Vert, 11:30, Lucas) |
| 4 | Vue technicien mobile | Cliquer **COMMENCER** sur l'intervention 08:30 Entreprise Horizon |
| 5 | Checklist | Cocher les étapes |
| 6 | Signature client | Signer à la souris, **FAIRE SIGNER LE CLIENT**, puis **TERMINER** |
| 7 | Statistiques | Vue dirigeant |
| — | Écran final | « Votre entreprise mérite des outils adaptés… » |

Le lien du bouton **PARLONS DE VOTRE PROJET** se règle via `NEXT_PUBLIC_EDUST_CONTACT_URL`
(voir `.env.example`). Sans valeur, le bouton affiche un message de remerciement.

## Vidéo de prévention « Sur le chemin de l'école » (`/prevention`)

Petite vidéo animée Police Municipale (58 s) construite avec les deux personnages fournis : le policier
municipal et l'enfant (Léo). Dialogue en champ / contrechamp, 3 conseils illustrés, plan final.

Les personnages sont **animés et parlent** : chaque image fournie est découpée en marionnette 2D
(corps, tête articulée au cou, main de Léo articulée au poignet, bouche, paupières). La bouche suit
l'enveloppe de la voix (synchronisation labiale), les têtes s'inclinent et hochent, les yeux clignent,
Léo entre en marchant et fait coucou au final. Voix françaises de synthèse (Kokoro : voix d'homme
naturelle pour le policier, voix d'enfant pour Léo) et bruitages, **sans musique** (à ajouter au montage) :
`public/audio/prevention/bande-son.mp3`.
Préparation des voix et du rig : voir [`scripts/prevention/README.md`](scripts/prevention/README.md).

| Accès | Effet |
|---|---|
| `/prevention` | Lecteur : lecture avec son, timeline par plans, format **9:16** / **4:5**, sous-titres, export `.srt` |
| `/prevention?mode=demo` | **Mode démonstration** : plein écran, lecture automatique en boucle, interface masquée (Échap pour quitter) |
| `/prevention?format=4x5&t=20` | Ouvre directement un format et un instant |

Vidéos prêtes à publier : `public/videos/prevention/` (MP4 H.264 + son AAC, 1080 × 1920 et 1080 × 1350, 30 i/s)
et sous-titres `prevention-chemin-ecole.fr.srt`. Pour les régénérer après une modification :

```bash
npm run build && npm start
node scripts/render-prevention-video.mjs --url http://localhost:3000   # nécessite ffmpeg + Playwright
```

- Scénario, découpage, transitions et sous-titres : `src/components/prevention/timeline.ts`
- Mise en scène (cadrages par format, caméra, parallaxe, cartes conseil) : `src/components/prevention/PreventionScene.tsx`
- Visuels : `public/images/prevention/` — `sources/` (images fournies), `enfant/` et `policier/`
  (personnages détourés), `decors/` (place de la mairie tirée de la photo du policier, policier retiré puis flouté).

## Fonctionnalités

- **Tableau de bord** : KPI (jour / semaine / mois) avec compteurs animés, planning du jour,
  activité récente en temps réel, graphiques 7 jours et répartition par type, équipe en direct.
- **Clients** : recherche, tri, création, fiche client (coordonnées, indicateurs, onglets
  Vue générale / Interventions / Devis / Documents / Factures, historique).
- **Interventions** : filtres par statut, recherche, création (formulaire complet), planification,
  démarrage, annulation ; fiche détaillée avec timeline, checklist interactive, photos (upload
  réel depuis l'appareil, redimensionné localement), rapport, signature tactile, clôture.
- **Rapport PDF** : `/rapport/INT-…` — version imprimable, « Enregistrer en PDF » du navigateur.
- **Planning** : vues Jour (grille horaire par technicien), Semaine (par défaut), Mois ; filtre
  technicien ; file « À planifier ».
- **Équipe**, **Devis** (acceptation / refus, détail chiffré), **Documents**, **Statistiques**,
  **Paramètres** (entreprise, notifications, signature obligatoire, réinitialisation).
- **Vue technicien mobile** (`/technicien`) : Aujourd'hui / Planning / Interventions / Profil,
  parcours COMMENCER → Checklist → Photos → Rapport → Signature → TERMINER. Plein écran sur
  smartphone, maquette de téléphone sur ordinateur.
- **Mode démo** guidé en 7 étapes + écran final.

Responsive vérifié à 375, 390, 430, 768, 1024 et 1440 px.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Recharts · lucide-react.

Voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) pour l'organisation du code et le passage à la
version connectée (PostgreSQL, Prisma, authentification, stockage, e-mails, signature, PDF, facturation).
