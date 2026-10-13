# SMASH HOUSE — site de commande en ligne pour fast-food (React + TypeScript + Tailwind)

Site complet de restaurant rapide : accueil gourmand, carte avec personnalisation (formule menu, sauces, suppléments, ingrédients à retirer), panier, livraison / à emporter / sur place, commande avec créneau horaire, suivi de commande en direct, espace client et espace gérant (commandes en temps réel, carte, ruptures, statistiques). Entièrement en français, pensé mobile d’abord.

> **Mode démonstration** : enseigne, prix et avis fictifs, paiement **simulé** (rien n’est débité), comptes non sécurisés, suivi de commande simulé (le statut avance toutes les 20 s). Tout est indiqué dans l’interface.

## Lancer

```bash
cd fastfood
npm install
npm run dev          # http://localhost:5173
```

| Commande | Rôle |
| --- | --- |
| `npm run build` | build de production (`dist/`) |
| `npm run build:static` | version statique à déposer sur n’importe quel hébergeur (Netlify Drop, GitHub Pages…) |
| `npm test` | tests des calculs (options, menu, livraison, codes promo) |

**Comptes de test :** client `client@smashhouse.demo` / `demo1234` — gérant `admin@smashhouse.demo` / `admin1234`.
**Codes promo :** `SMASH10` (−10 %), `BIGFAIM` (−20 % dès 30 €), `LIVRAISON` (livraison offerte).
**Règles :** livraison 2,90 €, offerte dès 25 €, minimum 15 € en livraison ; formule menu +3,50 € (limonade +0,50 €) ; taille XL +1,50 €.

## Fonctionnalités

- **Accueil** : grande bannière, choix livraison / à emporter / sur place, catégories, best-sellers, offre promo, « comment ça marche », avis (démo), horaires et adresse.
- **Carte** : 20 produits en 6 catégories, onglets collants, recherche, filtre végé, allergènes et calories, produits en rupture grisés.
- **Personnalisation** : seul ou en menu (accompagnement + boisson), sauce, suppléments payants, ingrédients à retirer, taille XL, note pour la cuisine, quantité. Prix recalculé en direct.
- **Panier** latéral : quantités, options lisibles, barre « livraison offerte », minimum de commande ; barre panier fixe sur mobile.
- **Commande** : créneau, coordonnées, adresse (si livraison), code promo, paiement en ligne (simulé) ou sur place.
- **Suivi** : étapes Reçue → En préparation → Prête / En livraison → Terminée.
- **Espace gérant** : tableau des commandes par statut (faire avancer, annuler), carte (prix, disponibilité, ajout, suppression), statistiques.

`localStorage` ne conserve que le panier et le mode de commande ; le reste est en mémoire (réinitialisé au rechargement).

## Visuels

Les 23 photos (20 plats, bannière, promo, cuisine) ont été **générées avec Canva** (IA), exportées en haute définition depuis le design Canva « Couverture photos du menu Smash House » et enregistrées dans `public/images/`. Ce ne sont pas des photos de vrais plats : pour un vrai restaurant, remplacez-les par des photos de ses produits (même nom de fichier).

## Vendre le site

Le dossier `marketing/` contient le kit LinkedIn : carrousel PDF (8 pages), vidéo de commande, image de post, guide PDF avec posts prêts à copier, messages de prospection pour restaurateurs et mise en ligne gratuite.

## Passer en production

Même architecture que STYLESHOP (voir `../styleshop/README.md`, `supabase/schema.sql` et `server/stripe-checkout.ts`) :
Supabase (comptes, carte, commandes en temps réel pour la cuisine, règles RLS) et Stripe Checkout (paiement, confirmation par webhook, prix recalculés côté serveur). Ajouter aussi la gestion des zones de livraison et l’impression des tickets cuisine si besoin.
