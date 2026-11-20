# Décisions d'architecture

| N° | Décision | Raison |
|---|---|---|
| ADR-001 | Projet dans `noamis-360/` du dépôt existant, sans toucher au démonstrateur E-DUST à la racine | Dépôt imposé par l'environnement ; aucune perte de l'existant |
| ADR-002 | Next.js 16.4.5, React 19.3, TypeScript 5.9, Vitest 5.1, Playwright 1.63 — versions publiées depuis au moins 2 semaines | Stabilité ; TypeScript 7 écarté (compatibilité outillage) |
| ADR-003 | Supabase (Auth, PostgreSQL, Storage, RLS) | Imposé, sécurité au niveau de la base |
| ADR-004 | `cacheComponents` désactivé, rendu dynamique | Application entièrement authentifiée : pas de cache de données personnelles, modèle plus simple et plus sûr |
| ADR-005 | Autorisation en 3 couches : garde de page, `guarded()` dans chaque Server Action, RLS | Ne jamais dépendre de l'interface |
| ADR-006 | Privilèges administrateur conditionnés à `aal2` dans les fonctions SQL | MFA imposée côté base, pas seulement côté interface |
| ADR-007 | Stockage sans politique d'accès direct ; URL signées 60 s émises par le serveur | Les rapports de sûreté ne doivent jamais être exposés |
| ADR-008 | Totaux financiers en SQL `numeric` + Decimal.js côté interface, même règle d'arrondi (testée) | Exactitude au centime, base source de vérité |
| ADR-009 | Numéro de facture attribué à l'émission (pas à la création), séquence par année | Numérotation continue sans trou |
| ADR-010 | Invitations par lien d'activation généré (pas d'e-mail) | Indépendance vis-à-vis du SMTP limité de Supabase |
| ADR-011 | Composants d'interface écrits dans le style shadcn/ui sur Radix, sans le CLI shadcn | Accès réseau au registre non garanti ; même résultat |
| ADR-012 | Diagnostic PROTECT : score calculé serveur, contact rattaché au diagnostic (fonction dédiée) | Intégrité, pas de doublon, minimisation des données |
| ADR-013 | Connecteur IA optionnel (SDK Anthropic, modèle `claude-opus-5-5`, repli serveur activé), désactivé sans clé | Brouillons uniquement, validation humaine obligatoire |
| ADR-014 | Facturation électronique : PDF à mentions légales, présentés comme non suffisants ; intégration future avec une plateforme agréée (export Factur-X/UBL) | Réception obligatoire depuis le 01/09/2026, émission au 01/09/2027 pour les micro-entreprises (à confirmer sur impots.gouv.fr) |
| ADR-015 | Historique détaillé (journal d'audit) réservé aux administrateurs | Moindre privilège : le journal peut révéler des valeurs sensibles |
