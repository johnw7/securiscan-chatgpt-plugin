# Exploitation

## Sauvegardes

| Élément | Méthode | Fréquence conseillée |
|---|---|---|
| Base (schéma + données + comptes) | `scripts/backup.sh` (pg_dump logique) | Quotidienne, rétention 30 jours, copie chiffrée hors site |
| Base (offre Supabase Pro) | Sauvegardes automatiques quotidiennes (+ PITR en option) | Automatique |
| Fichiers (`documents`, `audit-photos`) | Copie S3 du stockage Supabase (`rclone` ou API) | Hebdomadaire |

L'offre gratuite Supabase ne fournit pas de sauvegarde restaurable par vos soins : la sauvegarde logique `scripts/backup.sh` est donc indispensable dans ce cas.

## Restauration (procédure vérifiée le 19/11/2026)

Vérifiée sur la pile locale : sauvegarde → réinitialisation complète → restauration → volumes identiques (8 tables comparées) et connexion d'un compte restauré fonctionnelle.

```bash
# 1. Schéma : appliquer les migrations sur une base vierge
supabase db push
# 2. Comptes puis données (rôle supabase_admin requis pour neutraliser les déclencheurs)
PGOPTIONS="-c session_replication_role=replica" pg_restore -U supabase_admin -d <db> --data-only --single-transaction auth.dump
PGOPTIONS="-c session_replication_role=replica" pg_restore -U supabase_admin -d <db> --data-only --single-transaction public.dump
# 3. Contrôles : nombre de lignes des tables clés, connexion, consultation d'une facture et d'un document
```
Les déclencheurs sont neutralisés pendant l'import pour ne pas recréer de journal ni recalculer les factures émises.

## Tâches récurrentes

- **Purge RGPD PROTECT** (mensuelle) : `select public.purge_protect_assessments();` (diagnostics anonymes > 12 mois).
- **Mises à jour** : `npm audit` et mises à jour mineures mensuelles ; relancer `npm run check` et les tests E2E.
- **Revue des accès** (trimestrielle) : Administration → Utilisateurs ; désactiver les comptes inutilisés.
- **Journal d'audit** : consultation lors de tout incident.

## Supervision

- Vercel : journaux d'exécution et erreurs (Observability), alertes de déploiement.
- Supabase : rapports de base, journaux Auth, alertes d'usage (quotas de l'offre gratuite).
- Point de contrôle : la page `/login` doit répondre en 200 avec l'en-tête `content-security-policy`.

## Incidents courants

- **Perte du second facteur d'un administrateur** : un super-administrateur supprime le facteur dans Supabase (Authentication → Users → utilisateur → MFA), la personne se reconnecte puis se réenrôle.
- **Lien d'activation expiré** : Administration → Utilisateurs → icône clé (nouveau lien).
- **Fuite suspectée d'un lien de partage** : Documents → document → Révoquer.

## Tests

```bash
supabase start && npm run db:reset && node scripts/seed-dev.ts
npm test && npm run test:security && npm run test:integration && npm run test:e2e
```
