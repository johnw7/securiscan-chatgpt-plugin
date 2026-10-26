"""Page HTML du logo E-DUST v2 (out/ref, produit par build_ref.py) pour l'import dans Adobe Express :
5 pages 1080×1080, logos en SVG vectoriel posés à plat sur un fond de page modifiable. Usage : python3 express_ref.py → express_ref.html"""
import base64, os, re
D = os.path.dirname(os.path.abspath(__file__)); R = f'{D}/out/ref'
NOIR, CREME, OR = '#141210', '#F2EBE0', '#E2B98C'
def src(n, sans_fond=False):
    s = open(f'{R}/{n}.svg').read()
    if sans_fond: s = re.sub(r'<rect width="512" height="512"[^>]*/>', '', s, count=1)
    return 'data:image/svg+xml;base64,' + base64.b64encode(s.encode()).decode()
def dims(n):
    w, h = re.search(r'viewBox="0 0 (\d+) (\d+)"', open(f'{R}/{n}.svg').read()).groups(); return int(w), int(h)
def page(i, fond, n, largeur, sans_fond=False):
    w, h = dims(n); hh = largeur * h / w
    return (f'<section class="slide" id="logo_p{i}" data-canvas-width="1080" data-canvas-height="1080" style="position:relative;width:1080px;height:1080px;overflow:hidden;background:{fond}">'
            f'<img src="{src(n, sans_fond)}" alt="Logo E-DUST Solutions" style="position:absolute;left:{(1080 - largeur) / 2:.0f}px;top:{(1080 - hh) / 2:.0f}px;width:{largeur}px;height:{hh:.0f}px"></section>')
pages = [page(1, NOIR, 'horizontal_transparent_clair', 880), page(2, CREME, 'horizontal_transparent_fonce', 880),
         page(3, NOIR, 'icone_fond_noir', 1080, True), page(4, CREME, 'icone_fond_creme', 1080, True), page(5, OR, 'icone_fond_or', 1080, True)]
open(f'{D}/express_ref.html', 'w').write('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide">'
    '<title>E-DUST Solutions — logo</title><style>html,body{margin:0;background:#222}.slide{margin:0 auto 40px}</style></head><body>' + ''.join(pages) + '</body></html>')
print('ok', os.path.getsize(f'{D}/express_ref.html'), 'octets')
