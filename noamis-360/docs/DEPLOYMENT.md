# Déploiement

## Cible

- **Hébergement** : Vercel, équipe « noamis surete conseil », projet lié au dépôt GitHub, répertoire racine `noamis-360`, région `cdg1` (Paris).
- **Données** : un projet Supabase par environnement (préproduction, production), région Union européenne.
- **Domaine** : URL temporaire `*.vercel.app` ; aucun changement DNS de noamis.fr sans autorisation explicite.

## Étapes

1. **Supabase** : créer le projet (offre gratuite pour démarrer), puis :
   ```bash
   supabase link --project-ref <ref>
   supabase db push                      # applique supabase/migrations (aucune donnée fictive)
   ```
   Dans Auth → URL Configuration : `Site URL` = URL Vercel ; redirections autorisées : `<URL>/auth/callback`, `<URL>/auth/confirm`.
   Auth → Providers → Email : inscriptions désactivées ; Auth → MFA : TOTP activé ; mot de passe ≥ 12 caractères.
2. **Vercel** : variables d'environnement (Production et Preview) :
   | Variable | Type |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | public |
   | `NEXT_PUBLIC_SUPABASE_URL` | public |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public |
   | `SUPABASE_SERVICE_ROLE_KEY` | **sensible** |
   | `IP_HASH_SALT` | **sensible** (32+ caractères aléatoires) |
   | `ANTHROPIC_API_KEY` | sensible, facultatif |
3. **Déployer** (poussée Git sur la branche de production).
4. **Initialiser** l'organisation et le super-administrateur :
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… NEXT_PUBLIC_SITE_URL=… \
   ADMIN_EMAIL=… ADMIN_NAME="…" node scripts/bootstrap-production.ts
   ```
   Ouvrir le lien affiché, définir le mot de passe, activer la MFA, compléter Administration → Organisation (adresse, SIRET, IBAN).
5. **Vérifier** : HTTPS, `/login`, connexion, MFA, création d'un client, en-têtes (`curl -I`), diagnostic public.

## État au 20/11/2026

Voir docs/PROGRESS.md : le projet Supabase de production n'a pas pu être créé (jeton refusé), le déploiement Vercel est donc en attente.
