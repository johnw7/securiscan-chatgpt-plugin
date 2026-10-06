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
