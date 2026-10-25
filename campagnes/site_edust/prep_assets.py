"""Prépare les médias du site E-DUST (assets/, ignoré par git) puis l'archive prête pour Hostinger dans livraison/site_edust/.
Sources : livraison/portfolio_site/videos (Reels web 720×1280 < 4 Mo), livraison/portfolio_fictif (carrousels, affiches, avant/après),
logo et favicon « warm » d'edust-solutions.fr (téléchargés dans raw/ par l'étape 1 ci-dessous si absents).
Usage : python3 prep_assets.py   (puis ouvrir index.html via le serveur local pour vérifier)."""
import os, shutil, subprocess, zipfile
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.abspath(f'{D}/../..'); L = f'{R}/livraison'
A = f'{D}/assets'; os.makedirs(f'{A}/videos', exist_ok=True); os.makedirs(f'{A}/visuels', exist_ok=True); os.makedirs(f'{D}/raw', exist_ok=True)

# 1. logo et favicon officiels (version chaude) depuis le site actuel
for nom, url in [('logo.png', 'https://edust-solutions.fr/images/edust-logo-warm.png'), ('favicon.png', 'https://edust-solutions.fr/favicon-warm-192.png')]:
    if not os.path.exists(f'{D}/raw/{nom}'):
        subprocess.run(['curl', '-sL', '-m', '30', '-o', f'{D}/raw/{nom}', url], check=True)
lg = Image.open(f'{D}/raw/logo.png').convert('RGBA'); lg.thumbnail((640, 640)); lg.save(f'{A}/logo.png', optimize=True)
fv = Image.open(f'{D}/raw/favicon.png').convert('RGBA'); fv.save(f'{A}/favicon.png'); fv.resize((180, 180), Image.LANCZOS).save(f'{A}/apple-touch-icon.png')

# 2. vidéos (déjà optimisées pour le web) + miniatures
VIDEOS = ['showreel', 'pov-patisserie', 'pov-mariage', 'reel-coiffure-ralenti', 'reel-fleuriste-bouquet', 'reel-garage-checkup',
          'reel-renovation-avant-apres', 'tiktok-immobilier-mutation', 'reel-spa-respiration', 'pub-canette-ralenti']
for v in VIDEOS:
    shutil.copyfile(f'{L}/portfolio_site/videos/{v}.mp4', f'{A}/videos/{v}.mp4')
    i = Image.open(f'{L}/portfolio_site/videos/{v}.jpg').convert('RGB'); i.thumbnail((540, 960)); i.save(f'{A}/videos/{v}.jpg', quality=82, optimize=True)

# 3. visuels (pages 4:5 des carrousels, affiches, avant/après) en JPEG web
VISUELS = {'marc-accroche': 'mains_artisans/p01.png', 'marc-portrait': 'mains_artisans/p02.png', 'marc-avant': 'mains_artisans/p03.png',
           'marc-savoir-faire': 'mains_artisans/p04.png', 'marc-vitrine': 'mains_artisans/p06.png', 'claire-22h14': 'page_accueil/p01.png',
           'claire-site': 'page_accueil/p06.png', 'affiche-pizzeria': 'affiches_situation/p02.png', 'affiche-librairie': 'affiches_situation/p04.png',
           'affiche-institut': 'affiches_situation/p06.png', 'avant-apres-bastien': 'avant_apres/c01.png', 'avant-apres-bastien-2': 'avant_apres/c05.png'}
for n, src in VISUELS.items():
    i = Image.open(f'{L}/portfolio_fictif/{src}').convert('RGB'); i.thumbnail((864, 1080)); i.save(f'{A}/visuels/{n}.jpg', quality=82, optimize=True, progressive=True)

# 4. archive prête à téléverser (public_html)
os.makedirs(f'{L}/site_edust', exist_ok=True)
z = f'{L}/site_edust/edust-site-hostinger.zip'
with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as f:
    for page in ['index.html', 'mentions-legales.html', '.htaccess']:
        if os.path.exists(f'{D}/{page}'): f.write(f'{D}/{page}', page)
    for base, _, fichiers in os.walk(A):
        for fi in fichiers:
            p = os.path.join(base, fi); f.write(p, os.path.relpath(p, D))
print('ok', z, round(os.path.getsize(z) / 1e6, 1), 'Mo')
