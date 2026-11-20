# Architecture

## Vue d'ensemble

```
Navigateur ──HTTPS──> Vercel (Next.js 16, rendu serveur)
                        │  proxy.ts : CSP à nonce + rafraîchissement de session
                        │  Server Components : lecture (client Supabase de l'utilisateur → RLS)
                        │  Server Actions / Route Handlers : écriture, fichiers, PDF
                        ▼
                     Supabase
                        ├─ Auth (mot de passe + TOTP, JWT, aal1/aal2)
                        ├─ PostgreSQL 17 : 43 tables, RLS partout, fonctions SECURITY DEFINER
                        └─ Storage : buckets privés `documents`, `audit-photos` (aucun accès direct)
```

## Organisation du code

| Dossier | Contenu |
|---|---|
| `src/app/(public)` | Accueil, diagnostic PROTECT, pages légales |
| `src/app/(auth)` | Connexion, mot de passe oublié/réinitialisation, MFA |
| `src/app/(staff)` | Espace NOAMIS (garde `requireStaff`) |
| `src/app/(portal)` | Portail client (garde `requireClient`) |
| `src/app/(shared)` | Compte utilisateur |
| `src/app/api` | Téléversements, téléchargements signés, PDF, Excel, export comptable, partage |
| `src/features/<module>` | Schémas Zod, Server Actions, composants et logique de chaque module |
| `src/lib/auth` | Couche d'accès (DAL) : session vérifiée (`getClaims`), garde-fous, MFA |
| `src/lib/permissions` | Matrice rôles → capacités |
| `src/lib/supabase` | Clients serveur / navigateur / service (serveur uniquement) |
| `src/lib/pdf` | Socle des documents PDF (charte NOAMIS) |
| `src/lib/validation` | Schémas partagés |
| `supabase/migrations` | 9 migrations SQL versionnées |
| `tests/{unit,integration,security,e2e}` | Tests |
| `scripts/` | Données fictives locales, initialisation de production, sauvegarde |

## Principes

1. **Défense en profondeur** : chaque page appelle un garde serveur ; chaque Server Action passe par `guarded()` (session, capacité, MFA, validation Zod) ; la base applique la RLS et des déclencheurs d'intégrité, quelle que soit l'interface.
2. **La base est la source de vérité** : totaux financiers recalculés en SQL (`numeric`), numérotation sans trou, factures émises verrouillées par déclencheur, journal d'audit en ajout seul.
3. **Clé de service** utilisée uniquement côté serveur, après contrôle explicite des droits (stockage, invitations, diagnostic public).
4. **Rendu dynamique** (pas de cache partagé de données personnelles).

## Modèle de données (extrait)

`organizations` · `profiles` · `memberships` (rôle, rattachement client) · `clients` · `contacts` · `leads` · `missions` · `mission_members` · `tasks` · `notes` · `calendar_events` · `notifications` · `audit_templates` · `audits` · `audit_observations` · `risk_assessments` · `recommendations` · `projects` · `milestones` · `vendors` · `selection_criteria` · `vendor_offers` · `project_meetings` · `project_decisions` · `intelligence_sources` · `intelligence_items` · `intelligence_reports` · `intelligence_report_recipients` · `service_catalog` · `quotes` · `quote_items` · `invoices` · `invoice_items` · `payments` · `payment_reminders` · `documents` · `document_versions` · `document_shares` · `messages` · `client_approvals` · `protect_assessments` · `number_sequences` · `audit_logs`.

Toutes les tables : identifiants UUID, clés étrangères, contraintes CHECK, index, `created_at`/`updated_at`, suppression logique (`deleted_at`) pour les données métier.
