# NOAMIS : brouillon quotidien (gratuit)

Chaque jour ouvré, GitHub Actions lit des flux officiels (`feeds.txt`), demande un
brouillon de post LinkedIn à Gemini (offre gratuite) et crée une **Issue** avec le texte.
Vous recevez la notification de GitHub (email ou appli mobile), relisez, puis publiez vous-même.
Rien n'est publié automatiquement.

## Mise en route (5 minutes)
1. Créez une clé gratuite sur https://aistudio.google.com/apikey
2. Dans GitHub : Settings > Secrets and variables > Actions > New repository secret
   nom `GEMINI_API_KEY`, valeur la clé.
3. Le workflow `.github/workflows/noamis-daily.yml` doit être sur la branche par défaut
   (les tâches planifiées ne tournent que là).
4. Onglet Actions > "NOAMIS brouillon quotidien" > Run workflow pour tester.

## Personnaliser
- Sources : `feeds.txt` (un flux RSS par ligne).
- Ton et règles : variable `PROMPT` dans `daily_draft.py`.
- Heure : ligne `cron` du workflow (en UTC).
- Test sans clé : `DRY_RUN=1 python3 noamis-daily/daily_draft.py`

## Intégration de l'agent LinkedIn (plugin `linkedin-agent`, licence MIT)
Le dossier `linkedin_agent/` reprend des éléments du plugin :
- `hooks.json` : les 21 formules d'accroche de `li-post`. Le modèle en choisit une.
- `humanize.py` + `slop.json` : l'humaniseur de `li-human` (tirets cadratins, caractères
  invisibles, vocabulaire convenu). Son lexique est surtout anglais : il nettoie bien la
  typographie, moins les tournures françaises. Relisez toujours le brouillon.
- `voice.md` : la voix NOAMIS injectée dans le prompt. **Corrigez-la**, c'est elle qui
  fait ressembler les brouillons à vos vrais posts.
- `LICENSE` : licence MIT d'origine, à conserver.

L'Issue contient l'accroche choisie, le post, les tournures suspectes éventuelles et le
**premier commentaire** (la source), car LinkedIn réduit la portée des posts avec lien dans le texte.
