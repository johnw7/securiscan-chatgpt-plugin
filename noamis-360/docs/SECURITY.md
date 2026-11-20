# Sécurité

## Rôles (moindre privilège)

| Rôle | Périmètre |
|---|---|
| Super-administrateur | Tout, y compris la gestion des administrateurs |
| Administrateur NOAMIS | Utilisateurs, organisation, émission de factures, règlements, journal d'audit |
| Collaborateur NOAMIS | Missions (hors confidentielles non attribuées), audits, projets, veille, documents, brouillons financiers |
| Client | Son seul portail (données de sa fiche client) |

**MFA (TOTP) obligatoire pour les administrateurs** : sans session `aal2`, les fonctions SQL `private.is_admin`/`is_staff` ne leur accordent aucun droit, et l'interface impose l'enrôlement ou la vérification.

## Mesures

- **RLS** activée sur les 43 tables ; aucune autorisation pour le rôle `anon` ; politiques écrites sur les colonnes de la ligne.
- **Missions confidentielles** : visibles uniquement du responsable, des membres désignés et des administrateurs ; la confidentialité se propage aux tâches, documents, audits, projets, devis et factures liés.
- **Stockage** : buckets privés, aucune politique d'accès direct ; téléchargement via route serveur (contrôle RLS) puis URL signée de 60 s.
- **Fichiers** : liste blanche, vérification de la signature binaire, taille maximale, refus des PDF à JavaScript, des macros Office et du contenu actif ; nom de stockage aléatoire ; empreinte SHA-256.
- **Liens de partage** : jeton aléatoire 256 bits stocké haché, 7 jours maximum, quota de téléchargements, révocables ; interdits pour les rapports de sûreté et documents restreints.
- **Factures** : émission par fonction SQL réservée aux administrateurs, numérotation sans trou, verrouillage par déclencheur (même avec la clé de service), corrections par avoir, trop-perçu refusé.
- **Journal d'audit** en ajout seul (déclencheur) ; secrets et contenus volumineux jamais journalisés.
- **En-têtes** : CSP à nonce (`strict-dynamic`), HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, pas de `X-Powered-By`.
- **Erreurs** : messages génériques en français, sans détail technique ; journaux applicatifs avec masquage des jetons et mots de passe.
- **Authentification** : inscription publique désactivée, mot de passe ≥ 12 caractères (majuscule, minuscule, chiffre), message de connexion générique, anti redirection ouverte, désactivation d'un compte = révocation de ses sessions.
- **Veille** : collecte HTTPS uniquement, protection SSRF (adresses privées refusées, y compris après redirection), respect de robots.txt, taille et délai bornés.
- **PROTECT** : score recalculé côté serveur, aucune adresse collectée, IP conservée uniquement sous forme d'empreinte salée, 10 envois/heure, consentement explicite.
- **IA (optionnelle)** : seuls des contenus publics de veille sont transmis ; résultats marqués « brouillon IA » ; diffusion impossible sans validation (contrainte SQL).

## Tests de sécurité (cahier des charges § 17)

| # | Exigence | Tests |
|---|---|---|
| 1 | Non connecté sans accès | `tests/security/rls-isolation.test.ts`, `tests/e2e/public-security.spec.ts` |
| 2-3 | Client A ≠ client B (lecture, modification) | `rls-isolation.test.ts`, `storage-api.test.ts`, `workflows.spec.ts` |
| 4 | Mission confidentielle | `rls-isolation.test.ts` |
| 5 | Téléchargements privés | `storage-api.test.ts`, `public-security.spec.ts` |
| 6 | Routes serveur | `public-security.spec.ts`, `workflows.spec.ts` |
| 7 | Validation des entrées | `tests/unit/security.test.ts`, `validation.test.ts`, `workflows.spec.ts` |
| 8 | Fichiers importés | `security.test.ts` |
| 9 | Erreurs sans secrets | `security.test.ts`, `public-security.spec.ts` |
| 10 | Journaux sans secrets | `security.test.ts`, `rls-isolation.test.ts` |
| 11 | Cohérence financière | `tests/integration/finance-db.test.ts`, `tests/unit/finance.test.ts` |
| 12 | Expiration des liens | `finance-db.test.ts`, `rls-isolation.test.ts`, `security.test.ts` |
| OWASP | En-têtes, redirection ouverte, énumération, SSRF, injection | `public-security.spec.ts`, `security.test.ts` |

## Points d'attention

- Configurer un **SMTP personnalisé** dans Supabase (l'envoi par défaut est limité) pour les e-mails de réinitialisation ; les invitations n'en dépendent pas (lien d'activation).
- Choisir la **région Union européenne** pour le projet Supabase et Vercel (`cdg1`).
- Activer la protection contre les mots de passe divulgués (Supabase Auth, offre Pro).
