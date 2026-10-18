"""Extrait la canette BOOST RUSH du PDF source en calques PNG transparents HD, alignés entre eux."""
import os, re, subprocess
import pypdf
from pypdf.generic import NameObject
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__))
A = f'{D}/assets'
TMP = f'{D}/assets/_tmp'
os.makedirs(TMP, exist_ok=True)
ALL = ['X4', 'X7', 'X9', 'X11', 'X16', 'X17', 'X19']
# X4 fond noir · X7 canette nue · X9 tigre · X11 éclair · X16 « BOOST » · X17 « RUSH » · X19 « Fuel your limits »
LAYERS = {
    'canette_complete': ['X7', 'X9', 'X11', 'X16', 'X17', 'X19'],
    'canette_nue': ['X7'],
    'tigre': ['X9'],
    'eclair': ['X11'],
    'txt_boost': ['X16'],
    'txt_rush': ['X17'],
    'txt_fuel': ['X19'],
}
DPI = 400

def render(name, keep):
    r = pypdf.PdfReader(f'{A}/boost_rush_source.pdf')
    w = pypdf.PdfWriter()
    w.append(r, pages=[0])
    page = w.pages[0]
    x = page['/Resources']['/XObject']['/X20'].get_object()
    c = x.get_data().decode('latin1')
    for n in ALL:
        if n not in keep:
            c = c.replace(f'/{n} Do', '')
    x.set_data(c.encode('latin1'))
    # la page peint un fond blanc avant le dessin : on le retire pour garder la transparence
    pc = page.get_contents().get_data().decode('latin1').replace('0 0 1123 794 re\nf', '')
    from pypdf.generic import ContentStream
    cs = ContentStream(None, w)
    cs.set_data(pc.encode('latin1'))
    page.replace_contents(cs)
    pdf = f'{TMP}/{name}.pdf'
    w.write(pdf)
    subprocess.run(['pdftocairo', '-png', '-transp', '-singlefile', '-r', str(DPI), pdf, f'{TMP}/{name}'], check=True)
    return Image.open(f'{TMP}/{name}.png').convert('RGBA')

full = render('canette_complete', LAYERS['canette_complete'])
box = full.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
pad = 20
box = (box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad)
for name, keep in LAYERS.items():
    im = full if name == 'canette_complete' else render(name, keep)
    im.crop(box).save(f'{A}/{name}.png')
    print(name, im.crop(box).size)
for f in os.listdir(TMP):
    os.remove(f'{TMP}/{f}')
os.rmdir(TMP)
