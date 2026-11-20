# Avancement — NOAMIS 360°

_Dernière mise à jour : 20/11/2026_

## Phases

| Phase | État | Validation |
|---|---|---|
| A — Initialisation | ✅ Terminée | Next.js 16, charte NOAMIS (contrastes AA testés), thèmes sombre/clair |
| B — Infrastructure | ✅ Terminée | 9 migrations, 43 tables sous RLS, buckets privés, rôles, MFA |
| C — PILOT | ✅ Terminée | Tests E2E (client, contact, mission, tâche) |
| D — AUDIT, PROJECT, INTELLIGENCE | ✅ Terminée | Tests en base (validation d'audit, clôture, diffusion), PDF/Excel vérifiés |
| E — DOCS, FINANCE, CONNECT | ✅ Terminée | Tests de sécurité, cohérence financière, parcours client E2E |
| F — PROTECT | ✅ Terminée | Parcours public E2E, prospect créé dans le CRM |
| G — Validation | ✅ Terminée en local | Voir résultats ci-dessous |
| H — Déploiement | ⏸ En attente d'action manuelle | Scripts SQL de déploiement prêts et testés sur base vierge ; voie manuelle dans docs/DEPLOYMENT.md |

## Résultats des tests (19-20/11/2026)

| Suite | Résultat |
|---|---|
| Unitaires (Vitest) | 63/63 |
| Sécurité + intégration (base Supabase locale réelle) | 78/78 |
| E2E desktop (dev) | 19/19 |
| E2E sur build de production (CSP stricte) | 19/19 |
| E2E mobile | 2/2 |
| Accessibilité axe-core WCAG 2.2 AA (24 pages) | 0 violation grave ou critique |
| TypeScript, ESLint | 0 erreur |
| `npm audit` | 0 vulnérabilité |
| Sauvegarde / restauration | Vérifiée (volumes identiques, connexion OK) |

## Défauts trouvés et corrigés grâce aux tests

- Politiques RLS incompatibles avec `INSERT … RETURNING` (missions, documents).
- Validation silencieuse des champs cachés dans les formulaires.
- Sélection facultative vide refusée.
- HTML encodé en entités non neutralisé dans les flux de veille.
- Jointure auto-référencée des avoirs.
- Graphiques focalisables mais masqués aux lecteurs d'écran ; noms accessibles incohérents.
- Double enrôlement MFA en mode strict React.

## Blocages

1. **Supabase (production)** : le connecteur et les deux jetons saisis sont refusés par l'API de gestion (« JWT could not be decoded »). Action requise : jeton `sbp_` valide, reconnexion du connecteur sur claude.ai, ou intégration Supabase via Vercel.
2. **Vercel** : le connecteur peut lire l'équipe « noamis surete conseil » mais la création de projet est refusée (403 « You don't have permission to create the project »). Action requise : importer le dépôt depuis vercel.com/new (dossier racine `noamis-360`) ou accorder au connecteur le droit de créer des projets.

3. **Contournement préparé** : `supabase/deploy/01_schema_complet.sql` + `02_initialisation.sql`, à coller dans le SQL Editor Supabase (testés sur base vierge : 43 tables sous RLS, organisation, super-admin, modèle d'audit, 2 buckets privés).

## Coûts récurrents estimés

| Service | Offre | Coût |
|---|---|---|
| Vercel | Hobby (usage non commercial) / Pro recommandé pour usage professionnel | 0 € / ~20 $/mois/membre |
| Supabase | Free (pause après 7 j d'inactivité, pas de sauvegarde restaurable) / Pro recommandé | 0 € / ~25 $/mois |
| Anthropic (facultatif) | À l'usage | quelques euros/mois selon volume |
| Plateforme agréée e-facture | À choisir | variable |

Aucun abonnement payant n'a été souscrit.
