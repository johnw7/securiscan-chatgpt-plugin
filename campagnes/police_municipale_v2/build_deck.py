import sys, os
sys.path.insert(0, '/home/user/securiscan-chatgpt-plugin/campagnes/police_municipale_v2')
from concepts import C
D = os.path.dirname(os.path.abspath(__file__))

# (scène, personnages, usage) en français pour chaque affiche
META = [
 ("Hôtel de ville, lumière dorée", "Agente, la trentaine", "Visuel manifeste, lancement"),
 ("Marché de centre-ville, matin", "Agent, fin de vingtaine", "Proximité avec les habitants"),
 ("Parc urbain, après-midi", "Agente de la brigade VTT", "Profils sportifs et de terrain"),
 ("Devant une école primaire", "Agent expérimenté, la cinquantaine", "Protection des plus jeunes"),
 ("Rue piétonne à l'heure bleue", "Binôme agente / agent", "Patrouilles de soirée"),
 ("Promenade du front de mer", "Agente, la vingtaine", "Communes littorales, été"),
 ("Rue calme, fin d'après-midi", "Agent, la quarantaine, véhicule", "Patrouille et intervention"),
 ("Hall d'accueil de mairie", "Agente aux cheveux argentés", "Accueil, écoute, orientation"),
 ("Esplanade de parc", "Maître-chien et son malinois", "Brigade cynophile"),
 ("Place avec fontaine", "Équipe de quatre agents", "Diversité, esprit d'équipe"),
 ("Centre de supervision urbaine", "Agente opératrice CSU", "Vidéoprotection, nouveaux métiers"),
 ("Centre sportif et d'entraînement", "Jeune agent athlétique", "Jeunes diplômés, sportifs"),
 ("Marché de Noël au crépuscule", "Agente, la cinquantaine", "Événements et fêtes"),
 ("Avenue bordée d'arbres", "Motard de la brigade", "Brigade motocycliste"),
 ("Passage piéton en centre-ville", "Binôme agente / agent", "Sécurité routière"),
 ("Devant une boulangerie", "Agente, fin de vingtaine", "Lien avec les commerçants"),
 ("Place de centre ancien", "Tuteur expérimenté et jeune recrue", "Formation, tutorat"),
 ("Quai et pont de pierre, coucher de soleil", "Agente, la trentaine", "Fierté et ancrage local"),
 ("Place mouillée sous la pluie", "Agent, la trentaine", "Disponibilité, engagement"),
 ("Rue résidentielle ensoleillée", "Agente et un habitant âgé", "Seniors, solidarité"),
]

TRI = '<div class="tri"><i></i><i></i><i></i></div>'
FOOT = '<div class="foot">E-DUST Solutions · Campagne recrutement Police municipale · personnages fictifs</div>'
head = open(f'{D}/head.html').read()
pages = []

pages.append(f'''<div class="pg">
 <img src="p01.jpg" style="position:absolute;right:12mm;top:16mm;height:172mm;border-radius:2mm;box-shadow:0 6mm 16mm rgba(0,0,0,.5);transform:rotate(3deg);z-index:3">
 <img src="p12.jpg" style="position:absolute;right:78mm;top:30mm;height:146mm;border-radius:2mm;box-shadow:0 6mm 16mm rgba(0,0,0,.5);transform:rotate(-4deg);z-index:2">
 <div style="position:absolute;left:16mm;top:24mm;width:96mm;z-index:4">
  <div class="kick">CAMPAGNE OFFERTE</div>
  <div class="big" style="font-size:46pt">RECRUTEMENT<br><b>POLICE<br>MUNICIPALE</b></div>
  <div class="red"></div>
  <p class="lede">20 affiches A4 prêtes à personnaliser pour donner envie de rejoindre la police municipale de votre commune.</p>
 </div>
 <div class="foot">E-DUST Solutions · Tarik Belattar · Visuels de démonstration — personnages fictifs générés par IA</div>
 {TRI}
</div>''')

pages.append(f'''<div class="pg light">
 <div style="position:absolute;left:16mm;top:18mm;width:120mm">
  <div class="kick" style="color:#1f6fd0">LE CONCEPT</div>
  <div class="big" style="font-size:40pt">20 VISAGES,<br><b>20 FAÇONS DE SERVIR.</b></div>
  <div class="red"></div>
  <p>Chaque affiche montre un agent ou une équipe en pied, dans une situation réelle du quotidien : la mairie, le marché, l'école, le front de mer, la patrouille du soir, la pluie…</p>
  <p>Des profils variés — femmes et hommes, jeunes recrues et agents expérimentés, toutes origines — pour que chaque candidat·e puisse s'y reconnaître.</p>
  <p>Une charte commune : bleu nuit, bleu ciel de la bande réfléchissante, liseré tricolore, titres condensés impactants.</p>
 </div>
 <div style="position:absolute;right:16mm;top:20mm;width:118mm">
  <dl class="meta" style="margin-top:0">
   <dt>OBJECTIF</dt><dd>Susciter des candidatures de gardien·ne·s-brigadier·e·s : lauréat·e·s du concours, mutations, détachements.</dd>
   <dt>CIBLES</dt><dd>20–45 ans, profils de terrain, sport, sécurité, armée, reconversion ; agents d'autres collectivités.</dd>
   <dt>TON</dt><dd>Sérieux, institutionnel, humain et valorisant.</dd>
   <dt>FORMAT</dt><dd>A4 portrait (déclinable A3, 40×60, réseaux sociaux 4:5 et 9:16).</dd>
   <dt>À PERSONNALISER</dt><dd>Nom de la commune à côté de l'écusson, QR code vers la page candidature, contact RH.</dd>
   <dt>CONDITIONS</dt><dd>Campagne offerte par E-DUST Solutions aux polices municipales.</dd>
  </dl>
 </div>
 {FOOT}<div class="num">2</div>
 {TRI}
</div>''')

def grid(idx, num, label):
    imgs = ''.join(f'<img class="p" src="p{i:02d}.jpg">' for i in idx)
    return f'''<div class="pg">
 <div style="position:absolute;left:16mm;top:12mm"><div class="kick">LA SÉRIE · {label}</div></div>
 <div style="position:absolute;left:0;right:0;top:26mm;height:74mm;display:flex;justify-content:center;gap:6mm">{imgs[:len(imgs)//2] if False else ''.join(f'<img class="p" src="p{i:02d}.jpg">' for i in idx[:5])}</div>
 <div style="position:absolute;left:0;right:0;top:108mm;height:74mm;display:flex;justify-content:center;gap:6mm">{''.join(f'<img class="p" src="p{i:02d}.jpg">' for i in idx[5:])}</div>
 <div class="num">{num}</div>
 {TRI}
</div>'''

pages.append(grid(list(range(1, 11)), 3, 'AFFICHES 1 À 10'))
pages.append(grid(list(range(11, 21)), 4, 'AFFICHES 11 À 20'))

n = 5
for i, (slug, l1, l2, tag, _) in enumerate(C, 1):
    sc, pers, use = META[i - 1]
    pages.append(f'''<div class="pg light">
 <img src="p{i:02d}.jpg" style="position:absolute;left:16mm;top:12mm;height:182mm;border-radius:2mm;box-shadow:0 4mm 12mm rgba(11,31,77,.3)">
 <div class="card" style="position:absolute;left:160mm;top:30mm;width:120mm">
  <span class="tag">AFFICHE {i}</span>
  <h3>{l1}<br>{l2}</h3>
  <p>{tag}</p>
  <dl class="meta"><dt>SCÈNE</dt><dd>{sc}</dd><dt>PERSONNAGE(S)</dt><dd>{pers}</dd><dt>USAGE</dt><dd>{use}</dd></dl>
 </div>
 {FOOT}<div class="num">{n}</div>
 {TRI}
</div>''')
    n += 1

pages.append(f'''<div class="pg">
 <div style="position:absolute;left:16mm;top:20mm;width:125mm">
  <div class="kick">UNE CAMPAGNE OFFERTE</div>
  <div class="big" style="font-size:40pt">À VOTRE<br><b>COMMUNE.</b></div>
  <div class="red"></div>
  <p>E-DUST Solutions offre cette campagne aux polices municipales qui recrutent. Nous l'adaptons à votre commune : nom, QR code et contacts, sur les affiches comme sur les réseaux sociaux.</p>
  <p>Les personnages sont fictifs et générés par IA. L'écusson Police municipale figure en en-tête de chaque visuel.</p>
 </div>
 <div style="position:absolute;right:16mm;top:28mm;width:118mm">
  <dl class="meta" style="margin-top:0">
   <dt>INCLUS</dt><dd>20 affiches A4 HD (PDF impression + PNG), 82 déclinaisons réseaux sociaux, personnalisation commune, QR code.</dd>
   <dt>DÉCLINAISONS</dt><dd>Posts 4:5 (2 versions), stories 9:16, visuels paysage LinkedIn/Facebook, bannière LinkedIn, couverture Facebook. Sur demande : A3 / 40×60, reel vidéo.</dd>
   <dt>CONTACT</dt><dd>E-DUST Solutions — Tarik Belattar<br>tarikbelatta@gmail.com · 06 13 24 96 80</dd>
  </dl>
 </div>
 <div class="foot">Visuels de démonstration · personnages fictifs générés par IA · aucun lien avec une collectivité existante</div>
 {TRI}
</div>''')

open(f'{D}/deck.html', 'w').write(head + '\n'.join(pages) + '\n</body></html>')

# planche récap : A3 paysage, 10 x 2
cells = ''.join(f'<div class="c"><img src="p{i:02d}.jpg"><span>{i:02d} · {C[i-1][1]} {C[i-1][2]}</span></div>' for i in range(1, 21)) + '<div class="c" style="display:flex;flex-direction:column;justify-content:center;padding:4mm;border:1px dashed #3fa9f5;border-radius:1mm"><b style="font-family:Anton;font-weight:400;font-size:20pt;color:#3fa9f5;line-height:1.05">VOTRE<br>COMMUNE<br>ICI.</b><span style="font-size:7.5pt">Nom de la commune, QR code et contact RH intégrés gratuitement.</span></div>'
open(f'{D}/recap.html', 'w').write(f'''<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@600;800&display=swap" rel="stylesheet">
<style>@page{{size:420mm 297mm;margin:0}}html,body{{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.pg{{width:420mm;height:297mm;background:#0b1f4d;color:#fff;font-family:Montserrat;position:relative;overflow:hidden}}
h1{{font-family:Anton;font-weight:400;font-size:34pt;margin:0;position:absolute;left:14mm;top:10mm}}h1 b{{color:#3fa9f5;font-weight:400}}
.sub{{position:absolute;right:14mm;top:16mm;font-weight:800;font-size:10pt;letter-spacing:3px;color:#3fa9f5}}
.g{{position:absolute;left:14mm;right:14mm;top:32mm;display:grid;grid-template-columns:repeat(7,52mm);gap:5mm 4mm;justify-content:center}}
.c img{{width:100%;display:block;border-radius:1mm;box-shadow:0 2mm 5mm rgba(0,0,0,.4)}}
.c span{{display:block;font-size:7pt;font-weight:600;margin-top:1.4mm;color:#d5e2ff;line-height:1.25}}
.f{{position:absolute;left:14mm;bottom:9mm;font-size:8pt;opacity:.75}}
.tri{{position:absolute;left:0;right:0;bottom:0;height:3mm;display:flex}}.tri i{{flex:1}}.tri i:nth-child(1){{background:#2b5cc8}}.tri i:nth-child(2){{background:#fff}}.tri i:nth-child(3){{background:#e1323c}}
</style></head><body><div class="pg"><h1>RECRUTEMENT POLICE MUNICIPALE · <b>20 AFFICHES</b></h1><div class="sub">CAMPAGNE OFFERTE · E-DUST SOLUTIONS</div>
<div class="g">{cells}</div><div class="f">Visuels de démonstration · personnages fictifs générés par IA · à personnaliser : nom de la commune, QR code, contact RH · tarikbelatta@gmail.com · 06 13 24 96 80</div>{TRI}</div></body></html>''')
print('ok')
