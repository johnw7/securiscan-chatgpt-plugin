# Architecture

## Vue d'ensemble

```
src/
├── app/                        Routes (App Router)
│   ├── (app)/                  Back-office : sidebar + header (AppShell)
│   │   ├── page.tsx            Tableau de bord
│   │   ├── clients/[id]        Liste et fiche client
│   │   ├── interventions/[id]  Liste et fiche intervention
│   │   ├── planning, equipe, devis, documents, statistiques, parametres
│   ├── technicien/             Application mobile technicien (sans sidebar)
│   ├── rapport/[id]            Rapport d'intervention imprimable (PDF navigateur)
│   └── api/                    API REST (health, interventions)
├── components/
│   ├── ui/                     Design system : Card, Badge, Button, Modal, Tabs, Table, Toast…
│   ├── layout/                 Sidebar, Header, AppShell, Logo
│   ├── charts/                 Graphiques Recharts (palette validée daltonisme)
│   ├── demo/                   Mode démo : étapes, provider, barre et écran final
│   ├── interventions/          Checklist, SignaturePad, PhotoGallery, Timeline, formulaires…
│   └── clients/ planning/ team/ quotes/ documents/ stats/ settings/ technician/ dashboard/
├── config/brand.ts             Identité E-DUST (couleurs, dégradé, mentions, lien de contact)
└── lib/
    ├── types.ts                Modèle de domaine (aligné sur prisma/schema.prisma)
    ├── data/                   Données de démonstration (seed déterministe, ancré sur la date du jour)
    ├── store/                  État applicatif : reducer pur, sélecteurs, persistance, actions
    ├── services/               Points d'extension : photos, notifications, e-mails, signature
    └── auth/roles.ts           Rôles et permissions (admin, planification, technicien, client)
```

## Flux de données (démo)

1. `AppStoreProvider` génère les données au montage (`createSeedData(date du jour)`) ou recharge
   la copie locale (`localStorage`) si elle date du jour. Rendu 100 % client pour les données :
   aucune différence d'hydratation serveur / navigateur.
2. Les composants lisent l'état via `useStore()` et les **sélecteurs** (`lib/store/selectors.ts`).
3. Ils modifient l'état uniquement via **`useAppActions()`** : chaque action
   - dispatch une action métier au **reducer pur** (`lib/store/reducer.ts`),
   - déclenche les effets via **`services`** (notifications, e-mail, stockage, signature),
   - affiche un retour visuel (toast).
4. Les indicateurs « historiques » (CA, volumes) viennent de `lib/data/stats.ts` et sont ajustés en
   direct par l'écart entre l'état courant et l'état initial (créer / démarrer / terminer une
   intervention fait bouger les compteurs).

## Passage à la version connectée

| Besoin | Où brancher |
|---|---|
| **PostgreSQL + Prisma** | `prisma/schema.prisma` (multi-entreprises). Remplacer le seed par des requêtes Prisma dans des routes `app/api/*` ou des Server Actions ; `useAppActions()` appelle alors l'API au lieu du reducer local (même signature pour les composants). |
| **Authentification** | Auth.js / Clerk / Supabase Auth ; `middleware.ts` pour protéger `(app)` et `technicien` ; contrôle `can(role, permission)` de `lib/auth/roles.ts` côté serveur. |
| **Comptes** admin / technicien / client | Enum `Role` + `User.clientId` pour l'espace client. |
| **API** | `app/api/interventions/route.ts` montre le contrat ; ajouter POST/PATCH avec validation (zod). |
| **Notifications / e-mails** | Implémenter `NotificationService` / `EmailService` côté serveur (Brevo, Resend, Twilio…), enregistrer dans `lib/services/index.ts`. |
| **Stockage photos** | `PhotoStorage` : URL d'upload signée (S3 / R2), stocker `Photo.storageKey`. |
| **Génération PDF** | Remplacer `/rapport/[id]` (impression navigateur) par une génération serveur (@react-pdf/renderer ou Playwright) archivée en `Document`. |
| **Signature électronique** | `SignatureService` → prestataire eIDAS (Yousign, Docusign) ; conserver `Signature.providerRef`. |
| **Facturation** | Modèles `Invoice` / `Quote` prêts ; ajouter numérotation légale, relances, export comptable. |

## Ce qui est simulé dans la démo (et pourquoi)

- **Envoi d'e-mails / SMS** : aucune clé d'API ne doit vivre dans le navigateur ; les services
  simulés journalisent l'envoi (console en développement) et l'interface confirme l'action.
- **Stockage des fichiers** : les photos ajoutées sont réelles mais restent dans le navigateur
  (data URL redimensionnée) ; les documents de la liste sont des métadonnées fictives.
- **Signature** : signature manuscrite capturée et horodatée localement, sans valeur probante
  tant qu'un prestataire certifié n'est pas branché.
- **Itinéraire** : ouvre Google Maps avec l'adresse (fictive) du site.
