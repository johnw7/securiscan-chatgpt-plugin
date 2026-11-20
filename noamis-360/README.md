# NOAMIS 360°

Plateforme de pilotage de **NOAMIS Sûreté Conseil** (conseil indépendant en sécurité et sûreté) : direction et CRM, audits de sûreté, AMOA, veille, documents, finance, portail client et diagnostic public.

| Module | Rôle | Accès |
|---|---|---|
| **PILOT** | Tableau de bord, clients, contacts, prospects, missions, tâches, calendrier, recherche, notifications, historique | Équipe NOAMIS |
| **AUDIT** | Questionnaires configurables, brouillon terrain hors ligne, photos, cotation des risques, recommandations, validation, rapport PDF | Équipe NOAMIS |
| **PROJECT** | AMOA en 8 étapes : cahier des charges, jalons, prestataires, comparatif pondéré (PDF/Excel), réunions, décisions, réserves, clôture | Équipe NOAMIS |
| **INTELLIGENCE** | Sources évaluées (code de l'Amirauté), collecte RSS autorisée, fiches/bulletins/alertes, validation humaine, diffusion, brouillons IA identifiés | Équipe NOAMIS |
| **DOCS** | Documents privés versionnés, téléchargements signés, liens de partage expirants | Équipe NOAMIS |
| **FINANCE** | Catalogue, devis, factures, avoirs, règlements, relances, PDF à mentions légales, export comptable | Équipe (émission : administrateurs) |
| **CONNECT** | Portail client cloisonné : missions, documents, validations, devis/factures, messagerie, veille | Clients |
| **PROTECT** | Diagnostic préliminaire public, synthèse PDF, demande de contact → prospect CRM | Public |

## Pile technique

Next.js 16 (App Router) · TypeScript strict · React 19 · Tailwind CSS 4 · composants accessibles (Radix) · Supabase (PostgreSQL 17, Auth + MFA TOTP, Storage privé, RLS) · Zod · React Hook Form · Recharts · Decimal.js · @react-pdf/renderer · ExcelJS · Vitest · Playwright + axe-core.

## Démarrage local (développeurs)

```bash
npm install
supabase start                      # pile Supabase locale (Docker)
cp .env.example .env.local          # puis renseigner les clés affichées par `supabase status`
npm run db:reset                    # applique les migrations
node scripts/seed-dev.ts            # données FICTIVES (refusé hors environnement local)
npm run dev                         # http://localhost:3000
```

Comptes fictifs locaux : `consultant@noamis.test`, `admin@noamis.test` (MFA requise), `client.a@exemple.test`… — mot de passe affiché par le script.

## Qualité

```bash
npm run typecheck && npm run lint
npm test                            # tests unitaires
npm run test:security               # RLS, stockage, isolation (base locale requise)
npm run test:integration            # cohérence financière, flux métier en base
npm run test:e2e                    # parcours Playwright, accessibilité, mobile
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) · [Sécurité](docs/SECURITY.md) · [Déploiement](docs/DEPLOYMENT.md)
- [Exploitation, sauvegardes, restauration](docs/OPERATIONS.md) · [Guide utilisateur](docs/USER_GUIDE.md)
- [Avancement et journal](docs/PROGRESS.md) · [Décisions](docs/DECISIONS.md)
