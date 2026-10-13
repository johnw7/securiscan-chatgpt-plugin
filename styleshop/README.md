# STYLESHOP — boutique de mode (React + TypeScript + Tailwind)

Application e-commerce complète de démonstration : accueil, catalogue filtrable (32 articles), fiches produit, favoris, panier, commande, paiement simulé, espace client et tableau de bord administrateur. Interface entièrement en français, responsive (téléphone, tablette, ordinateur).

> **Mode démonstration** : aucun backend ni prestataire de paiement n’est connecté. Les paiements sont **simulés** (rien n’est débité, la commande reste « en attente de paiement »), les comptes ne sont **pas sécurisés**, les prix et les avis clients sont **fictifs**. Tout cela est indiqué clairement dans l’interface.

## Lancer l’application

Prérequis : [Node.js](https://nodejs.org) 18 ou plus récent.

```bash
cd styleshop
npm install
npm run dev
```

Ouvrez ensuite l’adresse affichée (par défaut http://localhost:5173).

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur de développement avec rechargement à chaud |
| `npm run build` | vérification TypeScript + build de production dans `dist/` |
| `npm run preview` | sert le build de production en local |
| `npm test` | tests des calculs du panier (sous-total, remises, livraison, total) |

### Comptes de test (démo)

| Rôle | E-mail | Mot de passe |
| --- | --- | --- |
| Client | `client@styleshop.demo` | `demo1234` |
| Administrateur | `admin@styleshop.demo` | `admin1234` |

Codes promo de démonstration : `BIENVENUE10` (−10 %), `STYLE20` (−20 %), `LIVRAISON` (livraison offerte).
Livraison : standard 4,90 € (offerte dès 60 € après remise), point relais 3,50 €, express 9,90 €.

## Fonctionnalités

- **Accueil** : bannière, catégories (Homme, Femme, Enfant, Accessoires), Nouveautés, Meilleures ventes, Promotions, barre de recherche, compteurs panier et favoris.
- **Catalogue** : filtres catégorie / taille / couleur / prix / promotions, tri (nouveautés, prix croissant/décroissant, meilleures ventes), recherche sans accents. Les filtres sont dans l’URL (partageables). Tiroir de filtres sur mobile.
- **Fiche produit** : galerie de photos, prix et prix barré, description et détails, choix couleur / taille (tailles indisponibles barrées) / quantité, état du stock, ajout au panier et aux favoris, avis clients de démonstration (marqués « Démo »), suggestions similaires.
- **Panier** : modification des quantités (limitées au stock), suppression, taille et couleur affichées, barre « livraison offerte », code promo, sous-total / réduction / livraison / total calculés en centimes (pas d’erreur d’arrondi).
- **Commande** : coordonnées, adresse, pays, mode de livraison, validation des champs, récapitulatif, paiement simulé, page de confirmation avec numéro de commande.
- **Espace client** : inscription, connexion, profil, historique et statut des commandes, favoris, carnet d’adresses.
- **Administration** : statistiques de ventes (démo), ajout / modification / suppression de vêtements, prix et stock modifiables directement dans le tableau, liste des commandes et changement de statut.

### Stockage

Conformément au cahier des charges, `localStorage` ne sert **qu’au panier et aux favoris**. Les comptes, commandes et modifications d’administration restent en mémoire et sont réinitialisés au rechargement de la page — c’est le rôle du futur backend.

### Photos

Les 39 visuels (32 produits, bannière, tuiles Homme/Femme, 4 catégories) ont été **générés avec Canva** (images IA réalistes), exportés en haute définition depuis le design Canva « Couverture planche photos STYLESHOP », et sont enregistrés dans `public/images/` : ils font partie de l’application et ne dépendent d’aucun service externe. Chaque fiche produit affiche la photo principale et une vue « détail » recadrée de la même photo.

Ce sont des images générées, pas des photos des articles réels : avant de vendre, remplacez-les par vos propres photos produit (même nom de fichier dans `public/images/products/`, ou champ « URL des photos » dans l’administration). Si une image ne charge pas, un visuel de remplacement neutre s’affiche.

## Architecture

```
src/
  types.ts                 modèles (Product, CartItem, Order, User…)
  data/products.ts         catalogue de démonstration (32 articles)
  lib/pricing.ts           calcul du panier, codes promo, livraison (+ tests)
  lib/format.ts            prix en euros, dates
  context/StoreContext.tsx état global : produits, panier, favoris, commandes, compte
  services/config.ts       détection du mode démo / production (.env)
  services/payment.ts      paiement simulé ↔ Stripe Checkout
  components/              Header, Footer, ProductCard, ProductImage, QuantitySelector…
  pages/                   Home, Catalog, ProductPage, Cart, Checkout, Confirmation, Favorites
  pages/account/           Login (connexion / inscription), Account
  pages/admin/             Admin (statistiques, produits, commandes), ProductForm
supabase/schema.sql        tables + politiques RLS pour la production
server/stripe-checkout.ts  API serveur : création de session Checkout + webhook
```

## Passer en production (Supabase + Stripe)

1. **Supabase** : créez un projet, exécutez `supabase/schema.sql`, importez les produits. Donnez le rôle `admin` au compte du gérant dans la table `profiles`. Remplacez les fonctions de `StoreContext` (produits, commandes, connexion) par des appels `@supabase/supabase-js` ; l’authentification passe par Supabase Auth et **les droits sont vérifiés côté serveur par les politiques RLS** (la vérification du rôle dans le navigateur n’est qu’un confort d’affichage).
2. **Stripe** : déployez `server/stripe-checkout.ts` (Supabase Edge Function, Vercel, ou serveur Node) avec `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` côté serveur uniquement. Déclarez l’URL `/stripe-webhook` dans le tableau de bord Stripe (événement `checkout.session.completed`).
3. Copiez `.env.example` en `.env` et renseignez `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY` et `VITE_API_URL`. Dès que `VITE_API_URL` et la clé publique Stripe sont présents, le bouton de commande redirige vers Stripe Checkout au lieu du paiement simulé.

Règles de sécurité appliquées par cette architecture :

- les montants sont **recalculés côté serveur** à partir des identifiants produits ;
- aucune donnée bancaire n’est saisie ni stockée sur le site (page de paiement hébergée par Stripe) ;
- une commande ne devient « payée » **que** via le webhook signé de Stripe, jamais depuis le navigateur ;
- les clés secrètes ne sont jamais exposées au front (`VITE_*` = public).
