import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from concepts import C
H = '''<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:transparent}#poster{width:1240px;height:1754px;position:relative;overflow:hidden}svg{display:block}</style>
</head><body><div id="poster">
<svg viewBox="0 0 1240 1754" width="1240" height="1754" xmlns="http://www.w3.org/2000/svg">
<defs>
 <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#071533"/><stop offset=".62" stop-color="#0b1f4d" stop-opacity=".96"/><stop offset=".82" stop-color="#0b1f4d" stop-opacity=".55"/><stop offset="1" stop-color="#0b1f4d" stop-opacity="0"/></linearGradient>
 <linearGradient id="bot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#071533" stop-opacity="0"/><stop offset="1" stop-color="#071533" stop-opacity=".45"/></linearGradient>
</defs>
<rect x="0" y="0" width="1240" height="660" fill="url(#top)"/>
<rect x="0" y="1440" width="1240" height="160" fill="url(#bot)"/>
<g font-family="Montserrat">
 <path d="M80 56 L136 56 L136 96 C136 118 120 131 108 137 C96 131 80 118 80 96Z" fill="none" stroke="#9fb7e8" stroke-width="2.5" stroke-dasharray="6 5"/>
 <text x="108" y="101" text-anchor="middle" font-size="10" font-weight="700" fill="#9fb7e8">BLASON</text>
 <text x="154" y="88" font-size="19" font-weight="800" fill="#fff" letter-spacing="3">VILLE DE</text>
 <text x="154" y="114" font-size="19" font-weight="600" fill="#9fb7e8" letter-spacing="3">VOTRE COMMUNE</text>
 <rect x="880" y="62" width="280" height="54" rx="27" fill="#e1323c"/>
 <circle cx="911" cy="89" r="7" fill="#fff"/>
 <text x="930" y="97" font-size="20" font-weight="800" fill="#fff" letter-spacing="2.5">ON RECRUTE !</text>
 <text x="80" y="170" font-size="26" font-weight="800" fill="#3fa9f5" letter-spacing="8">LA POLICE MUNICIPALE</text>
</g>
<text x="74" y="372" font-family="Anton" font-size="160" fill="#fff" class="fit" data-max="160">{L1}</text>
<text x="78" y="486" font-family="Anton" font-size="104" fill="#3fa9f5" class="fit" data-max="104">{L2}</text>
<rect x="80" y="508" width="110" height="7" fill="#e1323c"/>
<text x="80" y="556" font-family="Montserrat" font-weight="600" font-size="26" fill="#e3ecff">{TAG}</text>
<!-- bandeau bas compact -->
<path d="M0 1592 L1240 1566 L1240 1754 L0 1754Z" fill="#ffffff"/>
<path d="M0 1592 L1240 1566" stroke="#3fa9f5" stroke-width="7"/>
<g font-family="Montserrat">
 <text x="80" y="1632" font-size="14" font-weight="800" fill="#3fa9f5" letter-spacing="3">PROXIMITÉ · TERRAIN · SENS DU SERVICE</text>
 <text x="80" y="1662" font-size="19" font-weight="700" fill="#0b1f4d">Postes de gardien·ne-brigadier·e de police municipale</text>
 <text x="80" y="1688" font-size="16" font-weight="500" fill="#5a6a8c">Lauréat·e·s du concours · mutations · détachements</text>
 <rect x="740" y="1628" width="300" height="52" rx="26" fill="#0b1f4d"/>
 <text x="890" y="1660" text-anchor="middle" font-size="16" font-weight="800" fill="#fff" letter-spacing="1">CANDIDATEZ EN MAIRIE →</text>
 <rect x="1060" y="1592" width="110" height="110" rx="10" fill="#fff" stroke="#0b1f4d" stroke-width="3" stroke-dasharray="7 5"/>
 <g fill="#0b1f4d"><rect x="1072" y="1604" width="28" height="28"/><rect x="1130" y="1604" width="28" height="28"/><rect x="1072" y="1662" width="28" height="28"/><rect x="1108" y="1640" width="10" height="10"/><rect x="1130" y="1662" width="14" height="14"/></g>
 <g fill="#fff"><rect x="1078" y="1610" width="16" height="16"/><rect x="1136" y="1610" width="16" height="16"/><rect x="1078" y="1668" width="16" height="16"/></g>
 <g fill="#0b1f4d"><rect x="1082" y="1614" width="8" height="8"/><rect x="1140" y="1614" width="8" height="8"/><rect x="1082" y="1672" width="8" height="8"/></g>
</g>
<g><rect x="0" y="1742" width="413" height="12" fill="#2b5cc8"/><rect x="413" y="1742" width="414" height="12" fill="#f4f4f4"/><rect x="827" y="1742" width="413" height="12" fill="#e1323c"/></g>
<text transform="translate(28,1540) rotate(-90)" font-family="Montserrat" font-size="12" font-weight="600" fill="#ffffff" opacity=".75">Visuel de démonstration · personnages fictifs · Conception E-DUST Solutions</text>
</svg></div>
<script>document.fonts.ready.then(()=>{document.querySelectorAll('.fit').forEach(t=>{let f=+t.dataset.max;t.setAttribute('font-size',f);while(t.getBBox().width>1086&&f>40){f-=2;t.setAttribute('font-size',f)}});document.body.dataset.ok=1})</script>
</body></html>'''
d = os.path.dirname(os.path.abspath(__file__))
for i, (slug, l1, l2, tag, _) in enumerate(C, 1):
    open(f'{d}/ov{i:02d}.html', 'w').write(H.replace('{L1}', l1).replace('{L2}', l2).replace('{TAG}', tag))
print(len(C))
