# NOAMIS — Espace Projet

Application web responsive, en français, qui complète le site vitrine [www.noamis.fr](https://www.noamis.fr).
Elle est indépendante du site vitrine : celui-ci la relie simplement par un lien **« Espace client »** vers la page `/connexion`
(et éventuellement par un lien **« Présenter mon projet »** vers `/presenter-mon-projet`).

> NOAMIS conseille, prépare les dossiers, identifie des professionnels spécialisés, aide à comparer les propositions et peut
> coordonner le suivi organisationnel selon la mission convenue. Le client choisit son prestataire et contractualise directement
> avec lui. Toutes les données de démonstration sont **fictives**.

## Démarrage

Prérequis : Node.js **22.13 ou plus récent** (la base SQLite est intégrée à Node, aucune base externe à installer).

```bash
cd noamis-espace-projet
npm install
npm start            # http://localhost:3100
npm test             # scénario complet + contrôles de cloisonnement
npm run reset-demo   # remet la démonstration à zéro
```

### Comptes de démonstration

| Rôle | Identifiant | Mot de passe |
|---|---|---|
| Cabinet | `cabinet@noamis.example` | `Demo-Cabinet-2026` |
| Client | `client@noamis.example` | `Demo-Client-2026` |

Un second client fictif (`direction@orvalis.example`, invitation non acceptée) possède son propre dossier : il sert à vérifier
que le client de démonstration ne peut pas l’ouvrir.

## Scénario de démonstration

1. **Soumettre une demande** — `/presenter-mon-projet` (sans compte) : profil, coordonnées, contact préféré, besoin, zone, délai,
   description ; niveau d’accompagnement facultatif ; mise en garde contre l’envoi d’informations sensibles ; page de confirmation.
2. **Créer un dossier** — connexion cabinet → *Demandes* → ouvrir la demande → choisir le niveau → *Créer le dossier*.
3. **Inviter le client** — option « Inviter un nouveau client » : un lien personnel (7 jours, usage unique) est créé.
   Sans SMTP, le lien s’affiche une seule fois au cabinet ; l’ouvrir dans une fenêtre privée pour définir le mot de passe.
4. **Préparer** — onglets *Documents* (dépôt, privé par défaut, puis « Partager avec le client »), *Notes et comptes rendus*,
   *Étapes et livrables*, *Tâches*.
5. **Soumettre une version du dossier pour validation** — onglet *Validations* : action, destinataire (annuaire), pièces ; la version
   du dossier est enregistrée. Côté client : *Décisions* → *Valider*, *Demander une modification* ou *Refuser*.
   Toute modification des pièces, du destinataire ou de l’action crée une nouvelle demande (l’ancienne passe à « Remplacée »).
   Après validation, le cabinet effectue l’envoi puis *Consigne la transmission*.
6. **Comparer deux propositions** — onglet *Propositions* : saisir deux devis puis les partager ; côté client, *Mon projet* →
   comparatif (tableau sur ordinateur, fiches sur mobile) séparant les informations du prestataire et l’analyse NOAMIS.
7. **Clôturer** — onglet *Synthèse* → *Clôturer le dossier* (synthèse publiée, dossier en consultation seule).
8. **Cloisonnement** — connecté en client, ouvrir `/espace/dossiers/2` (dossier d’un autre client) : page introuvable (404).

Le fichier `test/scenario.test.js` rejoue automatiquement tout ce scénario.

## Fonctionnalités

- **Espace client** : tableau de bord (étape en cours, dernière mise à jour, prochaine action attendue), rubriques
  *Mon projet* (méthode Comprendre → Préparer → Rechercher → Accompagner → Finaliser, livrables prévus, comptes rendus,
  actions convenues, comparatif), *Documents*, *Décisions*, *Messages* ; notifications.
- **Cabinet** : tableau de bord (décisions reçues, demandes, échéances), demandes, dossiers et onglets (synthèse, étapes et
  livrables, tâches, documents, notes internes / comptes rendus, propositions, validations, messages, historique), clients
  et invitations, annuaire interne des prestataires.
- **Niveaux** : NOAMIS CONSEIL, NOAMIS PROJET, NOAMIS ACCOMPAGNEMENT INTÉGRAL, avec étapes et livrables par défaut que le cabinet
  ajuste. Aucun tarif public n’est affiché.
- **Historique** : chaque décision enregistre son auteur, sa date et la version concernée ; chaque transmission est consignée.

## Sécurité et confidentialité

- Deux rôles, **Cabinet** et **Client** ; pas de compte prestataire. Accès client uniquement par invitation individuelle.
- Mots de passe hachés (scrypt) ; sessions en base, cookie `HttpOnly`, `SameSite=Lax`, `Secure` en production ; jeton CSRF
  sur tous les formulaires ; limitation des tentatives de connexion ; en-têtes CSP, `nosniff`, `frame-ancestors 'none'`.
- **Autorisations vérifiées côté serveur à chaque consultation, modification et téléchargement** : un client n’obtient que les
  dossiers qui lui sont attribués, et seulement les documents partagés ; toute autre requête renvoie 404.
- Documents stockés hors du dossier public (`data/storage`, noms aléatoires), servis uniquement après contrôle d’accès.
  Formats acceptés : PDF, Office, OpenDocument, images, texte — 15 Mo maximum.
- Nouveaux documents, notes et propositions **privés par défaut** ; les notes internes ne sont jamais visibles du client.
- Notifications et e-mails **génériques** : ils signalent qu’une mise à jour ou une décision est disponible, sans détail ni pièce jointe.
- Une validation autorise uniquement l’action décrite : elle ne déclenche ni commande, ni paiement, ni signature de devis.

## Ce qui reste à configurer

| Élément | État | À faire |
|---|---|---|
| Envoi d’e-mails (invitations, notifications) | Désactivé tant que SMTP n’est pas renseigné : notifications visibles dans l’application, lien d’invitation affiché au cabinet | Renseigner `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (voir `.env.example`) avec un domaine d’envoi authentifié (SPF, DKIM) |
| Hébergement et HTTPS | — | Déployer derrière HTTPS (ex. `espace.noamis.fr`), définir `APP_BASE_URL`, `NODE_ENV=production`, `TRUST_PROXY=true` |
| Données réelles | La démonstration est injectée si la base est vide | `DEMO_MODE=false`, puis créer le compte cabinet réel (voir ci-dessous) |
| Sauvegardes | — | Sauvegarder régulièrement `data/noamis.db` et `data/storage/` (chiffrés) |
| Lien depuis le site vitrine | — | Ajouter un lien « Espace client » vers `https://<domaine>/connexion` sur www.noamis.fr |
| Mentions RGPD | Case de consentement sur le formulaire public | Relier la politique de confidentialité du site et définir la durée de conservation |

Création d’un compte cabinet réel (une fois `DEMO_MODE=false`) :

```bash
node --disable-warning=ExperimentalWarning -e "
const {openDb}=require('./src/db');const {hashPassword}=require('./src/auth');
const db=openDb(process.env.DATABASE_PATH||'data/noamis.db');
db.run(\"INSERT INTO users (email,name,role,password_hash,activated_at,created_at) VALUES (?,?,'cabinet',?,datetime('now'),datetime('now'))\",
'prenom.nom@noamis.fr','Prénom Nom',hashPassword('UnMotDePasseLongEtUnique'));"
```

## Structure

```
server.js              démarrage
src/app.js             configuration Express, en-têtes de sécurité, gestion des erreurs
src/db.js              schéma SQLite (node:sqlite)
src/auth.js            mots de passe, sessions, CSRF, invitations, rôles
src/services.js        création de dossier, historique, contrôle d’accès aux dossiers
src/notify.js          notifications in-app et e-mails génériques
src/view.js            gabarits HTML échappés, composants de formulaire accessibles
src/components.js      frise des étapes, comparatif, fiche de validation
src/routes/            public, client, cabinet, partagé (téléchargement, notifications)
public/                feuille de style (palette officielle) et logo officiel
scripts/seed.js        données de démonstration fictives
test/                  test de bout en bout
```

Identité visuelle : noir profond `#000000`, blanc doux `#F5F5F5`, or mat `#C4A15B` (variables `--noamis-noir`, `--noamis-blanc`,
`--noamis-or`), logo officiel repris de www.noamis.fr sans déformation ni recadrage.

---

*NOAMIS — Votre projet de sécurité, notre accompagnement.*
