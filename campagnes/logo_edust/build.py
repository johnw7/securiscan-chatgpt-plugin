"""Logo E-DUST Solutions dans la charte (noir chaud #141210, crème #F2EBE0, or #E2B98C, bois #C89B6D).
Symbole : un « E » taillé en trois barres ; la barre du bas se dissout en particules carrées (la « poussière » d'E-DUST,
clin d'œil aux pixels de l'ancien logo) qui s'envolent en or et bois — une marque qui prend vie.
Logotype : « E-DUST » en DM Serif Display (le trait d'union devient un pixel or), « SOLUTIONS » en DM Sans 800 espacé.
Textes vectorisés (contours de glyphes via fontTools) : les SVG s'ouvrent tels quels dans Illustrator / Adobe Express.
Usage : python3 build.py → out/*.svg ; rendu PNG et planche : NODE_PATH=$(npm root -g) node rendu.cjs"""
import os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{D}/out', exist_ok=True)
NOIR, CREME, OR, BOIS = '#141210', '#F2EBE0', '#E2B98C', '#C89B6D'
POLICES = {k: TTFont(f'{D}/fonts/{f}') for k, f in [('serif', 'DMSerifDisplay.ttf'), ('sans', 'DMSans-800.ttf')]}

def texte(s, police, taille, x, y, interlettre=0.0):
    """Chemin SVG du texte (ligne de base en y), et largeur obtenue."""
    f = POLICES[police]; gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm; k = taille / upm
    d = []; cx = x
    for ch in s:
        g = cmap.get(ord(ch))
        if g is None: continue
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (k, 0, 0, -k, cx, y)))
        d.append(pen.getCommands())
        cx += gs[g].width * k + interlettre * taille
    return ' '.join(d), cx - x - interlettre * taille

def barre(x, y, w, h, col):
    """Barre à bout droit arrondi, départ net (raccord propre au fût)."""
    r = h / 2
    return f'<path d="M{x:.1f} {y:.1f}H{x + w - r:.1f}A{r:.1f} {r:.1f} 0 0 1 {x + w - r:.1f} {y + h:.1f}H{x:.1f}Z" fill="{col}"/>'

def symbole(x, y, t, encre=CREME, accent=OR, poussiere=BOIS):
    """« E » en trois barres (t = hauteur) ; la barre basse se défait en particules qui s'envolent."""
    e = t * .2; r = e / 2
    els = [f'<path d="M{x + r:.1f} {y:.1f}H{x + e:.1f}V{y + t:.1f}H{x + r:.1f}A{r:.1f} {r:.1f} 0 0 1 {x:.1f} {y + t - r:.1f}V{y + r:.1f}A{r:.1f} {r:.1f} 0 0 1 {x + r:.1f} {y:.1f}Z" fill="{encre}"/>',
           barre(x + e - .5, y, t * .78 - e, e, encre),
           barre(x + e - .5, y + t / 2 - e / 2, t * .56 - e, e, accent),
           barre(x + e - .5, y + t - e, t * .40 - e, e, encre)]
    px = x + t * .46
    for i, (dx, dy, c, col) in enumerate([(0, 0, .86, encre), (.15, -.02, .74, accent), (.28, -.08, .6, poussiere), (.39, -.17, .48, accent),
                                           (.48, -.28, .37, poussiere), (.55, -.40, .28, accent), (.60, -.52, .2, poussiere)]):
        sz = e * c; cy = y + t - e / 2 + dy * t
        els.append(f'<rect x="{px + dx * t:.1f}" y="{cy - sz / 2:.1f}" width="{sz:.1f}" height="{sz:.1f}" rx="{sz * .14:.1f}" fill="{col}" transform="rotate({i * 8} {px + dx * t + sz / 2:.1f} {cy:.1f})"/>')
    return ''.join(els)

def logotype(x, y, taille, encre=CREME, accent=OR, sous=None):
    """« E-DUST » (trait d'union = pixel or) + « SOLUTIONS » ; renvoie (svg, largeur)."""
    d1, w1 = texte('E', 'serif', taille, x, y)
    s = taille * .16; hx = x + w1 + taille * .06
    pix = f'<rect x="{hx:.1f}" y="{y - taille * .36:.1f}" width="{s:.1f}" height="{s:.1f}" rx="{s * .12:.1f}" fill="{accent}"/>'
    d2, w2 = texte('DUST', 'serif', taille, hx + s + taille * .06, y)
    largeur = hx + s + taille * .06 + w2 - x
    sous = sous or accent
    ts = taille * .2
    # SOLUTIONS justifié sur la largeur de E-DUST par l'interlettrage (sans déformer les lettres)
    _, w0 = texte('SOLUTIONS', 'sans', ts, x, 0, 0)
    il = (largeur - w0) / (8 * ts)
    d3, _ = texte('SOLUTIONS', 'sans', ts, x + taille * .02, y + taille * .42, il)
    sol = f'<path d="{d3}" fill="{sous}"/>'
    return f'<path d="{d1} {d2}" fill="{encre}"/>{pix}{sol}', largeur

def svg(w, h, corps, fond=None):
    f = f'<rect width="{w}" height="{h}" fill="{fond}"/>' if fond else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{f}{corps}</svg>'

def horizontal(fond, encre, accent, poussiere, sous):
    t = 160
    sym = symbole(80, 70, t, encre, accent, poussiere)
    lt, lw = logotype(80 + t * 1.32, 70 + t * .74, 150, encre, accent, sous)
    w = int(80 + t * 1.32 + lw + 80)
    return svg(w, 300, sym + lt, fond)
def vertical(fond, encre, accent, poussiere, sous):
    t = 220
    lt, lw = logotype(0, 0, 150, encre, accent, sous)
    W = int(max(lw, t * 1.3) + 160); x0 = (W - lw) / 2
    lt, _ = logotype(x0, 70 + t + 190, 150, encre, accent, sous)
    sym = symbole(W / 2 - t * .6, 70, t, encre, accent, poussiere)
    return svg(W, 70 + t + 190 + 120, sym + lt, fond)
def icone(fond, encre, accent, poussiere, rayon=True):
    t = 300
    f = f'<rect width="512" height="512" rx="{112 if rayon else 0}" fill="{fond}"/>'
    return svg(512, 512, f + symbole(512 / 2 - t * .55, 512 / 2 - t / 2, t, encre, accent, poussiere))

VARIANTES = {
    'logo_horizontal_fond_noir': horizontal(NOIR, CREME, OR, BOIS, OR),
    'logo_horizontal_fond_creme': horizontal(CREME, NOIR, BOIS, OR, BOIS),
    'logo_horizontal_transparent_clair': horizontal(None, CREME, OR, BOIS, OR),
    'logo_horizontal_transparent_fonce': horizontal(None, NOIR, BOIS, OR, BOIS),
    'logo_vertical_fond_noir': vertical(NOIR, CREME, OR, BOIS, OR),
    'logo_vertical_transparent_fonce': vertical(None, NOIR, CREME, NOIR, NOIR),
    'logo_monochrome_noir': horizontal(None, NOIR, NOIR, NOIR, NOIR),
    'logo_monochrome_blanc': horizontal(None, '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'),
    'icone_fond_noir': icone(NOIR, CREME, OR, BOIS),
    'icone_fond_creme': icone(CREME, NOIR, BOIS, OR),
}
for n, s in VARIANTES.items():
    open(f'{D}/out/{n}.svg', 'w').write(s)
print('ok', len(VARIANTES), 'SVG')
