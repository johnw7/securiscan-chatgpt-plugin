# Portfolio E-DUST Solutions : créations

`portfolio-edust-solutions.pdf` : 16 pages au format paysage (16:10), aux couleurs E-DUST Solutions (bleu nuit #021448, bleu électrique #0B58FF, cyan #01DAFF et leur dégradé).

Contenu : l’agence, les 6 expertises, puis l’étude de cas complète **SMASH HOUSE** (brief, identité, mises en situation, direction photo, site, commande en ligne, réseaux sociaux, print, livrables). Le document se termine par la méthode, trois formules d’accompagnement sans tarifs (sur devis) et une page de contact.

**À personnaliser avant envoi :** remplacez `[VOTRE NOM]`, `[VOTRE TÉLÉPHONE]`, `[VOTRE E-MAIL]`, `[VOTRE SITE]`, `[VILLE]`, `[ANNÉE]` et `[VOTRE QR CODE]` dans `source/portfolio-agence.html`, puis régénérez le PDF :

```bash
cd portfolio-agence/source
SHELLBIN=/chemin/vers/chromium node render-pdf.mjs "$PWD" ../portfolio-edust-solutions.pdf   # nécessite playwright-core
```

SMASH HOUSE est une enseigne de démonstration : visuels générés par IA avec Canva, paiement simulé. Les mentions « démo » sont conservées dans le document.
