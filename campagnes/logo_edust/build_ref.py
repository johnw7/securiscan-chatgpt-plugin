"""Logo E-DUST d'après la référence de Tarik (« edust » gras, « Solutions » décalé dessous, « communication digitale » à gauche),
remis dans la charte du site : noir chaud #141210, crème #F2EBE0, or #E2B98C, bois #C89B6D, police DM Sans.
Retouches : composition resserrée, « edust » se termine par un pixel carré d'où s'envolent trois particules
(la « dust »), le point du « i » de Solutions devient carré, accord « digitale ». Textes vectorisés (fontTools) : SVG utilisables tels quels dans Canva / Illustrator.
Usage : python3 build_ref.py → out/ref/*.svg ; rendu PNG : NODE_PATH=$(npm root -g) node rendu.cjs out/ref"""
import os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
D = os.path.dirname(os.path.abspath(__file__)); OUT = f'{D}/out/ref'; os.makedirs(OUT, exist_ok=True)
NOIR, CREME, OR, BOIS = '#141210', '#F2EBE0', '#E2B98C', '#C89B6D'
POLICES = {w: TTFont(f'{D}/fonts/DMSans-{w}.ttf') for w in (500, 600, 800)}

def glyphes(s, w):
    f = POLICES[w]; return f.getGlyphSet(), f.getBestCmap(), f['head'].unitsPerEm

def texte(s, w, taille, x, y, interlettre=0.0):
    """Chemin SVG (ligne de base y), largeur, et abscisse de départ de chaque lettre."""
    gs, cmap, upm = glyphes(s, w); k = taille / upm; d = []; cx = x; pos = []
    for ch in s:
        g = cmap[ord(ch)]; pos.append(cx)
        pen = SVGPathPen(gs); gs[g].draw(TransformPen(pen, (k, 0, 0, -k, cx, y))); d.append(pen.getCommands())
        cx += gs[g].width * k + interlettre * taille
    return ' '.join(d), cx - x - interlettre * taille, pos

def bornes(ch, w):
    gs, cmap, _ = glyphes(ch, w); p = BoundsPen(gs); gs[cmap[ord(ch)]].draw(p); return p.bounds

def poussiere(px, py, cote, pixel, part1, part2, n=3):
    """Pixel carré (coin bas-gauche en px, py = ligne de base) et particules qui s'envolent en haut à droite."""
    els = [f'<rect x="{px:.1f}" y="{py - cote:.1f}" width="{cote:.1f}" height="{cote:.1f}" rx="{cote * .12:.1f}" fill="{pixel}"/>']
    for i, (dx, dy, c, col) in enumerate([(1.0, -1.1, .66, part1), (1.8, -2.05, .46, part2), (2.4, -2.9, .3, part1)][:n]):
        t = cote * c; cx = px + cote / 2 + dx * cote; cy = py - cote / 2 + dy * cote
        els.append(f'<rect x="{cx - t / 2:.1f}" y="{cy - t / 2:.1f}" width="{t:.1f}" height="{t:.1f}" rx="{t * .14:.1f}" fill="{col}" transform="rotate({14 + i * 11} {cx:.1f} {cy:.1f})"/>')
    return ''.join(els), px + cote / 2 + 2.4 * cote + cote * .2, py - cote / 2 - 2.9 * cote - cote * .2

def logo(x0, y0, F, encre, accent, petit, pixel, part1, part2, op_petit=.62):
    """Composition complète ; renvoie (svg, xmin, xmax, ymin, ymax)."""
    d1, w1, pos = texte('edust', 800, F, x0, y0, -.035)
    # « edust▪ » : le point final est un pixel d'où s'envole la poussière
    bd8 = bornes('\u0131', 800); cote = (bd8[2] - bd8[0]) * F / 1000 * 1.05
    pous, xp, yp = poussiere(x0 + w1 + F * .035, y0, cote, pixel, part1, part2)
    S = F * .6; xs = pos[2] - F * .09; ys = y0 + F * .52
    # « Solutions » avec un i sans point : le point devient un petit carré
    d2, w2, pos2 = texte('Solut\u0131ons', 600, S, xs, ys, -.02)
    k = S / 1000; bi = bornes('i', 600); bd = bornes('\u0131', 600)
    c2 = (bd[2] - bd[0]) * k * 1.08; cx = pos2[5] + (bd[0] + bd[2]) / 2 * k; haut = ys - bi[3] * k
    els = [f'<path d="{d1}" fill="{encre}"/>', pous, f'<path d="{d2}" fill="{accent}"/>',
           f'<rect x="{cx - c2 / 2:.1f}" y="{haut:.1f}" width="{c2:.1f}" height="{c2:.1f}" rx="{c2 * .12:.1f}" fill="{accent}"/>']
    # « communication / digitale », aligné à droite contre « Solutions »
    P = F * .2; xd = xs - F * .07
    _, la, _ = texte('communication', 500, P, 0, 0, -.01); _, lb, _ = texte('digitale', 500, P, 0, 0, -.01)
    da, _, _ = texte('communication', 500, P, xd - la, y0 + F * .235, -.01)
    db, _, _ = texte('digitale', 500, P, xd - lb, y0 + F * .235 + P * 1.08, -.01)
    els.append(f'<path d="{da} {db}" fill="{petit}" fill-opacity="{op_petit}"/>')
    asc = bornes('d', 800)[3] / 1000 * F
    return ''.join(els), xd - la, max(xs + w2, xp), min(y0 - asc, yp), ys + .02 * F

def svg(w, h, corps, fond=None, rx=0):
    f = f'<rect width="{w}" height="{h}" rx="{rx}" fill="{fond}"/>' if fond else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{f}{corps}</svg>'

def carre(fond, *c):
    """Format carré 2000×2000 comme la référence (Canva, réseaux)."""
    _, xa, xb, ya, yb = logo(0, 0, 400, *c)
    corps, *_ = logo(1000 - (xa + xb) / 2, 1000 - (ya + yb) / 2, 400, *c)
    return svg(2000, 2000, corps, fond)

def horizontal(fond, *c, marge=70):
    _, xa, xb, ya, yb = logo(0, 0, 330, *c)
    corps, *_ = logo(marge - xa, marge - ya, 330, *c)
    return svg(int(xb - xa + 2 * marge), int(yb - ya + 2 * marge), corps, fond)

def icone(fond, encre, pixel, part1, part2, rx=112):
    """« e▪ » + poussière : avatar, favicon (groupe centré dans 512×512)."""
    F = 400; b = bornes('e', 800); k = F / 1000
    d, w, _ = texte('e', 800, F, 0, 0); cote = 48
    pous, xp, yp = poussiere(w + 12, 0, cote, pixel, part1, part2, n=2)
    xa, xb, ya, yb = b[0] * k, xp, min(-b[3] * k, yp), -b[1] * k
    dx, dy = 256 - (xa + xb) / 2, 256 - (ya + yb) / 2
    return svg(512, 512, f'<g transform="translate({dx:.1f} {dy:.1f})"><path d="{d}" fill="{encre}"/>{pous}</g>', fond, rx)

SOMBRE = (CREME, OR, CREME, CREME, OR, BOIS)   # encre, accent, petit texte, pixel, particules
CLAIR = (NOIR, BOIS, NOIR, NOIR, BOIS, OR)
VARIANTES = {
    'carre_fond_noir': carre(NOIR, *SOMBRE),
    'carre_fond_creme': carre(CREME, *CLAIR),
    'horizontal_fond_noir': horizontal(NOIR, *SOMBRE),
    'horizontal_fond_creme': horizontal(CREME, *CLAIR),
    'horizontal_transparent_clair': horizontal(None, *SOMBRE),
    'horizontal_transparent_fonce': horizontal(None, *CLAIR),
    'monochrome_blanc': horizontal(None, *(['#FFFFFF'] * 6)),
    'monochrome_noir': horizontal(None, *(['#000000'] * 6)),
    'icone_fond_noir': icone(NOIR, CREME, OR, OR, BOIS),
    'icone_fond_creme': icone(CREME, NOIR, BOIS, BOIS, OR),
    'icone_fond_or': icone(OR, NOIR, NOIR, NOIR, NOIR),
}
for n, s in VARIANTES.items():
    open(f'{OUT}/{n}.svg', 'w').write(s)
print('ok', len(VARIANTES), 'SVG')
