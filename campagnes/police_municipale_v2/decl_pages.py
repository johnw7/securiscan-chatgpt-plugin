"""Pages A4 paysage présentant les déclinaisons réseaux sociaux (pour le portfolio)."""
import os, glob
from PIL import Image
R = '/home/user/securiscan-chatgpt-plugin/livraison/police_municipale/campagne_V2/declinaisons_reseaux_sociaux'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'decl_pages')
os.makedirs(f'{OUT}/img', exist_ok=True)

def small(path, w):
    name = os.path.basename(os.path.dirname(path))[:1] + '_' + os.path.basename(path)
    im = Image.open(path)
    im.thumbnail((w, 4000))
    im.save(f'{OUT}/img/{name}', quality=85)
    return f'img/{name}'

def files(d):
    return sorted(glob.glob(f'{R}/{d}/*.jpg'))

TRI = '<div class="tri"><i></i><i></i><i></i></div>'
pages = []
num = 0
def page(body, label):
    global num
    num += 1
    pages.append(f'<div class="pg">{body}<div class="ft"><span>E-DUST Solutions · Campagne recrutement Police municipale</span><span>{label}</span></div>{TRI}</div>')

def grid(imgs, h, cols, top=30):
    cells = ''.join(f'<img class="sh" src="{s}" style="height:{h}mm">' for s in imgs)
    return f'<div class="grid" style="top:{top}mm;grid-template-columns:repeat({cols},auto)">{cells}</div>'

def head(k, t, sub=''):
    return f'<div class="hd"><div class="k">{k}</div><div class="t">{t}</div>{f"<div class=s>{sub}</div>" if sub else ""}</div>'

post = [small(f, 520) for f in files('1_post_instagram_facebook_4x5')]
clair = [small(f, 520) for f in files('2_post_version_claire_4x5')]
story = [small(f, 420) for f in files('3_story_reel_9x16')]
land = [small(f, 700) for f in files('4_linkedin_facebook_paysage')]
ban = [small(f, 1600) for f in files('5_bannieres')]

# ouverture de section
page(f'''<div style="position:absolute;left:16mm;top:24mm;width:90mm">
 <div class="k">DÉCLINAISONS</div>
 <div class="big">RÉSEAUX<br><b>SOCIAUX.</b></div>
 <div class="red"></div>
 <p class="lede">Chaque affiche est déclinée dans tous les formats utiles à la commune pour diffuser la campagne en ligne.</p>
 <dl class="meta">
  <dt>POST 4:5</dt><dd>Instagram, Facebook, LinkedIn · 1080 × 1350 · 20 visuels</dd>
  <dt>VERSION CLAIRE</dt><dd>Variante fond clair du post · 20 visuels</dd>
  <dt>STORY / REEL 9:16</dt><dd>Instagram, Facebook · 1080 × 1920 · 20 visuels</dd>
  <dt>PAYSAGE</dt><dd>LinkedIn, Facebook, site web · 1200 × 630 · 20 visuels</dd>
  <dt>BANNIÈRES</dt><dd>Bannière LinkedIn 1584 × 396 · couverture Facebook 1640 × 624</dd>
 </dl>
</div>
<img class="sh" src="{story[11]}" style="position:absolute;right:16mm;top:16mm;height:170mm">
<img class="sh" src="{post[0]}" style="position:absolute;left:111mm;top:16mm;height:92mm">
<img class="sh" src="{land[9]}" style="position:absolute;left:111mm;top:126mm;height:39mm">''', 'DÉCLINAISONS')

def cap(t, x, y):
    return f'<div class="cap" style="position:absolute;left:{x}mm;top:{y}mm">{t}</div>'
page(head('UN VISUEL, TOUS LES FORMATS', 'Exemple : affiche 12') +
     f'<img class="sh" src="{story[11]}" style="position:absolute;left:16mm;top:26mm;height:150mm">' + cap('STORY / REEL 9:16', 16, 180) +
     f'<img class="sh" src="{post[11]}" style="position:absolute;left:110mm;top:26mm;height:104mm">' + cap('POST 4:5', 110, 133) +
     f'<img class="sh" src="{clair[11]}" style="position:absolute;left:200mm;top:26mm;height:104mm">' + cap('POST 4:5 · VERSION CLAIRE', 200, 133) +
     f'<img class="sh" src="{land[11]}" style="position:absolute;left:110mm;top:144mm;height:42mm">' + cap('PAYSAGE 1200 × 630', 194, 160), 'FORMATS')

for label, imgs, sub in [('POST 4:5 · INSTAGRAM, FACEBOOK, LINKEDIN', post, '1080 × 1350 px'),
                         ('POST 4:5 · VERSION CLAIRE', clair, 'Variante fond clair · 1080 × 1350 px')]:
    for part in (0, 1):
        page(head(label, f'Affiches {part * 10 + 1} à {part * 10 + 10}', sub) + grid(imgs[part * 10:part * 10 + 10], 66, 5, 32), label.split(' ·')[0])
for part in (0, 1):
    page(head('STORY / REEL 9:16', f'Affiches {part * 10 + 1} à {part * 10 + 10}', '1080 × 1920 px') + grid(story[part * 10:part * 10 + 10], 74, 5, 28), 'STORY 9:16')
page(head('PAYSAGE · LINKEDIN, FACEBOOK, SITE WEB', 'Affiches 1 à 12', '1200 × 630 px') + grid(land[:12], 36, 3, 30), 'PAYSAGE')
page(head('PAYSAGE · LINKEDIN, FACEBOOK, SITE WEB', 'Affiches 13 à 20', '1200 × 630 px') + grid(land[12:], 36, 3, 30), 'PAYSAGE')
page(head('BANNIÈRES', 'LinkedIn et Facebook') +
     f'''<div style="position:absolute;left:16mm;top:28mm"><div class="cap">BANNIÈRE LINKEDIN · 1584 × 396 px</div><img class="sh" src="{ban[0]}" style="width:250mm"></div>
<div style="position:absolute;left:16mm;top:106mm"><div class="cap">COUVERTURE FACEBOOK · 1640 × 624 px</div><img class="sh" src="{ban[1]}" style="width:200mm"></div>''', 'BANNIÈRES')

CSS = '''@page{size:297mm 210mm;margin:0}*{box-sizing:border-box}
html,body{margin:0;font-family:Montserrat,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg{width:297mm;height:210mm;position:relative;overflow:hidden;page-break-after:always;background:#0b1f4d;color:#fff}
.k{font-weight:800;letter-spacing:5px;font-size:10pt;color:#3fa9f5}
.big{font-family:Anton;font-size:52pt;line-height:1;margin:4mm 0}.big b{color:#3fa9f5;font-weight:400}
.red{width:22mm;height:2mm;background:#e1323c;margin:5mm 0}
.lede{font-size:12pt;line-height:1.5;color:#d5e2ff;font-weight:600}
.meta{display:grid;grid-template-columns:38mm 1fr;gap:2.4mm 4mm;font-size:9.5pt;margin-top:5mm}
.meta dt{font-weight:800;color:#3fa9f5;letter-spacing:1px;font-size:8.5pt}.meta dd{margin:0}
.hd{position:absolute;left:16mm;top:10mm;display:flex;align-items:baseline;gap:6mm}
.hd .t{font-family:Anton;font-size:18pt}.hd .s{font-size:9pt;opacity:.7}
.grid{position:absolute;left:0;right:0;display:grid;justify-content:center;gap:5mm 5mm}
img.sh{display:block;border-radius:1.2mm;box-shadow:0 3mm 9mm rgba(0,0,0,.45)}
.cap{font-weight:800;font-size:8.5pt;letter-spacing:2px;color:#3fa9f5;margin-bottom:2.5mm}
.ft{position:absolute;left:16mm;right:16mm;bottom:7mm;display:flex;justify-content:space-between;font-size:7pt;opacity:.6;font-weight:600}
.tri{position:absolute;left:0;right:0;bottom:0;height:3mm;display:flex}.tri i{flex:1}.tri i:nth-child(1){background:#2b5cc8}.tri i:nth-child(2){background:#fff}.tri i:nth-child(3){background:#e1323c}'''
open(f'{OUT}/decl_pages.html', 'w').write(f'''<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>{"".join(pages)}</body></html>''')
print(num, 'pages')
