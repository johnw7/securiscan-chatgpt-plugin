"""Déclinaisons réseaux sociaux : génère les pages HTML (rendu par decl.cjs)."""
import os, base64
D = os.path.dirname(os.path.abspath(__file__))
import sys; sys.path.insert(0, D)
from concepts import C

ECU = 'data:image/png;base64,' + base64.b64encode(open(f'{D}/ecusson_police_municipale.png', 'rb').read()).decode()
OUT = f'{D}/decl'
os.makedirs(OUT, exist_ok=True)
PH = lambda i: f'file://{D}/photos/photo_{i:02d}.jpg'

HEAD = '''<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}html,body{margin:0}
#f{position:relative;overflow:hidden;font-family:Montserrat;background:#0b1f4d}
#f img.ph{position:absolute;display:block}
.k{font-weight:800;color:#3fa9f5;letter-spacing:.3em}
.l1,.l2{font-family:Anton;line-height:1;white-space:nowrap;position:absolute}
.l1{color:#fff}.l2{color:#3fa9f5}
.pill{position:absolute;background:#e1323c;color:#fff;font-weight:800;border-radius:999px;display:flex;align-items:center;gap:.5em;letter-spacing:.08em}
.pill i{width:.45em;height:.45em;border-radius:50%;background:#fff;display:block}
.cta{position:absolute;background:#fff;color:#0b1f4d;font-weight:800;border-radius:999px;display:flex;align-items:center;justify-content:center;letter-spacing:.06em}
.tri{position:absolute;left:0;right:0;bottom:0;display:flex}.tri i{flex:1}.tri i:nth-child(1){background:#2b5cc8}.tri i:nth-child(2){background:#f4f4f4}.tri i:nth-child(3){background:#e1323c}
.disc{position:absolute;color:#fff;opacity:.7;font-weight:600}
.light .l1{color:#0b1f4d}.light .k{color:#1f6fd0}
</style></head><body>'''
FIT = '''<script>document.fonts.ready.then(()=>{document.querySelectorAll('[data-max]').forEach(t=>{let f=+t.dataset.max;t.style.fontSize=f+'px';while(t.scrollWidth>+t.dataset.w&&f>20){f-=2;t.style.fontSize=f+'px'}});document.body.dataset.ok=1})</script></body></html>'''

def ecu(x, y, h, extra=''):
    return f'<img src="{ECU}" style="position:absolute;left:{x}px;top:{y}px;height:{h}px;{extra}">'

def commune(x, y, s, dark=False):
    c1, c2 = ('#0b1f4d', '#1f6fd0') if dark else ('#fff', '#9fb7e8')
    return f'<div style="position:absolute;left:{x}px;top:{y}px;font-weight:800;font-size:{s}px;letter-spacing:.14em;color:{c1};line-height:1.35">VILLE DE<br><span style="font-weight:600;color:{c2}">VOTRE COMMUNE</span></div>'

def photo(i, k, left, top):
    # k = échelle page (1240 px de large) -> format ; la photo HD fait 1,5 x la page
    return f'<img class="ph" src="{PH(i)}" style="left:{left}px;top:{top}px;width:{1240*k:.1f}px">'

DISC = 'Visuel de démonstration · personnages fictifs · E-DUST Solutions'

def post(i, l1, l2, tag, light=False):
    W, H, k = 1080, 1350, 1080 / 1240
    g = ('linear-gradient(180deg,#ffffff 0%,rgba(255,255,255,.93) 26%,rgba(255,255,255,.55) 36%,rgba(255,255,255,0) 44%)' if light
         else 'linear-gradient(180deg,#071533 0%,rgba(11,31,77,.94) 26%,rgba(11,31,77,.5) 36%,rgba(11,31,77,0) 45%)')
    band = '#ffffff' if light else '#0b1f4d'
    ctaS = 'background:#0b1f4d;color:#fff' if light else ''
    return f'''<div id="f" class="{'light' if light else ''}" style="width:{W}px;height:{H}px">
{photo(i, k, 0, -150 * k)}
<div style="position:absolute;inset:0;background:{g}"></div>
{ecu(52, 40, 92)}{commune(140, 58, 19, light)}
<div class="pill" style="right:52px;top:56px;font-size:19px;padding:13px 24px"><i></i>ON RECRUTE !</div>
<div class="k" style="position:absolute;left:54px;top:162px;font-size:22px">LA POLICE MUNICIPALE</div>
<div class="l1" data-max="118" data-w="976" style="left:50px;top:198px">{l1}</div>
<div class="l2" data-max="78" data-w="976" style="left:52px;top:318px">{l2}</div>
<div style="position:absolute;left:0;right:0;bottom:0;height:96px;background:{band}"></div>
<div style="position:absolute;left:54px;bottom:42px;font-weight:700;font-size:19px;color:{'#0b1f4d' if light else '#fff'}">{tag}</div>
<div class="cta" style="right:52px;bottom:26px;height:50px;padding:0 26px;font-size:17px;{ctaS}">CANDIDATEZ EN MAIRIE →</div>
<div class="tri" style="height:9px"><i></i><i></i><i></i></div>
<div class="disc" style="left:54px;top:{H-128}px;font-size:12px">{DISC}</div>
</div>'''

def story(i, l1, l2, tag):
    W, H = 1080, 1920
    k = H / 1754
    return f'''<div id="f" style="width:{W}px;height:{H}px">
{photo(i, k, -(1240 * k - W) / 2, 0)}
<div style="position:absolute;inset:0;background:linear-gradient(180deg,#071533 0%,rgba(11,31,77,.94) 28%,rgba(11,31,77,.6) 36%,rgba(11,31,77,0) 44%,rgba(11,31,77,0) 82%,rgba(7,21,51,.85) 94%)"></div>
{ecu(70, 150, 120)}{commune(186, 176, 24)}
<div class="pill" style="right:70px;top:180px;font-size:23px;padding:16px 28px"><i></i>ON RECRUTE !</div>
<div class="k" style="position:absolute;left:72px;top:330px;font-size:27px">LA POLICE MUNICIPALE</div>
<div class="l1" data-max="150" data-w="940" style="left:66px;top:376px">{l1}</div>
<div class="l2" data-max="96" data-w="940" style="left:70px;top:530px">{l2}</div>
<div style="position:absolute;left:72px;top:648px;width:900px;font-weight:600;font-size:30px;color:#e3ecff;line-height:1.35">{tag}</div>
<div class="cta" style="left:50%;transform:translateX(-50%);top:1752px;height:78px;padding:0 44px;font-size:26px">CANDIDATEZ EN MAIRIE →</div>
<div class="disc" style="left:0;right:0;text-align:center;top:1846px;font-size:16px">{DISC}</div>
<div class="tri" style="height:12px"><i></i><i></i><i></i></div>
</div>'''

def land(i, l1, l2, tag):
    W, H, P = 1200, 630, 560
    k = H / 1040
    return f'''<div id="f" style="width:{W}px;height:{H}px">
<div style="position:absolute;left:{P - 60}px;top:0;width:{W - P + 60}px;height:{H}px;overflow:hidden">{photo(i, k, -(92 * k), -560 * k)}</div>
<div style="position:absolute;left:0;top:0;width:{P + 80}px;height:{H}px;background:linear-gradient(90deg,#0b1f4d 0%,#0b1f4d 82%,rgba(11,31,77,0) 100%)"></div>
{ecu(44, 36, 80)}{commune(122, 52, 16)}
<div class="k" style="position:absolute;left:46px;top:150px;font-size:17px">LA POLICE MUNICIPALE</div>
<div class="l1" data-max="84" data-w="500" style="left:42px;top:178px">{l1}</div>
<div class="l2" data-max="56" data-w="500" style="left:44px;top:268px">{l2}</div>
<div style="position:absolute;left:46px;top:345px;width:470px;font-weight:600;font-size:19px;color:#e3ecff;line-height:1.4">{tag}</div>
<div class="pill" style="left:46px;top:452px;font-size:16px;padding:11px 20px"><i></i>ON RECRUTE !</div>
<div class="cta" style="left:226px;top:448px;height:46px;padding:0 22px;font-size:15px">CANDIDATEZ EN MAIRIE →</div>
<div class="disc" style="left:46px;top:560px;font-size:11px">{DISC}</div>
<div class="tri" style="height:8px"><i></i><i></i><i></i></div>
</div>'''

def banner(W, H, ids):
    n = len(ids); cw = (W * 0.56) / n
    k = H / 1100
    cols = ''.join(f'<div style="position:absolute;left:{W * 0.44 + j * cw:.1f}px;top:0;width:{cw + 1:.1f}px;height:{H}px;overflow:hidden">'
                   f'{photo(i, k, -(620 * k - cw / 2), -540 * k)}</div>' for j, i in enumerate(ids))
    s = min(H / 396, 1.25)
    oy = (H - 396 * s) / 2
    return f'''<div id="f" style="width:{W}px;height:{H}px">{cols}
<div style="position:absolute;left:0;top:0;width:{W * 0.52:.0f}px;height:{H}px;background:linear-gradient(90deg,#0b1f4d 0%,#0b1f4d 82%,rgba(11,31,77,0) 100%)"></div>
{ecu(40 * s, 70 * s + oy, 110 * s)}
<div class="k" style="position:absolute;left:{150 * s:.0f}px;top:{82 * s + oy:.0f}px;font-size:{15 * s:.0f}px">LA POLICE MUNICIPALE</div>
<div class="l1" style="left:{148 * s:.0f}px;top:{106 * s + oy:.0f}px;font-size:{62 * s:.0f}px">ON RECRUTE !</div>
<div style="position:absolute;left:{150 * s:.0f}px;top:{186 * s + oy:.0f}px;font-weight:600;font-size:{17 * s:.0f}px;color:#e3ecff">Un métier utile, au cœur de votre commune.</div>
<div class="tri" style="height:{7 * s:.0f}px"><i></i><i></i><i></i></div></div>'''

jobs = []
def emit(name, w, h, body):
    open(f'{OUT}/{name}.html', 'w').write(HEAD + body + FIT)
    jobs.append(f'{name} {w} {h}')

for i, (slug, l1, l2, tag, _) in enumerate(C, 1):
    emit(f'post_{i:02d}', 1080, 1350, post(i, l1, l2, tag))
    emit(f'post-clair_{i:02d}', 1080, 1350, post(i, l1, l2, tag, light=True))
    emit(f'story_{i:02d}', 1080, 1920, story(i, l1, l2, tag))
    emit(f'paysage_{i:02d}', 1200, 630, land(i, l1, l2, tag))
emit('banniere_linkedin', 1584, 396, banner(1584, 396, [1, 12, 20, 6, 17]))
emit('couverture_facebook', 1640, 624, banner(1640, 624, [10, 3, 18, 2, 13]))
open(f'{OUT}/jobs.txt', 'w').write('\n'.join(jobs))
print(len(jobs))
