#!/usr/bin/env python3
"""NOAMIS : brouillon quotidien de post LinkedIn à partir de flux officiels.

Étapes : lit les flux RSS, demande un brouillon à Gemni (offre gratuite),
puis crée une Issue GitHub (notification email) pour validation humaine.
Rien n'est publié automatiquement. Bibliothèque standard uniquement.

Variables d'environnement :
  GEMINI_API_KEY   clé gratuite (aistudio.google.com)
  GEMINI_MODEL     optionnel, défaut gemini-2.0-flash
  GITHUB_TOKEN, GITHUB_REPOSITORY   fournis par GitHub Actions
  DRY_RUN=1        affiche le prompt, n'appelle ni Gemini ni GitHub
"""
import html
import json
import os
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

HERE = Path(__file__).parent
AGENT = HERE / "linkedin_agent"
sys.path.insert(0, str(AGENT))
MAX_ITEMS_PER_FEED = 5

PROMPT = """Tu es l'agent LinkedIn de NOAMIS Sûreté Conseil. Écris UN brouillon de post en français
à partir des actualités ci-dessous, en respectant la voix et les règles suivantes.

VOIX NOAMIS :
{voice}

FORMULES D'ACCROCHE DISPONIBLES (choisis la seule qui colle vraiment au sujet) :
{hooks}

RÈGLES D'ÉCRITURE :
- Ligne 1 : l'accroche, seule, lisible avant la coupure mobile (environ 140 caractères).
- Ligne 2 : la suite directe de l'accroche, pas de la mise en place.
- Corps : paragraphes de 1 à 3 lignes, une ligne vide entre chaque.
- Un tournant : une phrase qui reformule ce qui précède.
- Fin : UNE question précise que seul ce post peut poser. Pas de "Qu'en pensez-vous ?".
- Une seule idée par post. Longueur : 900 à 1300 caractères.
- Choisis l'actualité la plus utile pour des responsables de sites ou d'entrepôts et donne 3 conseils concrets.
- N'invente aucun chiffre, client ou résultat. Utilise seulement les actualités fournies.
- Aucun lien dans le texte du post. Trois hashtags maximum, en bas, s'ils sont réels.
- Pas de tiret cadratin.

FORMAT DE RÉPONSE EXACT :
ACCROCHE: <numéro et nom de la formule>
POST:
<texte du post>
PREMIER_COMMENTAIRE:
<source : nom de l'organisme et lien>

Actualités :
{news}
"""


def fetch_feed(url):
    req = urllib.request.Request(url, headers={"User-Agent": "noamis-daily/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        root = ET.fromstring(r.read())
    out = []
    for item in root.iter("item"):
        title = html.unescape(item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        desc = html.unescape(html.unescape(item.findtext("description") or "")).replace("\xa0", " ").strip()[:300]
        if title:
            out.append(f"- {title} ({link}) {desc}")
        if len(out) >= MAX_ITEMS_PER_FEED:
            break
    return out


def collect_news():
    lines = []
    for raw in (HERE / "feeds.txt").read_text(encoding="utf-8").splitlines():
        url = raw.strip()
        if not url or url.startswith("#"):
            continue
        try:
            lines += fetch_feed(url)
        except Exception as e:  # un flux en panne ne doit pas tout bloquer
            print(f"Flux ignoré {url}: {e}", file=sys.stderr)
    return "\n".join(lines)


def ask_gemini(prompt):
    model = os.environ.get("GEMINI_MODEL") or "gemini-3.5-flash"
    key = os.environ["GEMINI_API_KEY"]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode()
    req = urllib.request.Request(
        url, data=body, method="POST",
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.load(r)
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()


def create_issue(title, body):
    repo = os.environ["GITHUB_REPOSITORY"]
    req = urllib.request.Request(
        f"https://api.github.com/repos/{repo}/issues",
        data=json.dumps({"title": title, "body": body}).encode(),
        method="POST",
        headers={
            "Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)["html_url"]


def load_hooks():
    data = json.loads((AGENT / "hooks.json").read_text(encoding="utf-8"))
    return "\n".join(f"{h['id']}. {h['name']}: {h['template']}" for h in data["hooks"])


def parse_reply(text):
    hook, post, comment = "", text, ""
    if "POST:" in text:
        head, rest = text.split("POST:", 1)
        hook = head.replace("ACCROCHE:", "").strip()
        post, _, comment = rest.partition("PREMIER_COMMENTAIRE:")
    return hook, post.strip(), comment.strip()


def humanize_text(text):
    """Passe le texte dans l'humaniseur de li-human (MIT). Renvoie (texte, rapport)."""
    import humanize
    lex = humanize.load_lexicon(str(AGENT / "slop.json"))
    return humanize.humanize(text, lex)


def main():
    news = collect_news()
    if not news:
        print("Aucune actualité récupérée, rien à faire.")
        return 0
    voice = (AGENT / "voice.md").read_text(encoding="utf-8")
    prompt = PROMPT.format(voice=voice, hooks=load_hooks(), news=news)
    if os.environ.get("DRY_RUN"):
        print(prompt)
        return 0
    hook, post, comment = parse_reply(ask_gemini(prompt))
    post, report = humanize_text(post)
    flags = report.get("structures") or report.get("structural") or []
    flag_txt = f"\n\n**À relire (tournures typiques d'une IA détectées) :** {flags}" if flags else ""
    body = (
        "**Brouillon à relire avant publication. Rien n'est publié automatiquement.**\n\n"
        f"Formule d'accroche : {hook or 'non indiquée'}\n\n"
        f"```\n{post}\n```{flag_txt}\n\n"
        f"**Premier commentaire à poster (source) :**\n{comment or 'voir actualités ci-dessous'}\n\n"
        f"---\n<details><summary>Actualités utilisées</summary>\n\n{news}\n\n</details>"
    )
    print("Issue créée :", create_issue(f"Brouillon LinkedIn du {date.today():%d/%m/%Y}", body))
    return 0


if __name__ == "__main__":
    sys.exit(main())
