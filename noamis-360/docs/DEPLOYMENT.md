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

## Voie manuelle sans terminal (≈ 15 minutes, testée sur base vierge le 20/11/2026)

1. **Supabase** → supabase.com → *New project* (offre Free, région *West EU (Paris)*), choisir un mot de passe de base (à conserver dans un gestionnaire de mots de passe).
2. **SQL Editor** → *New query* → coller le contenu de `supabase/deploy/01_schema_complet.sql` → *Run*.
3. **Authentication → Users → Add user → Create new user** : votre adresse, un mot de passe ≥ 12 caractères, cocher *Auto Confirm User*.
4. **SQL Editor** : coller `supabase/deploy/02_initialisation.sql` (adapter l'adresse ligne 6 si besoin) → *Run* → message « Initialisation terminée ».
5. **Authentication → Sign In / Providers** : désactiver *Allow new users to sign up* ; **Multi-Factor** : TOTP activé.
6. **Project Settings → API** : copier l'URL du projet, la clé `anon` et la clé `service_role`.
7. **Vercel** → projet importé (dossier racine `noamis-360`) → *Settings → Environment Variables* : renseigner les variables du tableau ci-dessus (`IP_HASH_SALT` : 32+ caractères aléatoires, par ex. générés par le gestionnaire de mots de passe) → *Deployments → Redeploy*.
8. **Supabase → Authentication → URL Configuration** : *Site URL* = URL Vercel ; *Redirect URLs* = `<URL>/auth/callback`, `<URL>/auth/confirm`.
9. Se connecter sur `<URL>/login`, enrôler la MFA, compléter Administration → Organisation.

Ces fichiers ne contiennent aucune donnée fictive ni aucun secret. Ils sont régénérés par concaténation de `supabase/migrations`.

## État au 20/11/2026

Voir docs/PROGRESS.md : les accès API Supabase et Vercel donnés à l'assistant ont été refusés ; le déploiement se fait par la voie manuelle ci-dessus.
