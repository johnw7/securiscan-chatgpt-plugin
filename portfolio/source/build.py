"""Remplit les blocs %%…%% du portfolio et écrit portfolio.built.html."""
import re, sys
D = sys.argv[1]
src = open(f'{D}/portfolio.html', encoding='utf8').read()

def svg(name, extra=''):
    s = open(f'{D}/a/{name}', encoding='utf8').read()
    return s.replace('<svg ', f'<svg style="width:100%;height:auto;display:block;{extra}" ', 1)

toc = ['Le constat', 'Le parcours client en 4 étapes', 'Les 8 piliers de la communication', '01 · Identité visuelle', '02 · Site web',
       '03 · Commande & vente en ligne', '04 · Google & avis clients', '05 · Réseaux sociaux', '06 · Photo & vidéo', '07 · Supports imprimés',
       '08 · Fidélisation', 'Auto-diagnostic : 12 questions', 'Offres', 'Méthode de travail & contact']
toc_html = ''.join(f'<div style="display:flex; gap:22px; align-items:baseline; padding:14px 0; border-bottom:1px solid var(--line)"><span class="num">{i:02d}</span><span>{t}</span></div>' for i, t in enumerate(toc, 1))

funnel = [
    ('Être trouvé', 'Google, Plans, réseaux, bouche-à-oreille', ['Fiche Google', 'Site référencé', 'Réseaux sociaux', 'Enseigne']),
    ('Donner envie', 'Une image forte qui attire le regard', ['Logo & charte', 'Photos', 'Vidéos courtes', 'Vitrine']),
    ('Convaincre', 'Lever les doutes et faciliter l’achat', ['Avis clients', 'Site clair', 'Commande en ligne', 'Offres']),
    ('Faire revenir', 'Transformer un client en habitué', ['Carte fidélité', 'E-mail / SMS', 'Réseaux', 'Parrainage']),
]
funnel_html = ''
for i, (t, d, tools) in enumerate(funnel):
    shade = ['#ffe6df', '#ffc9bb', '#ff9a80', '#ff5a36'][i]
    color = '#121417' if i < 3 else '#fff'
    funnel_html += f'''<div style="background:{shade}; color:{color}; padding:34px 30px; min-height:470px; {'border-radius:26px 0 0 26px;' if i == 0 else ''}{'border-radius:0 26px 26px 0;' if i == 3 else ''} position:relative">
      <p style="font-size:64px; font-weight:900; letter-spacing:-.05em; opacity:.35">{i + 1}</p>
      <h3 style="font-size:36px; margin-top:6px">{t}</h3>
      <p style="margin-top:12px; font-size:19px; line-height:1.4; opacity:.85">{d}</p>
      <div style="display:flex; flex-direction:column; gap:10px; margin-top:28px">{''.join(f'<span style="background:rgba(255,255,255,.65); color:#121417; border-radius:12px; padding:10px 14px; font-size:17px; font-weight:700">{x}</span>' for x in tools)}</div>
    </div>'''

pillars = [
    ('01', 'Identité visuelle', 'Logo, couleurs, typographies, charte.'),
    ('02', 'Site web', 'Vitrine ou boutique, rapide et mobile.'),
    ('03', 'Vente en ligne', 'Commande, click & collect, livraison.'),
    ('04', 'Google & avis', 'Fiche optimisée, avis, visibilité locale.'),
    ('05', 'Réseaux sociaux', 'Ligne éditoriale, posts, stories, vidéos.'),
    ('06', 'Photo & vidéo', 'Des images qui donnent envie.'),
    ('07', 'Print', 'Flyers, menus, cartes, vitrine, packaging.'),
    ('08', 'Fidélisation', 'Carte, e-mail, SMS, parrainage.'),
]
pillars_html = ''.join(f'''<div class="card" style="padding:30px; min-height:310px; display:flex; flex-direction:column">
  <span class="num" style="font-size:56px; letter-spacing:-.04em">{n}</span>
  <h3 style="margin-top:auto">{t}</h3><p style="margin-top:10px; font-size:20px; line-height:1.45; color:#5d5a55">{d}</p></div>''' for n, t, d in pillars)

week = [('Lun', 'Photo produit', '#ffe6df'), ('Mar', 'Story coulisses', '#ebe3d5'), ('Mer', 'Carrousel conseil', '#ffe6df'), ('Jeu', 'Avis client', '#ebe3d5'), ('Ven', 'Offre du week-end', '#ff5a36')]
week_html = ''.join(f'<div style="background:{c}; border-radius:14px; padding:14px; min-height:110px; {"color:#fff;" if c == "#ff5a36" else ""}"><b style="font-size:18px">{d}</b><p style="margin-top:8px; line-height:1.3">{t}</p></div>' for d, t, c in week)

quiz = ['Mon commerce a un logo professionnel, utilisé partout', 'Ma fiche Google est complète, avec photos récentes', 'J’ai plus de 20 avis Google et j’y réponds',
        'J’ai un site qui s’affiche bien sur téléphone', 'Mes clients peuvent commander ou réserver en ligne', 'Je publie au moins une fois par semaine',
        'Mes photos donnent vraiment envie', 'Mes horaires sont à jour partout', 'J’ai des flyers ou cartes à donner en boutique',
        'J’ai un programme de fidélité', 'Je peux recontacter mes clients (e-mail, SMS)', 'Je sais d’où viennent mes nouveaux clients']
quiz_html = ''.join(f'<div style="display:flex; gap:16px; align-items:center; padding:12px 0; border-bottom:1px solid #2c3036"><span style="width:30px; height:30px; flex:none; border:2.5px solid #ff8a6e; border-radius:8px"></span><span>{q}</span></div>' for q in quiz)

packs = [
    ('Démarrage', 'Être visible et professionnel', '900 – 1 500 €', False,
     ['Logo + mini-charte', 'Fiche Google optimisée', 'Site vitrine 1 page', '10 modèles de posts réseaux', 'Cartes de visite']),
    ('Croissance', 'Attirer et vendre plus', '2 500 – 4 500 €', True,
     ['Tout le pack Démarrage', 'Site 5 pages ou commande / boutique en ligne', 'Pack photos & visuels', '1 mois de réseaux (12 publications)', 'Flyers + carte de fidélité']),
    ('Premium', 'Un service com’ à vos côtés', 'dès 5 000 € + suivi mensuel', False,
     ['Tout le pack Croissance', 'Vente en ligne complète (paiement, comptes)', 'Gestion des réseaux au mois', 'Campagnes e-mail / SMS', 'Publicité locale + rapport mensuel']),
]
packs_html = ''
for name, sub, price, star, items in packs:
    bg = 'background:#121417; color:#f4efe6; border-color:#121417;' if star else ''
    packs_html += f'''<div class="card" style="padding:36px; {bg} position:relative; display:flex; flex-direction:column; min-height:520px">
      {'<span style="position:absolute; top:-16px; right:28px; background:#ff5a36; color:#fff; border-radius:999px; padding:8px 16px; font-size:15px; font-weight:800">Le plus choisi</span>' if star else ''}
      <h3 style="font-size:38px">{name}</h3><p style="margin-top:8px; font-size:19px; opacity:.75">{sub}</p>
      <p style="margin-top:22px; font-size:34px; font-weight:900; letter-spacing:-.03em; color:#ff5a36">{price}</p>
      <ul class="check" style="margin-top:24px; font-size:19px">{''.join(f'<li>{i}</li>' for i in items)}</ul></div>'''

steps = [('1', 'Audit offert', '30 min pour faire le point sur votre communication actuelle.', 'Jour 1'),
         ('2', 'Proposition', 'Plan d’action et devis clair, priorisé selon votre budget.', 'Sous 48 h'),
         ('3', 'Création', 'Logo, site, visuels… avec vos retours à chaque étape.', '2 à 6 semaines'),
         ('4', 'Lancement & suivi', 'Mise en ligne, formation, puis suivi des résultats.', 'En continu')]
steps_html = ''.join(f'''<div class="card" style="padding:30px; min-height:290px; display:flex; flex-direction:column">
  <div class="pill-num">{n}</div><h3 style="margin-top:22px">{t}</h3><p style="margin-top:10px; font-size:19px; line-height:1.45; color:#3b3935">{d}</p>
  <span class="tag" style="margin-top:auto; align-self:flex-start">{w}</span></div>''' for n, t, d, w in steps)

gbtns = ''.join(f'<span style="flex:1; text-align:center; border:1px solid #dadce0; border-radius:999px; padding:9px 0; font-size:15px; font-weight:600; color:#1a73e8">{b}</span>' for b in ['Itinéraire', 'Appeler', 'Site Web', 'Commander'])
stamps = ''.join(f'<span style="aspect-ratio:1; border-radius:50%; border:2px dashed #17110e; display:grid; place-items:center; {"background:#ffc22b;" if i < 6 else ""} font-size:20px">{"🍔" if i < 6 else ""}</span>' for i in range(10))

rep = {
    '%%TOC%%': toc_html, '%%FUNNEL%%': funnel_html, '%%PILLARS%%': pillars_html, '%%WEEK%%': week_html, '%%QUIZ%%': quiz_html,
    '%%PACKS%%': packs_html, '%%STEPS%%': steps_html, '%%GBTNS%%': gbtns, '%%STAMPS%%': stamps,
    '%%BADGE%%': svg('smashhouse-logo-badge.svg'), '%%HORIZ_DARK%%': svg('smashhouse-logo-horizontal-fond-sombre.svg'),
    '%%HORIZ_DARK_SMALL%%': svg('smashhouse-logo-horizontal-fond-sombre.svg'), '%%ICON%%': svg('smashhouse-icone.svg'),
    '%%MONO%%': svg('smashhouse-logo-monochrome.svg'), '%%PASTILLE%%': svg('smashhouse-pastille.svg'),
}
for k, v in rep.items():
    src = src.replace(k, v)
left = re.findall(r'%%[A-Z_]+%%', src)
assert not left, left
open(f'{D}/portfolio.built.html', 'w', encoding='utf8').write(src)
print('ok')
