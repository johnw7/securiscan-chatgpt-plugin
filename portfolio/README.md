# Portfolio : la communication d’un commerce

`portfolio-communication-commerces.pdf` : 17 pages au format paysage (16:10) à envoyer aux commerçants ou à présenter sur tablette.

**À personnaliser avant envoi :** remplacez `[VOTRE NOM]`, `[VOTRE TÉLÉPHONE]`, `[VOTRE E-MAIL]`, `[VOTRE SITE]`, `[VOTRE PROFIL]`, `[VILLE]`, `[ANNÉE]` et `[VOTRE QR CODE]` dans `source/portfolio.html`, puis régénérez le PDF :

```bash
cd portfolio/source
python3 build.py .                       # remplit les blocs %%…%% → portfolio.built.html
node render-pdf.mjs "$PWD" ../portfolio-communication-commerces.pdf   # nécessite playwright-core + Chromium
```

Les exemples (STYLESHOP, SMASH HOUSE) sont des démos : enseignes fictives, visuels générés par IA avec Canva, prix indicatifs. Les mentions « démo » sont conservées dans le document.
