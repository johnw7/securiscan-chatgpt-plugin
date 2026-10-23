"""Portfolio « Création de marque » E-DUST : carrousel 4:5 (1080×1350) de 18 slides, 5 marques fictives.
Sorties : portfolio.html (images liées, pour l'aperçu et l'export PNG) et portfolio_express.html (images intégrées, pour Adobe Express).
Polices : kit Adobe Fonts ark1qxx (Anton, Montserrat, Cormorant Garamond, DM Serif Display, Unbounded, DM Sans)."""
import os, base64
D = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1350
KIT = '<link rel="stylesheet" href="https://use.typekit.net/ark1qxx.css">'
SANS = "'dm-sans',sans-serif"

def img(name, embed):
    p = f'{D}/img/{name}'
    if not embed: return f'img/{name}'
    mt = 'image/png' if name.endswith('.png') else 'image/jpeg'
    return f'data:{mt};base64,' + base64.b64encode(open(p, 'rb').read()).decode()

def box(x, y, w, h, style='', inner=''):
    return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{style}">{inner}</div>'

def txt(x, y, w, s, size, fam=SANS, col='#fff', weight=400, ls=0, lh=1.1, align='left', style='', h=None):
    hh = f'height:{h}px;' if h else ''
    return (f'<p style="position:absolute;left:{x}px;top:{y}px;width:{w}px;{hh}margin:0;font-family:{fam};font-size:{size}px;'
            f'font-weight:{weight};color:{col};letter-spacing:{ls}em;line-height:{lh};text-align:{align};{style}">{s}</p>')

def picture(src, x, y, w, h, radius=0, style=''):
    return f'<img src="{src}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;object-fit:cover;border-radius:{radius}px;{style}">'

def slide(bg, inner, n, total, foot_col='rgba(255,255,255,.55)', label='E-DUST — Brand identity'):
    foot = txt(80, 1272, 600, label, 20, col=foot_col, ls=.12, weight=500) + txt(700, 1272, 300, f'{n:02d} / {total:02d}', 20, col=foot_col, ls=.12, weight=500, align='right')
    return f'<section class="slide" data-canvas-width="{W}" data-canvas-height="{H}" style="position:relative;width:{W}px;height:{H}px;overflow:hidden;background:{bg};">{inner}{foot}</section>'

def phone(x, y, w, src):
    h = int(w * 2.02); b = int(w * .045)
    return (box(x, y, w, h, f'background:#111;border-radius:{int(w*.15)}px;box-shadow:0 40px 80px rgba(0,0,0,.45);')
            + picture(src, x + b, y + b, w - 2 * b, h - 2 * b, int(w * .12))
            + box(x + w * .36, y + b + 12, w * .28, w * .07, f'background:#000;border-radius:{int(w*.04)}px;'))

def post(x, y, w, src, handle, avatar_bg, dark=False):
    hh = 64; ih = int(w * 1.25); fg = '#111' if not dark else '#fff'; bg = '#fff' if not dark else '#151515'
    return (box(x, y, w, hh + ih + 56, f'background:{bg};border-radius:18px;box-shadow:0 30px 70px rgba(0,0,0,.35);')
            + box(x + 18, y + 14, 36, 36, f'background:{avatar_bg};border-radius:18px;')
            + txt(x + 66, y + 20, w - 90, handle, 20, col=fg, weight=700)
            + picture(src, x, y + hh, w, ih)
            + txt(x + 18, y + hh + ih + 14, w - 36, '♡&nbsp;&nbsp;💬&nbsp;&nbsp;↗', 24, col=fg))

# ---------------------------------------------------------------- marques
V_SVG = lambda s, c='#fff', a='#c8ff2a', x=0, y=0: (f'<svg width="{s}" height="{s}" viewBox="0 0 100 100" style="position:absolute;left:{x}px;top:{y}px">'
    f'<polyline points="8,22 50,86 92,22" fill="none" stroke="{c}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>'
    f'<line x1="64" y1="22" x2="98" y2="22" stroke="{a}" stroke-width="9" stroke-linecap="round"/></svg>')
def vyrox_logo(x, y, size, col='#fff'):
    return V_SVG(size, col, '#c8ff2a', x, y) + txt(x + size * 1.18, y + size * .02, size * 5, 'VYROX', size * .95, "'montserrat',sans-serif", col, 800, .04, 1, style='font-style:italic;')
def noir_mono(x, y, s, col='#d8b47a'):
    return (box(x, y, s, s, f'border:2px solid {col};border-radius:{s//2}px;')
            + txt(x, y + s * .2, s, 'N<span style="font-style:italic">a</span>', s * .48, "'cormorant-garamond',serif", col, 500, .02, 1, 'center'))
def velo_mark(x, y, s, col='#111', acc='#ff5a1f'):
    return (f'<svg width="{s}" height="{s}" viewBox="0 0 100 100" style="position:absolute;left:{x}px;top:{y}px"><polygon points="18,14 42,14 58,62 82,14 100,14 64,90 40,90" fill="{col}"/><rect x="0" y="34" width="26" height="8" fill="{acc}"/><rect x="6" y="50" width="20" height="8" fill="{acc}"/><rect x="12" y="66" width="14" height="8" fill="{acc}"/></svg>')
def oliva_mark(x, y, s, col='#5e6b3a', acc='#c8643b'):
    return (f'<svg width="{s}" height="{s}" viewBox="0 0 100 100" style="position:absolute;left:{x}px;top:{y}px"><circle cx="50" cy="50" r="44" fill="none" stroke="{col}" stroke-width="5"/><path d="M50 78 C50 58 50 40 62 24" fill="none" stroke="{col}" stroke-width="4" stroke-linecap="round"/><ellipse cx="38" cy="46" rx="11" ry="6" transform="rotate(-35 38 46)" fill="{col}"/><ellipse cx="64" cy="40" rx="11" ry="6" transform="rotate(35 64 40)" fill="{col}"/><ellipse cx="42" cy="62" rx="10" ry="5.5" transform="rotate(-30 42 62)" fill="{col}"/><circle cx="62" cy="24" r="6" fill="{acc}"/></svg>')
def orbit_mark(x, y, s, a='#6c4bff', b='#2bd4ff'):
    return (f'<svg width="{s}" height="{s}" viewBox="0 0 100 100" style="position:absolute;left:{x}px;top:{y}px"><defs><linearGradient id="og{x}{y}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient></defs><circle cx="50" cy="50" r="30" fill="url(#og{x}{y})"/><ellipse cx="50" cy="50" rx="46" ry="16" fill="none" stroke="#fff" stroke-width="4" transform="rotate(-25 50 50)"/><circle cx="88" cy="34" r="7" fill="#fff"/></svg>')

def swatches(x, y, cols, fg):
    out = ''; w = 180
    for i, (hexc, name) in enumerate(cols):
        out += box(x + i * (w + 20), y, w, 180, f'background:{hexc};border-radius:20px;border:1px solid rgba(128,128,128,.25);')
        out += txt(x + i * (w + 20), y + 196, w, name, 22, col=fg, weight=700) + txt(x + i * (w + 20), y + 226, w, hexc.upper(), 20, col=fg, style='opacity:.65;')
    return out

def build(embed):
    I = lambda n: img(n, embed); S = []; TOT = 18
    # 1 · couverture
    tiles = [('#0a0c0b', vyrox_logo(70, 92, 56)), ('#0b0907', txt(0, 96, 430, 'NOIR ABSOLU', 46, "'cormorant-garamond',serif", '#efe2c8', 500, .18, 1, 'center')),
             ('#ff5a1f', txt(0, 78, 430, 'VELOCITY', 84, "'anton',sans-serif", '#111', 400, .02, 1, 'center')), ('#f4ecdd', oliva_mark(60, 70, 100) + txt(176, 92, 250, 'Maison<br>Oliva', 40, "'dm-serif-display',serif", '#2b1d14', 400, 0, .95)),
             ('#0d0b1f', orbit_mark(70, 70, 100) + txt(190, 98, 230, 'orbit', 56, "'unbounded',sans-serif", '#fff', 700, -.02, 1))]
    inner = txt(80, 110, 920, 'PORTFOLIO 2026 · CRÉATION DE MARQUE', 24, col='#c8ff2a', ls=.2, weight=700)
    inner += txt(80, 160, 920, 'Des marques<br>qu\'on reconnaît<br>en 1 seconde.', 104, "'dm-serif-display',serif", '#fff', 400, -.01, 1.0)
    for i, (bg, t) in enumerate(tiles):
        cx, cy = 80 + (i % 2) * 470, 520 + (i // 2) * 210
        if i == 4: cx = 80
        inner += box(cx, cy, 450 if i < 4 else 920, 190, f'background:{bg};border-radius:28px;border:1px solid rgba(255,255,255,.12);overflow:hidden;', t if i < 4 else t.replace('left:70px', 'left:290px').replace('left:190px', 'left:410px'))
    inner += txt(80, 1170, 600, '5 identités · logos, couleurs, typographies, déclinaisons réseaux sociaux', 24, col='rgba(255,255,255,.75)')
    inner += txt(700, 1176, 300, 'GLISSE →', 26, col='#c8ff2a', weight=700, ls=.2, align='right')
    S.append(slide('#0e0f12', inner, 1, TOT, label='Tarik Belattar — E-DUST Solutions'))
    # 2 · méthode
    steps = [('01', 'Stratégie', 'Cible, positionnement, ton. On définit ce qui rend ta marque unique.'), ('02', 'Identité', 'Logo, palette, typographies, motifs : un système cohérent et reconnaissable.'),
             ('03', 'Déclinaisons', 'Posts, stories, bannières, packaging : la marque vit partout pareil.'), ('04', 'Contenus', 'Reels et pubs vidéo storytellées pour faire grandir ta communauté.')]
    inner = txt(80, 110, 920, 'MA MÉTHODE', 24, col='#c8ff2a', ls=.2, weight=700) + txt(80, 160, 920, 'Une marque forte,<br>c\'est un système.', 92, "'dm-serif-display',serif", '#fff', 400, -.01, 1.02)
    for i, (n, t, d) in enumerate(steps):
        y = 450 + i * 190
        inner += box(80, y, 920, 1, 'background:rgba(255,255,255,.18);') + txt(80, y + 34, 140, n, 64, "'unbounded',sans-serif", '#c8ff2a', 700) + txt(240, y + 34, 760, t, 46, "'dm-serif-display',serif", '#fff') + txt(240, y + 98, 740, d, 26, col='rgba(255,255,255,.72)', lh=1.35)
    S.append(slide('#0e0f12', inner, 2, TOT, label='Tarik Belattar — E-DUST Solutions'))
    # ---------- VYROX
    G = '#c8ff2a'
    inner = picture(I('vyrox_run.jpg'), 0, 0, W, H) + box(0, 0, W, H, 'background:linear-gradient(180deg,rgba(10,12,11,.2) 0%,rgba(10,12,11,.55) 45%,rgba(10,12,11,.97) 78%);')
    inner += txt(80, 110, 600, 'IDENTITÉ 01 · SPORT &amp; TECH', 24, col=G, ls=.2, weight=700) + vyrox_logo(80, 760, 120)
    inner += box(80, 930, 360, 12, f'background:{G};transform:skewX(-20deg);') + txt(80, 980, 920, 'Ressens le rythme.<br>Repousse tes limites.', 58, "'montserrat',sans-serif", '#fff', 800, 0, 1.08, style='font-style:italic;')
    inner += txt(80, 1150, 920, 'Écouteurs de sport · énergie · dépassement de soi', 26, col='rgba(255,255,255,.75)')
    S.append(slide('#0a0c0b', inner, 3, TOT))
    inner = txt(80, 110, 920, 'VYROX · SYSTÈME DE MARQUE', 24, col=G, ls=.2, weight=700)
    inner += box(80, 170, 600, 330, 'background:#16191a;border-radius:28px;', vyrox_logo(70, 125, 80)) + box(700, 170, 300, 330, f'background:{G};border-radius:28px;', V_SVG(130, '#0a0c0b', '#0a0c0b', 85, 100))
    inner += txt(80, 520, 600, 'Logo principal', 22, col='rgba(255,255,255,.6)') + txt(700, 520, 300, 'Monogramme', 22, col='rgba(255,255,255,.6)')
    inner += swatches(80, 600, [('#0a0c0b', 'Carbone'), (G, 'Volt'), ('#ffffff', 'Blanc'), ('#8a9188', 'Acier')], '#fff')
    inner += box(80, 900, 920, 300, 'background:#16191a;border-radius:28px;', txt(50, 40, 300, 'Aa', 150, "'montserrat',sans-serif", '#fff', 800, 0, 1, style='font-style:italic;') + txt(380, 60, 500, 'Montserrat ExtraBold Italic', 32, col='#fff', weight=700) + txt(380, 110, 500, 'Titres · slogans · chiffres', 24, col='rgba(255,255,255,.6)') + txt(380, 170, 500, 'DM Sans', 32, col='#fff', weight=700) + txt(380, 220, 500, 'Textes · infos produit', 24, col='rgba(255,255,255,.6)'))
    S.append(slide('#0a0c0b', inner, 4, TOT))
    inner = txt(80, 110, 920, 'VYROX · DÉCLINAISONS', 24, col=G, ls=.2, weight=700) + txt(80, 160, 920, 'Une campagne,<br>tous les formats.', 72, "'montserrat',sans-serif", '#fff', 800, 0, 1.05, style='font-style:italic;')
    inner += phone(80, 400, 380, I('vyrox_story_9x16.jpg')) + post(500, 420, 500, I('vyrox_post_4x5.jpg'), 'vyrox.official', G, True)
    inner += picture(I('vyrox_bud.png'), 620, 1010, 300, 280, 0, 'object-fit:contain;')
    S.append(slide('#0a0c0b', inner, 5, TOT))
    # ---------- NOIR ABSOLU
    Gd, Ch, Ink = '#d8b47a', '#efe2c8', '#0b0907'; CG = "'cormorant-garamond',serif"
    inner = picture(I('noir_photo.jpg'), 0, 0, W, H) + box(0, 0, W, H, f'background:linear-gradient(180deg,rgba(11,9,7,.1) 30%,rgba(11,9,7,.92) 82%);')
    inner += box(40, 40, W - 80, H - 80, f'border:1.5px solid rgba(216,180,122,.6);') + txt(80, 110, 920, 'IDENTITÉ 02 · PARFUMERIE DE LUXE', 24, col=Gd, ls=.2, weight=700)
    inner += txt(80, 960, 920, 'NOIR ABSOLU', 104, CG, Ch, 500, .16, 1, 'center') + box(340, 1090, 400, 2, f'background:{Gd};') + txt(80, 1120, 920, 'Laissez votre empreinte.', 50, CG, '#fff', 500, 0, 1, 'center', 'font-style:italic;')
    S.append(slide(Ink, inner, 6, TOT, foot_col='rgba(239,226,200,.6)'))
    inner = txt(80, 110, 920, 'NOIR ABSOLU · SYSTÈME DE MARQUE', 24, col=Gd, ls=.2, weight=700)
    inner += box(80, 170, 600, 330, 'background:#17130f;border-radius:6px;border:1px solid rgba(216,180,122,.35);', txt(0, 130, 600, 'NOIR ABSOLU', 54, CG, Ch, 500, .16, 1, 'center') + txt(0, 205, 600, 'EAU DE PARFUM · PARIS', 18, col=Gd, ls=.4, align='center'))
    inner += box(700, 170, 300, 330, f'background:{Ch};border-radius:6px;', noir_mono(85, 100, 130, Ink))
    inner += txt(80, 520, 600, 'Logotype', 22, col='rgba(239,226,200,.6)') + txt(700, 520, 300, 'Monogramme', 22, col='rgba(239,226,200,.6)')
    inner += swatches(80, 600, [(Ink, 'Encre'), (Gd, 'Or'), (Ch, 'Champagne'), ('#6b4a2b', 'Ambre')], Ch)
    inner += box(80, 900, 920, 300, 'background:#17130f;border-radius:6px;', txt(50, 40, 300, 'Aa', 170, CG, Ch, 500, 0, 1, style='font-style:italic;') + txt(380, 60, 500, 'Cormorant Garamond', 34, CG, Ch, 500) + txt(380, 110, 500, 'Logotype · titres · citations', 24, col='rgba(239,226,200,.6)') + txt(380, 170, 500, 'DM Sans', 32, col=Ch, weight=700) + txt(380, 220, 500, 'Mentions · informations', 24, col='rgba(239,226,200,.6)'))
    S.append(slide(Ink, inner, 7, TOT, foot_col='rgba(239,226,200,.6)'))
    inner = txt(80, 110, 920, 'NOIR ABSOLU · DÉCLINAISONS', 24, col=Gd, ls=.2, weight=700) + txt(80, 160, 920, 'L\'élégance, jusque<br>dans le fil d\'actu.', 76, CG, Ch, 500, 0, 1.05, style='font-style:italic;')
    inner += post(80, 420, 500, I('noir_post_4x5.jpg'), 'noirabsolu.paris', Gd, True) + phone(620, 400, 380, I('noir_story_9x16.jpg'))
    S.append(slide(Ink, inner, 8, TOT, foot_col='rgba(239,226,200,.6)'))
    # ---------- VELOCITY
    Or, Off = '#ff5a1f', '#f2eee6'; AN = "'anton',sans-serif"
    inner = txt(-40, 140, 1300, 'VELOCITY VELOCITY', 250, AN, 'rgba(255,255,255,.2)', 400, .01, .95, style='white-space:nowrap;')
    inner += txt(-200, 400, 1500, 'VELOCITY VELOCITY', 250, AN, 'rgba(255,255,255,.2)', 400, .01, .95, style='white-space:nowrap;')
    inner += txt(80, 110, 920, 'IDENTITÉ 03 · SNEAKERS STREET', 24, col='#111', ls=.2, weight=700) + picture(I('velo_shoe.png'), 140, 220, 800, 790, 0, 'object-fit:contain;transform:rotate(-12deg);')
    inner += txt(80, 930, 920, 'LÂCHE<br>TOUT.', 150, AN, '#fff', 400, 0, .9, style='text-shadow:0 8px 0 #111;')
    S.append(slide(Or, inner, 9, TOT, foot_col='rgba(17,17,17,.7)'))
    inner = txt(80, 110, 920, 'VELOCITY · SYSTÈME DE MARQUE', 24, col=Or, ls=.2, weight=700)
    inner += box(80, 170, 600, 330, 'background:#111;border-radius:0;', velo_mark(60, 115, 100, '#fff', Or) + txt(180, 112, 400, 'VELOCITY', 96, AN, '#fff', 400, .02, 1)) + box(700, 170, 300, 330, f'background:{Or};', velo_mark(85, 100, 130, '#111', '#fff'))
    inner += txt(80, 520, 600, 'Logo principal', 22, col='rgba(17,17,17,.6)') + txt(700, 520, 300, 'Symbole', 22, col='rgba(17,17,17,.6)')
    inner += swatches(80, 600, [(Or, 'Blaze'), ('#111111', 'Asphalte'), (Off, 'Craie'), ('#9a9a9a', 'Béton')], '#111')
    inner += box(80, 900, 920, 300, 'background:#111;', txt(50, 30, 300, 'Aa', 190, AN, Or, 400, 0, 1) + txt(380, 60, 500, 'Anton', 34, col='#fff', weight=700) + txt(380, 110, 500, 'Titres XXL · slogans · stickers', 24, col='rgba(255,255,255,.6)') + txt(380, 170, 500, 'DM Sans', 32, col='#fff', weight=700) + txt(380, 220, 500, 'Textes · prix · infos', 24, col='rgba(255,255,255,.6)'))
    S.append(slide(Off, inner, 10, TOT, foot_col='rgba(17,17,17,.6)'))
    inner = txt(80, 110, 920, 'VELOCITY · DÉCLINAISONS', 24, col=Or, ls=.2, weight=700) + txt(80, 160, 920, 'FORT. SIMPLE.<br>RECONNAISSABLE.', 100, AN, '#111', 400, 0, .95)
    inner += phone(80, 420, 380, I('velo_story_9x16.jpg')) + post(500, 440, 500, I('velo_post_4x5.jpg'), 'velocity.drops', Or, False)
    S.append(slide(Off, inner, 11, TOT, foot_col='rgba(17,17,17,.6)'))
    # ---------- MAISON OLIVA
    Cr, Te, Ol, Es = '#f4ecdd', '#c8643b', '#5e6b3a', '#2b1d14'; SE = "'dm-serif-display',serif"
    inner = box(0, 0, W, H, f'background:radial-gradient(circle at 75% 30%,#fbf5ea 0%,{Cr} 60%);') + txt(80, 110, 920, 'IDENTITÉ 04 · CAFÉ-BRUNCH', 24, col=Te, ls=.2, weight=700)
    inner += box(700, -120, 520, 520, f'background:{Te};border-radius:260px;opacity:.9;') + box(-200, 1080, 440, 440, f'background:{Ol};border-radius:220px;opacity:.85;')
    inner += oliva_mark(390, 330, 300) + txt(80, 680, 920, 'Maison Oliva', 128, SE, Es, 400, -.01, 1, 'center') + txt(80, 830, 920, 'Brunch · café de spécialité · terrasse', 30, col=Es, align='center', style='opacity:.75;')
    inner += txt(80, 940, 920, '« Ton dimanche mérite mieux<br>qu\'un café pressé. »', 50, SE, Te, 400, 0, 1.15, 'center', 'font-style:italic;')
    S.append(slide(Cr, inner, 12, TOT, foot_col='rgba(43,29,20,.6)'))
    inner = txt(80, 110, 920, 'MAISON OLIVA · SYSTÈME DE MARQUE', 24, col=Te, ls=.2, weight=700)
    inner += box(80, 170, 600, 330, 'background:#fffaf1;border-radius:28px;border:1px solid rgba(43,29,20,.12);', oliva_mark(60, 95, 140) + txt(230, 118, 360, 'Maison<br>Oliva', 64, SE, Es, 400, -.01, .95)) + box(700, 170, 300, 330, f'background:{Ol};border-radius:28px;', oliva_mark(85, 100, 130, Cr, Te))
    inner += txt(80, 520, 600, 'Logo principal', 22, col='rgba(43,29,20,.6)') + txt(700, 520, 300, 'Symbole', 22, col='rgba(43,29,20,.6)')
    inner += swatches(80, 600, [(Cr, 'Crème'), (Te, 'Terracotta'), (Ol, 'Olive'), (Es, 'Espresso')], Es)
    inner += box(80, 900, 920, 300, 'background:#fffaf1;border-radius:28px;border:1px solid rgba(43,29,20,.12);', txt(50, 40, 300, 'Aa', 170, SE, Te, 400, 0, 1) + txt(380, 60, 500, 'DM Serif Display', 34, SE, Es) + txt(380, 110, 500, 'Logo · titres · menus', 24, col='rgba(43,29,20,.6)') + txt(380, 170, 500, 'DM Sans', 32, col=Es, weight=700) + txt(380, 220, 500, 'Textes · prix · horaires', 24, col='rgba(43,29,20,.6)'))
    S.append(slide(Cr, inner, 13, TOT, foot_col='rgba(43,29,20,.6)'))
    cup = (box(130, 560, 300, 330, f'background:#fffaf1;border-radius:20px 20px 120px 120px;box-shadow:0 30px 60px rgba(43,29,20,.25);', oliva_mark(90, 90, 120))
           + box(110, 540, 340, 40, f'background:{Es};border-radius:20px;') + box(418, 640, 80, 140, f'border:18px solid #fffaf1;border-left:none;border-radius:0 70px 70px 0;'))
    menu = box(560, 460, 420, 600, 'background:#fffaf1;border-radius:14px;box-shadow:0 30px 60px rgba(43,29,20,.25);', oliva_mark(170, 40, 80)
           + txt(0, 140, 420, 'Le Brunch', 52, SE, Es, 400, 0, 1, 'center') + box(150, 210, 120, 3, f'background:{Te};')
           + ''.join(txt(50, 250 + i * 80, 320, a, 28, SE, Es) + txt(50, 285 + i * 80, 320, b, 20, col='rgba(43,29,20,.6)') for i, (a, b) in enumerate([('Pancakes maison', 'sirop d\'érable, fruits rouges'), ('Avocado toast', 'pain au levain, œuf parfait'), ('Latte d\'Oliva', 'café de spécialité'), ('Granola bowl', 'yaourt grec, miel')])))
    sticker = box(160, 960, 250, 250, f'background:{Te};border-radius:125px;transform:rotate(-10deg);', txt(0, 70, 250, 'brunch<br>du dimanche', 34, SE, '#fff', 400, 0, 1.05, 'center'))
    inner = txt(80, 110, 920, 'MAISON OLIVA · DÉCLINAISONS', 24, col=Te, ls=.2, weight=700) + txt(80, 160, 920, 'Une marque qu\'on<br>a envie de goûter.', 76, SE, Es, 400, -.01, 1.05) + cup + menu + sticker
    S.append(slide('#ecdfc8', inner, 14, TOT, foot_col='rgba(43,29,20,.6)'))
    # ---------- ORBIT
    Vi, Cy, Nk = '#6c4bff', '#2bd4ff', '#0d0b1f'; UB = "'unbounded',sans-serif"
    inner = box(0, 0, W, H, f'background:radial-gradient(circle at 70% 25%,#2a1f6b 0%,{Nk} 55%);') + box(560, 120, 640, 640, f'background:linear-gradient(135deg,{Vi},{Cy});border-radius:320px;opacity:.35;')
    inner += txt(80, 110, 920, 'IDENTITÉ 05 · APPLI DE PRODUCTIVITÉ', 24, col=Cy, ls=.2, weight=700) + orbit_mark(330, 300, 420)
    inner += txt(80, 780, 920, 'orbit', 200, UB, '#fff', 700, -.03, 1, 'center') + txt(80, 1010, 920, 'Tes journées, enfin en orbite.', 46, col='#fff', weight=500, align='center') + txt(80, 1080, 920, 'Tâches · agenda · focus — tout au même endroit', 28, col='rgba(255,255,255,.65)', align='center')
    S.append(slide(Nk, inner, 15, TOT))
    inner = txt(80, 110, 920, 'ORBIT · SYSTÈME DE MARQUE', 24, col=Cy, ls=.2, weight=700)
    inner += box(80, 170, 600, 330, 'background:#17143a;border-radius:28px;', orbit_mark(60, 95, 140) + txt(230, 118, 360, 'orbit', 96, UB, '#fff', 700, -.03, 1)) + box(700, 170, 300, 330, f'background:linear-gradient(135deg,{Vi},{Cy});border-radius:28px;', box(85, 100, 130, 130, 'background:#0d0b1f;border-radius:36px;', orbit_mark(15, 15, 100)))
    inner += txt(80, 520, 600, 'Logo principal', 22, col='rgba(255,255,255,.6)') + txt(700, 520, 300, 'Icône d\'appli', 22, col='rgba(255,255,255,.6)')
    inner += swatches(80, 600, [(Nk, 'Nuit'), (Vi, 'Orbite'), (Cy, 'Signal'), ('#f4f3ff', 'Lune')], '#fff')
    inner += box(80, 900, 920, 300, 'background:#17143a;border-radius:28px;', txt(50, 50, 300, 'Aa', 150, UB, '#fff', 700, -.03, 1) + txt(380, 60, 500, 'Unbounded', 34, UB, '#fff', 700) + txt(380, 110, 500, 'Logo · titres', 24, col='rgba(255,255,255,.6)') + txt(380, 170, 500, 'DM Sans', 32, col='#fff', weight=700) + txt(380, 220, 500, 'Interface · textes', 24, col='rgba(255,255,255,.6)'))
    S.append(slide(Nk, inner, 16, TOT))
    ui = ''.join(box(26, 250 + i * 120, 308, 100, 'background:#1d1946;border-radius:22px;', box(20, 30, 40, 40, f'border:3px solid {Cy if i else Vi};border-radius:20px;' + (f'background:{Vi};' if i == 0 else '')) + txt(80, 26, 220, t, 22, col='#fff', weight=700) + txt(80, 56, 220, s, 17, col='rgba(255,255,255,.55)')) for i, (t, s) in enumerate([('Envoyer le devis', '09:00 · Travail'), ('Séance de sport', '12:30 · Perso'), ('Focus 45 min', '14:00 · Deep work'), ('Appeler maman', '19:00 · Perso')]))
    screen = box(0, 0, 360, 728, f'background:{Nk};', txt(26, 80, 300, 'Bonjour 👋', 22, col='rgba(255,255,255,.7)') + txt(26, 115, 310, 'Ta journée<br>en orbite', 40, UB, '#fff', 700, -.02, 1.05) + ui + box(26, 760 - 140, 308, 70, f'background:linear-gradient(90deg,{Vi},{Cy});border-radius:35px;', txt(0, 22, 308, '+ Nouvelle tâche', 22, col='#fff', weight=700, align='center')))
    phone_ui = box(80, 400, 400, 808, 'background:#111;border-radius:60px;box-shadow:0 40px 80px rgba(0,0,0,.5);', box(20, 20, 360, 768, 'border-radius:46px;overflow:hidden;', screen))
    card = box(540, 470, 460, 270, f'background:linear-gradient(135deg,{Vi},{Cy});border-radius:22px;box-shadow:0 30px 60px rgba(0,0,0,.4);', orbit_mark(30, 30, 70) + txt(30, 180, 400, 'Léa Martin', 30, col='#fff', weight=700) + txt(30, 220, 400, 'Product Designer · orbit', 20, col='rgba(255,255,255,.8)'))
    icon = box(540, 800, 200, 200, 'background:#0d0b1f;border-radius:46px;border:1px solid rgba(255,255,255,.15);box-shadow:0 30px 60px rgba(0,0,0,.4);', orbit_mark(30, 30, 140)) + txt(540, 1015, 200, 'orbit', 24, col='#fff', align='center')
    notif = box(770, 820, 230, 150, 'background:rgba(255,255,255,.1);border-radius:24px;border:1px solid rgba(255,255,255,.18);', txt(20, 22, 200, 'orbit · maintenant', 16, col='rgba(255,255,255,.6)') + txt(20, 52, 200, 'Focus terminé 🎯<br>Belle session !', 20, col='#fff', weight=700, lh=1.3))
    inner = txt(80, 110, 920, 'ORBIT · DÉCLINAISONS', 24, col=Cy, ls=.2, weight=700) + txt(80, 160, 920, 'De l\'icône à l\'interface.', 64, UB, '#fff', 700, -.02, 1.1) + phone_ui + card + icon + notif
    S.append(slide(Nk, inner, 17, TOT))
    # 18 · appel à l'action
    inner = box(0, 0, W, H, 'background:radial-gradient(circle at 50% 35%,#1f2a12 0%,#0e0f12 60%);') + txt(80, 110, 920, 'ET MAINTENANT ?', 24, col='#c8ff2a', ls=.2, weight=700)
    inner += txt(80, 200, 920, 'Ta marque<br>est la prochaine.', 110, "'dm-serif-display',serif", '#fff', 400, -.01, 1.0)
    inner += txt(80, 500, 920, 'Logo, identité visuelle, déclinaisons réseaux sociaux et pubs vidéo storytellées : je crée une marque qu\'on remarque — et qu\'on retient.', 32, col='rgba(255,255,255,.8)', lh=1.4)
    inner += box(80, 720, 520, 96, 'background:#c8ff2a;border-radius:48px;', txt(0, 30, 520, 'Écris-moi « MARQUE » en DM', 30, col='#0e0f12', weight=700, align='center'))
    inner += txt(80, 900, 920, 'Tarik Belattar — E-DUST Solutions', 36, col='#fff', weight=700) + txt(80, 955, 920, '06 13 24 96 80 · tarikbelatta@gmail.com', 30, col='rgba(255,255,255,.75)') + txt(80, 1000, 920, 'edust-solutions.fr', 30, col='#c8ff2a', weight=700)
    inner += txt(80, 1120, 920, 'Toutes les marques présentées sont fictives, créées pour la démonstration. Visuels photo générés par IA.', 20, col='rgba(255,255,255,.5)', lh=1.4)
    S.append(slide('#0e0f12', inner, 18, TOT, label='Tarik Belattar — E-DUST Solutions'))
    head = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="hz:slide-selector" content=".slide">'
            f'<meta name="hz:canvas-width" content="{W}"><meta name="hz:canvas-height" content="{H}"><title>E-DUST — Portfolio création de marque</title>{KIT}'
            f'<style>html,body{{margin:0;padding:0;background:#222}}.slide{{margin:0 auto 40px;}}</style></head><body>')
    return head + ''.join(S) + '</body></html>'

open(f'{D}/portfolio.html', 'w').write(build(False))
open(f'{D}/portfolio_express.html', 'w').write(build(True))
print('ok', os.path.getsize(f'{D}/portfolio_express.html'))
