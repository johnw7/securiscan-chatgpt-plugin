#!/usr/bin/env python3
"""NOAMIS : brouillon quotidien de post LinkedIn à partir de flux officiels.

Étapes : lit les flux RSS, demande un brouillon à Gemini (offre gratuite),
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
MAX_ITEMS_PER_FEED = 5

PROMPT = """Tu rédiges pour NOAMIS Sûreté Conseil, cabinet de conseil en sûreté et accompagnement.
Écris UN brouillon de post LinkedIn en français à partir des actualités ci-dessous.

Règles :
- Ton sobre, professionnel, utile. Pas de sensationnalisme, pas d'emojis en excès.
- Pas de tiret cadratin. Phrases courtes.
- N'invente aucun chiffre, aucun fait, aucune promesse. Utilise uniquement ce qui figure dans les actualités.
- Choisis l'actualité la plus pertinente pour des responsables d'entrepôts, de sites ou de PME, et donne 3 conseils concrets de prévention.
- Cite la source (nom de l'organisme et lien) à la fin.
- Termine par une question simple pour ouvrir la discussion.
- Longueur : 900 à 1300 caractères.
- Réponds uniquement avec le texte du post.

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
    model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
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


def main():
    news = collect_news()
    if not news:
        print("Aucune actualité récupérée, rien à faire.")
        return 0
    prompt = PROMPT.format(news=news)
    if os.environ.get("DRY_RUN"):
        print(prompt)
        return 0
    draft = ask_gemini(prompt)
    body = (
        "**Brouillon à relire avant publication. Rien n'est publié automatiquement.**\n\n"
        f"{draft}\n\n---\n<details><summary>Actualités utilisées</summary>\n\n{news}\n\n</details>"
    )
    print("Issue créée :", create_issue(f"Brouillon LinkedIn du {date.today():%d/%m/%Y}", body))
    return 0


if __name__ == "__main__":
    sys.exit(main())
